# 시스템 상세 명세서 (System Specification)

## 6. 인터페이스 정의 (Interface Definition)

### 6.1 외부 시스템 API 개략 (External System API Overview)
본 시스템은 핵심 기능을 위해 외부 AI 서비스와 연동합니다.

| 서비스명 | 용도 | 연동 방식 | 주요 엔드포인트 | 비고 |
| :--- | :--- | :--- | :--- | :--- |
| **Llama 3.1 8b** | 1. 문제 자동 생성<br>2. 정답 유사도 판별 | HTTP (OpenAI Compatible) | `POST /v1/chat/completions` | Groq API 또는 Local Ollama 사용 |

#### AI 서비스 요청/응답 예시 (유사도 판별)
*   **Request**:
    ```json
    {
      "model": "llama-3.1-8b-instant",
      "messages": [
        {"role": "system", "content": "You are a strict evaluator..."},
        {"role": "user", "content": "Compare meaning: ..."}
      ],
      "response_format": {"type": "json_object"}
    }
    ```
*   **Response**:
    ```json
    {
      "is_correct": true,
      "similarity_score": 85,
      "feedback": "문맥상 적절한 해석입니다."
    }
    ```

### 6.2 내부 API 요청/응답 개요 (Internal API Request/Response Overview)
프론트엔드와 백엔드 간의 주요 REST API 명세입니다.

#### A. 인증 (Auth)
*   **로그인 (`POST /api/auth/login`)**
    *   **Request**: `username` (str), `password` (str) (Form Data)
    *   **Response**:
        ```json
        {
          "access_token": "eyJhbGciOi...",
          "token_type": "bearer"
        }
        ```
*   **게스트 로그인 (`POST /api/auth/guest`)**
    *   **Response**: Access Token (Guest 권한)

#### B. 게임 (Game)
*   **문제 조회 (`GET /api/questions`)**
    *   **Query**: `difficulty` (int, default=1)
    *   **Response**:
        ```json
        {
          "questions": [
            {
              "id": "q1_1",
              "encoded": "암호화된 문장...",
              "correct_count": 10,
              "total_attempts": 15,
              "success_rate": 66.7
            }
          ]
        }
        ```
*   **정답 검증 (`POST /api/verify`)**
    *   **Request**:
        ```json
        {
          "questionId": "q1_1",
          "userAnswer": "사용자가 입력한 답"
        }
        ```
    *   **Response**:
        ```json
        {
          "isCorrect": true,
          "similarity": 85.5,
          "feedback": "정확합니다!",
          "correctAnswer": "정답 의미"
        }
        ```

#### C. 사용자 데이터 (User Data)
*   **오답 노트 저장 (`POST /api/notes`)**
    *   **Request**: `{ "question_id": "...", "user_answer": "..." }`
    *   **Response**: 저장된 노트 ID 및 상세 정보
*   **랭킹 조회 (`GET /api/rankings`)**
    *   **Response**: 상위 100위 랭킹 리스트

### 6.3 데이터 모델 요약 (Data Model Summary)
데이터베이스(RDBMS)의 주요 엔티티 구조입니다.

| 엔티티 (Entity) | 설명 | 주요 속성 (Attributes) |
| :--- | :--- | :--- |
| **User** | 사용자 계정 | `id` (PK), `username` (Unique), `hashed_password`, `is_guest`, `created_at` |
| **Question** | 게임 문제 | `id` (PK), `encoded_text` (지문), `correct_meaning` (정답), `difficulty` |
| **Attempt** | 풀이 시도 로그 | `id` (PK), `question_id` (FK), `user_answer`, `similarity_score`, `is_correct` |
| **WrongAnswerNote** | 오답 노트 | `id` (PK), `user_id` (FK), `question_id` (FK), `user_answer` |
| **Guestbook** | 랭킹/방명록 | `id` (PK), `nickname`, `score`, `max_streak`, `difficulty` |

---

## 7. 성능/보안/확장성 고려 (Non-Functional Requirements)

### 7.1 확장성 전략 (Scalability Strategy)
*   **Stateless Backend**: FastAPI 서버는 상태를 저장하지 않으므로(Stateless), 트래픽 증가 시 수평 확장(Scale-out)이 용이합니다. (Load Balancer 뒤에 여러 인스턴스 배치 가능)
*   **Containerization**: Docker 및 Docker Compose를 사용하여 환경 일관성을 보장하고 배포를 자동화합니다.
*   **Database Separation**: 웹 서버와 데이터베이스 서버를 분리하여 각각 독립적으로 리소스를 증설할 수 있습니다.

### 7.2 보안 모델 (Security Model)
*   **인증 (Authentication)**:
    *   **JWT (JSON Web Token)**: 로그인 시 발급된 토큰을 헤더(`Authorization: Bearer <token>`)에 실어 보냅니다. 서버는 세션을 별도로 저장하지 않아도 토큰 검증만으로 사용자를 식별합니다.
    *   **Guest Mode**: 게스트 사용자에게도 제한된 권한의 JWT를 발급하여 API 접근을 제어합니다.
*   **인가 (Authorization)**:
    *   일반 사용자: 모든 기능 접근 가능 (오답 노트, 랭킹 등록 등).
    *   게스트 사용자: 게임 플레이는 가능하나, 오답 노트 저장 등 개인화 데이터 접근은 차단됩니다.
*   **데이터 보호**:
    *   **비밀번호 암호화**: `bcrypt` 알고리즘을 사용하여 비밀번호를 단방향 해시 처리하여 DB에 저장합니다.
    *   **환경 변수 관리**: API Key, DB 접속 정보 등 민감 정보는 `.env` 파일로 관리하며 코드에 노출하지 않습니다.

### 7.3 예상 성능 및 목표 (Performance Goals)
*   **예상 TPS (Transactions Per Second)**:
    *   초기 목표: 10~50 TPS (동시 접속자 100명 내외 기준)
    *   게임 특성상 실시간성이 매우 높지는 않으나, 정답 제출 시 빠른 피드백이 중요합니다.
*   **응답 속도 (Latency)**:
    *   **일반 API (조회/로그인)**: < 200ms
    *   **AI 검증 API**: < 2~3초 (외부 AI 모델 추론 시간에 의존적. 로컬 GPU 사용 시 단축 가능)
*   **최적화 계획**:
    *   AI 응답 속도가 병목이 될 경우, 비동기 처리를 강화하거나 유사한 답안에 대한 캐싱(Caching) 시스템을 도입하여 API 호출을 줄입니다.
