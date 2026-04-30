from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends, Cookie, Body
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import sqlite3
import datetime
import hashlib
import os
import shutil
import secrets
import re
from analytics_service import (
    get_post_count,
    get_user_count,
    get_folder_size_mb,
    get_activity_by_period,
    log_activity,
    get_summary_report,
    get_top_uploaders,
    get_post_statistics,
    get_pool_statistics,
    get_tag_statistics,
    get_activity_log,
)
from export_service import generate_csv_report, generate_json_report, generate_pdf_report

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
    email: str = Field(..., min_length=5)
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    username_or_email: str = Field(..., min_length=3)
    password: str = Field(..., min_length=6)

class PasswordResetRequest(BaseModel):
    email: str = Field(..., min_length=5)

class PasswordReset(BaseModel):
    token: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=6)

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
    """Register a new user with email"""
    conn = get_db()
    cursor = conn.cursor()
    
    # Validate email format
    email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(email_regex, user.email):
        conn.close()
        raise HTTPException(status_code=400, detail="Invalid email format")
    
    # Check if username exists
    cursor.execute("SELECT id FROM users WHERE username = ?", (user.username,))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=409, detail="Username already exists")
    
    # Check if email exists
    cursor.execute("SELECT id FROM users WHERE email = ?", (user.email,))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=409, detail="Email already registered")
    
    password_hash = hash_password(user.password)
    created_at = datetime.datetime.now().isoformat()
    
    cursor.execute(
        "INSERT INTO users (username, email, password_hash, is_admin, accepted_tos, created_at) VALUES (?, ?, ?, 0, 1, ?)",
        (user.username, user.email, password_hash, created_at)
    )
    conn.commit()
    user_id = cursor.lastrowid
    
    # Get current T&C version
    cursor.execute("SELECT id FROM terms_and_conditions ORDER BY created_at DESC LIMIT 1")
    tos_row = cursor.fetchone()
    if tos_row:
        tos_id = tos_row[0]
        # Record T&C acceptance
        cursor.execute(
            "INSERT INTO user_tos_acceptance (user_id, tos_id, accepted_at) VALUES (?, ?, ?)",
            (user_id, tos_id, created_at)
        )
        conn.commit()
    
    conn.close()
    
    return {"id": user_id, "username": user.username, "email": user.email, "message": "User created successfully"}

