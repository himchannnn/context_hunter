# Context Hunter Frontend Guide

이 문서는 **Context Hunter**의 프론트엔드 구조와 구현 방식을 설명합니다.

## 1. 기술 스택 (Tech Stack)
*   **Framework**: React (Vite)
*   **Language**: TypeScript
*   **Styling**: Tailwind CSS
*   **Icons**: Lucide React
*   **State Management**: React Context API (`AuthContext`, `SoundContext`)

## 2. 디렉토리 구조 (Directory Structure)
```
app/
├── src/
│   ├── components/      # UI 컴포넌트 (화면 단위)
│   ├── context/         # 전역 상태 관리 (인증, 사운드)
│   ├── lib/             # 유틸리티 및 API 호출 함수
│   ├── styles/          # 전역 스타일 (globals.css)
│   ├── types/           # TypeScript 타입 정의
│   ├── App.tsx          # 메인 라우팅 및 레이아웃
│   └── main.tsx         # 진입점 (Entry Point)
```

## 3. 주요 컴포넌트 (Key Components)

### 화면 (Screens)
*   **`MainScreen.tsx`**: 게임의 메인 로비입니다. 게임 모드(일일/도전)를 선택하고 오답노트로 이동할 수 있습니다. **Mini Leaderboard(명예의 전당)**와 **Footer**가 포함되어 있습니다.
*   **`GameScreen.tsx`**: 실제 게임 플레이가 이루어지는 곳입니다. 문제 표시, 정답 입력, AI 결과 확인 기능을 담당합니다.
*   **`DailyResultScreen.tsx`**: 일일 모드 종료 후 결과를 보여주고, 공유하기(Fallback 지원) 및 오답노트 추가 기능을 제공합니다.
*   **`ChallengeResultScreen.tsx`**: 도전 모드 종료 후 점수와 글로벌 랭킹을 보여주고, 재시작(Restart) 기능을 제공합니다.
*   **`WrongAnswerNoteScreen.tsx`**: 오답 노트를 확인하고 삭제할 수 있는 화면입니다.
*   **`LoginScreen.tsx` / `SignupScreen.tsx`**: 사용자 인증을 담당합니다.

### 공통 기능
*   **반응형 디자인**: 모든 컴포넌트는 Tailwind의 `md:` 프리픽스를 사용하여 모바일과 데스크탑 환경에 최적화되어 있습니다.
*   **UI 통일성**: 모든 버튼과 입력 필드는 `rounded-xl`, `font-bold`, `hover:scale` 효과 등을 사용하여 일관된 디자인 시스템을 따릅니다.
*   **랭킹 시스템**: `App.tsx` 헤더에 사용자의 랭킹에 따른 **뱃지(Badge)**가 표시됩니다.

## 4. 테마 및 스타일링 (Theme & Styling)
*   **단일 테마**: 초기에는 다크 모드를 지원했으나, 디자인 통일성을 위해 **Light Mode** 전용으로 변경되었습니다.
*   **`globals.css` / `index.css`**: 전역 스타일 및 버튼/입력 필드의 기본 스타일을 정의합니다.
*   **애니메이션**: `index.css`에 정의된 `@keyframes shake` 등을 사용하여 시각적 피드백을 제공합니다.

## 5. 인증 (Authentication)
*   **`AuthContext.tsx`**: JWT 토큰을 관리하고 로그인/로그아웃 상태를 전파합니다.
*   **게스트 로그인**: 회원가입 없이 기능을 체험할 수 있도록 게스트 로그인 모드를 지원합니다.

## 6. 사운드 시스템 (Sound System)
*   **`SoundContext.tsx`**: **Web Audio API**를 사용하여 효과음(정답, 오답, 클릭)을 프로그래매틱하게 생성하고 재생합니다. 별도의 오디오 파일 에셋이 필요하지 않습니다.
