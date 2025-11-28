import { useState } from 'react';
import MainScreen from './components/MainScreen';
import DifficultyScreen from './components/DifficultyScreen';
import GameScreen from './components/GameScreen';
import DailyResultScreen from './components/DailyResultScreen';
import ChallengeResultScreen from './components/ChallengeResultScreen';
import type { GameState, GameMode, Difficulty, GameResult } from './types';

export default function App() {
  const [gameState, setGameState] = useState<GameState>('main');
  const [gameMode, setGameMode] = useState<GameMode>('daily');
  const [difficulty, setDifficulty] = useState<Difficulty>(1);
  const [results, setResults] = useState<GameResult[]>([]);
  const [maxStreak, setMaxStreak] = useState(0);

  const selectMode = (mode: GameMode) => {
    setGameMode(mode);
    setGameState('difficulty');
  };

  const startGame = (selectedDifficulty: Difficulty) => {
    setDifficulty(selectedDifficulty);
    setResults([]);
    setMaxStreak(0);
    setGameState('playing');
  };

  const endGame = (gameResults: GameResult[], streak: number) => {
    setResults(gameResults);
    setMaxStreak(streak);
    setGameState('result');
  };

  const resetGame = () => {
    setGameState('main');
    setResults([]);
    setMaxStreak(0);
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      {gameState === 'main' && <MainScreen onSelectMode={selectMode} />}
      {gameState === 'difficulty' && (
        <DifficultyScreen
          onStartGame={startGame}
          onBack={() => setGameState('main')}
        />
      )}
      {gameState === 'playing' && (
        <GameScreen
          difficulty={difficulty}
          gameMode={gameMode}
          onGameEnd={endGame}
        />
      )}
      {gameState === 'result' && gameMode === 'daily' && (
        <DailyResultScreen
          results={results}
          onRestart={resetGame}
        />
      )}
      {gameState === 'result' && gameMode === 'challenge' && (
        <ChallengeResultScreen
          results={results}
          maxStreak={maxStreak}
          difficulty={difficulty}
          onRestart={resetGame}
        />
      )}
    </div>
  );
}
