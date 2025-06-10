from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class ChatSession(Base):
    __tablename__ = 'chat_sessions'
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_email = Column(String(255), nullable=False)
    title = Column(String(255), nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    # Add relationship to messages
    messages = relationship("ChatHistory", back_populates="session", cascade="all, delete-orphan")

class ChatHistory(Base):
    __tablename__ = 'chat_history'
    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(Integer, ForeignKey('chat_sessions.id'), nullable=False)
    user_email = Column(String(255), nullable=False)
    user_message = Column(Text, nullable=False)
    bot_response = Column(Text, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    # Add relationship back to session
    session = relationship("ChatSession", back_populates="messages")
    # Add relationship to feedback
    feedback = relationship("Feedback", back_populates="chat", cascade="all, delete-orphan")

class Feedback(Base):
    __tablename__ = 'feedback'
    id = Column(Integer, primary_key=True, autoincrement=True)
    chat_id = Column(Integer, ForeignKey('chat_history.id'), nullable=False)
    rating = Column(Integer, nullable=False)
    suggestion = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    # Add relationship back to chat
    chat = relationship("ChatHistory", back_populates="feedback")
