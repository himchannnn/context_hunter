// 게임 상태 타입 정의
export type GameState = 'main' | 'difficulty' | 'playing' | 'result' | 'notes';
// 게임 모드 타입 (일일 도전 / 무한 도전)
export type GameMode = 'daily' | 'challenge';
// 난이도 타입 (1: 청년층, 2: 중장년층, 3: 노년층)
export type Difficulty = 1 | 2 | 3;

// 문제 인터페이스
export interface Question {
    id: string;
    encoded: string;
    correct_count: number;
    total_attempts: number;
    success_rate: number;
    correct_meaning?: string;
}

// 정답 확인 응답 인터페이스
export interface VerifyResponse {
    isCorrect: boolean;
    similarity: number;
    correctAnswer?: string;
    feedback: string;
}

// 게임 결과 인터페이스
export interface GameResult {
    round: number;
    question: Question;
    userAnswer: string;
    isCorrect: boolean;
    similarity: number;
}
