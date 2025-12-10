# Context Hunter 프로젝트 구조 및 코드 흐름 분석

## 1. 프로젝트 개요
**Context Hunter**는 문맥을 통해 어려운 문장의 의미를 유추하는 웹 기반 게임입니다.
- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Backend**: FastAPI, Python, SQLAlchemy (MariaDB/SQLite)
- **AI**: Llama 3.1 8b (via Groq/Ollama API)

## 2. 파일 구조 (File Structure)

### Backend (`backend/`)
핵심 로직과 데이터 처리를 담당합니다.
- **`main.py`**: 앱의 진입점(Entry Point). API 엔드포인트를 정의하고 요청을 라우팅합니다.
- **`ai.py`**: AI 모델(Llama 3.1)과의 통신을 담당합니다. 문제 생성 및 유사도 판별 로직이 포함되어 있습니다.
- **`crud.py`**: 데이터베이스 CRUD(Create, Read, Update, Delete) 작업을 수행합니다.
- **`models.py`**: 데이터베이스 테이블 스키마(SQLAlchemy 모델)를 정의합니다. (`Question`, `User`, `Attempt` 등)
- **`schemas.py`**: API 요청/응답 데이터 검증을 위한 Pydantic 모델을 정의합니다.
- **`database.py`**: DB 연결 세션을 관리합니다.

### Frontend (`app/`)
사용자 인터페이스(UI)를 담당합니다.
- **`src/main.tsx`**: React 앱의 진입점. `App` 컴포넌트를 DOM에 렌더링합니다.
- **`src/App.tsx`**: 메인 컴포넌트. 게임 상태(`gameState`), 라우팅(화면 전환), 인증 상태를 관리합니다.
- **`src/lib/api.ts`**: 백엔드 API와의 통신을 담당하는 함수들이 모여 있습니다.
- **`src/components/`**: 화면별 컴포넌트들 (`GameScreen`, `DifficultyScreen`, `MainScreen` 등)이 위치합니다.

## 3. 상세 코드 흐름 (Step-by-Step Code Flow)

### 단계 1: 앱 시작 (Startup)
1.  **Backend**: `python -m uvicorn main:app` 명령어로 실행. `main.py`에서 FastAPI 앱이 생성되고 DB 테이블이 초기화됩니다.
2.  **Frontend**: `npm run dev`로 실행. 브라우저가 `index.html`을 로드하고, `src/main.tsx`가 실행되어 `App.tsx`를 렌더링합니다.

### 단계 2: 게임 시작 (Game Start)
1.  사용자가 **Frontend**의 `MainScreen`에서 "오늘의 단어" 또는 "도전 모드"를 선택합니다.
2.  `App.tsx`의 `selectMode` 함수가 호출되어 `gameState`가 `'difficulty'`로 변경됩니다.
3.  `DifficultyScreen`이 렌더링되고, 사용자가 난이도를 선택하면 `startGame`이 호출됩니다.
4.  `gameState`가 `'playing'`으로 변경되고 `GameScreen`이 렌더링됩니다.

### 단계 3: 문제 로딩 (Loading Questions)
1.  **Frontend** (`GameScreen`): 컴포넌트 마운트 시 `api.fetchQuestions(difficulty)`를 호출합니다.
2.  **API Request**: `GET /api/questions?difficulty=1` 요청이 백엔드로 전송됩니다.
3.  **Backend** (`main.py`): `read_questions` 엔드포인트가 요청을 받습니다.
4.  **Database** (`crud.py`): `get_questions_by_difficulty` 함수가 DB에서 해당 난이도의 문제들을 조회합니다.
5.  **Response**: 문제 목록(JSON)이 프론트엔드로 반환되고, `GameScreen`에 문제가 표시됩니다.

### 단계 4: 정답 제출 및 검증 (Submission & Verification)
1.  **Frontend** (`GameScreen`): 사용자가 답을 입력하고 제출 버튼을 누릅니다.
2.  **API Request**: `api.verifyAnswer`를 통해 `POST /api/verify` 요청을 보냅니다. (body: `{ questionId, userAnswer }`)
3.  **Backend** (`main.py`): `verify_answer` 엔드포인트가 요청을 받습니다.
4.  **Logic** (`crud.py`): `verify_answer` 함수가 실행됩니다.
    -   DB에서 해당 문제의 정답(`correct_meaning`)을 조회합니다.
    -   `ai.check_similarity(user_answer, correct_meaning)`을 호출합니다.
5.  **AI Processing** (`ai.py`): Llama 3.1 모델에게 두 문장의 의미적 유사도를 판단해달라고 요청합니다.
6.  **Result**: AI가 유사도 점수와 정답 여부를 반환하면, 이를 DB(`Attempt` 테이블)에 저장하고 프론트엔드로 결과를 보냅니다.

### 단계 5: 결과 처리 (Result Handling)
1.  **Frontend**: API 응답을 받아 정답/오답 애니메이션을 보여줍니다.
2.  모든 문제를 풀면 `onGameEnd`가 호출되어 `App.tsx`의 상태가 `'result'`로 변경됩니다.
3.  `ResultScreen`이 렌더링되어 최종 점수와 랭킹 등을 보여줍니다.
