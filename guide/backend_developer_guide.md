# Context Hunter - 백엔드 개발자 가이드

## 1. 프로젝트 개요
**Context Hunter**의 백엔드는 **FastAPI** 기반의 고성능 API 서버로, 프론트엔드와 LLM(Ollama) 사이의 중계 역할을 담당합니다. 또한 사용자 인증, 게임 진행 상황 저장, 오답 노트 관리 등의 데이터 영속성(Persistence)을 책임집니다.

### 기술 스택 (Tech Stack)
-   **프레임워크**: [FastAPI](https://fastapi.tiangolo.com/) (Python 3.10+)
-   **데이터베이스**: MariaDB (MySQL 호환) / SQLite (로컬 개발용)
-   **ORM**: [SQLAlchemy](https://www.sqlalchemy.org/)
-   **AI 연동**: OpenAI Client Library (Local Ollama와 통신)
-   **인증**: JWT (JSON Web Token)

---

## 2. 디렉토리 구조 (`backend/`)

```
backend/
├── main.py     # 엔트리 포인트 (API 라우터, 예외 처리, CORS 설정)
├── models.py   # DB 테이블 정의 (SQLAlchemy Models)
├── schemas.py  # Pydantic 데이터 검증 스키마
├── crud.py     # 비즈니스 로직 & DB 트랜잭션 함수들
├── ai.py       # LLM 연동 로직 (프롬프트 엔지니어링 핵심)
├── database.py # DB 연결 설정 (SessionLocal)
└── .env        # 환경 변수 (DB 접속 정보, Secret Key 등)
```

---

## 3. 핵심 아키텍처 및 로직

### A. API 계층 (`main.py`)
-   **역할**: HTTP 요청을 받아 적절한 `crud` 함수를 호출하고 응답을 반환합니다.
-   **Dependency Injection**: `Depends(get_db)`를 통해 DB 세션을 주입받아 트랜잭션 관리를 자동화합니다.
-   **인증 미들웨어**: `Depends(get_current_user)`를 사용하여 보호된 엔드포인트(오답노트, 상점 등) 접근을 제어합니다.

### B. 데이터 모델링 (`models.py`, `schemas.py`)
-   **`User`**: 일반 회원과 게스트(ID=-1)를 구분하여 관리합니다. `credits`와 `owned_themes` 같은 게임 재화 정보도 포함합니다.
-   **`Question`**: AI가 생성한 문제는 DB에 영구 저장됩니다. `encoded_text`(문제)와 `correct_meaning`(해석)이 핵심 필드입니다.
-   **`Attempt`**: 사용자의 모든 시도(정답/오답)를 로그로 남겨 추후 데이터 분석이나 난이도 조정에 활용할 수 있게 설계했습니다.

### C. 비즈니스 로직 (`crud.py`)
-   **문제 제공 전략**:
    1.  DB에 이미 생성된 문제가 있으면 랜덤으로 반환 (`func.random()`).
    2.  문제 수가 부족하면 즉시 `ai.generate_question()`을 호출해 실시간으로 생성 및 DB 저장 후 반환.
-   **일일 문제 로직**: `get_daily_questions`는 "오늘" 날짜로 생성된 문제만 필터링하며, 부족할 경우 지정된 카테고리(`Politics` 등)별로 1개씩 강제 생성합니다.

### D. 정답 검증 파이프라인 (`verify_answer` in `crud.py`)
단순 문자열 비교가 아닙니다.
1.  **Anti-Copy Check**: 사용자가 문제 원문(`encoded_text`)을 90% 이상 그대로 베껴 썼는지 `difflib`로 검사하여 차단합니다.
2.  **Semantic Check**: `ai.check_similarity`를 호출하여 의미적 유사도를 판단합니다.
3.  **결과 저장**: 점수(Similarity)와 등급(최상/우수/보통)을 계산하여 반환하고, `Attempt` 테이블에 로그를 기록합니다.

---

## 4. AI 연동 (`ai.py` 상세)
백엔드의 가장 독특한 부분입니다. `ai_developer_guide.md`에서 더 자세히 다루겠지만, 핵심은 다음과 같습니다.
-   **`AIClient` 클래스**: 싱글톤 패턴으로 관리되며, 로컬 `OLLAMA` 서버(`localhost:11434`)와 통신합니다.
-   **자기 검증 루프**: LLM이 생성한 json이 유효한지, 내용이 논리적인지 스스로 다시 검사하는 로직(`_verify_and_fix_question`)이 포함되어 있습니다.

---

## 5. 발표 및 설명 팁 (Q&A 대비)

**Q. "DB 부하는 어떻게 관리합니까?"**
> "현재 구조는 'Read-Heavy'가 아닌 'Write-Heavy'에 가깝습니다(로그 기록). 하지만 문제 조회 시에는 인덱싱된 `uuid`와 난수 정렬을 사용하므로 수천 건 수준에서는 지연이 없습니다. 대규모 트래픽 발생 시에는 Redis 캐싱을 도입할 수 있도록 Pydantic 모델을 분리해 두었습니다."

**Q. "FastAPI를 선택한 이유는?"**
> "LLM 응답 대기 시간(Latency) 때문입니다. Python의 `async/await` 비동기 처리를 네이티브로 지원하는 FastAPI를 사용하여, AI가 답변을 생성하는 동안에도 다른 사용자의 가벼운 요청(로그인, 랭킹 조회)을 블로킹 없이 처리할 수 있습니다."

**Q. "보안 취약점은?"**
> "모든 SQL 쿼리는 SQLAlchemy ORM을 통해 파라미터 바인딩되므로 SQL Injection으로부터 안전합니다. 패스워드는 `bcrypt`보다 강력한 `pbkdf2_sha256`으로 해싱하여 저장합니다. CORS 설정 또한 배포 시 화이트리스트 방식으로 제한할 수 있습니다."
