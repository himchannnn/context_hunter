import requests
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.models import User, Guestbook
import os

# Setup DB connection
# Assuming running from root, DB is in backend/
# OR running from backend/ DB is in ./
# Try both
if os.path.exists("backend/context_hunter_new.db"):
    db_path = "sqlite:///backend/context_hunter_new.db"
elif os.path.exists("context_hunter_new.db"):
    db_path = "sqlite:///context_hunter_new.db"
else:
    # Default to assume we are in backend dir? No, current cwd is root probably.
    # Metadata says Cwd: c:\Users\PC\Desktop\Context_Hunter_WLogin
    db_path = "sqlite:///backend/context_hunter_new.db"

print(f"Connecting to DB: {db_path}")
engine = create_engine(db_path)
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

def diagnose():
    print("--- DIAGNOSTIC START ---")
    
    # Check User
    user = db.query(User).filter(User.username == "himchan").first()
    if user:
        print(f"[OK] User 'himchan' found. ID: {user.id}, Credits: {user.credits}")
    else:
        print("[FAIL] User 'himchan' NOT FOUND in DB.")
        all_users = db.query(User).all()
        print(f"Total users in DB: {len(all_users)}")
        for u in all_users:
            print(f" - {u.username}")

    # Check Rankings
    rankings = db.query(Guestbook).all()
    print(f"Total Rank entries: {len(rankings)}")
    for r in rankings:
        print(f" - {r.nickname}: {r.score} (Streak: {r.max_streak})")

    # Check API Connectivity
    try:
        resp = requests.get("http://localhost:8000/docs", timeout=5)
        if resp.status_code == 200:
            print("[OK] Backend is reachable (Docs page).")
        else:
            print(f"[FAIL] Backend returned status {resp.status_code}")
    except Exception as e:
        print(f"[FAIL] Backend connection failed: {e}")

    print("--- DIAGNOSTIC END ---")

if __name__ == "__main__":
    diagnose()
