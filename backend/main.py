from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from jose import JWTError, jwt
import models, schemas, crud, database
import os
from dotenv import load_dotenv

load_dotenv()

# 데이터베이스 테이블 생성
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI()

# JWT 설정
# 실제 배포 시에는 SECRET_KEY를 환경 변수로 관리해야 합니다.
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-keep-it-secret") 
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# OAuth2 스킴 설정 (로그인 엔드포인트 지정)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

# CORS 설정 (프론트엔드와의 통신 허용)
origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 데이터베이스 세션 의존성 주입
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 인증 유틸리티 함수 (Auth Utils)
# JWT 액세스 토큰 생성
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# 현재 로그인한 사용자 가져오기 (토큰 검증)
async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = crud.get_user_by_username(db, username=username)
    if user is None:
        raise credentials_exception
    return user

# 인증 엔드포인트 (Auth Endpoints)
# 회원가입
@app.post("/api/auth/register", response_model=schemas.UserResponse)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_username(db, username=user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    return crud.create_user(db=db, user=user)

# 로그인 (토큰 발급)
@app.post("/api/auth/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = crud.get_user_by_username(db, username=form_data.username)
    if not user or not crud.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

# 게스트 로그인
@app.post("/api/auth/guest", response_model=schemas.Token)
def guest_login(db: Session = Depends(get_db)):
    user = crud.create_guest_user(db)
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

# 내 정보 조회
@app.get("/api/users/me", response_model=schemas.UserResponse)
def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user

# 문제 조회 엔드포인트
@app.get("/api/questions", response_model=schemas.QuestionsResponse)
def read_questions(difficulty: int = 1, db: Session = Depends(get_db)):
    try:
        with open("debug.log", "a", encoding="utf-8") as f:
            f.write(f"DEBUG: read_questions called with difficulty {difficulty}\n")
        questions = crud.get_questions_by_difficulty(db, difficulty)
        return {"questions": questions}
    except Exception as e:
        with open("debug.log", "a", encoding="utf-8") as f:
            f.write(f"ERROR in read_questions: {str(e)}\n")
            import traceback
            f.write(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

# 정답 확인 엔드포인트
@app.post("/api/verify", response_model=schemas.VerifyAnswerResponse)
def verify_answer(request: schemas.VerifyAnswerRequest, db: Session = Depends(get_db)):
    # 참고: 인증된 사용자의 경우 시도 기록을 사용자와 연결할 수 있습니다.
    result = crud.verify_answer(db, request.questionId, request.userAnswer)
    if not result:
        raise HTTPException(status_code=404, detail="Question not found")
    return result

# 랭킹 조회 엔드포인트
@app.get("/api/rankings", response_model=List[schemas.RankingEntry])
def read_rankings(db: Session = Depends(get_db)):
    return crud.get_rankings(db)

# 방명록(랭킹) 저장 엔드포인트
@app.post("/api/guestbook")
def create_guestbook(entry: schemas.GuestbookCreate, db: Session = Depends(get_db)):
    return crud.create_guestbook_entry(db, entry)

# 오답 노트 생성 엔드포인트 (인증 필요)
@app.post("/api/notes", response_model=schemas.WrongAnswerNoteResponse)
def create_note(note: schemas.WrongAnswerNoteCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return crud.create_note_entry(db, note, current_user.id)

# 내 오답 노트 조회 엔드포인트 (인증 필요)
@app.get("/api/notes", response_model=List[schemas.WrongAnswerNoteResponse])
def read_notes(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return crud.get_user_notes(db, current_user.id)

@app.get("/")
def read_root():
    return {"message": "Context Hunter Backend is running!"}
