import google.generativeai as genai
import os

# Print the API key to confirm it's loaded
print("GEMINI_API_KEY:", os.getenv("GEMINI_API_KEY"))

# Use the API key directly for explicit test
API_KEY = os.getenv("GEMINI_API_KEY") or "AIzaSyBNhSpF5A3wIsQQAVd-GF3s0EIynOax1dM"
genai.configure(api_key=API_KEY)

try:
    model = genai.GenerativeModel("gemini-1.5-flash-latest")
    response = model.generate_content("Hello, what is GST?")
    print("Gemini API response:", response.text if hasattr(response, "text") else response)
except Exception as e:
    print("Gemini API test failed:", e)
