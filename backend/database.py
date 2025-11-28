from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

# Default to a local SQLite for development if no env var is set, but intended for MariaDB
# Format: mysql+pymysql://user:password@host:port/db_name
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./context_hunter.db")
with open("debug.log", "a", encoding="utf-8") as f:
    f.write(f"DEBUG: Connecting to database at {SQLALCHEMY_DATABASE_URL}\n")
    f.write(f"DEBUG: Current working directory: {os.getcwd()}\n")


engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    pool_pre_ping=True,
    # connect_args is only for SQLite, remove if using MariaDB exclusively or handle conditionally
    connect_args={"check_same_thread": False} if "sqlite" in SQLALCHEMY_DATABASE_URL else {}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
