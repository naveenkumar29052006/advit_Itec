from openai import AsyncOpenAI
import os
from dotenv import load_dotenv
from typing import List, Dict, Any
import json

load_dotenv()

# Load environment variables
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "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")
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

# OpenRouter headers
HEADERS = {
    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
    "HTTP-Referer": "https://advithitec.in/",  # Advit ITEC website
    "X-Title": "Advit ITEC Chatbot",  # Brand title
    "Content-Type": "application/json"
}

SYSTEM_PROMPT = """You are an expert tax and finance chatbot of advit itec, specializing in GST filing, income tax, financial planning, and accounting services.

Guidelines:
1. Always respond only in English.
2. Focus on accuracy and clarity in tax and finance-related information.
3. Keep explanations clear, concise, and professional.
4. For GST and tax-related queries, always mention applicable sections and rules.
5. Break down complex financial concepts into simple steps.
6. Provide disclaimers when necessary about consulting a qualified professional.
7. Stay updated with current tax rates and GST slabs.

Key Areas of Expertise:
- GST Filing and Compliance
- Income Tax Returns
- Tax Planning and Savings
- Financial Record Keeping
- Business Accounting
- Corporate Tax
- Tax Deductions and Exemptions

Remember:
- Always provide accurate tax-related information
- Include relevant tax laws and regulations
- Suggest proper documentation requirements
- Explain filing deadlines and compliance requirements

Do not provide responses in any language other than English.
Important: Always include disclaimers for complex tax matters and recommend consulting a certified tax professional for specific cases."""

async def get_chat_response(messages: List[Dict[str, str]]) -> str:
    try:
        import aiohttp
        async with aiohttp.ClientSession() as session:
            async with session.post(
                OPENROUTER_URL,
                headers=HEADERS,
                json={
                    "model": "openai/gpt-3.5-turbo-16k",
                    "messages": [
                        {"role": "system", "content": SYSTEM_PROMPT},
                        *messages
                    ],
                    "temperature": 0.7,
                    "max_tokens": 2000,
                    "presence_penalty": 0.6,
                    "frequency_penalty": 0.3
                }
            ) as response:
                if response.status != 200:
                    error_text = await response.text()
                    print(f"OpenRouter API error: {error_text}")
                    raise Exception(f"API error {response.status}: {error_text}")
                
                data = await response.json()
                response_text = data['choices'][0]['message']['content']
                return response_text
                
    except Exception as e:
        print(f"Error in OpenRouter API call: {e}")
        return "I apologize, but I encountered an error. Please try again."

async def get_openai_response(user_query: str) -> str:
    """Main entry point for getting responses from the chatbot"""
    try:
        # Convert user query to messages format
        messages = [{"role": "user", "content": user_query}]
        print(f"Processing query: {user_query}")
        
        response = await get_chat_response(messages)
        return response
    except Exception as e:
        print(f"Error in get_openai_response: {e}")
        return "I apologize, but I encountered an error. Please try again."
