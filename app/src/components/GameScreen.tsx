import { useState, useEffect, useCallback } from 'react';
import type { Difficulty, GameResult, GameMode, Question } from '../types';
import { fetchQuestions, verifyAnswer } from '../lib/api';
import { Heart } from 'lucide-react';
import { useSound } from '../context/SoundContext';

interface GameScreenProps {
  difficulty: Difficulty;
  gameMode: GameMode;
  onGameEnd: (results: GameResult[], maxStreak: number) => void;
  onExit: () => void;
}

export default function GameScreen({ difficulty, gameMode, onGameEnd, onExit }: GameScreenProps) {
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
  const [isShaking, setIsShaking] = useState(false); // 오답 시 흔들림 효과
  const [showExitDialog, setShowExitDialog] = useState(false); // 나가기 확인 팝업

  const { playSound } = useSound();

  const totalRounds = gameMode === 'daily' ? 10 : 999;

  // ... (useEffects remain similar) ...

  // 게임 시작 시 문제 가져오기 (unchanged)
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

  // keydown handler (unchanged)
  // ...

  // 다음 문제로 이동 핸들러 (useCallback으로 감싸서 의존성 관리)
  const handleNext = useCallback(async () => {
    playSound('click');
    if (gameMode === 'daily' && currentRound + 1 >= totalRounds) {
      onGameEnd([...results], maxStreak);
    } else if (gameMode === 'challenge' && lives === 0) {
      onGameEnd([...results], maxStreak);
    } else {
      // 다음 문제 로드
      if (currentRound + 1 >= questions.length) {
        // 문제가 부족하면 추가로 가져오기
        const moreQuestions = await fetchQuestions(difficulty);
        setQuestions((prev) => [...prev, ...moreQuestions]);
      }
      setCurrentRound((prev) => prev + 1);
      setUserAnswer('');
      setShowFeedback(false);
      setCorrectAnswer('');
      setSimilarity(0);
    }
  }, [currentRound, gameMode, lives, maxStreak, onGameEnd, playSound, questions.length, results, totalRounds, difficulty]);

  // 키보드 이벤트 핸들러 (Enter 키로 다음 문제 이동)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showFeedback && e.key === 'Enter') {
        if (lives > 0) {
          handleNext();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showFeedback, lives, handleNext]);

  // 정답 제출 핸들러 (unchanged)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!questions[currentRound]) return;

    setSubmitting(true);
    playSound('click');
    console.log('Submitting answer:', userAnswer);

    try {
      // 백엔드 LLM을 통한 정답 확인
      const response = await verifyAnswer(
        questions[currentRound].id,
        userAnswer.trim()
      );
      console.log('Verify response:', response);

      setIsCorrect(response.isCorrect);
      setCorrectAnswer(response.correctAnswer || userAnswer.trim());
      setSimilarity(response.similarity || 0);
      setShowFeedback(true);

      const currentQuestion = questions[currentRound];
      // 정답이 있으면 문제 정보 업데이트
      if (response.correctAnswer) {
        currentQuestion.correct_meaning = response.correctAnswer;
      }

      const newResult: GameResult = {
        round: currentRound + 1,
        question: currentQuestion,
        userAnswer: userAnswer.trim(),
        isCorrect: response.isCorrect,
        similarity: response.similarity || 0,
      };

      const newResults = [...results, newResult];
      setResults(newResults);

      // 연속 정답 체크 및 생명 관리
      if (response.isCorrect) {
        playSound('correct');
        const newStreak = currentStreak + 1;
        setCurrentStreak(newStreak);
        setMaxStreak(Math.max(maxStreak, newStreak));
      } else {
        playSound('wrong');
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500); // 0.5초 후 흔들림 멈춤
        setCurrentStreak(0);
        if (gameMode === 'challenge') {
          const newLives = lives - 1;
          setLives(newLives);
          if (newLives === 0) {
            // 생명 소진 시 게임 종료
            setTimeout(() => {
              onGameEnd(newResults, Math.max(maxStreak, currentStreak));
            }, 2000);
          }
        }
      }
    } catch (error) {
      console.error('Failed to verify answer:', error);
      alert('정답 확인 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl w-full text-center space-y-4">
        <h2 className="text-2xl text-foreground">Context Hunter</h2>
        <div className="text-muted-foreground">문제를 불러오는 중...</div>
      </div>
    );
  }

  if (!questions[currentRound]) {
    return (
      <div className="max-w-2xl w-full text-center space-y-4">
        <h2 className="text-2xl text-foreground">Context Hunter</h2>
        <div className="text-destructive">문제를 불러오는데 실패했습니다. ({error})</div>
        <button onClick={onExit} className="text-primary hover:underline">메인으로 돌아가기</button>
      </div>
    );
  }

  return (
    <div className={`max-w-2xl w-full space-y-8 px-4 ${isShaking ? 'shake' : ''}`}>
      {/* 나가기 확인 다이얼로그 */}
      {showExitDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-card border border-border p-6 rounded-xl shadow-xl max-w-sm w-full mx-4 space-y-4 animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-bold text-foreground">게임을 종료하시겠습니까?</h3>
            <p className="text-sm text-muted-foreground">
              현재 진행 중인 게임 기록은 저장되지 않습니다.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowExitDialog(false)}
                className="flex-1 py-2 px-4 rounded-lg border border-input hover:bg-accent transition-colors text-sm font-medium"
              >
                취소
              </button>
              <button
                onClick={onExit}
                className="flex-1 py-2 px-4 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors text-sm font-medium"
              >
                나가기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 상단 정보: 제목, 생명(도전모드), 라운드 */}
      <div className="flex justify-between items-center relative">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowExitDialog(true)}
            className="text-muted-foreground hover:text-destructive transition-colors p-2 -ml-2 rounded-full hover:bg-destructive/10"
            title="나가기"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </button>
          <h2 className="text-xl md:text-2xl text-foreground">Context Hunter</h2>
        </div>

        <div className="flex items-center gap-4">
          {gameMode === 'challenge' && (
            <div className="flex items-center gap-1">
              {Array.from({ length: 3 }).map((_, index) => (
                <Heart
                  key={index}
                  size={20}
                  className={index < lives ? 'fill-destructive text-destructive' : 'text-muted'}
                />
              ))}
            </div>
          )}
          {gameMode === 'daily' && (
            <div className="text-muted-foreground text-sm md:text-base">
              라운드 {currentRound + 1} / {totalRounds}
            </div>
          )}
          {gameMode === 'challenge' && (
            <div className="text-muted-foreground text-sm md:text-base">
              라운드 {currentRound + 1}
            </div>
          )}
        </div>
      </div>

      {/* ... (Rest of the UI remains unchanged) ... */}

      {gameMode === 'challenge' && (
        <div className="text-center text-muted-foreground text-sm md:text-base">
          연속 정답: {currentStreak} | 최고 기록: {maxStreak}
        </div>
      )}

      {/* 문제 표시 영역 */}
      <div className="bg-card border border-border rounded-lg p-6 md:p-12 text-center">
        <div className="text-sm text-muted-foreground mb-4">암호화된 문장</div>
        <div className="text-xl md:text-2xl tracking-wide text-card-foreground break-keep">{questions[currentRound].encoded}</div>
      </div>

      {/* 입력 폼 또는 피드백 표시 */}
      {!showFeedback ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            placeholder="같은 의미의 문장을 입력하세요"
            className="w-full px-4 py-3 border-2 border-input bg-background text-foreground rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/20 focus:outline-none transition-all duration-200"
            autoFocus
            disabled={submitting}
          />
          <button
            type="submit"
            className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-bold text-lg hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:hover:scale-100 shadow-lg hover:shadow-primary/30"
            disabled={!userAnswer.trim() || submitting}
          >
            {submitting ? 'AI가 답변을 확인하는 중...' : '확인'}
          </button>
        </form>
      ) : (
        <div className="space-y-6">
          <div
            className={`p-6 rounded-lg text-center ${isCorrect ? 'bg-green-500/10' : 'bg-destructive/10'
              }`}
          >
            <div className={`text-2xl mb-2 ${isCorrect ? 'text-green-600' : 'text-destructive'}`}>
              {isCorrect ? '정답입니다! ✓' : '아쉽습니다 ✗'}
            </div>
            <div className="text-lg mb-4 text-foreground">
              유사도: {similarity}%
            </div>
            <div className="space-y-2 text-sm">
              <div className="text-muted-foreground">
                입력한 답: <span className={isCorrect ? 'text-green-600' : 'text-destructive'}>{userAnswer}</span>
              </div>
              {!isCorrect && (
                <div className="text-muted-foreground">
                  정답 예시: <span className="text-green-600">{correctAnswer}</span>
                </div>
              )}
            </div>
          </div>
          {lives > 0 && (
            <button
              onClick={handleNext}
              className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-bold text-lg hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-lg hover:shadow-primary/30"
            >
              {gameMode === 'daily' && currentRound + 1 >= totalRounds ? '결과 보기' : '다음 문제'}
            </button>
          )}
        </div>
      )}

      {/* 진행 상황 표시 (일일 모드) */}
      {gameMode === 'daily' && (
        <div className="pt-4 border-t border-border">
          <div className="flex gap-1 justify-center">
            {Array.from({ length: totalRounds }).map((_, index) => (
              <div
                key={index}
                className={`w-8 h-2 rounded-full ${index < currentRound
                  ? results[index]?.isCorrect
                    ? 'bg-green-500'
                    : 'bg-destructive'
                  : index === currentRound && showFeedback
                    ? isCorrect
                      ? 'bg-green-500'
                      : 'bg-destructive'
                    : 'bg-muted'
                  }`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
