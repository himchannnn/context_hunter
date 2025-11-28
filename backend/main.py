from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import models, schemas, crud, database

# Create tables
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI()

# CORS Configuration
origins = [
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/api/questions", response_model=schemas.QuestionsResponse)
def read_questions(difficulty: int = 1, db: Session = Depends(get_db)):
    with open("debug.log", "a", encoding="utf-8") as f:
        f.write(f"DEBUG: read_questions called with difficulty {difficulty}\n")
    questions = crud.get_questions_by_difficulty(db, difficulty)
    return {"questions": questions}

@app.post("/api/verify", response_model=schemas.VerifyAnswerResponse)
def verify_answer(request: schemas.VerifyAnswerRequest, db: Session = Depends(get_db)):
    result = crud.verify_answer(db, request.questionId, request.userAnswer)
    if not result:
        raise HTTPException(status_code=404, detail="Question not found")
    return result

@app.get("/api/rankings", response_model=List[schemas.RankingEntry])
def read_rankings(difficulty: int = 1, db: Session = Depends(get_db)):
    return crud.get_rankings(db, difficulty)

@app.post("/api/guestbook")
def create_guestbook(entry: schemas.GuestbookCreate, db: Session = Depends(get_db)):
    return crud.create_guestbook_entry(db, entry)

@app.get("/")
def read_root():
    return {"message": "Context Hunter Backend is running!"}
