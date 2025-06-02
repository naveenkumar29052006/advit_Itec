from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from services.openai_service import get_openai_response
from fastapi.logger import logger

router = APIRouter()

class ChatRequest(BaseModel):
    message: Optional[str]

@router.post("/")
async def chat(request: ChatRequest):

    logger.info(f"Received chat request with message: {request.message}")
    

    response = await get_openai_response(request.message)
    

    logger.info(f"OpenAI response: {response}")
    
    return {"response": response}
