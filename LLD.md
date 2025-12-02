# LLD (Low-Level Design) - Context Hunter

## 1. LLD의 목적
본 문서는 **Context Hunter** 시스템의 구현 상세를 정의하여 개발자가 즉시 코딩할 수 있도록 가이드하는 것을 목적으로 합니다. 클래스 구조, API 명세, DB 스키마, 알고리즘 등을 구체적으로 기술합니다.

## 2. 클래스/모듈 상세 디자인 (Class/Module Design)

### 2.1 Backend Class Diagram (SQLAlchemy Models)
```mermaid
classDiagram
    class User {
        +int id
        +string username
        +string hashed_password
        +boolean is_guest
        +datetime created_at
    }

    class Question {
        +string id
        +text encoded_text
        +text original_text
        +text correct_meaning
        +int difficulty
        +int correct_count
        +int total_attempts
        +float success_rate
    }

    class WrongAnswerNote {
        +int id
        +int user_id
        +string question_id
        +text user_answer
        +datetime created_at
    }

    class Attempt {
        +int id
        +string question_id
        +text user_answer
        +float similarity_score
        +boolean is_correct
        +datetime timestamp
    }

    class Guestbook {
        +int id
        +string nickname
        +int score
        +int max_streak
        +int difficulty
        +datetime timestamp
    }

    User "1" --> "*" WrongAnswerNote : has
    Question "1" --> "*" WrongAnswerNote : referenced_by
    Question "1" --> "*" Attempt : has_logs
```

### 2.2 Pydantic Schemas (Data Transfer Objects)
*   **User**: `UserCreate`, `UserLogin`, `UserResponse`
*   **Question**: `QuestionBase`, `Question`, `QuestionsResponse`
*   **Note**: `WrongAnswerNoteCreate`, `WrongAnswerNoteResponse`
*   **Verification**: `VerifyAnswerRequest`, `VerifyAnswerResponse`
*   **Ranking**: `GuestbookCreate`, `RankingEntry`

## 3. API 상세 설계 (API Specifications)

### 3.1 Auth API
| Method | Endpoint | Request Body | Response Body | 설명 |
| :--- | :--- | :--- | :--- | :--- |
| POST | `/api/auth/register` | `{username, password}` | `UserResponse` | 회원가입 |
| POST | `/api/auth/login` | `OAuth2PasswordRequestForm` | `{access_token, token_type}` | 로그인 |
| POST | `/api/auth/guest` | - | `{access_token, token_type}` | 게스트 로그인 |
| GET | `/api/users/me` | - | `UserResponse` | 내 정보 조회 |

### 3.2 Game API
| Method | Endpoint | Query Params | Request Body | Response Body | 설명 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| GET | `/api/questions` | `difficulty` (int) | - | `{questions: List[Question]}` | 문제 목록 조회 |
| POST | `/api/verify` | - | `{questionId, userAnswer}` | `VerifyAnswerResponse` | 정답 검증 |

### 3.3 Note API
| Method | Endpoint | Request Body | Response Body | 설명 |
| :--- | :--- | :--- | :--- | :--- |
| POST | `/api/notes` | `{question_id, user_answer}` | `WrongAnswerNoteResponse` | 오답 노트 생성 |
| GET | `/api/notes` | - | `List[WrongAnswerNoteResponse]` | 내 오답 노트 조회 |

### 3.4 Ranking API
| Method | Endpoint | Request Body | Response Body | 설명 |
| :--- | :--- | :--- | :--- | :--- |
| GET | `/api/rankings` | - | `List[RankingEntry]` | 랭킹 조회 |
| POST | `/api/guestbook` | `{nickname, score, ...}` | - | 랭킹(방명록) 저장 |

