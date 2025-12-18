from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# 문제 관련 스키마 (Question Schemas)
class QuestionBase(BaseModel):
    id: str
    encoded: str
    correct_meaning: str
    category: str = "general"

class Question(QuestionBase):
    correct_count: int
    total_attempts: int
    created_at: datetime
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
    credits: int = 0
    owned_themes: str = "default"
    equipped_theme: str = "default"
    total_solved: int = 0
    daily_progress_count: int = 0
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
    grade: Optional[str] = None

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

# 일일 진행 상황 스키마
class DailyProgressBase(BaseModel):
    date: str
    cleared_domains: str

class DailyProgressUpdate(BaseModel):
    date: str
    domain: str

class DailyProgressResponse(DailyProgressBase):
    id: int
    user_id: int
    reward_claimed: bool = False
    credits_awarded: int = 0 # 이번 호출로 지급된 크레딧 (0 또는 10)

    class Config:
        from_attributes = True

# 상점 및 테마 스키마
class ShopPurchaseRequest(BaseModel):
    theme_id: str

class ThemeEquipRequest(BaseModel):
    theme_id: str
