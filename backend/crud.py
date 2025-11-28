from sqlalchemy.orm import Session
from sqlalchemy import desc
import models, schemas
import difflib

def get_questions_by_difficulty(db: Session, difficulty: int, limit: int = 10):
    # In a real app, you might want to randomize this
    with open("debug.log", "a", encoding="utf-8") as f:
        f.write(f"DEBUG: Fetching questions for difficulty {difficulty} (type: {type(difficulty)})\n")
    
    questions = db.query(models.Question).filter(models.Question.difficulty == difficulty).limit(limit).all()
    
    with open("debug.log", "a", encoding="utf-8") as f:
        f.write(f"DEBUG: Found {len(questions)} questions\n")
    # Map to schema format (id, encoded)
    return [{"id": q.id, "encoded": q.encoded_text} for q in questions]

def calculate_similarity(str1: str, str2: str) -> float:
    # Basic similarity check using SequenceMatcher
    # In production, replace this with an AI API call (OpenAI, etc.)
    return difflib.SequenceMatcher(None, str1, str2).ratio() * 100

def verify_answer(db: Session, question_id: str, user_answer: str):
    question = db.query(models.Question).filter(models.Question.id == question_id).first()
    if not question:
        return None
    
    # Normalize strings
    normalized_user = user_answer.strip().lower().replace(" ", "")
    normalized_correct = question.correct_meaning.strip().lower().replace(" ", "")
    
    # Calculate similarity
    similarity = calculate_similarity(normalized_user, normalized_correct)
    
    # Threshold for correctness (e.g., 80%)
    is_correct = similarity >= 80
    
    # Save attempt
    attempt = models.Attempt(
        question_id=question_id,
        user_answer=user_answer,
        similarity_score=similarity,
        is_correct=is_correct
    )
    db.add(attempt)
    db.commit()
    
    return schemas.VerifyAnswerResponse(
        isCorrect=is_correct,
        similarity=round(similarity, 1),
        correctAnswer=question.correct_meaning if not is_correct else None,
        feedback="정답입니다!" if is_correct else "아쉽네요."
    )

def create_guestbook_entry(db: Session, entry: schemas.GuestbookCreate):
    db_entry = models.Guestbook(
        nickname=entry.nickname,
        score=entry.score,
        max_streak=entry.maxStreak,
        difficulty=entry.difficulty
    )
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    return db_entry

def get_rankings(db: Session, difficulty: int, limit: int = 100):
    return db.query(models.Guestbook)\
        .filter(models.Guestbook.difficulty == difficulty)\
        .order_by(desc(models.Guestbook.score), desc(models.Guestbook.max_streak))\
        .limit(limit)\
        .all()
