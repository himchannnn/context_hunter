from sqlalchemy.orm import Session
from sqlalchemy import desc
import models, schemas
import models, schemas
import difflib
import logging
from ai import generate_question, check_similarity

# 로거 설정
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# 초기 시드 데이터 (DB가 비었을 때 AI에게 던져줄 주제들)
SEED_CONTEXTS = [
    "The early bird catches the worm.",
    "A penny saved is a penny earned.",
    "Actions speak louder than words.",
    "Knowledge is power.",
    "Time is money.",
    "Honesty is the best policy.",
    "Practice makes perfect.",
    "Where there is a will, there is a way.",
    "Look before you leap.",
    "Better late than never."
]
import random

import uuid

# 난이도별 문제 조회 함수
def get_questions_by_difficulty(db: Session, difficulty: int, limit: int = 10):
    # 1. DB에서 문제 조회
    questions = db.query(models.Question).filter(models.Question.difficulty == difficulty).limit(limit).all()
    
    logger.info(f"Fetched {len(questions)} questions from DB for difficulty {difficulty}")

    # 2. 문제가 부족하면 AI로 생성 (자동 채우기)
    if len(questions) < limit:
        needed = limit - len(questions)
        logger.info(f"Not enough questions. Generating {needed} new questions using AI...")
        
        for _ in range(needed):
            try:
                # 시드 문맥 중 하나 랜덤 선택
                context = random.choice(SEED_CONTEXTS)
                # AI 호출 (암호화된 문장 생성)
                ai_data = generate_question(context, style="metaphorical and cryptic")
                
                if "error" in ai_data:
                    logger.error(f"AI Generation Failed: {ai_data['error']}")
                    continue

                # DB에 저장
                new_q = models.Question(
                    id=f"q_{difficulty}_{uuid.uuid4().hex[:8]}", # Unique ID 생성
                    encoded_text=ai_data.get("encoded_sentence", "Error generating"),
                    original_text=context, # 원문 추가
                    correct_meaning=ai_data.get("original_meaning", "Error"),
                    difficulty=difficulty
                )
                db.add(new_q)
                db.commit()
                db.refresh(new_q)
                
                questions.append(new_q)
                
            except Exception as e:
                logger.error(f"Error during auto-generation: {e}")
                continue
    
    # 스키마 형식(id, encoded)으로 매핑하여 반환
    return [
        {
            "id": q.id, 
            "encoded": q.encoded_text, 
            "correct_meaning": q.correct_meaning,
            "correct_count": q.correct_count, 
            "total_attempts": q.total_attempts, 
            "success_rate": q.success_rate
        } 
        for q in questions
    ]


# 정답 확인 및 결과 저장 함수
def verify_answer(db: Session, question_id: str, user_answer: str):
    question = db.query(models.Question).filter(models.Question.id == question_id).first()
    if not question:
        return None
    
    # AI를 이용한 유사도 판별 호출
    # check_similarity 함수 내부에서 모델 로드 실패 시 적절한 에러 메시지를 반환하도록 처리되어 있음
    ai_result = check_similarity(user_answer, question.correct_meaning)
    
    similarity = ai_result['similarity_score']
    is_correct = ai_result['is_correct']
    feedback = ai_result['feedback']
    
    # 통계 업데이트
    question.total_attempts += 1
    if is_correct:
        question.correct_count += 1
    
    # 시도 기록 저장
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
        feedback=feedback
    )

# 방명록(랭킹) 저장 함수 (전체 난이도 통합 최고 기록만 유지)
def create_guestbook_entry(db: Session, entry: schemas.GuestbookCreate):
    # 기존 기록 조회 (난이도 구분 없이 닉네임으로만 조회)
    existing_entry = db.query(models.Guestbook).filter(
        models.Guestbook.nickname == entry.nickname
    ).first()

    if existing_entry:
        # 기존 기록이 있으면 점수 비교
        # 새 점수가 더 높거나, 점수가 같고 스트릭이 더 높을 때만 업데이트
        if entry.score > existing_entry.score or (entry.score == existing_entry.score and entry.max_streak > existing_entry.max_streak):
            existing_entry.score = entry.score
            existing_entry.max_streak = entry.max_streak
            existing_entry.difficulty = entry.difficulty # 달성 당시의 난이도 업데이트
            existing_entry.timestamp = func.now() # 시간 갱신
            db.commit()
            db.refresh(existing_entry)
            return existing_entry
        else:
            # 기존 기록이 더 좋으면 업데이트 하지 않음
            return existing_entry
    else:
        # 새 기록 생성
        db_entry = models.Guestbook(
            nickname=entry.nickname,
            score=entry.score,
            max_streak=entry.max_streak,
            difficulty=entry.difficulty
        )
        db.add(db_entry)
        db.commit()
        db.refresh(db_entry)
        return db_entry

# 랭킹 조회 함수 (전체 통합 랭킹)
def get_rankings(db: Session, limit: int = 100):
    return db.query(models.Guestbook)\
        .order_by(desc(models.Guestbook.score), desc(models.Guestbook.max_streak))\
        .limit(limit)\
        .all()

# 인증 관련 CRUD (Auth CRUD)
from passlib.context import CryptContext

# Windows에서 바이너리 의존성 문제를 피하기 위해 pbkdf2_sha256 사용
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()

def create_user(db: Session, user: schemas.UserCreate):
    try:
        hashed_password = pwd_context.hash(user.password)
        db_user = models.User(username=user.username, hashed_password=hashed_password)
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user
    except Exception as e:
        print(f"ERROR in create_user: {str(e)}")
        raise e

def create_guest_user(db: Session):
    # 게스트 사용자 생성 (DB 저장 X, 토큰 발급용 임시 객체)
    # 1회성 휘발유저이므로 DB에 남기지 않음
    import uuid
    guest_username = f"guest_{uuid.uuid4().hex[:8]}"
    # ID는 -1로 설정하여 DB에 없는 유저임을 표시
    db_user = models.User(id=-1, username=guest_username, is_guest=True)
    return db_user

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

# 오답 노트 CRUD (Note CRUD)
def create_note_entry(db: Session, note: schemas.WrongAnswerNoteCreate, user_id: int):
    # 이미 존재하는 오답노트인지 확인
    existing_note = db.query(models.WrongAnswerNote).filter(
        models.WrongAnswerNote.user_id == user_id,
        models.WrongAnswerNote.question_id == note.question_id
    ).first()
    
    if existing_note:
        # 이미 존재하면 답안만 업데이트
        existing_note.user_answer = note.user_answer
        db.commit()
        db.refresh(existing_note)
        return existing_note

    # 새 오답노트 생성
    db_note = models.WrongAnswerNote(
        user_id=user_id,
        question_id=note.question_id,
        user_answer=note.user_answer
    )
    db.add(db_note)
    db.commit()
    db.refresh(db_note)
    return db_note

def get_user_notes(db: Session, user_id: int):
    return db.query(models.WrongAnswerNote).filter(models.WrongAnswerNote.user_id == user_id).all()
