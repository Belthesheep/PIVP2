import sqlite3

DB_NAME = "sheepbooru.db"

def init_db():
    """Initialize the database with all required tables"""
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    # Users table (3NF normalized with email and T&C fields)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            email TEXT UNIQUE,
            password_hash TEXT NOT NULL,
            is_admin BOOLEAN NOT NULL DEFAULT 0,
            accepted_tos BOOLEAN NOT NULL DEFAULT 0,
            created_at DATETIME NOT NULL
        )
    """)
    
    # Posts table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            image_filename TEXT NOT NULL,
            uploader_id INTEGER NOT NULL,
            upload_date DATETIME NOT NULL,
            description TEXT,
            favorite_count INTEGER NOT NULL DEFAULT 0,
            FOREIGN KEY (uploader_id) REFERENCES users(id) ON DELETE CASCADE
        )
    """)
    
    # Tags table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS tags (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tag_name TEXT NOT NULL UNIQUE
        )
    """)
    
    # PostTags junction table (many-to-many relationship)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS post_tags (
            post_id INTEGER NOT NULL,
            tag_id INTEGER NOT NULL,
            PRIMARY KEY (post_id, tag_id),
            FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
            FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
        )
    """)
    
    # Favorites table (tracks which users favorited which posts)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS favorites (
            user_id INTEGER NOT NULL,
            post_id INTEGER NOT NULL,
            favorited_at DATETIME NOT NULL,
            PRIMARY KEY (user_id, post_id),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
        )
    """)
    
    # Pools table (collections of posts)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS pools (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            creator_id INTEGER NOT NULL,
            created_at DATETIME NOT NULL,
            FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE
        )
    """)
    
    # PoolPosts junction table (ordered posts in pools)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS pool_posts (
            pool_id INTEGER NOT NULL,
            post_id INTEGER NOT NULL,
            order_index INTEGER NOT NULL,
            PRIMARY KEY (pool_id, post_id),
            FOREIGN KEY (pool_id) REFERENCES pools(id) ON DELETE CASCADE,
            FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
        )
    """)
    
    # Activity log table (for reporting and analytics)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS activity_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            action_type TEXT NOT NULL,
            post_id INTEGER,
            pool_id INTEGER,
            timestamp DATETIME NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE SET NULL,
            FOREIGN KEY (pool_id) REFERENCES pools(id) ON DELETE SET NULL
        )
    """)
    
    # Password reset tokens table (for password recovery)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS password_reset_tokens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL UNIQUE,
            token TEXT NOT NULL UNIQUE,
            created_at DATETIME NOT NULL,
            expires_at DATETIME NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    """)
    
    # Terms and Conditions versions table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS terms_and_conditions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            version TEXT NOT NULL UNIQUE,
            content TEXT NOT NULL,
            created_at DATETIME NOT NULL
        )
    """)
    
    # User T&C acceptance records
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_tos_acceptance (
            user_id INTEGER NOT NULL,
            tos_id INTEGER NOT NULL,
            accepted_at DATETIME NOT NULL,
            PRIMARY KEY (user_id, tos_id),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (tos_id) REFERENCES terms_and_conditions(id) ON DELETE CASCADE
        )
    """)
    
    conn.commit()
    conn.close()
    print(f"Database '{DB_NAME}' initialized successfully with 11 tables!")
    print("Tables: users, posts, tags, post_tags, favorites, pools, pool_posts,")
    print("        activity_log, password_reset_tokens, terms_and_conditions, user_tos_acceptance")

if __name__ == "__main__":
    init_db()