@app.post("/api/auth/login")
async def login(credentials: UserLogin):
    """Login with username or email"""
    conn = get_db()
    cursor = conn.cursor()
    
    password_hash = hash_password(credentials.password)
    
    # Try to login with username or email
    cursor.execute(
        "SELECT id, username, email, is_admin, created_at FROM users WHERE (username = ? OR email = ?) AND password_hash = ?",
        (credentials.username_or_email, credentials.username_or_email, password_hash)
    )
    user = cursor.fetchone()
    conn.close()
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Create session
    session_token = secrets.token_hex(32)
    user_dict = dict(user)
    sessions[session_token] = user_dict
    
    response = JSONResponse(content={
        "user": user_dict,
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

@app.post("/api/auth/request-password-reset")
async def request_password_reset(request: PasswordResetRequest):
    """Request a password reset token via email"""
    conn = get_db()
    cursor = conn.cursor()
    
    # Find user by email
    cursor.execute("SELECT id, username, email FROM users WHERE email = ?", (request.email,))
    user = cursor.fetchone()
    
    if not user:
        # Don't reveal if email exists or not for security
        conn.close()
        return {"message": "If the email is registered, a password reset link has been sent"}
    
    # Generate reset token (valid for 1 hour)
    reset_token = secrets.token_urlsafe(32)
    created_at = datetime.datetime.now().isoformat()
    expires_at = (datetime.datetime.now() + datetime.timedelta(hours=1)).isoformat()
    
    # Delete any existing reset tokens for this user
    cursor.execute("DELETE FROM password_reset_tokens WHERE user_id = ?", (user["id"],))
    
    # Store new reset token
    cursor.execute(
        "INSERT INTO password_reset_tokens (user_id, token, created_at, expires_at) VALUES (?, ?, ?, ?)",
        (user["id"], reset_token, created_at, expires_at)
    )
    conn.commit()
    conn.close()
    
    # TODO: In production, send email with reset link
    # For now, return the token (DON'T DO THIS IN PRODUCTION!)
    print(f"[DEV] Password reset token for {user['email']}: {reset_token}")
    
    return {"message": "If the email is registered, a password reset link has been sent"}

@app.post("/api/auth/validate-reset-token")
async def validate_reset_token(token: str):
    """Validate a password reset token"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute(
        "SELECT user_id, expires_at FROM password_reset_tokens WHERE token = ?",
        (token,)
    )
    reset_record = cursor.fetchone()
    conn.close()
    
    if not reset_record:
        raise HTTPException(status_code=400, detail="Invalid reset token")
    
    # Check if token has expired
    expires_at = datetime.datetime.fromisoformat(reset_record["expires_at"])
    if datetime.datetime.now() > expires_at:
        raise HTTPException(status_code=400, detail="Reset token has expired")
    
    return {"valid": True, "user_id": reset_record["user_id"]}

@app.post("/api/auth/reset-password")
async def reset_password(reset: PasswordReset):
    """Reset password using token"""
    conn = get_db()
    cursor = conn.cursor()
    
    # Validate token
    cursor.execute(
        "SELECT user_id, expires_at FROM password_reset_tokens WHERE token = ?",
        (reset.token,)
    )
    reset_record = cursor.fetchone()
    
    if not reset_record:
        conn.close()
        raise HTTPException(status_code=400, detail="Invalid reset token")
    
    # Check if token has expired
    expires_at = datetime.datetime.fromisoformat(reset_record["expires_at"])
    if datetime.datetime.now() > expires_at:
        conn.close()
        raise HTTPException(status_code=400, detail="Reset token has expired")
    
    # Hash new password and update user
    password_hash = hash_password(reset.new_password)
    user_id = reset_record["user_id"]
    
    cursor.execute(
        "UPDATE users SET password_hash = ? WHERE id = ?",
        (password_hash, user_id)
    )
    
    # Delete the used reset token
    cursor.execute("DELETE FROM password_reset_tokens WHERE token = ?", (reset.token,))
    
    conn.commit()
    conn.close()
    
    return {"message": "Password reset successfully"}

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
    
    # Log activity
    log_activity(user["id"], "upload", post_id=post_id)
    
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
    
    # Log activity
    log_activity(user["id"], "delete", post_id=post_id)
    
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

# ============== REPORTING ENDPOINTS ==============

@app.get("/api/reports/summary")
async def get_report_summary(user = Depends(require_auth)):
    """Get comprehensive summary report (admin only)"""
    if not user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Only admins can access reports")
    
    return get_summary_report()

@app.get("/api/reports/activity")
async def get_activity_report(period: str = "day", user = Depends(require_auth)):
    """Get activity report for specified period (admin only)"""
    if not user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Only admins can access reports")
    
    if period not in ["day", "week", "month"]:
        raise HTTPException(status_code=400, detail="Period must be 'day', 'week', or 'month'")
    
    return get_activity_by_period(period)

@app.get("/api/reports/posts")
async def get_posts_report(user = Depends(require_auth)):
    """Get post statistics report (admin only)"""
    if not user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Only admins can access reports")
    
    return get_post_statistics()

@app.get("/api/reports/pools")
async def get_pools_report(user = Depends(require_auth)):
    """Get pool statistics report (admin only)"""
    if not user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Only admins can access reports")
    
    return get_pool_statistics()

@app.get("/api/reports/tags")
async def get_tags_report(limit: int = 20, user = Depends(require_auth)):
    """Get tag statistics report (admin only)"""
    if not user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Only admins can access reports")
    
    return get_tag_statistics(limit)

@app.get("/api/reports/top-uploaders")
async def get_top_uploaders_report(limit: int = 10, user = Depends(require_auth)):
    """Get top uploaders report (admin only)"""
    if not user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Only admins can access reports")
    
    return {"top_uploaders": get_top_uploaders(limit)}

@app.get("/api/reports/activity-log")
async def get_activity_log_report(limit: int = 100, action_type: Optional[str] = None, user = Depends(require_auth)):
    """Get activity log entries (admin only)"""
    if not user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Only admins can access reports")
    
    return {"activity_log": get_activity_log(limit, action_type)}

# ============== EXPORT ENDPOINTS ==============

@app.get("/api/reports/export/csv")
async def export_report_csv(report_type: str = "summary", user = Depends(require_auth)):
    """Export report as CSV (admin only)"""
    if not user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Only admins can export reports")
    
    if report_type not in ["summary", "posts", "pools", "tags"]:
        raise HTTPException(status_code=400, detail="Invalid report type")
    
    try:
        csv_content = generate_csv_report(report_type)
        filename = f"report_{report_type}_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        
        return StreamingResponse(
            iter([csv_content]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating CSV: {str(e)}")

@app.get("/api/reports/export/json")
async def export_report_json(report_type: str = "summary", user = Depends(require_auth)):
    """Export report as JSON (admin only)"""
    if not user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Only admins can export reports")
    
    if report_type not in ["summary", "posts", "pools", "tags", "uploaders"]:
        raise HTTPException(status_code=400, detail="Invalid report type")
    
    try:
        json_content = generate_json_report(report_type)
        filename = f"report_{report_type}_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        
        return StreamingResponse(
            iter([json_content]),
            media_type="application/json",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating JSON: {str(e)}")

@app.get("/api/reports/export/pdf")
async def export_report_pdf(report_type: str = "summary", user = Depends(require_auth)):
    """Export report as PDF (admin only)"""
    if not user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Only admins can export reports")
    
    if report_type not in ["summary", "posts", "pools"]:
        raise HTTPException(status_code=400, detail="Invalid report type. PDF supports: summary, posts, pools")
    
    try:
        pdf_content = generate_pdf_report(report_type)
        filename = f"report_{report_type}_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        
        return StreamingResponse(
            iter([pdf_content]),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating PDF: {str(e)}")

# ============== TERMS & CONDITIONS ENDPOINTS ==============

@app.get("/api/tos/current")
async def get_current_tos():
    """Get current Terms & Conditions"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT id, version, content, created_at FROM terms_and_conditions
        ORDER BY created_at DESC
        LIMIT 1
    """)
    
    tos = cursor.fetchone()
    conn.close()
    
    if not tos:
        raise HTTPException(status_code=404, detail="Terms & Conditions not found")
    
    return dict(tos)

@app.get("/api/tos/history")
async def get_tos_history():
    """Get all Terms & Conditions versions"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT id, version, created_at FROM terms_and_conditions
        ORDER BY created_at DESC
    """)
    
    versions = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    return {"versions": versions}

@app.get("/api/tos/{version_id}")
async def get_tos_version(version_id: int):
    """Get specific T&C version"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("SELECT id, version, content, created_at FROM terms_and_conditions WHERE id = ?", (version_id,))
    tos = cursor.fetchone()
    conn.close()
    
    if not tos:
        raise HTTPException(status_code=404, detail="Terms & Conditions version not found")
    
    return dict(tos)

@app.post("/api/tos")
async def create_tos(content: str = Form(...), version: str = Form(...), user = Depends(require_auth)):
    """Create new T&C version (admin only)"""
    if not user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Only admins can create Terms & Conditions")
    
    conn = get_db()
    cursor = conn.cursor()
    
    # Check if version already exists
    cursor.execute("SELECT id FROM terms_and_conditions WHERE version = ?", (version,))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=409, detail="T&C version already exists")
    
    created_at = datetime.datetime.now().isoformat()
    cursor.execute(
        "INSERT INTO terms_and_conditions (version, content, created_at) VALUES (?, ?, ?)",
        (version, content, created_at)
    )
    
    conn.commit()
    tos_id = cursor.lastrowid
    conn.close()
    
    return {"id": tos_id, "version": version, "message": "Terms & Conditions created successfully"}

# ============== ADMIN ENDPOINTS ==============

@app.get("/api/admin/users")
async def list_users(limit: int = 100, user = Depends(require_auth)):
    """List all users (admin only)"""
    if not user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Only admins can list users")
    
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT id, username, email, is_admin, created_at FROM users
        ORDER BY created_at DESC
        LIMIT ?
    """, (limit,))
    
    users = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    return {"users": users}

@app.get("/api/admin/users/{user_id}")
async def get_user_details(user_id: int, admin_user = Depends(require_auth)):
    """Get user details (admin only)"""
    if not admin_user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Only admins can view user details")
    
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT id, username, email, is_admin, created_at FROM users WHERE id = ?
    """, (user_id,))
    
    user = cursor.fetchone()
    conn.close()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return dict(user)

