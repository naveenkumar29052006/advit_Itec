from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any
from services.openai_service import get_openai_response
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    email: str
    name: str = "Guest"
    phone: str = None
    country: str = ""
    state: str = ""
    conversation_id: str = None

@router.post("")
@router.post("/")
async def chat_endpoint(request: ChatRequest) -> Dict[str, Any]:
    """Handle chat messages"""
    try:
        response = await get_openai_response(request.message)
        return {
            "status": "success",
            "response": response,
            "conversation_id": request.conversation_id or "new"
        }
    except Exception as e:
        logger.error(f"Error in chat endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
