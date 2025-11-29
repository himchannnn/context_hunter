from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

# .env 파일에서 환경 변수 로드
load_dotenv()

# 데이터베이스 연결 URL 설정
# 환경 변수 DATABASE_URL이 없으면 기본값으로 로컬 SQLite 파일 사용 (개발용)
# 배포 시에는 MariaDB URL 포맷 사용: mysql+pymysql://user:password@host:port/db_name
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./context_hunter_v2.db")

# 디버깅용 로그 파일 작성
with open("debug.log", "a", encoding="utf-8") as f:
    f.write(f"DEBUG: Connecting to database at {SQLALCHEMY_DATABASE_URL}\n")
    f.write(f"DEBUG: Current working directory: {os.getcwd()}\n")


# SQLAlchemy 엔진 생성
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    pool_pre_ping=True, # 연결 유효성 확인
    # connect_args는 SQLite 전용 옵션입니다. MariaDB 사용 시 제거하거나 조건부로 처리해야 합니다.
    connect_args={"check_same_thread": False} if "sqlite" in SQLALCHEMY_DATABASE_URL else {}
)

# 데이터베이스 세션 생성기
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# ORM 모델의 기본 클래스
Base = declarative_base()

# 의존성 주입을 위한 데이터베이스 세션 생성 함수
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
