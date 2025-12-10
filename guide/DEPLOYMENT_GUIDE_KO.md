# Context Hunter 배포 가이드

이 가이드는 학과 서버에 Context Hunter 애플리케이션을 배포하는 방법을 설명합니다.

## 📦 옵션 1: Podman 배포 (권장)

컨테이너를 사용하여 독립된 환경을 구성합니다.

### 1단계: 네트워크 생성 (불필요)
복잡한 네트워크 설정 대신, **호스트 네트워크**와 **포트 전송** 기능을 사용하여 더 간단하게 구성합니다.
이제 `podman network create` 단계는 필요하지 않습니다.

### 2단계: AI 서비스 (Ollama) 실행
백엔드에서 사용할 AI 모델을 위해 Ollama를 GPU 모드로 실행합니다.

```bash
podman run -d \
  --name ollama \
  --restart always \
  --network host \
  --device /dev/nvidia0:/dev/nvidia0 \
  -v ollama:/root/.ollama \
  ollama/ollama
```

**⚠️ 중요: 모델 다운로드 (최초 1회 필수)**
Ollama 컨테이너가 실행된 후, 반드시 아래 명령어로 모델을 받아야 합니다.
```bash
podman exec -it ollama ollama run llama3.1
```
*(다운로드가 완료되고 프롬프트가 뜨면 `/bye`를 입력해 빠져나오세요.)*

### 3단계: 백엔드 (Backend) 배포

**이미지 빌드:**
```bash
cd backend
podman build -t context-backend .
```

**컨테이너 실행:**
먼저 `backend` 폴더에 `.env.production` 파일을 생성하고 내용을 채운 뒤 실행합니다.

```bash
podman run -d \
  --name backend \
  --restart always \
  --network host \
  --device /dev/nvidia0:/dev/nvidia0 \
  --env-file backend/.env.production \
  context-backend
```
*(기본 템플릿 파일 `backend/.env.production`을 만들어 두었습니다. 실제 비밀번호로 수정한 후 실행하세요.)*

### 4단계: 프론트엔드 (Frontend) 배포

**이미지 빌드:**
```bash
cd ../app
podman build -t context-frontend .
```

**컨테이너 실행 (포트 65039):**
```bash
podman run -d \
  --name frontend \
  --restart always \
  -p 65039:80 \
  --add-host backend:host-gateway \
  context-frontend
```
**설명:** 프론트엔드는 호스트 네트워크(`--network host`)를 쓸 수 없으므로(80포트 권한 문제), 대신 `--add-host` 옵션으로 "백엔드란 이름은 내 호스트 컴퓨터야"라고 알려줍니다.

**✅ 확인:**
웹 브라우저에서 `http://서버IP:65039`로 접속하여 확인합니다.

---

## 🧹 정리 및 재시작 (Cleanup)

설정을 바꾸거나 "사용 중인 이름(name already in use)" 에러가 뜰 경우:

```bash
# 기존 컨테이너 삭제
podman rm -f backend frontend ollama
```

---

## 🔄 애플리케이션 업데이트 (Update)

코드가 변경되었을 때(`git pull` 후) 적용하는 방법입니다.

1.  **이미지 다시 빌드**:
    ```bash
    cd backend
    podman build -t context-backend .
    cd ../app
    podman build -t context-frontend .
    cd ..
    ```

2.  **컨테이너 재시작**:
    ```bash
    # (1) 기존 컨테이너 삭제
    podman rm -f backend frontend
    
    # (2) 백엔드 재실행 (호스트 네트워크)
    podman run -d --name backend --restart always --network host --device /dev/nvidia0:/dev/nvidia0 --env-file .env.production context-backend
    
    # (3) 프론트엔드 재실행 (--add-host 추가)
    podman run -d --name frontend --restart always -p 65039:80 --add-host backend:host-gateway context-frontend
    ```

---

## 📊 자원 모니터링 (Monitoring)

배포된 컨테이너들의 CPU, 메모리, GPU 사용량을 확인하는 방법입니다.

### 1. CPU 및 메모리 사용량 (`podman stats`)
실행 중인 모든 컨테이너의 실시간 리소스 점유율을 보여줍니다.
```bash
podman stats
# 종료하려면 Ctrl+C
```

### 2. GPU 사용량 (`nvidia-smi`)
Ollama가 GPU를 잘 쓰고 있는지 확인하려면 호스트에서 아래 명령어를 입력합니다.
```bash
nvidia-smi
# 또는 1초마다 갱신해서 보기:
watch -n 1 nvidia-smi
```
