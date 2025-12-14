# Context Hunter Podman Deployment Guide

이 가이드는 Check Hunter 애플리케이션을 **Podman**을 사용하여 배포하는 방법을 설명합니다.
AI 기능(검증 로직 등)은 다른 모듈로 대체될 수 있도록 설계되어 있으며, 환경 변수를 통해 제어할 수 있습니다.

## 1. 사전 요구 사항 (Prerequisites)

서버에 다음 도구들이 설치되어 있어야 합니다.

*   **Podman**: 컨테이너 런타임
*   **Podman Compose** (권장): `docker-compose.yml` 파일을 사용하여 배포를 쉽게 관리하기 위함.
    *   설치 예시 (RHEL/CentOS 8+): `sudo dnf install podman-compose`
    *   설치 예시 (Ubuntu): `sudo apt install podman-compose`

## 2. 프로젝트 구조 (Project Structure)

```
Context_Hunter_WLogin/
├── app/                # Frontend (React)
│   ├── Dockerfile      # Frontend 빌드 및 Nginx 설정
│   └── nginx.conf      # Nginx 리버스 프록시 설정
├── backend/            # Backend (FastAPI)
│   ├── Dockerfile      # Backend Python 환경 설정
│   └── ...
├── docker-compose.yml  # 서비스 오케스트레이션 설정
└── ...
```

---

## 3. 배포 방법 A: Podman Compose 사용 (권장)

가장 간편한 배포 방법입니다. `docker-compose.yml` 파일을 그대로 활용합니다.

### 3.1. 환경 변수 설정
배포 전, 중요한 보안 키나 AI 설정을 위해 `.env` 파일을 프로젝트 루트에 생성하거나 환경 변수를 export 하십시오.

**주요 환경 변수:**
*   `AI_API_KEY`: AI 서비스 API 키 (AI 기능 사용 시)
*   `AI_BASE_URL`: AI 서비스 URL (기본값 외 다른 URL 사용 시)
*   `AI_MODEL_NAME`: 사용할 AI 모델명 (기본값: `llama-3.1-8b-instant`)

### 3.2. 실행
프로젝트 루트 디렉토리에서 다음 명령어를 실행합니다.

```bash
# 백그라운드에서 빌드 및 실행
podman-compose up -d --build
```

### 3.3. 상태 확인
```bash
podman-compose ps
```

---

## 4. 배포 방법 B: 수동 배포 (Podman CLI)

`podman-compose`를 사용할 수 없는 경우, 다음 단계에 따라 수동으로 컨테이너를 띄울 수 있습니다.

### 4.1. 네트워크 생성
모든 컨테이너가 통신할 네트워크를 생성합니다.
```bash
podman network create app-network
```

### 4.2. 데이터베이스 (MariaDB) 실행
```bash
podman run -d \
  --name db \
  --network app-network \
  -e MYSQL_ROOT_PASSWORD=rootpassword \
  -e MYSQL_DATABASE=context_hunter \
  -e MYSQL_USER=hunter_user \
  -e MYSQL_PASSWORD=your_secure_password \
  -v db_data:/var/lib/mysql \
  mariadb:10.6
```

### 4.3. Backend 실행
백엔드 이미지를 빌드하고 실행합니다. AI 관련 설정이 변경되면 환경 변수(`-e`)를 수정하여 반영할 수 있습니다.

```bash
# 1. 이미지 빌드
cd backend
podman build -t context-backend .
cd ..

# 2. 컨테이너 실행
podman run -d \
  --name backend \
  --network app-network \
  -e DATABASE_URL="mysql+pymysql://hunter_user:your_secure_password@db/context_hunter" \
  -e AI_API_KEY="your_ai_key_here" \
  -e AI_MODEL_NAME="llama-3.1-8b-instant" \
  context-backend
```
> **참고 (AI 모듈 교체):**
> AI 기능을 다른 팀원이 개발한 모듈로 교체하거나 로직을 변경해야 할 경우, `backend` 코드를 수정한 후 이미지를 다시 빌드(`podman build`)하여 배포하면 됩니다. 외부 AI API를 호출하는 방식이라면 `AI_BASE_URL`만 변경하여 적용할 수도 있습니다.

### 4.4. Frontend 실행
프론트엔드 이미지를 빌드하고 실행합니다.

```bash
# 1. 이미지 빌드
cd app
podman build -t context-frontend .
cd ..

# 2. 컨테이너 실행 (80 포트 개방)
podman run -d \
  --name frontend \
  --network app-network \
  -p 80:80 \
  context-frontend
```

---

## 5. 관리 및 업데이트

### 로그 확인
```bash
# 전체 로그 (Compose)
podman-compose logs -f

# 특정 컨테이너 로그
podman logs -f backend
```

### 서비스 중단
```bash
# Compose
podman-compose down

# Manual
podman stop frontend backend db
podman rm frontend backend db
```
