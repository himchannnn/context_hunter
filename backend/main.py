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

from fastapi import Request
from fastapi.responses import JSONResponse

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    import traceback
    error_msg = f"Global Error: {str(exc)}\n{traceback.format_exc()}"
    print(error_msg)
    return JSONResponse(
        status_code=500,
        content={"detail": error_msg},
    )

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
    
    # 게스트 유저 처리 (DB 조회 안 함)
    if username.startswith("guest_"):
        # 임시 유저 객체 생성 (id=-1)
        return models.User(
            id=-1, 
            username=username, 
            is_guest=True, 
            created_at=datetime.utcnow(),
            credits=0,
            owned_themes="default",
            equipped_theme="default",
            total_solved=0
        )

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
    try:
        return crud.create_user(db=db, user=user)
    except Exception as e:
        print(f"Registration error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

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
def read_users_me(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Calculate daily progress count
    if current_user.id != -1:
        date = datetime.utcnow().strftime("%Y-%m-%d")
        progress = crud.get_daily_progress(db, current_user.id, date)
        if progress and progress.cleared_domains:
            # Count non-empty domains
            domains = [d for d in progress.cleared_domains.split(",") if d]
            current_user.daily_progress_count = len(domains)
        else:
            current_user.daily_progress_count = 0
    else:
        current_user.daily_progress_count = 0
            
    return current_user

# 문제 조회 엔드포인트
@app.get("/api/questions", response_model=schemas.QuestionsResponse)
def read_questions(category: Optional[str] = None, difficulty: int = 1, limit: int = 10, db: Session = Depends(get_db)):
    try:
        # print(f"DEBUG: read_questions called with category {category}") 
        questions = crud.get_questions(db, category, limit)
        return {"questions": questions}
    except Exception as e:
        print(f"ERROR in read_questions: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# 일일 진행 상황 조회
@app.get("/api/daily-progress", response_model=schemas.DailyProgressResponse)
def get_daily_progress(date: str, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    # 게스트는 로컬 관리 (혹은 빈 값 리턴)
    if current_user.id == -1:
         return {"date": date, "cleared_domains": "", "id": -1, "user_id": -1}
    
    progress = crud.get_daily_progress(db, current_user.id, date)
    if not progress:
        return {"date": date, "cleared_domains": "", "id": 0, "user_id": current_user.id}
    return progress

# 일일 진행 상황 업데이트 (클리어 시 호출)
@app.post("/api/daily-progress", response_model=schemas.DailyProgressResponse)
def update_daily_progress(update: schemas.DailyProgressUpdate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.id == -1:
        # 게스트는 서버 저장 안 함
        return {"date": update.date, "cleared_domains": update.domain, "id": -1, "user_id": -1}
        
    progress, is_new = crud.update_daily_progress(db, current_user.id, update.date, update.domain)
    
    credits_awarded = 0
    if is_new:
        current_user.credits += 10
        db.commit()
        credits_awarded = 10
        
    # Pydantic 모델 반환을 위해 dict로 변환하거나 ORM 객체에 속성 추가
    # ORM 객체에 임시 속성 추가는 위험하므로 dict로 변환
    return {
        "id": progress.id,
        "user_id": progress.user_id,
        "date": progress.date,
        "cleared_domains": progress.cleared_domains,
        "reward_claimed": progress.reward_claimed,
        "credits_awarded": credits_awarded
    }


# 정답 확인 엔드포인트
@app.post("/api/verify", response_model=schemas.VerifyAnswerResponse)
def verify_answer(request: schemas.VerifyAnswerRequest, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    # 참고: 인증된 사용자의 경우 시도 기록을 사용자와 연결할 수 있습니다.
    # user_id 전달하여 통계 업데이트
    result = crud.verify_answer(db, request.questionId, request.userAnswer, current_user.id)
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
    # 게스트는 오답노트 저장 안 함 (휘발성)
    if current_user.id == -1:
        # 가짜 응답 반환 (프론트엔드 에러 방지용)
        # Note: 실제 DB에 없으므로 ID는 임의값, created_at은 현재 시간
        return schemas.WrongAnswerNoteResponse(
            id=-1,
            user_id=-1,
            question_id=note.question_id,
            user_answer=note.user_answer,
            created_at=datetime.utcnow(),
            question=schemas.Question(
                id=note.question_id, 
                encoded="Guest Mode - Not Saved", 
                correct_count=0, 
                total_attempts=0, 
                success_rate=0.0
            ) 
        )
    return crud.create_note_entry(db, note, current_user.id)

# 내 오답 노트 조회 엔드포인트 (인증 필요)
@app.get("/api/notes", response_model=List[schemas.WrongAnswerNoteResponse])
def read_notes(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    # 게스트는 오답노트 없음
    if current_user.id == -1:
        return []
    return crud.get_user_notes(db, current_user.id)



# 12-12 추가: 상점 구매
@app.post("/api/shop/buy")
def buy_theme(request: schemas.ShopPurchaseRequest, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.id == -1:
         raise HTTPException(status_code=400, detail="Guest cannot buy themes")
         
    THEME_PRICE = 100
    theme_id = request.theme_id
    
    # Check credits
    if current_user.credits < THEME_PRICE:
        raise HTTPException(status_code=400, detail="Not enough credits")
        
    # Check if already owned
    owned_list = current_user.owned_themes.split(",") if current_user.owned_themes else []
    if theme_id in owned_list:
        raise HTTPException(status_code=400, detail="Theme already owned")
        
    # Deduct credits and add theme
    current_user.credits -= THEME_PRICE
    owned_list.append(theme_id)
    current_user.owned_themes = ",".join(owned_list)
    db.commit()
    
    return {"message": f"Purchased {theme_id}", "credits": current_user.credits, "owned_themes": current_user.owned_themes}

# 12-12 추가: 테마 장착
@app.post("/api/user/equip")
def equip_theme(request: schemas.ThemeEquipRequest, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.id == -1:
         raise HTTPException(status_code=400, detail="Guest cannot equip themes")
         
    theme_id = request.theme_id
    owned_list = current_user.owned_themes.split(",") if current_user.owned_themes else []
    
    if theme_id not in owned_list and theme_id != 'default':
        raise HTTPException(status_code=400, detail="Theme not owned")
        
    current_user.equipped_theme = theme_id
    db.commit()
    
    return {"message": f"Equipped {theme_id}", "equipped_theme": current_user.equipped_theme}

from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# ... (Existing imports and API endpoints remain unchanged) ...

# @app.get("/")
# def read_root():
#     return {"message": "Context Hunter Backend is running!"}

# @app.get("/")
# def read_root():
#     return {"message": "Context Hunter Backend is running!"}

@app.get("/")
def read_root():
    return {"message": "Context Hunter Backend is running!"}
