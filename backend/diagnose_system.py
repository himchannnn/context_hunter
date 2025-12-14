import requests
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import User, Guestbook
import os

# Running from backend/
db_path = "sqlite:///./context_hunter_new.db"

print(f"Connecting to DB: {db_path}")
engine = create_engine(db_path)
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

def diagnose():
    print("--- DIAGNOSTIC START ---")
    
    # Check User
    try:
        user = db.query(User).filter(User.username == "himchan").first()
        if user:
            print(f"[OK] User 'himchan' found. ID: {user.id}, Credits: {user.credits}")
        else:
            print("[FAIL] User 'himchan' NOT FOUND in DB.")
            all_users = db.query(User).all()
            print(f"Total users in DB: {len(all_users)}")
            for u in all_users:
                print(f" - {u.username}")
    except Exception as e:
        print(f"[ERROR] DB Query Failed: {e}")

    # Check Rankings
    try:
        rankings = db.query(Guestbook).all()
        print(f"Total Rank entries: {len(rankings)}")
        for r in rankings:
            print(f" - {r.nickname}: {r.score}")
    except Exception as e:
        print(f"[ERROR] DB Ranking Query Failed: {e}")

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
