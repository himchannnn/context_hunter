from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import User, DailyProgress
from database import Base
from datetime import datetime

SQLALCHEMY_DATABASE_URL = "sqlite:///./context_hunter_new.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

def fix_user(username_input):
    print(f"--- Fixing User: {username_input} ---")
    user = db.query(User).filter(User.username == username_input).first()
    if not user:
        print("User not found.")
        return

    print(f"Current Credits: {user.credits}")
    
    today = datetime.utcnow().strftime("%Y-%m-%d")
    progress = db.query(DailyProgress).filter(
        DailyProgress.user_id == user.id,
        DailyProgress.date == today
    ).first()
    
    if progress:
        print(f"Found progress: {progress.cleared_domains}")
        print("Deleting daily progress to reset...")
        db.delete(progress)
        db.commit()
        print("Progress deleted.")
    else:
        print("No progress found to delete.")

if __name__ == "__main__":
    fix_user("himchan")
