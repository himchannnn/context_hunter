from sqlalchemy import create_engine, text
from database import SQLALCHEMY_DATABASE_URL
import random
import os

def migrate():
    # Ensure we use the correct DB path relative to this script
    db_url = SQLALCHEMY_DATABASE_URL
    if "sqlite" in db_url and "///./" in db_url:
         # If strict local path, ensure it points to the file in the same dir
         print(f"Original DB URL: {db_url}")
         # It's already relative to CWD. If we run from backend/, it should be fine.

    engine = create_engine(db_url)
    print(f"Connecting to database at: {engine.url}")
    with engine.connect() as conn:
        # 1. Add category column if not exists
        try:
            conn.execute(text("ALTER TABLE questions ADD COLUMN category VARCHAR(50) DEFAULT 'general'"))
            print("Added category column to questions table.")
        except Exception as e:
            print(f"Column category might already exist or other error: {e}")

        # 2. Assign random categories to existing questions
        categories = ["Politics", "Economy", "Society", "Life/Culture", "IT/Science", "World"]
        
        # Get all question IDs
        try:
            result = conn.execute(text("SELECT id FROM questions"))
            question_ids = [row[0] for row in result]
            
            print(f"Updating {len(question_ids)} questions with random categories...")
            for q_id in question_ids:
                cat = random.choice(categories)
                conn.execute(text("UPDATE questions SET category = :cat WHERE id = :id"), {"cat": cat, "id": q_id})
            
            conn.commit()
            print("Migration completed.")
        except Exception as e:
            print(f"Error updating data: {e}")

if __name__ == "__main__":
    migrate()
