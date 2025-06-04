from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from routes import chat
import logging
from DATABASE.database import init_db

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="CA Chatbot API",
    description="Backend API for the CA Chatbot application",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    try:
        init_db()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Error initializing database: {e}")

# Include routers
app.include_router(chat.router, prefix="/chat")

@app.get("/")
def root():
    return {
        "status": "success",
        "message": "CA Chatbot backend is running",
        "version": "1.0.0"
    }
