# 배포 가이드 (학교 서버)

## 1. 환경 설정 (Environment Setup)

### Python & MariaDB 설치
서버에 Python 3.9 이상과 MariaDB가 설치되어 있어야 합니다.

```bash
# Ubuntu/Debian 예시
sudo apt update
sudo apt install python3 python3-pip mariadb-server libmysqlclient-dev
```

### 데이터베이스 설정 (Database Setup)
MariaDB에 접속하여 데이터베이스를 생성합니다:

```sql
sudo mysql -u root -p

CREATE DATABASE context_hunter;
CREATE USER 'hunter_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON context_hunter.* TO 'hunter_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

## 2. 백엔드 설정 (Backend Setup)

`backend` 폴더로 이동하여 라이브러리를 설치합니다:

```bash
cd backend
pip install -r requirements.txt

# 참고: 최초 실행 시 multilingual-e5-small 모델(약 500MB)이 다운로드됩니다.
# 서버에 최소 1GB 이상의 여유 메모리가 필요합니다.
```

`backend` 폴더 안에 `.env` 파일을 생성합니다:

```bash
# backend/.env
# backend/.env
DATABASE_URL=mysql+pymysql://hunter_user:your_secure_password@localhost/context_hunter

# AI Configuration
AI_API_KEY=your_api_key_here
AI_BASE_URL=https://api.groq.com/openai/v1
AI_MODEL_NAME=llama-3.1-8b-instant
```

**중요: 데이터베이스 초기화**
처음 실행할 때는 반드시 초기 데이터를 생성해야 합니다.

```bash
python seed.py
```

## 3. 서버 실행 (Running the Server)

### 개발/테스트 모드 (Development)
```bash
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8001
```

### 프로덕션 모드 (Production - 백그라운드 실행)
`gunicorn`이나 `systemd`를 사용하는 것이 좋지만, 간단하게는 아래 명령어를 사용합니다.

```bash
# 백그라운드 실행
nohup python -m uvicorn main:app --host 0.0.0.0 --port 8001 &
```

## 4. 프론트엔드 연동 (Frontend Integration)

프론트엔드의 `app/src/lib/api.ts` 파일을 열어 서버 IP로 변경합니다:

```typescript
// app/src/lib/api.ts
const API_BASE_URL = 'http://YOUR_SERVER_IP:8001/api';
```

그 후 프론트엔드를 빌드하여 Nginx 등으로 배포합니다.
## 5. Docker로 배포하기 (Recommended)

학교 서버 등 프로덕션 환경에서는 Docker를 사용하는 것이 가장 간편하고 안정적입니다.

### 5.1 사전 준비
서버에 **Docker**와 **Docker Compose**가 설치되어 있어야 합니다.

### 5.2 환경 변수 설정
프로젝트 루트에 `.env` 파일을 생성하고 AI API 키를 입력합니다.

```bash
# .env
AI_API_KEY=your_api_key_here
AI_BASE_URL=https://api.groq.com/openai/v1
AI_MODEL_NAME=llama-3.1-8b-instant
```

### 5.3 실행
다음 명령어로 모든 서비스(DB, Backend, Frontend)를 한 번에 실행합니다.

```bash
docker-compose up -d --build
```

*   `--build`: 이미지를 새로 빌드합니다 (코드 변경 시 필수).
*   `-d`: 백그라운드에서 실행합니다.

### 5.4 접속 확인
*   웹사이트: `http://YOUR_SERVER_IP:65039`
*   API: `http://YOUR_SERVER_IP:65039/api` (내부적으로 프록시됨)
*   DB 데이터는 `docker-compose.yml`이 있는 폴더에 영구 저장됩니다.

### 5.5 종료
```bash
docker-compose down
```
