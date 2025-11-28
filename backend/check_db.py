from sqlalchemy.orm import Session
from database import SessionLocal
import models

def check_data():
    db = SessionLocal()
    try:
        question_count = db.query(models.Question).count()
        print(f"Total Questions: {question_count}")
        
        if question_count > 0:
            q = db.query(models.Question).first()
            print(f"Sample Question: {q.encoded_text}")
        else:
            print("Database is empty!")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_data()
