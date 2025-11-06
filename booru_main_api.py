from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
import sqlite3
import datetime
import hashlib
import os
import shutil

# Database setup
DB_NAME = "sheepbooru.db"
UPLOAD_DIR = "uploads"
py
# Ensure upload directory exists
os.makedirs(UPLOAD_DIR, exist_ok=True)

def get_db():
    """Get database connection"""
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")  # Enable foreign key constraints
    return conn

# Pydantic Models
class UserCreate(BaseModel):
    username: str = Field(..., min_length=3)
    password: str = Field(..., min_length=6)

class User(BaseModel):
    id: int
    username: str
    is_admin: bool
    created_at: str

class PostResponse(BaseModel):
    id: int
    image_filename: str
    uploader_id: int
    uploader_username: str
    upload_date: str
    description: Optional[str]
    tags: List[str]

class TagResponse(BaseModel):
    id: int
    tag_name: str
    post_count: int

# Initialize FastAPI
app = FastAPI(title="SheepBooru API")

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded images
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# ============== UTILITY FUNCTIONS ==============

def hash_password(password: str) -> str:
    """Simple password hashing (use proper library in production!)"""
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

# ============== USER ENDPOINTS ==============

@app.post("/api/users", status_code=201)
async def create_user(user: UserCreate):
    """Register a new user"""
    conn = get_db()
    cursor = conn.cursor()
    
    # Check if username exists
    cursor.execute("SELECT id FROM users WHERE username = ?", (user.username,))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=409, detail="Username already exists")
    
    # Create user
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
    uploader_id: int = Form(...),
    description: Optional[str] = Form(None),
    tags: str = Form(...)  # Comma-separated tags
):
    """Upload a new post with image and tags"""
    conn = get_db()
    cursor = conn.cursor()
    
    # Verify user exists
    cursor.execute("SELECT id FROM users WHERE id = ?", (uploader_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="User not found")
    
    # Save image file
    filename = f"{datetime.datetime.now().timestamp()}_{image.filename}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    
    with open(filepath, "wb") as f:
        shutil.copyfileobj(image.file, f)
    
    # Create post
    upload_date = datetime.datetime.now().isoformat()
    cursor.execute(
        "INSERT INTO posts (image_filename, uploader_id, upload_date, description) VALUES (?, ?, ?, ?)",
        (filename, uploader_id, upload_date, description)
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
async def list_posts(tag: Optional[str] = None):
    """List all posts, optionally filtered by tag"""
    conn = get_db()
    cursor = conn.cursor()
    
    if tag:
        # Filter by tag
        query = """
            SELECT DISTINCT p.id, p.image_filename, p.uploader_id, u.username as uploader_username,
                   p.upload_date, p.description
            FROM posts p
            JOIN users u ON p.uploader_id = u.id
            JOIN post_tags pt ON p.id = pt.post_id
            JOIN tags t ON pt.tag_id = t.id
            WHERE t.tag_name = ?
            ORDER BY p.upload_date DESC
        """
        cursor.execute(query, (tag.lower(),))
    else:
        # Get all posts
        query = """
            SELECT p.id, p.image_filename, p.uploader_id, u.username as uploader_username,
                   p.upload_date, p.description
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
async def get_post(post_id: int):
    """Get a specific post with all details"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT p.id, p.image_filename, p.uploader_id, u.username as uploader_username,
               p.upload_date, p.description
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
    
    conn.close()
    
    return {**dict(post), "tags": tags}

@app.delete("/api/posts/{post_id}")
async def delete_post(post_id: int):
    """Delete a post and its image file"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("SELECT image_filename FROM posts WHERE id = ?", (post_id,))
    post = cursor.fetchone()
    
    if not post:
        conn.close()
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Delete image file
    filepath = os.path.join(UPLOAD_DIR, post["image_filename"])
    if os.path.exists(filepath):
        os.remove(filepath)
    
    # Delete post (CASCADE will handle post_tags)
    cursor.execute("DELETE FROM posts WHERE id = ?", (post_id,))
    conn.commit()
    conn.close()
    
    return {"message": "Post deleted successfully"}

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
        "version": "1.0",
        "endpoints": {
            "POST /api/users": "Create user",
            "GET /api/users": "List users",
            "POST /api/posts": "Upload post",
            "GET /api/posts": "List posts (optional ?tag=)",
            "GET /api/posts/{id}": "Get post details",
            "DELETE /api/posts/{id}": "Delete post",
            "GET /api/tags": "List all tags with counts"
        }
    }