@app.put("/api/admin/users/{user_id}/role")
async def update_user_role(user_id: int, is_admin: bool = Body(..., embed=True), admin_user = Depends(require_auth)):
    """Update user admin role (admin only)"""
    if not admin_user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Only admins can change user roles")
    
    if user_id == admin_user.get("id") and not is_admin:
        raise HTTPException(status_code=400, detail="Cannot remove your own admin status")
    
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("UPDATE users SET is_admin = ? WHERE id = ?", (is_admin, user_id))
    conn.commit()
    conn.close()
    
    log_activity(admin_user.get("id"), f"user_role_change_to_{is_admin}", None, None)
    
    return {"message": f"User role updated to {'admin' if is_admin else 'regular'}"}

@app.delete("/api/admin/posts/{post_id}")
async def delete_post_admin(post_id: int, user = Depends(require_auth)):
    """Delete any post (admin only)"""
    if not user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Only admins can delete posts")
    
    conn = get_db()
    cursor = conn.cursor()
    
    # Get post details before deletion
    cursor.execute("SELECT user_id, image_filename FROM posts WHERE id = ?", (post_id,))
    post = cursor.fetchone()
    
    if not post:
        conn.close()
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Delete related favorites
    cursor.execute("DELETE FROM favorites WHERE post_id = ?", (post_id,))
    
    # Delete post_tags
    cursor.execute("DELETE FROM post_tags WHERE post_id = ?", (post_id,))
    
    # Delete pool_posts
    cursor.execute("DELETE FROM pool_posts WHERE post_id = ?", (post_id,))
    
    # Delete post
    cursor.execute("DELETE FROM posts WHERE id = ?", (post_id,))
    
    conn.commit()
    conn.close()
    
    # Log activity
    log_activity(user.get("id"), "post_moderation_delete", post_id, None)
    
    # Clean up image file
    try:
        if post[1]:
            image_path = os.path.join("uploads", post[1])
            if os.path.exists(image_path):
                os.remove(image_path)
    except Exception as e:
        print(f"Error deleting image file: {e}")
    
    return {"message": "Post deleted by admin"}

