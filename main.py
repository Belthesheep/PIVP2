from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends, Cookie
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import List, Optional
import sqlite3
import datetime
import hashlib
import os
import shutil
import secrets

# Database setup
DB_NAME = "sheepbooru.db"
UPLOAD_DIR = "uploads"

# Session storage (in production, use Redis or similar)
sessions = {}

# Ensure upload directory exists
os.makedirs(UPLOAD_DIR, exist_ok=True)

def get_db():
    """Get database connection"""
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

# Pydantic Models
class UserCreate(BaseModel):
    username: str = Field(..., min_length=3)
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    username: str
    password: str

class User(BaseModel):
    id: int
    username: str
    is_admin: bool
    created_at: str

class PoolCreate(BaseModel):
    name: str = Field(..., min_length=1)
    description: Optional[str] = None

class PoolAddPost(BaseModel):
    post_id: int

# Initialize FastAPI
app = FastAPI(title="SheepBooru API")

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded images
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# ============== UTILITY FUNCTIONS ==============

def hash_password(password: str) -> str:
    """Simple password hashing"""
    return hashlib.sha256(password.encode()).hexdigest()

def get_or_create_tag(conn, tag_name: str) -> int:
    """Get existing tag ID or create new tag"""
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM tags WHERE tag_name = ?", (tag_name.lower(),))
    result = cursor.fetchone()
    
    if result:
        return result["id"]
    
    cursor.execute("INSERT INTO tags (tag_name) VALUES (?)", (tag_name.lower(),))
    conn.commit()
    return cursor.lastrowid

def get_current_user(session_token: Optional[str] = Cookie(None)):
    """Dependency to get current user from session"""
    if not session_token or session_token not in sessions:
        return None
    return sessions[session_token]

def require_auth(session_token: Optional[str] = Cookie(None)):
    """Dependency that requires authentication"""
    user = get_current_user(session_token)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user

# ============== AUTH ENDPOINTS ==============

@app.post("/api/auth/register", status_code=201)
async def register(user: UserCreate):
    """Register a new user"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("SELECT id FROM users WHERE username = ?", (user.username,))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=409, detail="Username already exists")
    
    password_hash = hash_password(user.password)
    created_at = datetime.datetime.now().isoformat()
    
    cursor.execute(
        "INSERT INTO users (username, password_hash, is_admin, created_at) VALUES (?, ?, 0, ?)",
        (user.username, password_hash, created_at)
    )
    conn.commit()
    user_id = cursor.lastrowid
    conn.close()
    
    return {"id": user_id, "username": user.username, "message": "User created successfully"}

@app.post("/api/auth/login")
async def login(credentials: UserLogin):
    """Login and create session"""
    conn = get_db()
    cursor = conn.cursor()
    
    password_hash = hash_password(credentials.password)
    cursor.execute(
        "SELECT id, username, is_admin, created_at FROM users WHERE username = ? AND password_hash = ?",
        (credentials.username, password_hash)
    )
    user = cursor.fetchone()
    conn.close()
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Create session
    session_token = secrets.token_hex(32)
    sessions[session_token] = dict(user)
    
    response = JSONResponse(content={
        "user": dict(user),
        "message": "Login successful"
    })
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        samesite="lax"
    )
    return response

@app.post("/api/auth/logout")
async def logout(session_token: Optional[str] = Cookie(None)):
    """Logout and destroy session"""
    if session_token in sessions:
        del sessions[session_token]
    
    response = JSONResponse(content={"message": "Logged out"})
    response.delete_cookie("session_token")
    return response

@app.get("/api/auth/me")
async def get_me(user = Depends(get_current_user)):
    """Get current user info"""
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user

# ============== USER ENDPOINTS ==============

@app.get("/api/users")
async def list_users():
    """List all users"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, username, is_admin, created_at FROM users")
    users = cursor.fetchall()
    conn.close()
    return [dict(u) for u in users]

# ============== POST ENDPOINTS ==============

@app.post("/api/posts", status_code=201)
async def create_post(
    image: UploadFile = File(...),
    description: Optional[str] = Form(None),
    tags: str = Form(...),
    user = Depends(require_auth)
):
    """Upload a new post with image and tags"""
    conn = get_db()
    cursor = conn.cursor()
    
    # Save image file
    filename = f"{datetime.datetime.now().timestamp()}_{image.filename}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    
    with open(filepath, "wb") as f:
        shutil.copyfileobj(image.file, f)
    
    # Create post
    upload_date = datetime.datetime.now().isoformat()
    cursor.execute(
        "INSERT INTO posts (image_filename, uploader_id, upload_date, description, favorite_count) VALUES (?, ?, ?, ?, 0)",
        (filename, user["id"], upload_date, description)
    )
    post_id = cursor.lastrowid
    
    # Add tags
    tag_list = [t.strip() for t in tags.split(",") if t.strip()]
    for tag_name in tag_list:
        tag_id = get_or_create_tag(conn, tag_name)
        cursor.execute("INSERT INTO post_tags (post_id, tag_id) VALUES (?, ?)", (post_id, tag_id))
    
    conn.commit()
    conn.close()
    
    return {"id": post_id, "message": "Post created successfully", "tags": tag_list}

