import requests
import os
from dotenv import load_dotenv
import json

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_REFERRER = os.getenv("OPENROUTER_REFERRER", "http://localhost:8000")
SITE_NAME = os.getenv("Advit ITec", "Advit ITec Chatbot")
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

HEADERS = {
    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
    "HTTP-Referer": OPENROUTER_REFERRER,
    "X-Title": SITE_NAME,
    "Content-Type": "application/json",
    "User-Agent": f"{SITE_NAME}/1.0.0"
}

async def get_openai_response(user_query: str) -> str:
    try:
       
        print(f"Using API Key (first 10 chars): {OPENROUTER_API_KEY[:10]}...")
        
       
        payload = {
            "model": "openai/gpt-3.5-turbo",  
            "messages": [
                {
                    "role": "system",
                    "content": "You are a helpful CA chatbot of Advit ITeC. Please provide responses in Hindi and English both. Focus on giving accurate information about Indian tax laws, ITR filing, and accounting."
                },
                {
                    "role": "user",
                    "content": user_query
                }
            ],
            "temperature": 0.7,
            "max_tokens": 1000
        }


        print("Sending request to OpenRouter...")
        print("Headers:", json.dumps(HEADERS, indent=2))
        print("Payload:", json.dumps(payload, indent=2))
        
        response = requests.post(
            OPENROUTER_URL,
            headers=HEADERS,
            json=payload,
            timeout=30
        )

   
        print(f"Response Status: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        print(f"Response Text: {response.text[:500]}...")  

 
        if response.status_code != 200:
            return f"API Error: {response.status_code} - {response.text}"

        try:
            data = response.json()
        except json.JSONDecodeError as e:
            return f"JSON Parse Error: {str(e)} - Response: {response.text[:200]}"

        if not isinstance(data, dict):
            return f"Invalid Response Format: {str(data)[:200]}"

        if "choices" not in data or not data["choices"]:
            return f"No Choices in Response: {str(data)[:200]}"

 
        try:
            return data["choices"][0]["message"]["content"]
        except KeyError as e:
            return f"Error extracting message: {str(e)} - Response: {str(data)[:200]}"

    except Exception as e:
        error_msg = f"Error: {str(e)}"
        print(f"Exception details: {type(e).__name__}: {str(e)}")
        return error_msg
