from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Text, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

# 혼동하기 쉬운 단어 모델 (현재 사용되지 않을 수 있음)
class ConfusingWord(Base):
    __tablename__ = "confusing_words"

    id = Column(Integer, primary_key=True, index=True)
    word = Column(String(100), nullable=False) # 예: "낳다"
    meaning = Column(String(255), nullable=False) # 예: "배 속의 아이를 밖으로 내놓다"
    difficulty = Column(Integer, default=1)

    questions = relationship("Question", back_populates="word")

# 문맥 문장 모델 (현재 사용되지 않을 수 있음)
class ContextSentence(Base):
    __tablename__ = "context_sentences"

    id = Column(Integer, primary_key=True, index=True)
    sentence_text = Column(Text, nullable=False) # 예: "그녀는 건강한 아기를 ___."
    difficulty = Column(Integer, default=1)

    questions = relationship("Question", back_populates="context")

# 문제 모델: 실제 게임에서 사용되는 문제 데이터
class Question(Base):
    __tablename__ = "questions"

    id = Column(String(50), primary_key=True, index=True) # 예: "q1_1"
    word_id = Column(Integer, ForeignKey("confusing_words.id"), nullable=True)
    context_id = Column(Integer, ForeignKey("context_sentences.id"), nullable=True)
    
    encoded_text = Column(Text, nullable=False) # 사용자에게 보여지는 암호화/변형된 문장
    original_text = Column(Text, nullable=False) # 원본 문장 (참고용)
    correct_meaning = Column(Text, nullable=False) # AI 비교를 위한 정답 해석
    difficulty = Column(Integer, default=1) # 난이도 (1: 청년, 2: 중장년, 3: 노년)
    category = Column(String(50), default="general") # 분야 (politics, economy, society, culture, it, world)

    word = relationship("ConfusingWord", back_populates="questions")
    context = relationship("ContextSentence", back_populates="questions")
    attempts = relationship("Attempt", back_populates="question")

    correct_count = Column(Integer, default=0) # 정답 횟수
    total_attempts = Column(Integer, default=0) # 총 시도 횟수

    # 정답률 계산 속성
    @property
    def success_rate(self):
        if self.total_attempts == 0:
            return 0.0
        return round((self.correct_count / self.total_attempts) * 100, 1)

    @property
    def encoded(self):
        return self.encoded_text

# 사용자 모델
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=True) # 사용자 ID (게스트는 Null 가능)
    hashed_password = Column(String(255), nullable=True) # 해시된 비밀번호
    is_guest = Column(Boolean, default=False) # 게스트 여부
    credits = Column(Integer, default=0) # 보유 크레딧
    owned_themes = Column(Text, default="default") # 보유 테마 (쉼표로 구분)
    equipped_theme = Column(String(50), default="default") # 장착 중인 테마
    total_solved = Column(Integer, default=0) # 총 정답 문제 수
    created_at = Column(DateTime(timezone=True), server_default=func.now()) # 생성일

    notes = relationship("WrongAnswerNote", back_populates="user")

# 오답 노트 모델: 사용자가 저장한 틀린 문제
class WrongAnswerNote(Base):
    __tablename__ = "wrong_answer_notes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    question_id = Column(String(50), ForeignKey("questions.id"))
    user_answer = Column(Text, nullable=False) # 사용자가 입력했던 오답
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="notes")
    question = relationship("Question")

# 시도 기록 모델: 모든 문제 풀이 로그 (분석용)
class Attempt(Base):
    __tablename__ = "attempts"

    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(String(50), ForeignKey("questions.id"))
    user_answer = Column(Text, nullable=False)
    similarity_score = Column(Float, default=0.0) # 유사도 점수
    is_correct = Column(Boolean, default=False) # 정답 여부
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    question = relationship("Question", back_populates="attempts")

# 방명록(랭킹) 모델: 도전 모드 결과 저장
class Guestbook(Base):
    __tablename__ = "guestbook"

    id = Column(Integer, primary_key=True, index=True)
    nickname = Column(String(50), unique=True, index=True, nullable=False) # 랭킹에 표시될 닉네임
    score = Column(Integer, default=0) # 맞춘 문제 수
    max_streak = Column(Integer, default=0) # 최대 연속 정답 수
    difficulty = Column(Integer, default=1) # 플레이한 난이도
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

# 일일 모드 진행 상황 모델
class DailyProgress(Base):
    __tablename__ = "daily_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True) # 로그인 유저 (게스트는 로컬스토리지 관리라 DB 저장 안함)
    date = Column(String(10), nullable=False) # "YYYY-MM-DD"
    # 클리어한 분야 목록을 쉼표로 구분하여 저장 (예: "politics,economy")
    cleared_domains = Column(Text, default="") 
    reward_claimed = Column(Boolean, default=False) # 일일 보상 수령 여부 
    
    user = relationship("User")
