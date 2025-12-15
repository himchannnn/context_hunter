# Ollama 설정 및 관리 가이드 (Docker/Podman 버전)

이 프로젝트는 Ollama를 별도로 설치할 필요 없이, `docker-compose`에 포함된 컨테이너로 실행합니다.
따라서 **복잡한 서버 설정 없이 배포 후 모델만 다운로드하면 바로 사용 가능**합니다.

## 1단계: 프로젝트 배포 (Deployment)

먼저 프로젝트 루트에서 전체 서비스를 실행합니다.

```bash
podman-compose up -d --build
```
이러면 자동으로 `backend`, `frontend`, `db`, 그리고 `ollama` 컨테이너가 모두 실행됩니다.

---

## 2단계: AI 모델 다운로드 (Model Setup)

**중요**: 컨테이너가 처음 실행되면 AI 모델이 없는 상태입니다. 실행 중인 컨테이너 내부에 명령을 내려 모델을 다운로드해야 합니다.

1.  **실행 중인 컨테이너 확인**:
    ```bash
    podman ps
    ```
    명령어를 입력하여 `ollama` 컨테이너의 이름(예: `context_hunter_ollama_1` 또는 `context-hunter-ollama-1`)을 확인합니다. 보통 `ollama`라는 이름이 포함되어 있습니다.

2.  **모델 다운로드 명령어 실행**:
    (컨테이너 이름이 `context_hunter_ollama_1`이라고 가정)
    ```bash
    podman exec -it context_hunter_ollama_1 ollama pull llama3.1
    ```
    > **참고**: `docker-compose.yml`에 설정된 볼륨(`ollama_data`) 덕분에, 이 모델은 컨테이너를 재시작해도 지워지지 않고 유지됩니다.

---

## 3단계: 작동 확인 (Verification)

백엔드 서버 로그를 확인하여 연결이 정상적인지 봅니다.

```bash
podman-compose logs -f backend
```

또는 Ollama 컨테이너가 정상적으로 떠 있는지 확인합니다.
```bash
# 로컬에서 테스트하고 싶다면 컨테이너 포트(11434)가 매핑되어 있어야 함
curl http://localhost:11434/api/tags
```
(`docker-compose.yml`에는 기본적으로 외부 포트 11434를 열지 않았습니다. 보안 때문입니다. 백엔드 컨테이너 내부에서만 `http://ollama:11434`로 접속합니다.)

---

## 문제 해결 (Troubleshooting)

### GPU 사용 및 자원 관리 (Resource Management)

**자원 독점 방지**:
기본적으로 Ollama는 모델을 메모리(VRAM)에 일정 시간 유지하여 응답 속도를 높입니다.
하지만 이 프로젝트에서는 다른 사용자와의 자원 공유를 위해 **2분간 사용이 없으면 자동으로 메모리에서 언로드**되도록 설정했습니다.
(`docker-compose.yml`의 `OLLAMA_KEEP_ALIVE=2m` 설정)

학과 서버에 GPU가 있고 이를 사용하고 싶다면:
1.  **Direct Mapping**: `docker-compose.yml`에 이미 `/dev/nvidia...` 장치들이 매핑되어 있습니다.
    *   서버에 해당 장치 파일이 존재하는지 확인하세요 (`ls -l /dev/nvidia*`).
    *   만약 권한 오류(Permission Denied)가 발생한다면 `security_opt: - label=disable` 주석을 해제해 보세요.
2.  **드라이버**: 호스트 서버에 NVIDIA 드라이버가 정상적으로 설치되어 있어야 합니다. (Toolkit은 필요 없음)

### 모델 다운로드가 너무 느릴 때
`podman exec`로 다운로드가 너무 느리거나 끊기면, `nohup`을 사용하지 마시고 터미널을 유지해 주세요. 모델 크기가 약 4.7GB입니다.

