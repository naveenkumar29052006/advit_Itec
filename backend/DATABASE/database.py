import mysql.connector
from mysql.connector import Error, pooling
from contextlib import contextmanager
import os
from dotenv import load_dotenv
import logging
from typing import Optional
from pathlib import Path

# Get the project root directory
ROOT_DIR = Path(__file__).parent.parent.parent

# Load environment variables
load_dotenv(ROOT_DIR / ".env")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database configuration


DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'nn03092005neeA@',
    'database': 'chatbot',
    'pool_name': 'mypool',
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
    """Get a database connection from the pool"""
    print(f"DB_HOST: {os.getenv('DB_HOST')}")
    print(f"DB_USER: {os.getenv('DB_USER')}")
    print(f"DB_PASSWORD: {os.getenv('DB_PASSWORD')}")
    print(f"DB_NAME: {os.getenv('DB_NAME')}")
    try:
        connection = connection_pool.get_connection()
        return connection
    except Error as e:
        logger.error(f"Error getting connection from pool: {e}")
        raise

@contextmanager
def get_db_cursor():
    """Context manager for database cursor"""
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
    try:
        with get_db_cursor() as (cursor, conn):
            # Create users table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    name VARCHAR(255) NOT NULL,
                    phone VARCHAR(20),
                    country VARCHAR(100),
                    state VARCHAR(100),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)

            # Create chat_conversations table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS chat_conversations (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT NOT NULL,
                    title VARCHAR(255) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    email_status ENUM('pending', 'sent', 'failed') DEFAULT 'pending',
                    FOREIGN KEY (user_id) REFERENCES users(id)
                )
            """)

            # Create qa_pairs table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS qa_pairs (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT NOT NULL,
                    conversation_id INT NOT NULL,
                    question TEXT NOT NULL,
                    answer TEXT NOT NULL,
                    category VARCHAR(50) DEFAULT 'general',
                    rating INT,
                    suggestion TEXT,
                    is_helpful BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id),
                    FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id)
                )
            """)

            conn.commit()
            logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Error initializing database: {e}")
        raise

