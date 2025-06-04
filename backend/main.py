from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from backend.routes import chat, user
import os
from dotenv import load_dotenv
import time
from typing import Callable
import logging
from backend.DATABASE.database import init_db

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Advit ITEC Chatbot API",
    description="Backend API for the Advit ITEC Chatbot application",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins in development
    allow_credentials=False,  # Disable credentials since we're using token auth
    allow_methods=["*"],
    allow_headers=["*"]
)

# Initialize database on startup
@app.on_event("startup")
async def startup():
    try:
        init_db()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Error initializing database: {e}")
        raise

# Error handler for rate limit exceeded
@app.exception_handler(HTTPException)
async def rate_limit_handler(request: Request, exc: HTTPException):
    if exc.status_code == 429:  # Too Many Requests
        return JSONResponse(
            status_code=429,
            content={
                "status": "error",
                "message": "Too many requests. Please try again later.",
                "detail": "Rate limit exceeded"
            }
        )
    raise exc

# Middleware for request timing and logging
@app.middleware("http")
async def log_requests(request: Request, call_next: Callable):
    """Log request details for debugging"""
    start_time = time.time()
    
    # Log request details
    logger.info(f"Request: {request.method} {request.url}")
    logger.info(f"Headers: {dict(request.headers)}")
    
    try:
        body = await request.body()
        if body:
            logger.info(f"Request body: {body.decode()}")
    except Exception as e:
        logger.error(f"Error reading request body: {e}")
    
    # Process request
    response = await call_next(request)
    
    # Log response details
    process_time = time.time() - start_time
    logger.info(f"Response status: {response.status_code}")
    logger.info(f"Process time: {process_time:.3f}s")
    
    return response

# Include routers
app.include_router(chat.router, prefix="/chat")
app.include_router(user.router, prefix="/user")

@app.get("/check_key")
def check_key():
    return {"OPENAI_API_KEY": os.getenv("OPENAI_API_KEY")}

@app.get("/")
def root():
    return {"message": "CA Chatbot backend is running"}
