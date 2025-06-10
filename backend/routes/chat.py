from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from backend.services.openai_service import get_openai_response
import logging
import time
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FuturesTimeoutError

router = APIRouter()
logger = logging.getLogger(__name__)
executor = ThreadPoolExecutor(max_workers=2)

class ChatRequest(BaseModel):
    user_query: str

class ChatResponse(BaseModel):
    response: str

@router.post("/chat", response_model=ChatResponse)
def chat_endpoint(chat_request: ChatRequest, request: Request):
    """Synchronous endpoint for Gemini (Google Generative AI) only."""
    start_time = time.time()
    try:
        user_query = chat_request.user_query
        logger.info(f"Request from: {request.client.host}")
        print("Before Gemini call")  # DEBUG
        # Run Gemini call in a background thread with timeout
        future = executor.submit(get_openai_response, user_query)
        try:
            response = future.result(timeout=15)
        except FuturesTimeoutError:
            logger.error("Gemini API call timed out")
            raise HTTPException(status_code=504, detail="Gemini API call timed out")
        print("After Gemini call")   # DEBUG
        elapsed = time.time() - start_time
        logger.info(f"/chat response time: {elapsed:.2f} seconds")
        return ChatResponse(response=response)
    except HTTPException as e:
        logger.error(f"HTTPException in /chat: {e.detail}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error in /chat: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
