from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Text, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class ConfusingWord(Base):
    __tablename__ = "confusing_words"

    id = Column(Integer, primary_key=True, index=True)
    word = Column(String(100), nullable=False) # e.g., "낳다"
    meaning = Column(String(255), nullable=False) # e.g., "배 속의 아이를 밖으로 내놓다"
    difficulty = Column(Integer, default=1)

    questions = relationship("Question", back_populates="word")

class ContextSentence(Base):
    __tablename__ = "context_sentences"

    id = Column(Integer, primary_key=True, index=True)
    sentence_text = Column(Text, nullable=False) # e.g., "그녀는 건강한 아기를 ___."
    difficulty = Column(Integer, default=1)

    questions = relationship("Question", back_populates="context")

class Question(Base):
    __tablename__ = "questions"

    id = Column(String(50), primary_key=True, index=True) # e.g., "q1_1"
    word_id = Column(Integer, ForeignKey("confusing_words.id"), nullable=True)
    context_id = Column(Integer, ForeignKey("context_sentences.id"), nullable=True)
    
    encoded_text = Column(Text, nullable=False) # The encrypted/difficult sentence shown to user
    original_text = Column(Text, nullable=False) # The original sentence (for reference)
    correct_meaning = Column(Text, nullable=False) # The interpreted answer for AI comparison
    difficulty = Column(Integer, default=1)

    word = relationship("ConfusingWord", back_populates="questions")
    context = relationship("ContextSentence", back_populates="questions")
    attempts = relationship("Attempt", back_populates="question")

class Attempt(Base):
    __tablename__ = "attempts"

    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(String(50), ForeignKey("questions.id"))
    user_answer = Column(Text, nullable=False)
    similarity_score = Column(Float, default=0.0)
    is_correct = Column(Boolean, default=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    question = relationship("Question", back_populates="attempts")

class Guestbook(Base):
    __tablename__ = "guestbook"

    id = Column(Integer, primary_key=True, index=True)
    nickname = Column(String(50), nullable=False)
    score = Column(Integer, default=0)
    max_streak = Column(Integer, default=0)
    difficulty = Column(Integer, default=1)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