@app.get("/api/posts")
async def list_posts(tag: Optional[str] = None, user_id: Optional[int] = None):
    """List all posts, optionally filtered by tag or user"""
    conn = get_db()
    cursor = conn.cursor()
    
    if tag:
        query = """
            SELECT DISTINCT p.id, p.image_filename, p.uploader_id, u.username as uploader_username,
                   p.upload_date, p.description, p.favorite_count
            FROM posts p
            JOIN users u ON p.uploader_id = u.id
            JOIN post_tags pt ON p.id = pt.post_id
            JOIN tags t ON pt.tag_id = t.id
            WHERE t.tag_name = ?
            ORDER BY p.upload_date DESC
        """
        cursor.execute(query, (tag.lower(),))
    elif user_id:
        query = """
            SELECT p.id, p.image_filename, p.uploader_id, u.username as uploader_username,
                   p.upload_date, p.description, p.favorite_count
            FROM posts p
            JOIN users u ON p.uploader_id = u.id
            WHERE p.uploader_id = ?
            ORDER BY p.upload_date DESC
        """
        cursor.execute(query, (user_id,))
    else:
        query = """
            SELECT p.id, p.image_filename, p.uploader_id, u.username as uploader_username,
                   p.upload_date, p.description, p.favorite_count
            FROM posts p
            JOIN users u ON p.uploader_id = u.id
            ORDER BY p.upload_date DESC
        """
        cursor.execute(query)
    
    posts = cursor.fetchall()
    
    # Get tags for each post
    result = []
    for post in posts:
        cursor.execute("""
            SELECT t.tag_name
            FROM tags t
            JOIN post_tags pt ON t.id = pt.tag_id
            WHERE pt.post_id = ?
        """, (post["id"],))
        tags = [row["tag_name"] for row in cursor.fetchall()]
        
        result.append({
            **dict(post),
            "tags": tags
        })
    
    conn.close()
    return result

@app.get("/api/posts/{post_id}")
async def get_post(post_id: int, current_user = Depends(get_current_user)):
    """Get a specific post with all details"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT p.id, p.image_filename, p.uploader_id, u.username as uploader_username,
               p.upload_date, p.description, p.favorite_count
        FROM posts p
        JOIN users u ON p.uploader_id = u.id
        WHERE p.id = ?
    """, (post_id,))
    
    post = cursor.fetchone()
    if not post:
        conn.close()
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Get tags
    cursor.execute("""
        SELECT t.tag_name
        FROM tags t
        JOIN post_tags pt ON t.id = pt.tag_id
        WHERE pt.post_id = ?
    """, (post_id,))
    tags = [row["tag_name"] for row in cursor.fetchall()]
    
    # Get pools this post belongs to
    cursor.execute("""
        SELECT p.id, p.name
        FROM pools p
        JOIN pool_posts pp ON p.id = pp.pool_id
        WHERE pp.post_id = ?
    """, (post_id,))
    pools = [dict(row) for row in cursor.fetchall()]
    
    # Check if current user has favorited
    is_favorited = False
    if current_user:
        cursor.execute(
            "SELECT 1 FROM favorites WHERE user_id = ? AND post_id = ?",
            (current_user["id"], post_id)
        )
        is_favorited = cursor.fetchone() is not None
    
    conn.close()
    
    return {
        **dict(post),
        "tags": tags,
        "pools": pools,
        "is_favorited": is_favorited
    }

