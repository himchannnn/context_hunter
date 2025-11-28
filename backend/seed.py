from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models

# Create tables
models.Base.metadata.create_all(bind=engine)

def seed_data():
    db = SessionLocal()
    
    # Check if data exists
    if db.query(models.Question).first():
        print("Database already seeded.")
        db.close()
        return

    print("Seeding database...")

    # 1. Confusing Words (Sample)
    words = [
        models.ConfusingWord(word="낳다", meaning="배 속의 아이를 밖으로 내놓다", difficulty=1),
        models.ConfusingWord(word="낫다", meaning="병이나 상처 따위가 고쳐져 본래대로 되다", difficulty=1),
    ]
    db.add_all(words)
    db.commit()

    # 2. Context Sentences (Sample - simplified for direct question creation)
    # In this seed, we'll just create the questions directly as per the mock data structure
    
    # Mock Questions from api.ts
    mock_questions = [
        # Difficulty 1
        {"id": "q1_1", "encoded": "나는학교에서친구들과축구를했어요", "original": "나는 학교에서 친구들과 축구를 했어요", "difficulty": 1},
        {"id": "q1_2", "encoded": "오늘점심에맛있는피자를먹었어요", "original": "오늘 점심에 맛있는 피자를 먹었어요", "difficulty": 1},
        {"id": "q1_3", "encoded": "주말에가족과함께공원에갔어요", "original": "주말에 가족과 함께 공원에 갔어요", "difficulty": 1},
        
        # Difficulty 2
        {"id": "q2_1", "encoded": "ㅎㅅ ㅇㅁㅇ ㅁㄹ ㅈㄹㅎㄴㄴ ㄱㅅ ㄱㅌㅅㅂㄴㄷ", "original": "회사 업무를 마무리하느라 고생했습니다", "difficulty": 2},
        {"id": "q2_2", "encoded": "ㅈㄴㅇ ㅎㅅㅇ ㅊㅅㅇㄹ ㅎㄱㅇ ㄱㅇㅅㅂㄴㄷ", "original": "저녁에 회식을 참석할 예정입니다", "difficulty": 2},
        
        # Difficulty 3
        {"id": "q3_1", "encoded": "sonjarwa hamkke jangtorul gassumnida", "original": "손자와 함께 장터를 갔습니다", "difficulty": 3},
        {"id": "q3_2", "encoded": "achim iljjik irona sancharul hamnida", "original": "아침 일찍 일어나 산책을 합니다", "difficulty": 3},
    ]

    for q_data in mock_questions:
        question = models.Question(
            id=q_data["id"],
            encoded_text=q_data["encoded"],
            original_text=q_data["original"],
            correct_meaning=q_data["original"], # For now, correct meaning is the original text
            difficulty=q_data["difficulty"]
        )
        db.add(question)
    
    db.commit()
    print("Seeding complete!")
    db.close()

if __name__ == "__main__":
    seed_data()
