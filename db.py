"""
Database Access Layer for CookMate
Provides unified parameterized query execution for MySQL (with automatic fallback to SQLite
if MySQL is not yet configured with valid credentials in .env).
"""

import os
import sqlite3
import pymysql
import pymysql.cursors
from config import Config, BASE_DIR

_use_mysql = False
_db_checked = False

def get_connection():
    """
    Establish a connection to the configured database.
    Attempts MySQL first; falls back gracefully to SQLite if MySQL is unreachable.
    """
    global _use_mysql, _db_checked
    
    # Try MySQL if not determined yet or if configured
    if not _db_checked or _use_mysql:
        try:
            # First try connecting without selecting a database in case cookmate_db isn't created yet
            conn = pymysql.connect(
                host=Config.DB_HOST,
                port=Config.DB_PORT,
                user=Config.DB_USER,
                password=Config.DB_PASSWORD,
                cursorclass=pymysql.cursors.DictCursor,
                autocommit=False,
                charset='utf8mb4'
            )
            # Create database if it does not exist
            with conn.cursor() as cur:
                cur.execute(f"CREATE DATABASE IF NOT EXISTS `{Config.DB_NAME}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
                cur.execute(f"USE `{Config.DB_NAME}`;")
            conn.commit()
            
            _use_mysql = True
            _db_checked = True
            return conn
        except Exception as e:
            if not _db_checked:
                print(f"[Database Notification] Could not connect to MySQL server ({e}).")
                print("[Database Notification] Using local database fallback (cookmate.db) so you can run and test immediately.")
                print("[Database Notification] To use MySQL, set DB_PASSWORD in your .env file.\n")
            _use_mysql = False
            _db_checked = True

    # SQLite fallback connection
    sqlite_path = os.path.join(str(BASE_DIR), 'cookmate.db')
    conn = sqlite3.connect(sqlite_path)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

def is_mysql():
    """Returns True if the current active engine is MySQL."""
    global _use_mysql
    return _use_mysql

def dict_from_row(row):
    """Converts a sqlite3.Row or dict into a standard python dict."""
    if row is None:
        return None
    if isinstance(row, dict):
        return row
    return dict(row)

def query(sql, params=None, fetch='all'):
    """
    Executes a SELECT query with parameterized inputs.
    fetch options: 'all', 'one', or 'none'
    """
    conn = get_connection()
    try:
        if is_mysql():
            with conn.cursor() as cur:
                # Replace SQLite ? with MySQL %s if needed
                formatted_sql = sql.replace('?', '%s')
                cur.execute(formatted_sql, params or ())
                if fetch == 'one':
                    res = cur.fetchone()
                elif fetch == 'all':
                    res = cur.fetchall()
                else:
                    res = None
            conn.commit()
            return res
        else:
            # SQLite
            cur = conn.cursor()
            formatted_sql = sql.replace('%s', '?')
            cur.execute(formatted_sql, params or ())
            if fetch == 'one':
                row = cur.fetchone()
                res = dict_from_row(row)
            elif fetch == 'all':
                rows = cur.fetchall()
                res = [dict_from_row(r) for r in rows]
            else:
                res = None
            conn.commit()
            return res
    finally:
        conn.close()

def execute(sql, params=None):
    """
    Executes an INSERT, UPDATE, or DELETE query.
    Returns the lastrowid.
    """
    conn = get_connection()
    try:
        if is_mysql():
            with conn.cursor() as cur:
                formatted_sql = sql.replace('?', '%s')
                cur.execute(formatted_sql, params or ())
                last_id = cur.lastrowid
            conn.commit()
            return last_id
        else:
            cur = conn.cursor()
            formatted_sql = sql.replace('%s', '?')
            cur.execute(formatted_sql, params or ())
            last_id = cur.lastrowid
            conn.commit()
            return last_id
    finally:
        conn.close()

def init_db():
    """
    Initializes tables if they do not exist.
    Compatible with both MySQL and SQLite.
    """
    conn = get_connection()
    try:
        if is_mysql():
            with conn.cursor() as cur:
                # 1. Users
                cur.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    email VARCHAR(120) NOT NULL UNIQUE,
                    password_hash VARCHAR(255) NOT NULL,
                    role VARCHAR(20) DEFAULT 'customer',
                    phone VARCHAR(20) DEFAULT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
                """)
                # 2. Food Items
                cur.execute("""
                CREATE TABLE IF NOT EXISTS food_items (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(150) NOT NULL,
                    category VARCHAR(80) NOT NULL,
                    price DECIMAL(10, 2) NOT NULL,
                    discount_price DECIMAL(10, 2) DEFAULT NULL,
                    description TEXT NOT NULL,
                    prep_time VARCHAR(50) DEFAULT '20 mins',
                    serving_size VARCHAR(50) DEFAULT '1-2 persons',
                    rating DECIMAL(2, 1) DEFAULT 4.5,
                    image_url VARCHAR(255) NOT NULL,
                    is_available BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
                """)
                # 3. Favorites
                cur.execute("""
                CREATE TABLE IF NOT EXISTS favorites (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT NOT NULL,
                    meal_id VARCHAR(50) NOT NULL,
                    meal_name VARCHAR(150) NOT NULL,
                    meal_thumb VARCHAR(255) DEFAULT NULL,
                    meal_category VARCHAR(80) DEFAULT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE KEY unique_user_meal (user_id, meal_id),
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
                """)
                # 4. Cart Items
                cur.execute("""
                CREATE TABLE IF NOT EXISTS cart_items (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT NOT NULL,
                    food_item_id INT NOT NULL,
                    quantity INT NOT NULL DEFAULT 1,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    UNIQUE KEY unique_user_cart_item (user_id, food_item_id),
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (food_item_id) REFERENCES food_items(id) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
                """)
                # 5. Orders
                cur.execute("""
                CREATE TABLE IF NOT EXISTS orders (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    order_number VARCHAR(30) NOT NULL UNIQUE,
                    user_id INT NOT NULL,
                    customer_name VARCHAR(100) NOT NULL,
                    customer_email VARCHAR(120) NOT NULL,
                    customer_phone VARCHAR(30) NOT NULL,
                    delivery_address TEXT NOT NULL,
                    total_amount DECIMAL(10, 2) NOT NULL,
                    payment_method VARCHAR(50) DEFAULT 'Cash on Delivery',
                    status VARCHAR(30) DEFAULT 'Placed',
                    notes TEXT DEFAULT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
                """)
                # 6. Order Items
                cur.execute("""
                CREATE TABLE IF NOT EXISTS order_items (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    order_id INT NOT NULL,
                    food_item_id INT DEFAULT NULL,
                    item_name VARCHAR(150) NOT NULL,
                    unit_price DECIMAL(10, 2) NOT NULL,
                    quantity INT NOT NULL,
                    line_total DECIMAL(10, 2) NOT NULL,
                    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
                """)
                # 7. Contact Messages
                cur.execute("""
                CREATE TABLE IF NOT EXISTS contact_messages (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    email VARCHAR(120) NOT NULL,
                    subject VARCHAR(150) NOT NULL,
                    message TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
                """)
            conn.commit()
        else:
            # SQLite Table Initialization
            cur = conn.cursor()
            cur.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                role TEXT DEFAULT 'customer',
                phone TEXT DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """)
            cur.execute("""
            CREATE TABLE IF NOT EXISTS food_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                category TEXT NOT NULL,
                price REAL NOT NULL,
                discount_price REAL DEFAULT NULL,
                description TEXT NOT NULL,
                prep_time TEXT DEFAULT '20 mins',
                serving_size TEXT DEFAULT '1-2 persons',
                rating REAL DEFAULT 4.5,
                image_url TEXT NOT NULL,
                is_available INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """)
            cur.execute("""
            CREATE TABLE IF NOT EXISTS favorites (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                meal_id TEXT NOT NULL,
                meal_name TEXT NOT NULL,
                meal_thumb TEXT DEFAULT NULL,
                meal_category TEXT DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE (user_id, meal_id),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
            """)
            cur.execute("""
            CREATE TABLE IF NOT EXISTS cart_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                food_item_id INTEGER NOT NULL,
                quantity INTEGER NOT NULL DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE (user_id, food_item_id),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (food_item_id) REFERENCES food_items(id) ON DELETE CASCADE
            );
            """)
            cur.execute("""
            CREATE TABLE IF NOT EXISTS orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_number TEXT NOT NULL UNIQUE,
                user_id INTEGER NOT NULL,
                customer_name TEXT NOT NULL,
                customer_email TEXT NOT NULL,
                customer_phone TEXT NOT NULL,
                delivery_address TEXT NOT NULL,
                total_amount REAL NOT NULL,
                payment_method TEXT DEFAULT 'Cash on Delivery',
                status TEXT DEFAULT 'Placed',
                notes TEXT DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
            """)
            cur.execute("""
            CREATE TABLE IF NOT EXISTS order_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id INTEGER NOT NULL,
                food_item_id INTEGER DEFAULT NULL,
                item_name TEXT NOT NULL,
                unit_price REAL NOT NULL,
                quantity INTEGER NOT NULL,
                line_total REAL NOT NULL,
                FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
            );
            """)
            cur.execute("""
            CREATE TABLE IF NOT EXISTS contact_messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                subject TEXT NOT NULL,
                message TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """)
            conn.commit()
    finally:
        conn.close()
