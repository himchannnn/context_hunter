from sqlalchemy import create_engine, func
from sqlalchemy.orm import sessionmaker
from models import Guestbook
from database import Base

SQLALCHEMY_DATABASE_URL = "sqlite:///./context_hunter_new.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

def fix_duplicates():
    print("--- Checking for Duplicate Rankings ---")
    
    # 1. Find nicknames with duplicate entries
    duplicates = db.query(Guestbook.nickname, func.count(Guestbook.id))\
        .group_by(Guestbook.nickname)\
        .having(func.count(Guestbook.id) > 1)\
        .all()
        
    if not duplicates:
        print("No duplicates found.")
        return

    print(f"Found {len(duplicates)} users with duplicates.")
    
    for nickname, count in duplicates:
        print(f"Fixing user: {nickname} (Count: {count})")
        
        # Get all entries for this user
        entries = db.query(Guestbook).filter(Guestbook.nickname == nickname).all()
        
        # Find the best entry (highest score, then highest streak)
        # Sort desc by score, then max_streak
        entries.sort(key=lambda x: (x.score, x.max_streak), reverse=True)
        
        best_entry = entries[0]
        to_delete = entries[1:]
        
        print(f"  Best Entry: Score {best_entry.score}, Streak {best_entry.max_streak} (ID: {best_entry.id})")
        
        for entry in to_delete:
            print(f"  Deleting duplicate: Score {entry.score}, Streak {entry.max_streak} (ID: {entry.id})")
            db.delete(entry)
            
        db.commit()
        print(f"  Fixed {nickname}.")

if __name__ == "__main__":
    fix_duplicates()
