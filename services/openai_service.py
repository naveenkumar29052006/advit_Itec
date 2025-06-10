import os
from dotenv import load_dotenv
from typing import List, Dict, Any
import json
import logging
import google.generativeai as genai
from config import GEMINI_API_KEY

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

# Configure the Gemini API
genai.configure(api_key=GEMINI_API_KEY)

# List available models
available_models = [m.name for m in genai.list_models()]
logger.info(f"Available models: {available_models}")

# Initialize the model
model = genai.GenerativeModel('gemini-1.5-pro-latest')

# System prompt for the chatbot
SYSTEM_PROMPT = """You are a professional tax and finance expert chatbot. Your expertise includes:
- Tax planning and preparation
- Financial analysis and reporting
- Business advisory services
- Compliance and regulatory matters
- Investment strategies
- Risk management

Please provide clear, accurate, and professional responses. If you're unsure about something, acknowledge the limitations and suggest consulting with a qualified professional.

Format your responses in a clear, structured manner using markdown when appropriate."""

def get_chat_response(message: str) -> str:
    try:
        # Combine system prompt and user message
        prompt = f"{SYSTEM_PROMPT}\n\nUser: {message}"
        
        # Generate response
        response = model.generate_content(prompt)
        
        # Extract and return the response text
        return response.text
    except Exception as e:
        logger.error(f"Error getting chat response: {str(e)}")
        raise

async def get_openai_response(user_query: str) -> str:
    """Main entry point for getting responses from the chatbot"""
    try:
        # Convert user query to messages format
        messages = [{"role": "user", "content": user_query}]
        logger.info(f"Processing query: {user_query}")
        
        response = await get_chat_response(user_query)
        return response
    except Exception as e:
        logger.error(f"Error in get_openai_response: {str(e)}", exc_info=True)
        raise  # Re-raise to handle in the route
