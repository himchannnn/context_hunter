# Local AI Deployment Guide (Ollama + RTX A5000)

이 가이드는 **RTX A5000 (24GB)** GPU가 장착된 서버에서 **Ollama**를 사용하여 AI를 로컬로 구동하고, Context Hunter 서비스와 연결하는 방법을 설명합니다.

## 1. Ollama 설치 및 모델 준비

서버(Linux)에 Ollama를 설치하고 Llama 3.1 모델을 다운로드합니다.

### 1.1 Ollama 설치
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

### 1.2 모델 다운로드 (Llama 3.1 8b)
RTX A5000은 24GB VRAM을 가지고 있으므로, 8b 모델은 매우 여유롭게 돌아갑니다. (약 6GB VRAM 소요)

```bash
ollama pull llama3.1
```

### 1.3 Ollama 실행 확인
Ollama가 백그라운드에서 실행 중인지 확인합니다. 기본 포트는 **11434**입니다.

```bash
curl http://localhost:11434/api/tags
# {"models":[{"name":"llama3.1:latest", ...}]} 와 같은 응답이 오면 성공
```

---

## 2. Backend 연결 설정

Context Hunter의 백엔드가 로컬 Ollama를 사용하도록 설정합니다.

### 2.1 환경 변수 설정 (.env)
`backend/.env` 파일 (또는 Docker의 `.env`)을 다음과 같이 수정합니다.

```ini
# AI Configuration for Local Ollama
AI_API_KEY=ollama  # Ollama는 키가 필요 없지만, 클라이언트 호환성을 위해 임의의 값 입력
AI_BASE_URL=http://host.docker.internal:11434/v1  # Docker 사용 시
# 또는
# AI_BASE_URL=http://localhost:11434/v1  # 로컬 직접 실행 시

AI_MODEL_NAME=llama3.1
```

> **주의 (Docker 사용 시):**
> Docker 컨테이너 내부에서 호스트의 Ollama에 접근하려면 `host.docker.internal`을 사용해야 합니다.
> Linux Docker에서는 `docker-compose.yml`에 `extra_hosts` 설정이 필요할 수 있습니다.

### 2.2 Docker Compose 설정 (Linux 서버용)
`docker-compose.yml` 파일을 열어 `backend` 서비스에 다음 내용을 추가하여 호스트 네트워크 접근을 허용하는 것이 가장 확실한 방법입니다.

**방법 A: host.docker.internal 매핑 (추천)**
```yaml
services:
  backend:
    # ... 기존 설정 ...
    extra_hosts:
      - "host.docker.internal:host-gateway"
```

**방법 B: Host Network 모드 (대안)**
```yaml
services:
  backend:
    network_mode: "host"
    # ... 포트 매핑 제거 필요 ...
```

---

## 3. 전체 배포 순서 요약

1.  **Ollama 설치 & 모델 Pull**: `ollama pull llama3.1`
2.  **프로젝트 클론**: `git clone ...`
3.  **환경 변수 설정**: `.env` 파일에 `AI_BASE_URL=http://host.docker.internal:11434/v1` 설정
4.  **Docker Compose 수정**: `docker-compose.yml`에 `extra_hosts` 추가
5.  **서비스 실행**: `docker-compose up -d --build`

이제 외부 API 비용 없이, 강력한 RTX A5000 GPU를 활용하여 무제한으로 문제를 생성할 수 있습니다! 🚀
