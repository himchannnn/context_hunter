from sqlalchemy.orm import Session
from sqlalchemy import desc, func
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

# 문제 조회 함수 (분야별/난이도별)
def get_questions(db: Session, category: str = None, limit: int = 5, allow_generation: bool = True):
    query = db.query(models.Question)
    
    if category and category != "random":
        query = query.filter(models.Question.category == category)
    
    # 랜덤으로 가져오기 (MySQL/MariaDB: func.rand(), SQLite: func.random())
    # 여기서는 SQLite 호환을 위해 func.random() 사용
    questions = query.order_by(func.random()).limit(limit).all()
    
    logger.info(f"Fetched {len(questions)} questions for category {category}")

    # 문제가 부족하면 AI로 생성 (자동 채우기) - allow_generation이 True일 때만
    if allow_generation and len(questions) < limit:
        needed = limit - len(questions)
        logger.info(f"Not enough questions. Generating {needed} new questions using AI...")
        
        for _ in range(needed):
            # 카테고리가 없으면 'general' 또는 랜덤 선택
            target_category = category if category else "General"
            
            # AI 호출
            ai_data = generate_question(category=target_category, difficulty=1)
            
            if "error" in ai_data:
                logger.error(f"AI Generation Error: {ai_data['error']}")
                continue
                
            # DB 저장
            try:
                new_question = models.Question(
                    id=str(uuid.uuid4()),  # Generate explicit ID
                    encoded_text=ai_data.get("encoded_sentence", "Error"),
                    original_text=ai_data.get("original_sentence", "Unknown"),
                    correct_meaning=ai_data.get("original_meaning", "Error"),
                    category=ai_data.get("category", target_category),
                    difficulty=ai_data.get("difficulty_level", 1),
                    correct_count=0,
                    total_attempts=0
                )
                db.add(new_question)
                db.commit()
                db.refresh(new_question)
                
                questions.append(new_question)
            except Exception as e:
                 logger.error(f"Failed to save AI question: {e}")
                 db.rollback()

    return [
        {
            "id": str(q.id), # UUID to string
            "encoded": q.encoded_text, 
            "correct_meaning": q.correct_meaning,
            "category": q.category,
            "correct_count": q.correct_count, 
            "total_attempts": q.total_attempts, 
            "success_rate": q.success_rate
        } 
        for q in questions
    ]


# 정답 확인 및 결과 저장 함수
def verify_answer(db: Session, question_id: str, user_answer: str, user_id: int = -1):
    try:
        question = db.query(models.Question).filter(models.Question.id == question_id).first()
        if not question:
            logger.error(f"verify_answer: Question {question_id} not found")
            return None
            
        # 1. 보여지는 문장(문제)과 동일한 경우 정답 처리 금지 (Copy & Paste 방지)
        # 띄어쓰기 무시하고 비교
        # 1. Check if it matches the Correct Meaning (Model Answer) first.
        # If the user found the exact Model Answer (or very close), we accept it regardless of its similarity to the Encoded Text.
        # This solves the "Model Answer is too similar to Question" conflict.
        meaning_matcher = difflib.SequenceMatcher(None, user_answer, question.correct_meaning)
        if meaning_matcher.ratio() >= 0.9:
            pass # Bypass the copy-paste check below
        else:
            # 2. 보여지는 문장(문제)과 동일한 경우 정답 처리 금지 (Copy & Paste 방지)
            # difflib를 사용해 유사도 90% 이상이면 반려
            matcher = difflib.SequenceMatcher(None, user_answer, question.encoded_text)
            if matcher.ratio() >= 0.9:
                return schemas.VerifyAnswerResponse(
                    isCorrect=False,
                    similarity=0.0,
                    correctAnswer=question.correct_meaning, 
                    feedback="원문에 있는 단어들을 너무 많이 사용했습니다. 자신의 말로 풀어서 설명해주세요."
                )
        
        # AI를 이용한 유사도 판별 호출
        # check_similarity 함수 내부에서 모델 로드 실패 시 적절한 에러 메시지를 반환하도록 처리되어 있음
        # Compare against the original encoded text (the difficult sentence) directly
        ai_result = check_similarity(user_answer, question.encoded_text)
        
        similarity = ai_result['similarity_score']
        is_correct = ai_result['is_correct']
        feedback = ai_result['feedback']
        
        # 통계 업데이트
        question.total_attempts += 1
        if is_correct:
            question.correct_count += 1
            # 유저 총 정답 수 증가 (게스트 제외)
            if user_id != -1:
                user = db.query(models.User).filter(models.User.id == user_id).first()
                if user:
                    user.total_solved += 1
        
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
    except Exception as e:
        logger.error(f"verify_answer FAILED: {str(e)}")
        import traceback
        traceback.print_exc()
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

# 방명록(랭킹) 저장 함수 (전체 난이도 통합 최고 기록만 유지)
def create_guestbook_entry(db: Session, entry: schemas.GuestbookCreate):
    # 기존 기록 조회 (닉네임으로만 조회)
    existing_entry = db.query(models.Guestbook).filter(
        models.Guestbook.nickname == entry.nickname
    ).first()

    if existing_entry:
        # 기존 기록이 있으면 점수 비교
        # 새 점수가 더 높거나, 점수가 같고 스트릭이 더 높을 때만 업데이트
        should_update = False
        if entry.score > existing_entry.score:
            should_update = True
        elif entry.score == existing_entry.score and entry.max_streak > existing_entry.max_streak:
            should_update = True
            
        if should_update:
            existing_entry.score = entry.score
            existing_entry.max_streak = entry.max_streak
            # existing_entry.difficulty = entry.difficulty # 난이도 개념 약화로 주석 처리 또는 유지
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
        db_user = models.User(
            username=user.username, 
            hashed_password=hashed_password,
            total_solved=0
        )
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

# 일일 진행 상황 CRUD
def get_daily_progress(db: Session, user_id: int, date: str):
    progress = db.query(models.DailyProgress).filter(
        models.DailyProgress.user_id == user_id,
        models.DailyProgress.date == date
    ).first()
    return progress

def update_daily_progress(db: Session, user_id: int, date: str, domain: str):
    progress = get_daily_progress(db, user_id, date)
    
    is_new = False
    if not progress:
        progress = models.DailyProgress(
            user_id=user_id,
            date=date,
            cleared_domains=domain
        )
        db.add(progress)
        db.commit()
        db.refresh(progress)
        is_new = True
    else:
        domains = progress.cleared_domains.split(",") if progress.cleared_domains else []
        if domain not in domains:
            domains.append(domain)
            progress.cleared_domains = ",".join(domains)
            db.commit()
            db.refresh(progress)
            is_new = True
            
    return progress, is_new

