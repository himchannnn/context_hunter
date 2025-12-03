# 시스템 상세 명세서 - 상태 및 설정 (System Specification - State & Config)

## 6. 상태 정의 (State Definitions)

### 6.1 상태 머신 (State Machine) - Frontend
프론트엔드 애플리케이션(`App.tsx`)은 단일 상태 변수 `gameState`를 통해 전체 화면 흐름을 제어합니다.

#### 주요 상태 (States)
| 상태명 (State) | 설명 | 화면 컴포넌트 |
| :--- | :--- | :--- |
| **`main`** | 초기 화면. 게임 모드 선택 및 메뉴 접근 가능. | `MainScreen` |
| **`difficulty`** | 난이도 선택 화면. | `DifficultyScreen` |
| **`playing`** | 게임 진행 중. 문제 풀이 및 피드백 표시. | `GameScreen` |
| **`result`** | 게임 종료 후 결과 화면. | `DailyResultScreen` / `ChallengeResultScreen` |
| **`notes`** | 오답 노트 확인 화면. | `WrongAnswerNoteScreen` |

#### 상태 전이 다이어그램 (State Transition Diagram)
```mermaid
stateDiagram-v2
    [*] --> main
    
    main --> difficulty : 모드 선택 (일일/도전)
    main --> notes : 오답노트 버튼 클릭
    
    notes --> main : 뒤로가기
    
    difficulty --> playing : 난이도 선택 완료
    difficulty --> main : 뒤로가기
    
    playing --> result : 모든 문제 풀이 완료 (일일)
    playing --> result : 생명 소진 (도전)
    
    result --> playing : 다시 하기 (Retry)
    result --> main : 홈으로 이동
```

### 6.2 상태 전이 조건 및 규칙 (Transition Rules)
1.  **Game Start (`main` -> `difficulty` -> `playing`)**:
    *   사용자가 모드(Daily/Challenge)를 선택하면 `difficulty` 상태로 진입합니다.
    *   난이도(1~3)를 선택하면 `playing` 상태로 진입하며, 이때 `results` 배열과 `maxStreak`가 초기화됩니다.
2.  **Game Over (`playing` -> `result`)**:
    *   **Daily Mode**: 총 10라운드가 종료되면 즉시 `result` 상태로 전이합니다.
    *   **Challenge Mode**: 사용자 생명(`lives`)이 0이 되면 2초 딜레이(애니메이션) 후 `result` 상태로 전이합니다.
3.  **Reset (`result` -> `main`)**:
    *   사용자가 "홈으로" 버튼을 누르면 `main` 상태로 돌아가며 모든 게임 진행 데이터가 초기화됩니다.

---

## 7. 구성 파일/환경 변수 (Configuration & Environment Variables)

### 7.1 설정 파일 구조 (Configuration Structure)
프로젝트는 환경 변수(`.env`)와 Docker Compose 설정(`docker-compose.yml`)을 통해 실행 환경을 관리합니다.

#### A. Backend 환경 변수 (`backend/.env`)
백엔드 서버 실행에 필요한 핵심 설정입니다.

| 변수명 | 필수 여부 | 기본값 | 설명 |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | **Yes** | - | DB 연결 문자열 (예: `mysql+pymysql://user:pass@host/db`) |
| `SECRET_KEY` | **Yes** | - | JWT 토큰 서명용 비밀키 (보안 필수) |
| `AI_API_KEY` | **Yes** | - | AI 서비스(Groq/OpenAI) API Key |
| `AI_BASE_URL` | No | `https://api.groq.com...` | AI API 엔드포인트 (로컬 Ollama 사용 시 변경) |
| `AI_MODEL_NAME` | No | `llama-3.1-8b-instant` | 사용할 LLM 모델명 |

#### B. Docker Compose 설정 (`docker-compose.yml`)
전체 시스템 배포를 위한 오케스트레이션 설정입니다.

```yaml
version: '3.8'
services:
  # 1. 데이터베이스 (MariaDB)
  db:
    image: mariadb:10.6
    environment:
      MYSQL_DATABASE: context_hunter
      # ... (User/Password 설정)
    volumes:
      - db_data:/var/lib/mysql # 데이터 영구 저장

  # 2. 백엔드 API (FastAPI)
  backend:
    build: ./backend
    environment:
      - DATABASE_URL=...
      - AI_API_KEY=${AI_API_KEY} # 호스트 환경변수 주입
    depends_on:
      - db

  # 3. 프론트엔드 (Nginx serving React)
  frontend:
    build: ./app
    ports:
      - "65039:80" # 외부 포트 65039 개방
    depends_on:
      - backend
```

### 7.2 서비스 포트 및 연결 정보 (Service Ports & Connections)

| 서비스 | 내부 포트 (Container) | 외부 포트 (Host) | 프로토콜 | 용도 |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend** | 80 (Nginx) | **65039** | HTTP | 웹 브라우저 접속용 |
| **Backend** | 8000 (Uvicorn) | - (내부 통신) | HTTP | API 서버 (프론트엔드 -> 백엔드) |
| **Database** | 3306 | - (내부 통신) | TCP | 데이터 저장소 |

*   **연결 문자열 예시**:
    *   **Backend -> DB**: `mysql+pymysql://hunter_user:password@db/context_hunter` (`db`는 docker service name)
    *   **Frontend -> Backend**: Nginx Reverse Proxy 설정을 통해 `/api` 요청을 `http://backend:8000`으로 전달.
