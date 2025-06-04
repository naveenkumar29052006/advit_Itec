import mysql.connector
from mysql.connector import Error, pooling
from contextlib import contextmanager
import os
from dotenv import load_dotenv
import logging
from typing import Optional

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database configuration
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD', 'nn03092005neeA@'),
    'database': os.getenv('DB_NAME', 'chatbot'),
    'pool_name': 'chatbot_pool',
    'pool_size': 5
}

# Create connection pool
try:
    connection_pool = mysql.connector.pooling.MySQLConnectionPool(**DB_CONFIG)
    logger.info("Database connection pool created successfully")
except Error as e:
    logger.error(f"Error creating connection pool: {e}")
    raise

def get_db_connection():
    try:
        connection = connection_pool.get_connection()
        return connection
    except Error as e:
        logger.error(f"Error getting connection from pool: {e}")
        raise

@contextmanager
def get_db_cursor():
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True, buffered=True)
        yield cursor, conn
    except Error as e:
        logger.error(f"Database error: {e}")
        if conn:
            conn.rollback()
        raise
    finally:
        try:
            if cursor:
                cursor.close()
            if conn:
                conn.close()
        except Error as e:
            logger.error(f"Error closing database connection: {e}")
            raise

def init_db():
    """Initialize the database with required tables"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Create users table with extended profile
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                name VARCHAR(100) NOT NULL,
                password VARCHAR(255) NOT NULL,
                phone VARCHAR(20),
                country VARCHAR(100),
                state VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        """)
        conn.commit()

        # Create chat_sessions table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS chat_sessions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                end_time TIMESTAMP NULL,
                topic VARCHAR(100),
                context TEXT,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        """)
        conn.commit()

        # Create qa_pairs table with enhanced tracking
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS qa_pairs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                session_id INT,
                question TEXT NOT NULL,
                answer TEXT NOT NULL,
                category VARCHAR(50) DEFAULT 'general',
                is_helpful BOOLEAN DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                user_context TEXT,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (session_id) REFERENCES chat_sessions(id),
                INDEX idx_user_session (user_id, session_id)
            )
        """)
        conn.commit()

        print("Database initialized successfully")
    except Error as e:
        print(f"Error initializing database: {e}")
        raise
    finally:
        cursor.close()
        conn.close()

