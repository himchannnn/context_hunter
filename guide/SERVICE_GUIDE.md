# Context Hunter Service Guide

**Context Hunter** 서비스의 전체적인 구조와 개발 가이드라인을 통합한 문서입니다. 이 문서는 프로젝트를 처음 접하는 개발자가 서비스의 전반적인 흐름을 이해하고, 각 파트별 세부 문서로 이동할 수 있도록 돕습니다.

## 1. 서비스 개요 (Overview)
**Context Hunter**는 문맥 파악 능력을 기르는 언어 교육 게임입니다. 사용자에게 암호화되거나 변형된 문장을 제시하고, 이를 해석하여 원래 의미를 맞추도록 유도합니다. AI를 활용하여 정답의 유사도를 판단하고 피드백을 제공합니다.

### 핵심 기능
*   **일일 모드**: 매일 제공되는 10개의 문제를 풉니다.
*   **도전 모드**: 3번 틀릴 때까지 계속해서 문제를 풀고 글로벌 랭킹에 도전합니다.
*   **랭킹 시스템**: 실시간 랭킹 뱃지와 명예의 전당을 통해 경쟁심을 고취합니다.
*   **오답 노트**: 틀린 문제를 저장하고 복습할 수 있습니다.
*   **AI 피드백**: 단순 정답 확인이 아닌, AI(E5 모델)가 의미적 유사도를 분석합니다.
*   **소셜 공유**: 내 점수를 친구들에게 자랑할 수 있습니다.
*   **감각적 피드백**: 사운드와 애니메이션으로 몰입감을 더합니다.

## 2. 아키텍처 (Architecture)

``` mermaid
graph TD
    User["사용자 (Web/Mobile)"] --> Frontend["Frontend (React/Vite)"]
    Frontend --> API["Backend API (FastAPI)"]
    API --> DB["(Database)"]
    API --> AI["AI Engine (LLM)"]
```

*   **Frontend**: 사용자 인터페이스 및 게임 로직 시각화
*   **Backend**: 데이터 관리, 인증, 게임 로직 처리
*   **AI Engine**: 문제 생성(Llama 3.1) 및 답안 유사도 분석(E5)

## 3. 상세 가이드 (Detailed Guides)

각 파트별 상세 구현 내용과 가이드는 아래 링크를 참고하세요.

### 🎨 [Frontend Guide](app/FRONTEND_GUIDE.md)
*   화면 구성 (Main, Game, Result 등)
*   상태 관리 (Auth, Theme)
*   스타일링 및 반응형 디자인

### ⚙️ [Backend Guide](backend/BACKEND_GUIDE.md)
*   API 엔드포인트 명세
*   데이터베이스 스키마 (User, Question, Note 등)
*   인증 로직

### 🤖 [AI Implementation Guide](backend/AI_IMPLEMENTATION_GUIDE.md)
*   문제 생성 프롬프트 엔지니어링
*   유사도 판별 로직 및 피드백 생성
*   AI 모듈 통합 방법

## 4. 시작하기 (Getting Started)

### 사전 요구사항
*   Node.js (v18+)
*   Python (v3.8+)

### 실행 방법
1.  **Backend 실행**:
    ```bash
    cd backend
    pip install -r requirements.txt
    uvicorn main:app --reload --port 8001
    ```
2.  **Frontend 실행**:
    ```bash
    cd app
    npm install
    npm run dev
    ```

## 5. 향후 계획 (Roadmap)
*   **데이터셋 확장**: 다양한 주제와 난이도의 문제 데이터 추가
*   **AI 고도화**: 더 정교한 피드백과 맞춤형 문제 추천 알고리즘 도입
*   **모바일 앱**: PWA 지원 강화 또는 네이티브 앱 출시
