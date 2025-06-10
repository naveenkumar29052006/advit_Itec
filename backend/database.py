from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.models.chat import Base
import os
from dotenv import load_dotenv
from urllib.parse import quote_plus

load_dotenv(os.path.join(os.path.dirname(__file__), '../.env'))

# Fallback: also load from project root if not found
if not os.getenv('DB_USER'):
    from pathlib import Path
    load_dotenv(str(Path(__file__).parent.parent / '.env'))

DB_USER = os.getenv('DB_USER', 'root')
DB_PASSWORD = quote_plus(os.getenv('DB_PASSWORD', ''))  # URL encode the password
DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_PORT = os.getenv('DB_PORT', '3306')
DB_NAME = os.getenv('DB_NAME', 'chatbot')

DATABASE_URL = f"mysql+mysqlconnector://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create tables if they don't exist
Base.metadata.create_all(bind=engine)

def get_db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()