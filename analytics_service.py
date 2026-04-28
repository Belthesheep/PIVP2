"""
Analytics and reporting service for SheepBooru.
Provides functions to gather statistics for reports and admin dashboards.
"""

import sqlite3
import os
import datetime
from pathlib import Path

DB_NAME = "sheepbooru.db"
UPLOAD_DIR = "uploads"


def get_db():
    """Get database connection"""
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def get_post_count():
    """Get total number of posts"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) as count FROM posts")
    result = cursor.fetchone()
    conn.close()
    return result["count"] if result else 0


def get_user_count():
    """Get total number of users"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) as count FROM users")
    result = cursor.fetchone()
    conn.close()
    return result["count"] if result else 0


def get_folder_size_mb():
    """Get total size of uploads folder in MB"""
    if not os.path.exists(UPLOAD_DIR):
        return 0.0
    
    total_size = 0
    for filename in os.listdir(UPLOAD_DIR):
        filepath = os.path.join(UPLOAD_DIR, filename)
        if os.path.isfile(filepath):
            total_size += os.path.getsize(filepath)
    
    return round(total_size / (1024 * 1024), 2)  # Convert to MB


def get_activity_by_period(period: str = "day"):
    """
    Get activity statistics for a given period.
    
    Args:
        period: 'day', 'week', or 'month'
    
    Returns:
        dict with upload_count, download_count, delete_count
    """
    conn = get_db()
    cursor = conn.cursor()
    
    # Calculate date threshold
    now = datetime.datetime.now()
    if period == "day":
        threshold = now - datetime.timedelta(days=1)
    elif period == "week":
        threshold = now - datetime.timedelta(weeks=1)
    elif period == "month":
        threshold = now - datetime.timedelta(days=30)
    else:
        threshold = now - datetime.timedelta(days=1)
    
    threshold_iso = threshold.isoformat()
    
    # Get activity counts
    cursor.execute(
        "SELECT action_type, COUNT(*) as count FROM activity_log WHERE timestamp > ? GROUP BY action_type",
        (threshold_iso,)
    )
    results = cursor.fetchall()
    conn.close()
    
    activity_counts = {row["action_type"]: row["count"] for row in results}
    
    return {
        "upload_count": activity_counts.get("upload", 0),
        "download_count": activity_counts.get("download", 0),
        "delete_count": activity_counts.get("delete", 0),
        "period": period,
    }


def log_activity(user_id: int, action_type: str, post_id: int = None, pool_id: int = None):
    """
    Log an activity for analytics purposes.
    
    Args:
        user_id: ID of the user performing the action
        action_type: Type of action ('upload', 'download', 'delete', 'favorite', etc.)
        post_id: ID of post related to action (optional)
        pool_id: ID of pool related to action (optional)
    """
    conn = get_db()
    cursor = conn.cursor()
    
    timestamp = datetime.datetime.now().isoformat()
    
    cursor.execute(
        "INSERT INTO activity_log (user_id, action_type, post_id, pool_id, timestamp) VALUES (?, ?, ?, ?, ?)",
        (user_id, action_type, post_id, pool_id, timestamp)
    )
    
    conn.commit()
    conn.close()


def get_summary_report():
    """Get comprehensive summary report"""
    return {
        "total_posts": get_post_count(),
        "total_users": get_user_count(),
        "storage_used_mb": get_folder_size_mb(),
        "activity_today": get_activity_by_period("day"),
        "activity_week": get_activity_by_period("week"),
        "activity_month": get_activity_by_period("month"),
        "generated_at": datetime.datetime.now().isoformat(),
    }


def get_top_uploaders(limit: int = 10):
    """Get top uploaders by post count"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT 
            u.id,
            u.username,
            COUNT(p.id) as post_count
        FROM users u
        LEFT JOIN posts p ON u.id = p.uploader_id
        GROUP BY u.id, u.username
        ORDER BY post_count DESC
        LIMIT ?
    """, (limit,))
    
    results = cursor.fetchall()
    conn.close()
    
    return [dict(row) for row in results]


def get_post_statistics():
    """Get statistics about posts"""
    conn = get_db()
    cursor = conn.cursor()
    
    # Total posts
    cursor.execute("SELECT COUNT(*) as count FROM posts")
    total = cursor.fetchone()["count"]
    
    # Posts with no tags
    cursor.execute("""
        SELECT COUNT(*) as count FROM posts p
        WHERE NOT EXISTS (SELECT 1 FROM post_tags pt WHERE pt.post_id = p.id)
    """)
    untagged = cursor.fetchone()["count"]
    
    # Average favorites
    cursor.execute("SELECT AVG(favorite_count) as avg_fav FROM posts")
    avg_fav_row = cursor.fetchone()
    avg_fav = round(avg_fav_row["avg_fav"] or 0, 2)
    
    # Most favorited posts
    cursor.execute("""
        SELECT id, description, favorite_count FROM posts
        ORDER BY favorite_count DESC
        LIMIT 10
    """)
    top_posts = [dict(row) for row in cursor.fetchall()]
    
    conn.close()
    
    return {
        "total_posts": total,
        "untagged_posts": untagged,
        "average_favorites": avg_fav,
        "top_favorited_posts": top_posts,
    }


def get_pool_statistics():
    """Get statistics about pools"""
    conn = get_db()
    cursor = conn.cursor()
    
    # Total pools
    cursor.execute("SELECT COUNT(*) as count FROM pools")
    total = cursor.fetchone()["count"]
    
    # Pools by creator
    cursor.execute("""
        SELECT 
            u.username,
            COUNT(p.id) as pool_count
        FROM users u
        LEFT JOIN pools p ON u.id = p.creator_id
        GROUP BY u.id, u.username
        ORDER BY pool_count DESC
        LIMIT 10
    """)
    top_creators = [dict(row) for row in cursor.fetchall()]
    
    conn.close()
    
    return {
        "total_pools": total,
        "top_creators": top_creators,
    }


def get_tag_statistics(limit: int = 20):
    """Get statistics about tags"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT 
            t.tag_name,
            COUNT(pt.post_id) as post_count
        FROM tags t
        LEFT JOIN post_tags pt ON t.id = pt.tag_id
        GROUP BY t.id, t.tag_name
        ORDER BY post_count DESC
        LIMIT ?
    """, (limit,))
    
    results = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    return {"most_used_tags": results}


def get_activity_log(limit: int = 100, action_type: str = None):
    """Get activity log entries"""
    conn = get_db()
    cursor = conn.cursor()
    
    if action_type:
        cursor.execute("""
            SELECT 
                al.id,
                al.user_id,
                u.username,
                al.action_type,
                al.post_id,
                al.pool_id,
                al.timestamp
            FROM activity_log al
            JOIN users u ON al.user_id = u.id
            WHERE al.action_type = ?
            ORDER BY al.timestamp DESC
            LIMIT ?
        """, (action_type, limit))
    else:
        cursor.execute("""
            SELECT 
                al.id,
                al.user_id,
                u.username,
                al.action_type,
                al.post_id,
                al.pool_id,
                al.timestamp
            FROM activity_log al
            JOIN users u ON al.user_id = u.id
            ORDER BY al.timestamp DESC
            LIMIT ?
        """, (limit,))
    
    results = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    return results