@app.delete("/api/posts/{post_id}")
async def delete_post(post_id: int, user = Depends(require_auth)):
    """Delete a post and its image file"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("SELECT image_filename, uploader_id FROM posts WHERE id = ?", (post_id,))
    post = cursor.fetchone()
    
    if not post:
        conn.close()
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Check ownership
    if post["uploader_id"] != user["id"] and not user.get("is_admin"):
        conn.close()
        raise HTTPException(status_code=403, detail="Not authorized to delete this post")
    
    # Delete image file
    filepath = os.path.join(UPLOAD_DIR, post["image_filename"])
    if os.path.exists(filepath):
        os.remove(filepath)
    
    # Delete post (CASCADE will handle favorites, post_tags, pool_posts)
    cursor.execute("DELETE FROM posts WHERE id = ?", (post_id,))
    conn.commit()
    conn.close()
    
    return {"message": "Post deleted successfully"}

# ============== FAVORITE ENDPOINTS ==============

@app.post("/api/posts/{post_id}/favorite")
async def toggle_favorite(post_id: int, user = Depends(require_auth)):
    """Toggle favorite status for a post"""
    conn = get_db()
    cursor = conn.cursor()
    
    # Check if post exists
    cursor.execute("SELECT id FROM posts WHERE id = ?", (post_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Check if already favorited
    cursor.execute(
        "SELECT 1 FROM favorites WHERE user_id = ? AND post_id = ?",
        (user["id"], post_id)
    )
    is_favorited = cursor.fetchone() is not None
    
    if is_favorited:
        # Unfavorite
        cursor.execute(
            "DELETE FROM favorites WHERE user_id = ? AND post_id = ?",
            (user["id"], post_id)
        )
        cursor.execute(
            "UPDATE posts SET favorite_count = favorite_count - 1 WHERE id = ?",
            (post_id,)
        )
        message = "Unfavorited"
        new_status = False
    else:
        # Favorite
        favorited_at = datetime.datetime.now().isoformat()
        cursor.execute(
            "INSERT INTO favorites (user_id, post_id, favorited_at) VALUES (?, ?, ?)",
            (user["id"], post_id, favorited_at)
        )
        cursor.execute(
            "UPDATE posts SET favorite_count = favorite_count + 1 WHERE id = ?",
            (post_id,)
        )
        message = "Favorited"
        new_status = True
    
    conn.commit()
    
    # Get updated count
    cursor.execute("SELECT favorite_count FROM posts WHERE id = ?", (post_id,))
    favorite_count = cursor.fetchone()["favorite_count"]
    
    conn.close()
    
    return {
        "message": message,
        "is_favorited": new_status,
        "favorite_count": favorite_count
    }

@app.get("/api/users/{user_id}/favorites")
async def get_user_favorites(user_id: int):
    """Get all posts favorited by a user"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT p.id, p.image_filename, p.uploader_id, u.username as uploader_username,
               p.upload_date, p.description, p.favorite_count
        FROM posts p
        JOIN users u ON p.uploader_id = u.id
        JOIN favorites f ON p.id = f.post_id
        WHERE f.user_id = ?
        ORDER BY f.favorited_at DESC
    """, (user_id,))
    
    posts = cursor.fetchall()
    
    # Get tags for each post
    result = []
    for post in posts:
        cursor.execute("""
            SELECT t.tag_name
            FROM tags t
            JOIN post_tags pt ON t.id = pt.tag_id
            WHERE pt.post_id = ?
        """, (post["id"],))
        tags = [row["tag_name"] for row in cursor.fetchall()]
        
        result.append({
            **dict(post),
            "tags": tags
        })
    
    conn.close()
    return result

# ============== POOL ENDPOINTS ==============

@app.post("/api/pools", status_code=201)
async def create_pool(pool: PoolCreate, user = Depends(require_auth)):
    """Create a new pool"""
    conn = get_db()
    cursor = conn.cursor()
    
    created_at = datetime.datetime.now().isoformat()
    cursor.execute(
        "INSERT INTO pools (name, description, creator_id, created_at) VALUES (?, ?, ?, ?)",
        (pool.name, pool.description, user["id"], created_at)
    )
    pool_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    return {"id": pool_id, "name": pool.name, "message": "Pool created successfully"}

@app.get("/api/pools")
async def list_pools():
    """List all pools"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT p.id, p.name, p.description, p.creator_id, u.username as creator_username,
               p.created_at
        FROM pools p
        JOIN users u ON p.creator_id = u.id
        ORDER BY p.created_at DESC
    """)

    pools = cursor.fetchall()
    result = []
    for p in pools:
        pool = dict(p)
        # compute post count explicitly to avoid any GROUP BY surprising behavior
        cursor.execute("SELECT COUNT(*) as cnt FROM pool_posts WHERE pool_id = ?", (pool['id'],))
        cnt = cursor.fetchone()["cnt"]
        pool['post_count'] = int(cnt)
        result.append(pool)

    conn.close()
    return result

@app.get("/api/pools/{pool_id}")
async def get_pool(pool_id: int):
    """Get a specific pool with its posts in order"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT p.id, p.name, p.description, p.creator_id, u.username as creator_username,
               p.created_at
        FROM pools p
        JOIN users u ON p.creator_id = u.id
        WHERE p.id = ?
    """, (pool_id,))
    
    pool = cursor.fetchone()
    if not pool:
        conn.close()
        raise HTTPException(status_code=404, detail="Pool not found")
    
    # Get posts in order
    cursor.execute("""
        SELECT p.id, p.image_filename, p.uploader_id, u.username as uploader_username,
               p.upload_date, p.description, p.favorite_count, pp.order_index
        FROM posts p
        JOIN users u ON p.uploader_id = u.id
        JOIN pool_posts pp ON p.id = pp.post_id
        WHERE pp.pool_id = ?
        ORDER BY pp.order_index
    """, (pool_id,))
    
    posts = cursor.fetchall()
    
    # Get tags for each post
    result_posts = []
    for post in posts:
        cursor.execute("""
            SELECT t.tag_name
            FROM tags t
            JOIN post_tags pt ON t.id = pt.tag_id
            WHERE pt.post_id = ?
        """, (post["id"],))
        tags = [row["tag_name"] for row in cursor.fetchall()]
        
        result_posts.append({
            **dict(post),
            "tags": tags
        })
    
    conn.close()
    
    return {
        **dict(pool),
        "posts": result_posts,
        "post_count": len(result_posts)
    }

@app.post("/api/pools/{pool_id}/posts")
async def add_post_to_pool(pool_id: int, data: PoolAddPost, user = Depends(require_auth)):
    """Add a post to a pool"""
    conn = get_db()
    cursor = conn.cursor()
    
    # Check if pool exists and user is creator
    cursor.execute("SELECT creator_id FROM pools WHERE id = ?", (pool_id,))
    pool = cursor.fetchone()
    if not pool:
        conn.close()
        raise HTTPException(status_code=404, detail="Pool not found")
    
    if pool["creator_id"] != user["id"] and not user.get("is_admin"):
        conn.close()
        raise HTTPException(status_code=403, detail="Only pool creator can add posts")
    
    # Check if post exists
    cursor.execute("SELECT id FROM posts WHERE id = ?", (data.post_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Check if already in pool
    cursor.execute(
        "SELECT 1 FROM pool_posts WHERE pool_id = ? AND post_id = ?",
        (pool_id, data.post_id)
    )
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=409, detail="Post already in pool")
    
    # Get next order index
    cursor.execute(
        "SELECT COALESCE(MAX(order_index), -1) + 1 as next_index FROM pool_posts WHERE pool_id = ?",
        (pool_id,)
    )
    next_index = cursor.fetchone()["next_index"]
    
    # Add to pool
    cursor.execute(
        "INSERT INTO pool_posts (pool_id, post_id, order_index) VALUES (?, ?, ?)",
        (pool_id, data.post_id, next_index)
    )
    conn.commit()
    conn.close()
    
    return {"message": "Post added to pool", "order_index": next_index}

@app.delete("/api/pools/{pool_id}/posts/{post_id}")
async def remove_post_from_pool(pool_id: int, post_id: int, user = Depends(require_auth)):
    """Remove a post from a pool"""
    conn = get_db()
    cursor = conn.cursor()
    
    # Check if pool exists and user is creator
    cursor.execute("SELECT creator_id FROM pools WHERE id = ?", (pool_id,))
    pool = cursor.fetchone()
    if not pool:
        conn.close()
        raise HTTPException(status_code=404, detail="Pool not found")
    
    if pool["creator_id"] != user["id"] and not user.get("is_admin"):
        conn.close()
        raise HTTPException(status_code=403, detail="Only pool creator can remove posts")
    
    # Remove from pool
    cursor.execute(
        "DELETE FROM pool_posts WHERE pool_id = ? AND post_id = ?",
        (pool_id, post_id)
    )
    
    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Post not in this pool")
    
    conn.commit()
    conn.close()
    
    return {"message": "Post removed from pool"}

@app.delete("/api/pools/{pool_id}")
async def delete_pool(pool_id: int, user = Depends(require_auth)):
    """Delete a pool"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("SELECT creator_id FROM pools WHERE id = ?", (pool_id,))
    pool = cursor.fetchone()
    
    if not pool:
        conn.close()
        raise HTTPException(status_code=404, detail="Pool not found")
    
    if pool["creator_id"] != user["id"] and not user.get("is_admin"):
        conn.close()
        raise HTTPException(status_code=403, detail="Only pool creator can delete pool")
    
    cursor.execute("DELETE FROM pools WHERE id = ?", (pool_id,))
    conn.commit()
    conn.close()
    
    return {"message": "Pool deleted successfully"}

# ============== TAG ENDPOINTS ==============

@app.get("/api/tags")
async def list_tags():
    """List all tags with post counts"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT t.id, t.tag_name, COUNT(pt.post_id) as post_count
        FROM tags t
        LEFT JOIN post_tags pt ON t.id = pt.tag_id
        GROUP BY t.id, t.tag_name
        ORDER BY post_count DESC, t.tag_name
    """)
    
    tags = cursor.fetchall()
    conn.close()
    
    return [dict(t) for t in tags]

# ============== ROOT ==============

@app.get("/")
async def root():
    return {
        "name": "SheepBooru API 🐏",
        "version": "2.0",
        "features": [
            "Authentication with sessions",
            "Post favorites",
            "Post pools (collections)",
            "7 database tables"
        ]
    }