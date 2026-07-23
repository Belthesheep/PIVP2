"""
Database migration script to upgrade existing databases to 3NF normalized schema.
Run this if you have an existing sheepbooru.db without the new tables.
"""

import sqlite3
import datetime

DB_NAME = "sheepbooru.db"

def migrate_to_v2():
    """Migrate existing database to add new 3NF normalized tables"""
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    print("Starting database migration...")
    
    # Check if columns exist before adding them
    cursor.execute("PRAGMA table_info(users)")
    columns = {col[1] for col in cursor.fetchall()}
    
    # Add email column if it doesn't exist
    if 'email' not in columns:
        print("Adding email column to users table...")
        cursor.execute("ALTER TABLE users ADD COLUMN email TEXT DEFAULT NULL")
    
    # Add accepted_tos column if it doesn't exist
    if 'accepted_tos' not in columns:
        print("Adding accepted_tos column to users table...")
        cursor.execute("ALTER TABLE users ADD COLUMN accepted_tos BOOLEAN DEFAULT 0")
    
    # Create activity_log table if it doesn't exist
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
    print("Created activity_log table")
    
    # Create password_reset_tokens table if it doesn't exist
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
    print("Created password_reset_tokens table")
    
    # Create terms_and_conditions table if it doesn't exist
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS terms_and_conditions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            version TEXT NOT NULL UNIQUE,
            content TEXT NOT NULL,
            created_at DATETIME NOT NULL
        )
    """)
    print("Created terms_and_conditions table")
    
    # Create user_tos_acceptance table if it doesn't exist
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
    print("Created user_tos_acceptance table")
    
    # Create initial Terms & Conditions if none exist
    cursor.execute("SELECT COUNT(*) FROM terms_and_conditions")
    if cursor.fetchone()[0] == 0:
        default_tos = """TERMS AND CONDITIONS

1. DISCLAIMER OF LIABILITY
The site owner is NOT responsible for any user-posted content on this platform. Users post at their own risk.

2. CONTENT GUIDELINES
All content must comply with applicable local, state, and federal laws. Content that violates any laws is prohibited.

3. CONTENT REMOVAL
Illegal content, copyrighted material, and content that violates these terms will be removed immediately upon detection or user report.

4. USER RESPONSIBILITY
Users are solely responsible for the content they upload. By uploading content, users warrant that they own or have licensed the content.

5. PRIVACY
Your personal information is used only for account management and service improvement. See privacy policy for details.

6. MODIFICATION OF TERMS
These terms may be modified at any time. Continued use of the service constitutes acceptance of modified terms."""
        
        cursor.execute(
            "INSERT INTO terms_and_conditions (version, content, created_at) VALUES (?, ?, ?)",
            ("1.0.0", default_tos, datetime.datetime.now().isoformat())
        )
        print("Created default Terms & Conditions v1.0.0")
    
    conn.commit()
    conn.close()
    print("Migration completed successfully!")

if __name__ == "__main__":
    migrate_to_v2()
