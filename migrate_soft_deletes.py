"""
Migración para agregar soporte de eliminación lógica (soft deletes)
Agrega columnas deleted_at a posts, users, pools y is_deleted a tags
"""

import sqlite3
from datetime import datetime

DB_NAME = "sheepbooru.db"

def migrate_soft_deletes():
    """Agrega columnas para soft deletes a las tablas principales"""
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    try:
        # Agregar columna deleted_at a tabla users
        print("Agregando columna deleted_at a tabla users...")
        cursor.execute("""
            ALTER TABLE users ADD COLUMN deleted_at DATETIME DEFAULT NULL
        """)
        print("✓ Tabla users actualizada")
    except sqlite3.OperationalError as e:
        if "duplicate column" in str(e):
            print("✓ Tabla users ya tiene columna deleted_at")
        else:
            raise
    
    try:
        # Agregar columna deleted_at a tabla posts
        print("Agregando columna deleted_at a tabla posts...")
        cursor.execute("""
            ALTER TABLE posts ADD COLUMN deleted_at DATETIME DEFAULT NULL
        """)
        print("✓ Tabla posts actualizada")
    except sqlite3.OperationalError as e:
        if "duplicate column" in str(e):
            print("✓ Tabla posts ya tiene columna deleted_at")
        else:
            raise
    
    try:
        # Agregar columna deleted_at a tabla pools
        print("Agregando columna deleted_at a tabla pools...")
        cursor.execute("""
            ALTER TABLE pools ADD COLUMN deleted_at DATETIME DEFAULT NULL
        """)
        print("✓ Tabla pools actualizada")
    except sqlite3.OperationalError as e:
        if "duplicate column" in str(e):
            print("✓ Tabla pools ya tiene columna deleted_at")
        else:
            raise
    
    try:
        # Agregar columna is_deleted a tabla tags
        print("Agregando columna is_deleted a tabla tags...")
        cursor.execute("""
            ALTER TABLE tags ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT 0
        """)
        print("✓ Tabla tags actualizada")
    except sqlite3.OperationalError as e:
        if "duplicate column" in str(e):
            print("✓ Tabla tags ya tiene columna is_deleted")
        else:
            raise
    
    conn.commit()
    conn.close()
    print("\n✓ Migración de soft deletes completada exitosamente!")

if __name__ == "__main__":
    migrate_soft_deletes()
