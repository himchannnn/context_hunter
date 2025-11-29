from sqlalchemy.orm import Session
from sqlalchemy import desc
import models, schemas
import difflib

# 난이도별 문제 조회 함수
def get_questions_by_difficulty(db: Session, difficulty: int, limit: int = 10):
    # 실제 앱에서는 랜덤하게 가져오는 것이 좋습니다.
    with open("debug.log", "a", encoding="utf-8") as f:
        f.write(f"DEBUG: Fetching questions for difficulty {difficulty} (type: {type(difficulty)})\n")
    
    questions = db.query(models.Question).filter(models.Question.difficulty == difficulty).limit(limit).all()
    
    with open("debug.log", "a", encoding="utf-8") as f:
        f.write(f"DEBUG: Found {len(questions)} questions\n")
        if questions:
            try:
                f.write(f"DEBUG: First question success_rate: {questions[0].success_rate}\n")
            except Exception as e:
                f.write(f"DEBUG: Error accessing success_rate: {e}\n")
    
    # 스키마 형식(id, encoded)으로 매핑하여 반환
    return [
        {
            "id": q.id, 
            "encoded": q.encoded_text, 
            "correct_count": q.correct_count, 
            "total_attempts": q.total_attempts, 
            "success_rate": q.success_rate
        } 
        for q in questions
    ]

# 문자열 유사도 계산 함수
def calculate_similarity(str1: str, str2: str) -> float:
    # difflib을 사용한 기본적인 유사도 검사
    # 실제 서비스에서는 AI API (OpenAI 등)를 사용하여 의미적 유사도를 판단해야 합니다.
    return difflib.SequenceMatcher(None, str1, str2).ratio() * 100

# 정답 확인 및 결과 저장 함수
def verify_answer(db: Session, question_id: str, user_answer: str):
    question = db.query(models.Question).filter(models.Question.id == question_id).first()
    if not question:
        return None
    
    # 문자열 정규화 (공백 제거, 소문자 변환)
    normalized_user = user_answer.strip().lower().replace(" ", "")
    normalized_correct = question.correct_meaning.strip().lower().replace(" ", "")
    
    # 유사도 계산
    similarity = calculate_similarity(normalized_user, normalized_correct)
    
    # 정답 판별 기준 (예: 80% 이상 유사하면 정답)
    is_correct = similarity >= 80
    
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
        feedback="정답입니다!" if is_correct else "아쉽네요."
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
        with open("debug.log", "a", encoding="utf-8") as f:
            f.write(f"ERROR in create_user: {str(e)}\n")
            import traceback
            f.write(traceback.format_exc())
        raise e

def create_guest_user(db: Session):
    # 게스트 사용자 생성
    # 실제로는 DB에 저장하지 않고 토큰만 발급할 수도 있지만, 여기서는 임시 사용자를 생성합니다.
    import uuid
    guest_username = f"guest_{uuid.uuid4().hex[:8]}"
    db_user = models.User(username=guest_username, is_guest=True)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

# 오답 노트 CRUD (Note CRUD)
def create_note_entry(db: Session, note: schemas.WrongAnswerNoteCreate, user_id: int):
    with open("debug.log", "a", encoding="utf-8") as f:
        f.write(f"DEBUG: create_note_entry called for user_id={user_id}, question_id={note.question_id}\n")

    # 이미 존재하는 오답노트인지 확인
    existing_note = db.query(models.WrongAnswerNote).filter(
        models.WrongAnswerNote.user_id == user_id,
        models.WrongAnswerNote.question_id == note.question_id
    ).first()
    
    if existing_note:
        with open("debug.log", "a", encoding="utf-8") as f:
            f.write(f"DEBUG: Note already exists, updating answer to {note.user_answer}\n")
        # 이미 존재하면 답안만 업데이트
        existing_note.user_answer = note.user_answer
        db.commit()
        db.refresh(existing_note)
        return existing_note

    with open("debug.log", "a", encoding="utf-8") as f:
        f.write(f"DEBUG: Creating new note with answer {note.user_answer}\n")

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
