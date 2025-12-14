from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import User, DailyProgress
from database import Base
from datetime import datetime

# Adjust DB path: since running from backend dir, DB is in parent dir?
# No, DB is at C:\Users\PC\Desktop\Context_Hunter_WLogin\context_hunter_new.db usually?
# Or C:\Users\PC\Desktop\Context_Hunter_WLogin\backend\context_hunter_new.db?
# The `DATABASE_URL` in `database.py` likely uses relative path.
# Let's assume it's `sqlite:///../context_hunter_new.db` if running from backend, or check main.py.
# Actually `main.py` uses `sqlite:///./context_hunter_new.db`.
# If I run from backend dir, it will look for db in backend dir.

SQLALCHEMY_DATABASE_URL = "sqlite:///./context_hunter_new.db"
# If db is in root, use "sqlite:///../context_hunter_new.db"

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
    else:
        print(f"No daily progress for {today}")

if __name__ == "__main__":
    check_user("himchan")
