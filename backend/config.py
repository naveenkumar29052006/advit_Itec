from dotenv import load_dotenv
import os
import logging
from pathlib import Path

# Configure logging
logger = logging.getLogger(__name__)

# Get the project root directory
ROOT_DIR = Path(__file__).parent.parent

# Load environment variables from .env file in project root
load_dotenv(ROOT_DIR / ".env")

# API Configuration
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Database Configuration
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./ca_chatbot.db")

# Server Configuration
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))

# Validate required environment variables

