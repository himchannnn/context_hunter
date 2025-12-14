from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.models import User, DailyProgress
from backend.database import Base
from datetime import datetime

# Adjust DB path if necessary
SQLALCHEMY_DATABASE_URL = "sqlite:///./context_hunter_new.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

def check_user(username_input):
    print(f"--- Checking User: {username_input} ---")
    user = db.query(User).filter(User.username == username_input).first()
    if not user:
        print("User not found.")
        return

    print(f"ID: {user.id}")
    print(f"Credits: {user.credits}")
    
    today = datetime.utcnow().strftime("%Y-%m-%d")
    progress = db.query(DailyProgress).filter(
        DailyProgress.user_id == user.id,
        DailyProgress.date == today
    ).first()
    
    if progress:
        print(f"Daily Progress ({today}):")
        print(f"  Cleared Domains: {progress.cleared_domains}")
        print(f"  Reward Claimed (Legacy): {progress.reward_claimed}")
    else:
        print(f"No daily progress for {today}")

if __name__ == "__main__":
    check_user("himchan")
