export type GameState = 'main' | 'difficulty' | 'playing' | 'result';
export type GameMode = 'daily' | 'challenge';
export type Difficulty = 1 | 2 | 3;

export interface GameResult {
    round: number;
    question: string;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    similarity: number; // 유사도 (0-100)
}
