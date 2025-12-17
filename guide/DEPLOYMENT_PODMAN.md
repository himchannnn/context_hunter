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
│   └── Dockerfile      # Frontend 빌드 및 Node.js Proxy 실행 (Port 3000)
├── backend/            # Backend (FastAPI)
│   ├── Dockerfile      # Backend Python 환경 설정
│   └── ...
├── docker-compose.yml  # 서비스 오케스트레이션 설정
└── ...
```

---

## 3. 배포 방법 A: Podman Compose 사용 (권장)

가장 간편한 배포 방법입니다. `docker-compose.yml` 파일을 그대로 활용합니다.

### 3.1. Ollama 설정 (로컬 AI)
**상세한 관리 방법은 [Ollama 설정 가이드](./OLLAMA_SETUP_GUIDE_KO.md)를 참고하세요.**

`docker-compose.yml`에 Ollama 서비스가 포함되어 있으므로 **서버에 별도로 설치할 필요가 없습니다.**
단, 최초 실행 후 **모델 다운로드**가 필요합니다 (가이드 참조).

### 3.2. 환경 변수 설정
배포 전, 중요한 보안 키나 AI 설정을 위해 `.env` 파일을 프로젝트 루트에 생성하거나 환경 변수를 export 하십시오.

**주요 환경 변수:**
*   `AI_API_KEY`: "ollama" (값 무관)
*   `AI_BASE_URL`: "http://ollama:11434/v1" (Docker 네트워크 내부 통신)
*   `AI_MODEL_NAME`: "llama3.1" (사용할 모델명)

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
podman network create app-network
```

### 4.2. Ollama 실행 (AI)
```bash
podman run -d \
  --name ollama \
  --network app-network \
  -v ollama_data:/root/.ollama \
  -e NVIDIA_VISIBLE_DEVICES=all \
  -e NVIDIA_DRIVER_CAPABILITIES=compute,utility \
  -e LD_LIBRARY_PATH=/usr/lib/x86_64-linux-gnu/nvidia:$LD_LIBRARY_PATH \
  -v /usr/lib64:/usr/lib/x86_64-linux-gnu/nvidia:ro \
  --device /dev/nvidia0:/dev/nvidia0 \
  --device /dev/nvidia1:/dev/nvidia1 \
  --device /dev/nvidiactl:/dev/nvidiactl \
  --device /dev/nvidiactl:/dev/nvidiactl \
  --device /dev/nvidia-uvm:/dev/nvidia-uvm \
  --device /dev/nvidia-uvm-tools:/dev/nvidia-uvm-tools \
  --device /dev/nvidia-modeset:/dev/nvidia-modeset \
  ollama/ollama:latest
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
  --name context-backend \
  --network host \
  -e DATABASE_URL="mysql+pymysql://dbid253:dbpass253@127.0.0.1/db25339" \
  -e AI_API_KEY="ollama" \
  -e AI_BASE_URL="http://127.0.0.1:11434/v1" \
  -e AI_MODEL_NAME="llama3.1" \
  context-backend \
  uvicorn main:app --host 0.0.0.0 --port 64039
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

# 2. 컨테이너 실행 (외부 80 포트 -> 내부 3000 포트)
podman run -d \
  --name frontend \
  --network app-network \
  -p 80:3000 \
  context-frontend
```

### 5. 서버 관리 및 정리 (Maintenance)
배포를 반복하면 이전 버전의 이미지가 `<none>` 상태(dangling images)로 쌓여 용량을 차지하게 됩니다.
정기적으로 다음 명령어를 실행하여 사용하지 않는 이미지를 정리해 주세요.

```bash
# 사용하지 않는 이미지(dangling) 및 중지된 컨테이너 일괄 삭제
podman system prune -f

# 또는 댕글링 이미지만 삭제
podman image prune -f
```

**재배포 시 권장 명령어:**
```bash
# 1. 기존 컨테이너 종료 및 삭제
podman-compose down

# 2. 이미지 새로 빌드 및 실행
podman-compose up -d --build

# 3. 이전 이미지 정리
podman image prune -f
```

### 5.1. 트러블슈팅: 정리 시 "no such container" 오류
만약 컨테이너를 **수동으로 삭제**하거나 `system prune`을 먼저 실행한 뒤 `podman-compose down`을 하면,
`Error: no container with name or ID ... found` 같은 오류가 발생할 수 있습니다.
이는 **이미 삭제된 컨테이너를 다시 끄려고 해서 발생하는 자연스러운 현상**이므로, **무시하고 진행**하시면 됩니다.

---

## 5. 관리 및 업데이트

### 로그 확인
```bash
# 전체 로그 (Compose)
podman-compose logs -f

### 5.2. 트러블슈팅: GPU 인식 실패 (CPU 부하 발생)
만약 `podman logs`에서 `inference compute id=cpu`라고 뜨거나 GPU를 사용하지 않는 경우 다음을 확인하세요.

1.  **호스트 드라이버 확인**:
    서버에서 `nvidia-smi` 명령어가 정상 작동하는지 확인하세요.

2.  **디바이스 파일 확인**:
    `/dev/nvidia0`, `/dev/nvidiactl` 등의 파일이 실제로 존재하는지 확인하세요.
    ```bash
    ls -l /dev/nvidia*
    ```

3.  **SELinux 권한 (Podman)**:
    Podman 사용 시 SELinux가 디바이스 접근을 차단할 수 있습니다. `docker-compose.yml`에서 `security_opt: - label=disable` 옵션이 활성화되어 있는지 확인하세요.

4.  **수동 CDI 설정 (고급)**:
    위 방법으로 안 될 경우, NVIDIA Container Toolkit을 설치하고 CDI(Container Device Interface)를 설정해야 할 수 있습니다.

    **설치 확인 방법:**
    ```bash
    # 1. 버전 확인
    nvidia-ctk --version

    # 2. 패키지 설치 확인 (RHEL/CentOS)
    rpm -qa | grep nvidia-container-toolkit
    ```
    이 명령어가 없거나 아무것도 나오지 않으면 툴킷이 설치되지 않은 상태입니다. 시스템 관리자에게 설치를 요청하세요.

### 로그 확인
```

### 서비스 중단
```bash
# Compose
podman-compose down

# Manual
podman stop frontend backend db
podman rm frontend backend db
```
