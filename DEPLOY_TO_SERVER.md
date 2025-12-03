# 학과 서버 배포 계획 (Docker Backend + Host DB)

## 목표
백엔드(`FastAPI`)를 학과 서버에서 **Docker 컨테이너**로 실행하되, 데이터베이스는 **서버에 이미 설치된 MariaDB**를 사용하도록 설정합니다.

## 핵심 변경 사항
1.  **`docker-compose.yml` 수정**:
    -   `db` 서비스(컨테이너) 제거 (이미 서버에 있는 DB를 쓰므로 불필요).
    -   `backend` 서비스가 호스트(서버)의 네트워크에 접근할 수 있도록 설정.
2.  **환경 변수(`DATABASE_URL`) 설정**:
    -   컨테이너 내부에서 호스트의 DB를 가리키는 주소(`host.docker.internal` 또는 `172.17.0.1`) 사용.

## 상세 단계

### 1. `docker-compose.yml` 수정
기존 파일에서 `db` 섹션을 삭제하고, `backend`만 남깁니다.

```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    restart: always
    ports:
      - "8001:8001" # 외부에서 접속할 포트 개방
    environment:
      # 호스트 DB 접속 정보 (아래 설명 참조)
      DATABASE_URL: mysql+pymysql://사용자ID:비밀번호@host.docker.internal:3306/DB이름
      AI_API_KEY: ${AI_API_KEY}
      AI_BASE_URL: ${AI_BASE_URL}
      AI_MODEL_NAME: ${AI_MODEL_NAME}
    extra_hosts:
      - "host.docker.internal:host-gateway" # 리눅스 환경에서 호스트 접근 허용
```

### 2. DB 연결 주소 설정 (`DATABASE_URL`)
학과 서버(리눅스)에서 Docker 컨테이너가 **호스트(서버 자체)**의 DB에 접근하려면 주소가 중요합니다.

*   **주소**: `host.docker.internal` (위의 `extra_hosts` 설정 필요)
*   **포트**: 따로 설정된 포트가 없다면 기본 포트인 **`3306`**일 확률이 높습니다.
*   **사용자/비번**: 학과 서버 관리자에게 받은 DB 계정 정보를 사용합니다.

### 3. 배포 실행
1.  프로젝트 파일을 서버로 업로드.
2.  `backend/.env` 파일 생성 및 키 입력.
3.  `docker-compose up -d --build` 명령어로 실행.

## 주의사항
-   **방화벽**: 학과 서버의 3306 포트가 로컬(localhost) 접속만 허용되어 있을 수 있습니다. Docker 컨테이너는 기술적으로 '외부' 접속으로 간주될 수 있으므로, DB 설정(`my.cnf`)에서 `bind-address = 0.0.0.0` 설정이 필요한지 확인해야 할 수도 있습니다. 하지만 `host.docker.internal`을 통하면 보통 접근 가능합니다.
