# Context Hunter (문맥 사냥꾼)

문맥을 통해 어려운 문장의 의미를 유추하는 웹 기반 게임입니다.

**2025년 12월 부로 프로젝트 종료에 따라 서비스가 종료됨. 프로세스를 수정해 로컬 모델로 구동하실 수 있습니다.**

**Guide 폴더의 문서와 실제 구조가 다를 수 있습니다. 프로젝트 종료 전까지 지속적인 수정이 이루어졌기 때문입니다.**

## 프로젝트 구조

*   **`app/`**: 프론트엔드 (React + TypeScript + Vite + Tailwind CSS)
*   **`backend/`**: 백엔드 (FastAPI + Python + MariaDB/SQLite)

## 시작하기 (Getting Started)

### 1. 백엔드 설정 (Backend Setup)

`backend` 폴더로 이동합니다:

```bash
cd backend
```

필요한 라이브러리를 설치합니다:

```bash
pip install -r requirements.txt
```

서버를 실행합니다:

```bash
# 개발 모드
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8001
```

### 2. 프론트엔드 설정 (Frontend Setup)

`app` 폴더로 이동합니다:

```bash
cd app
```

필요한 라이브러리를 설치합니다:

```bash
npm install
```

개발 서버를 실행합니다:

```bash
npm run dev
```

웹사이트 주소: `http://localhost:65039` (Docker 배포 시)


## 배포 (Deployment)

학교 서버 배포 방법은 `deploy_guide.md` 파일을 참고하세요.