@app.delete("/api/admin/posts/{post_id}/user/{original_user_id}")
async def delete_post_user_posts(post_id: int, original_user_id: int, user = Depends(require_auth)):
    """Delete specific user's post (admin only)"""
    if not user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Only admins can delete posts")
    
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("SELECT user_id, image_filename FROM posts WHERE id = ? AND user_id = ?", (post_id, original_user_id))
    post = cursor.fetchone()
    
    if not post:
        conn.close()
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Delete related entries
    cursor.execute("DELETE FROM favorites WHERE post_id = ?", (post_id,))
    cursor.execute("DELETE FROM post_tags WHERE post_id = ?", (post_id,))
    cursor.execute("DELETE FROM pool_posts WHERE post_id = ?", (post_id,))
    cursor.execute("DELETE FROM posts WHERE id = ?", (post_id,))
    
    conn.commit()
    conn.close()
    
    log_activity(user.get("id"), "post_moderation_delete", post_id, None)
    
    try:
        if post[1]:
            image_path = os.path.join("uploads", post[1])
            if os.path.exists(image_path):
                os.remove(image_path)
    except Exception as e:
        print(f"Error deleting image file: {e}")
    
    return {"message": "Post deleted by admin"}

@app.delete("/api/admin/pools/{pool_id}")
async def delete_pool_admin(pool_id: int, user = Depends(require_auth)):
    """Delete any pool (admin only)"""
    if not user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Only admins can delete pools")
    
    conn = get_db()
    cursor = conn.cursor()
    
    # Delete pool_posts
    cursor.execute("DELETE FROM pool_posts WHERE pool_id = ?", (pool_id,))
    
    # Delete pool
    cursor.execute("DELETE FROM pools WHERE id = ?", (pool_id,))
    
    conn.commit()
    conn.close()
    
    log_activity(user.get("id"), "pool_moderation_delete", None, pool_id)
    
    return {"message": "Pool deleted by admin"}

