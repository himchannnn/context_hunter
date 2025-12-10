# Context Hunter Backend Guide

이 문서는 **Context Hunter**의 백엔드 구조, API, 데이터베이스 설계를 설명합니다.

## 1. 기술 스택 (Tech Stack)
*   **Framework**: FastAPI
*   **Language**: Python 3.x
*   **Database**: SQLite (개발용) / MariaDB (배포 예정)
*   **ORM**: SQLAlchemy
*   **Authentication**: OAuth2 (JWT)

## 2. 디렉토리 구조 (Directory Structure)
```
backend/
├── main.py              # FastAPI 앱 초기화 및 라우터 설정
├── models.py            # SQLAlchemy 데이터베이스 모델 정의
├── schemas.py           # Pydantic 데이터 검증 스키마
├── crud.py              # 데이터베이스 CRUD 함수 모음
├── database.py          # DB 연결 설정
├── ai.py (권장)          # AI 로직 (문제 생성, 유사도 판별)
└── AI_IMPLEMENTATION_GUIDE.md # AI 구현 가이드
```

## 3. 데이터베이스 모델 (Database Models)

*   **`User`**: 사용자 정보 (username, hashed_password, is_guest).
*   **`Question`**: 문제 데이터 (encoded_text, correct_meaning, difficulty, stats).
*   **`WrongAnswerNote`**: 사용자가 저장한 오답 노트 (user_id, question_id, user_answer).
*   **`Guestbook`**: 도전 모드 랭킹 및 방명록 (nickname, score, max_streak, difficulty).
*   **`Attempt`**: (내부용) 모든 문제 풀이 시도 로그.

## 4. 주요 API 엔드포인트 (Key API Endpoints)

### 인증 (Auth)
*   `POST /api/auth/register`: 회원가입
*   `POST /api/auth/login`: 로그인 (JWT 발급)
*   `POST /api/auth/guest`: 게스트 로그인

### 게임 (Game)
*   `GET /api/questions`: 난이도별 문제 조회
*   `POST /api/verify`: 정답 확인 및 유사도 분석 (AI 로직 연동)

### 기능 (Features)
*   `POST /api/notes`: 오답노트 추가
*   `GET /api/notes`: 내 오답노트 조회
*   `DELETE /api/notes/{note_id}`: 오답노트 삭제
*   `GET /api/rankings`: 글로벌 랭킹 조회 (통합)
*   `POST /api/guestbook`: 도전 모드 결과 저장 (자동 저장)

## 5. 실행 환경 (Runtime Environment)
*   **Port**: 8001 (기본값)
*   **Host**: 0.0.0.0

## 5. AI 로직 (AI Logic)
*   **유사도 판별**: 사용자의 답안과 정답의 의미적 유사성을 분석합니다.
*   **문제 생성**: 원문 데이터를 바탕으로 새로운 문제를 생성합니다.
*   *자세한 내용은 `backend/AI_IMPLEMENTATION_GUIDE.md`를 참고하세요.*