### 3.5 Sequence Diagram (Answer Verification)
```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant DB
    participant AI_Service

    User->>Frontend: Input Answer & Submit
    Frontend->>Backend: POST /api/verify (questionId, userAnswer)
    activate Backend
    Backend->>DB: Get Question (correct_meaning)
    activate DB
    DB-->>Backend: Question Data
    deactivate DB
    
    Backend->>Backend: Preprocess Answer (trim, lower)
    
    Backend->>AI_Service: Request Similarity Analysis
    activate AI_Service
    AI_Service-->>Backend: Similarity Score (0 - 100)
    deactivate AI_Service
    
    Backend->>Backend: Check Threshold (>= 85)
    Backend->>DB: Save Attempt Log
    
    Backend-->>Frontend: Response (isCorrect, similarity, feedback)
    deactivate Backend
    
    Frontend->>User: Show Result & Feedback
```

## 4. DB 상세 설계 (Database Schema)

### 4.1 Tables
*   **users**: `id` (PK), `username` (Unique), `hashed_password`, `is_guest`, `created_at`
*   **questions**: `id` (PK), `encoded_text`, `original_text`, `correct_meaning`, `difficulty`, `correct_count`, `total_attempts`
*   **wrong_answer_notes**: `id` (PK), `user_id` (FK), `question_id` (FK), `user_answer`, `created_at`
*   **attempts**: `id` (PK), `question_id` (FK), `user_answer`, `similarity_score`, `is_correct`, `timestamp`
*   **guestbook**: `id` (PK), `nickname`, `score`, `max_streak`, `difficulty`, `timestamp`

### 4.2 ERD (Entity Relationship Diagram)
> 위 클래스 다이어그램 참조 (1:N 관계 위주)

## 5. 알고리즘/로직 상세 (Core Logic)

### 5.1 정답 검증 로직 (Verify Answer)
1.  **Input**: `questionId`, `userAnswer`
2.  **Process**:
    *   DB에서 `questionId`로 문제 조회 (`correct_meaning` 획득)
    *   `userAnswer` 전처리 (trim, lowercase)
    *   **AI API 호출**: `userAnswer`와 `correct_meaning` 간의 의미적 유사도 분석 요청 (multilingual-e5-small)
    *   **Threshold Check**: 유사도 85점 이상이면 `isCorrect = True`
    *   `Attempt` 테이블에 로그 저장
3.  **Output**: `isCorrect`, `similarity`, `feedback`

### 5.2 랭킹 업데이트 로직
1.  **Input**: `nickname`, `score`, `max_streak`
2.  **Process**:
    *   `nickname`으로 `guestbook` 테이블 조회
    *   **조건**: 기존 기록이 없거나, 새로운 `score`가 기존 `score`보다 높을 경우 업데이트
    *   동점일 경우 `max_streak`가 높은 순으로 우선순위 고려 가능 (현재는 점수 위주)
3.  **Output**: Success/Fail

## 6. 보안 및 설정 (Security & Config)

### 6.1 보안 구현
*   **Password Hashing**: `passlib` 라이브러리의 `bcrypt` 알고리즘 사용
*   **JWT**: `python-jose` 라이브러리 사용, `HS256` 알고리즘, 만료 시간 30분 설정
*   **CORS**: `fastapi.middleware.cors` 사용하여 모든 오리진(`*`) 허용 (개발 단계), 배포 시 특정 도메인으로 제한

### 6.2 환경 변수 (.env)
*   `SECRET_KEY`: JWT 서명용 비밀키
*   `DATABASE_URL`: DB 연결 문자열 (예: `sqlite:///./context_hunter.db`)
*   `OPENAI_API_KEY`: AI API 키 (Llama 3.1 사용 시)
*   `AI_BASE_URL`: AI API Base URL (예: Groq, Ollama 등)
*   `AI_MODEL_NAME`: 사용할 모델명 (Default: llama-3.1-8b-instant)

## 7. 제한사항 및 예외 처리
*   **API Error Handling**: `HTTPException`을 사용하여 명확한 상태 코드(400, 401, 404, 500) 반환
*   **DB Connection**: `SessionLocal`을 사용하여 요청별 세션 생성 및 종료 (`yield` 패턴)
*   **AI API Failure**: 외부 API 호출 실패 시 기본 유사도 알고리즘(SequenceMatcher)으로 Fallback 처리 고려 (현재는 에러 반환)
