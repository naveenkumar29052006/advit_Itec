from fastapi import FastAPI
from routes import chat
import os
app = FastAPI()

app.include_router(chat.router, prefix="/chat")




@app.get("/")
def root():
    return {"message": "CA Chatbot backend is running"}
