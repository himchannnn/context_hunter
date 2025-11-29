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
```

`backend` 폴더 안에 `.env` 파일을 생성합니다:

```bash
# backend/.env
DATABASE_URL=mysql+pymysql://hunter_user:your_secure_password@localhost/context_hunter
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
