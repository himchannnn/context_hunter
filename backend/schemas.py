from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# Question Schemas
class QuestionBase(BaseModel):
    id: str
    encoded: str

class Question(QuestionBase):
    class Config:
        from_attributes = True

class QuestionsResponse(BaseModel):
    questions: List[Question]

# Verification Schemas
class VerifyAnswerRequest(BaseModel):
    questionId: str
    userAnswer: str

class VerifyAnswerResponse(BaseModel):
    isCorrect: bool
    feedback: Optional[str] = None
    correctAnswer: Optional[str] = None
    similarity: float

# Guestbook/Ranking Schemas
class GuestbookBase(BaseModel):
    nickname: str
    score: int
    maxStreak: int
    difficulty: int

class GuestbookCreate(GuestbookBase):
    pass

class RankingEntry(GuestbookBase):
    timestamp: datetime

    class Config:
        from_attributes = True