@app.delete("/api/admin/users/{user_id}")
async def delete_user_admin(user_id: int, admin_user = Depends(require_auth)):
    """Delete user account (admin only)"""
    if not admin_user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Only admins can delete users")
    
    if user_id == admin_user.get("id"):
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    
    conn = get_db()
    cursor = conn.cursor()
    
    # Get all posts by this user
    cursor.execute("SELECT id, image_filename FROM posts WHERE user_id = ?", (user_id,))
    posts = cursor.fetchall()
    
    # Delete all user's posts
    for post_id, image_filename in posts:
        cursor.execute("DELETE FROM favorites WHERE post_id = ?", (post_id,))
        cursor.execute("DELETE FROM post_tags WHERE post_id = ?", (post_id,))
        cursor.execute("DELETE FROM pool_posts WHERE post_id = ?", (post_id,))
        try:
            if image_filename:
                image_path = os.path.join("uploads", image_filename)
                if os.path.exists(image_path):
                    os.remove(image_path)
        except Exception as e:
            print(f"Error deleting image file for post {post_id}: {e}")
    
    cursor.execute("DELETE FROM posts WHERE user_id = ?", (user_id,))
    cursor.execute("DELETE FROM pools WHERE user_id = ?", (user_id,))
    cursor.execute("DELETE FROM favorites WHERE user_id = ?", (user_id,))
    cursor.execute("DELETE FROM user_tos_acceptance WHERE user_id = ?", (user_id,))
    cursor.execute("DELETE FROM password_reset_tokens WHERE user_id = ?", (user_id,))
    cursor.execute("DELETE FROM activity_log WHERE user_id = ? OR action_detail LIKE ?", (user_id, f"%{user_id}%"))
    cursor.execute("DELETE FROM users WHERE id = ?", (user_id,))
    
    conn.commit()
    conn.close()
    
    log_activity(admin_user.get("id"), "user_deletion", None, None)
    
    return {"message": "User and all related data deleted"}

@app.get("/api/admin/activity-log")
async def get_admin_activity_log(limit: int = 100, user = Depends(require_auth)):
    """Get admin activity log (admin only)"""
    if not user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Only admins can view activity log")
    
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT id, user_id, action_type, post_id, pool_id, timestamp
        FROM activity_log
        WHERE action_type LIKE '%moderation%' OR action_type LIKE '%user_role%' OR action_type = 'user_deletion'
        ORDER BY timestamp DESC
        LIMIT ?
    """, (limit,))
    
    logs = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    return {"logs": logs}

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