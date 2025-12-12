# GitHub에 코드 업로드하는 방법

현재 시스템에서 `git` 명령어를 실행할 수 없어, 직접 업로드해드릴 수가 없습니다. 
아래 순서대로 진행해주시면 됩니다.

## 1. Git 설치
먼저 컴퓨터에 Git이 설치되어 있어야 합니다.
- [Git for Windows 다운로드](https://git-scm.com/download/win)
- 설치 후 터미널(PowerShell 또는 CMD)을 재시작해야 할 수 있습니다. Note: `git --version` 명령어로 설치 확인이 가능합니다.

## 2. 명령어 실행
이 폴더(`c:\Users\h0n9j\Desktop\context_hunter-main`)에서 터미널을 열고 아래 명령어들을 순서대로 실행하세요.

이미 `.git` 폴더가 존재하는 것으로 보아, 과거에 git 초기화가 된 적이 있는 것 같습니다.

### 기존 연결 확인 및 변경
```powershell
# 현재 연결된 저장소 확인
git remote -v

# 만약 다른 저장소가 연결되어 있다면, 새로운 주소로 변경:
git remote set-url origin https://github.com/himchannnn/context_hunter
```

### 만약 연결된 저장소가 없다면 (새로 추가)
```powershell
git remote add origin https://github.com/himchannnn/context_hunter
```

### 코드 업로드 (Push)
```powershell
# 현재 변경사항 모두 스테이징
git add .

# 커밋 (메시지는 자유롭게 변경 가능)
git commit -m "Upload context_hunter code"

# 메인 브랜치로 설정 (대부분 main 또는 master 사용)
git branch -M main

# 원격 저장소로 업로드
git push -u origin main
```

만약 `git push` 과정에서 에러가 발생하면(예: `force` 필요 등), 기존 저장소와 역사가 달라서일 수 있습니다. 이 경우 덮어씌워도 된다면 `git push -f origin main`을 사용할 수 있습니다.
