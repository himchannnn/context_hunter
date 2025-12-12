from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# 문제 관련 스키마 (Question Schemas)
class QuestionBase(BaseModel):
    id: str
    encoded: str
    correct_meaning: str

class Question(QuestionBase):
    correct_count: int
    total_attempts: int
    success_rate: float

    class Config:
        from_attributes = True

class QuestionsResponse(BaseModel):
    questions: List[Question]

# 인증 관련 스키마 (Auth Schemas)
class UserBase(BaseModel):
    username: str

class UserCreate(UserBase):
    password: str

class UserLogin(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    is_guest: bool
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

# 오답 노트 스키마 (Note Schemas)
class WrongAnswerNoteBase(BaseModel):
    question_id: str
    user_answer: str

class WrongAnswerNoteCreate(WrongAnswerNoteBase):
    pass

class WrongAnswerNoteResponse(WrongAnswerNoteBase):
    id: int
    created_at: datetime
    question: Question # 전체 문제 정보를 포함

    class Config:
        from_attributes = True

# 정답 확인 스키마 (Verification Schemas)
class VerifyAnswerRequest(BaseModel):
    questionId: str
    userAnswer: str

class VerifyAnswerResponse(BaseModel):
    isCorrect: bool
    feedback: Optional[str] = None
    correctAnswer: Optional[str] = None
    similarity: float

# 방명록/랭킹 스키마 (Guestbook/Ranking Schemas)
class GuestbookBase(BaseModel):
    nickname: str
    score: int
    max_streak: int
    difficulty: int

class GuestbookCreate(GuestbookBase):
    pass

class RankingEntry(GuestbookBase):
    timestamp: datetime

    class Config:
        from_attributes = True
