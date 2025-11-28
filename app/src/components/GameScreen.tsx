import { useState, useEffect } from 'react';
import type { Difficulty, GameResult, GameMode } from '../types';
import { fetchQuestions, verifyAnswer, type Question } from '../lib/api';
import { Heart } from 'lucide-react';

interface GameScreenProps {
  difficulty: Difficulty;
  gameMode: GameMode;
  onGameEnd: (results: GameResult[], maxStreak: number) => void;
}

export default function GameScreen({ difficulty, gameMode, onGameEnd }: GameScreenProps) {
  const [currentRound, setCurrentRound] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [results, setResults] = useState<GameResult[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [similarity, setSimilarity] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [lives, setLives] = useState(3); // 도전 모드용
  const [currentStreak, setCurrentStreak] = useState(0); // 현재 연속 정답
  const [maxStreak, setMaxStreak] = useState(0); // 최대 연속 정답

  const totalRounds = gameMode === 'daily' ? 10 : 999;

  // 게임 시작 시 문제 가져오기
  useEffect(() => {
    const loadQuestions = async () => {
      setLoading(true);
      setError(null);
      try {
        const fetchedQuestions = await fetchQuestions(difficulty);
        if (fetchedQuestions.length === 0) {
          setError('No questions found');
        }
        setQuestions(fetchedQuestions);
      } catch (err) {
        console.error('Failed to load questions:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    loadQuestions();
  }, [difficulty]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!questions[currentRound]) return;

    setSubmitting(true);

    try {
      // 백엔드 LLM을 통한 정답 확인
      const response = await verifyAnswer(
        questions[currentRound].id,
        userAnswer.trim()
      );

      setIsCorrect(response.isCorrect);
      setCorrectAnswer(response.correctAnswer || userAnswer.trim());
      setSimilarity(response.similarity || 0);
      setShowFeedback(true);

      const newResult: GameResult = {
        round: currentRound + 1,
        question: questions[currentRound].encoded,
        userAnswer: userAnswer.trim(),
        correctAnswer: response.correctAnswer || userAnswer.trim(),
        isCorrect: response.isCorrect,
        similarity: response.similarity || 0,
      };

      const newResults = [...results, newResult];
      setResults(newResults);

      // 연속 정답 체크
      if (response.isCorrect) {
        const newStreak = currentStreak + 1;
        setCurrentStreak(newStreak);
        setMaxStreak(Math.max(maxStreak, newStreak));
      } else {
        setCurrentStreak(0);
        if (gameMode === 'challenge') {
          const newLives = lives - 1;
          setLives(newLives);
          if (newLives === 0) {
            // 게임 종료
            setTimeout(() => {
              onGameEnd(newResults, Math.max(maxStreak, currentStreak));
            }, 2000);
          }
        }
      }
    } catch (error) {
      console.error('Failed to verify answer:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = async () => {
    if (gameMode === 'daily' && currentRound + 1 >= totalRounds) {
      onGameEnd([...results], maxStreak);
    } else if (gameMode === 'challenge' && lives === 0) {
      onGameEnd([...results], maxStreak);
    } else {
      // 다음 문제 로드
      if (currentRound + 1 >= questions.length) {
        // 문제가 부족하면 추가로 가져오기
        const moreQuestions = await fetchQuestions(difficulty);
        setQuestions([...questions, ...moreQuestions]);
      }
      setCurrentRound(currentRound + 1);
      setUserAnswer('');
      setShowFeedback(false);
      setCorrectAnswer('');
      setSimilarity(0);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl w-full text-center space-y-4">
        <h2 className="text-2xl">Context Hunter</h2>
        <div className="text-gray-500">문제를 불러오는 중...</div>
      </div>
    );
  }

  if (!questions[currentRound]) {
    return (
      <div className="max-w-2xl w-full text-center space-y-4">
        <h2 className="text-2xl">Context Hunter</h2>
        <div className="text-red-500">문제를 불러오는데 실패했습니다. ({error})</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl w-full space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl">Context Hunter</h2>
        <div className="flex items-center gap-4">
          {gameMode === 'challenge' && (
            <div className="flex items-center gap-1">
              {Array.from({ length: 3 }).map((_, index) => (
                <Heart
                  key={index}
                  size={20}
                  className={index < lives ? 'fill-red-500 text-red-500' : 'text-gray-300'}
                />
              ))}
            </div>
          )}
          {gameMode === 'daily' && (
            <div className="text-gray-500">
              라운드 {currentRound + 1} / {totalRounds}
            </div>
          )}
          {gameMode === 'challenge' && (
            <div className="text-gray-500">
              라운드 {currentRound + 1}
            </div>
          )}
        </div>
      </div>

      {gameMode === 'challenge' && (
        <div className="text-center text-gray-600">
          연속 정답: {currentStreak} | 최고 기록: {maxStreak}
        </div>
      )}

      <div className="space-y-8">
        <div className="bg-gray-50 rounded-lg p-12 text-center">
          <div className="text-sm text-gray-500 mb-4">암호화된 문장</div>
          <div className="text-2xl tracking-wide">{questions[currentRound].encoded}</div>
        </div>

        {!showFeedback ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="같은 의미의 문장을 입력하세요"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-gray-900 focus:outline-none"
              autoFocus
              disabled={submitting}
            />
            <button
              type="submit"
              className="w-full py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 disabled:opacity-50"
              disabled={!userAnswer.trim() || submitting}
            >
              {submitting ? 'AI가 답변을 확인하는 중...' : '확인'}
            </button>
          </form>
        ) : (
          <div className="space-y-6">
            <div
              className={`p-6 rounded-lg text-center ${isCorrect ? 'bg-green-50' : 'bg-red-50'
                }`}
            >
              <div className={`text-2xl mb-2 ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                {isCorrect ? '정답입니다! ✓' : '아쉽습니다 ✗'}
              </div>
              <div className="text-lg mb-4 text-gray-700">
                유사도: {similarity}%
              </div>
              <div className="space-y-2 text-sm">
                <div className="text-gray-600">
                  입력한 답: <span className={isCorrect ? 'text-green-600' : 'text-red-600'}>{userAnswer}</span>
                </div>
                {!isCorrect && (
                  <div className="text-gray-600">
                    정답 예시: <span className="text-green-600">{correctAnswer}</span>
                  </div>
                )}
              </div>
            </div>
            {lives > 0 && (
              <button
                onClick={handleNext}
                className="w-full py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
              >
                {gameMode === 'daily' && currentRound + 1 >= totalRounds ? '결과 보기' : '다음 문제'}
              </button>
            )}
          </div>
        )}
      </div>

      {gameMode === 'daily' && (
        <div className="pt-4 border-t border-gray-200">
          <div className="flex gap-1 justify-center">
            {Array.from({ length: totalRounds }).map((_, index) => (
              <div
                key={index}
                className={`w-8 h-2 rounded-full ${index < currentRound
                  ? results[index]?.isCorrect
                    ? 'bg-green-500'
                    : 'bg-red-500'
                  : index === currentRound && showFeedback
                    ? isCorrect
                      ? 'bg-green-500'
                      : 'bg-red-500'
                    : 'bg-gray-200'
                  }`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
