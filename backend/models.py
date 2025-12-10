from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime
import enum

# ResponseType Enum 정의
class ResponseType(str, enum.Enum):
    SUCCESS = "success"
    EXCEPTION = "exception"

# 1. Board 테이블
class Board(Base):
    __tablename__ = "board"

    board_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(255), nullable=False)
    created_time = Column(DateTime, default=datetime.now, nullable=False)
    edited_time = Column(DateTime, default=datetime.now, onupdate=datetime.now, nullable=False)

    # Relationship
    user_chats = relationship("UserChat", back_populates="board", cascade="all, delete-orphan")

# 2. UserChat 테이블
class UserChat(Base):
    __tablename__ = "user_chat"

    user_chat_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    board_id = Column(Integer, ForeignKey("board.board_id", ondelete="CASCADE"), nullable=False)
    content = Column(Text, nullable=False)  # 사용자 질문
    response_type = Column(Enum(ResponseType), nullable=False)  # 'success' 또는 'exception'
    created_time = Column(DateTime, default=datetime.now, nullable=False)

    # Relationships
    board = relationship("Board", back_populates="user_chats")
    llm_response = relationship("LLMResponse", back_populates="user_chat", uselist=False, cascade="all, delete-orphan")

# 3. LLMResponse 테이블
class LLMResponse(Base):
    __tablename__ = "llm_response"

    response_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_chat_id = Column(Integer, ForeignKey("user_chat.user_chat_id", ondelete="CASCADE"), unique=True, nullable=False)

    # Exception 응답용 (인사말, 에러 메시지 등)
    plain_text = Column(Text, nullable=True)

    # Success 응답용 (CODE, WIRING, STEPS)
    code_content = Column(Text, nullable=True)
    wiring_content = Column(Text, nullable=True)
    steps_content = Column(Text, nullable=True)

    # Relationship
    user_chat = relationship("UserChat", back_populates="llm_response")
