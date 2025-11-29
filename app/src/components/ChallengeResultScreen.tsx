import { useState, useEffect, useRef } from 'react';
import type { GameResult, Difficulty } from '../types';
import { saveGuestbook, fetchRankings, type RankingEntry, createNote } from '../lib/api';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface ChallengeResultScreenProps {
  results: GameResult[];
  maxStreak: number;
  difficulty: Difficulty;
  onRestart: () => void;
}

export default function ChallengeResultScreen({
  results,
  maxStreak,
  difficulty,
  onRestart
}: ChallengeResultScreenProps) {
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [loadingRankings, setLoadingRankings] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [addedNotes, setAddedNotes] = useState<Set<string>>(new Set());

  const { user } = useAuth();

  const correctCount = results.filter((r) => r.isCorrect).length;

  // 컴포넌트 마운트 시 랭킹 로드 및 자동 저장 시도
  useEffect(() => {
    console.log('ChallengeResultScreen mounted. Difficulty:', difficulty);
    loadRankings();
    if (user && !user.is_guest) {
      handleAutoSaveGuestbook();
    }
  }, [user]); // difficulty 의존성 제거 (랭킹은 통합됨)

  // 랭킹 로드 후 내 랭킹으로 스크롤
  useEffect(() => {
    if (rankings.length > 0) {
      setTimeout(() => {
        const userEntry = document.getElementById('user-rank-entry');
        if (userEntry) {
          userEntry.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 1000);
    }
  }, [rankings]);

  // 랭킹 데이터 불러오기
  const loadRankings = async () => {
    setLoadingRankings(true);
    try {
      console.log('Fetching global rankings');
      const data = await fetchRankings();
      console.log('Rankings loaded:', data);
      setRankings(data);
    } catch (error) {
      console.error('Failed to load rankings:', error);
    } finally {
      setLoadingRankings(false);
    }
  };

  // 로그인 사용자 자동 저장 핸들러
  const handleAutoSaveGuestbook = async () => {
    if (!user || user.is_guest) return;

    try {
      await saveGuestbook({
        nickname: user.username,
        score: correctCount,
        max_streak: maxStreak,
        difficulty,
      });
      await loadRankings();
    } catch (error) {
      console.error('Failed to auto-save guestbook:', error);
    }
  };

  // 오답노트 추가 핸들러
  const handleAddToNote = async (questionId: string, userAnswer: string) => {
    if (addedNotes.has(questionId)) return;

    try {
      const token = localStorage.getItem('token');
      if (token) {
        await createNote(questionId, userAnswer, token);
        setAddedNotes(prev => new Set(prev).add(questionId));
        alert('오답노트에 추가되었습니다!');
      } else {
        alert('로그인이 필요합니다.');
      }
    } catch (error) {
      console.error(error);
      alert('오답노트 추가 실패');
    }
  };

  return (
    <div className="max-w-2xl w-full space-y-8 px-4">
      {/* 결과 요약 섹션 */}
      <div className="text-center space-y-4">
        <h2 className="text-xl md:text-2xl text-foreground">도전 모드 결과</h2>
        <div className="text-4xl md:text-6xl text-primary">{correctCount}</div>
        <div className="space-y-1">
          <div className="text-lg md:text-xl text-muted-foreground">정답 개수</div>
          <div className="text-sm text-muted-foreground">최대 연속 정답: {maxStreak}개</div>
        </div>
      </div>

      {/* 상세 결과 리스트 */}
      <div className="space-y-4 mb-8">
        {results.map((result, index) => (
          <div
            key={index}
            className={`bg-card rounded-lg shadow transition-all duration-200 border border-border ${expandedIndex === index ? 'ring-2 ring-primary' : ''
              }`}
          >
            <button
              onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
              className="w-full flex items-center justify-between p-4 text-left"
            >
              <div className="flex items-center space-x-4">
                <span
                  className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full font-bold ${result.isCorrect
                    ? 'bg-green-500/20 text-green-600'
                    : 'bg-destructive/20 text-destructive'
                    }`}
                >
                  {index + 1}
                </span>
                <div>
                  <div className="font-medium text-foreground break-all">
                    {result.question.encoded}
                  </div>
                  <div className={`text-sm ${result.isCorrect ? 'text-green-600' : 'text-destructive'}`}>
                    {result.isCorrect ? '정답' : '오답'}
                  </div>
                </div>
              </div>
              {expandedIndex === index ? (
                <ChevronUp className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              )}
            </button>

            {expandedIndex === index && (
              <div className="px-4 pb-4 border-t border-border mt-2 pt-4">
                <div className="grid gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground block mb-1">내가 쓴 답:</span>
                    <span className={result.isCorrect ? 'text-green-700' : 'text-destructive'}>
                      {result.userAnswer}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block mb-1">정답:</span>
                    <span className="text-foreground">{result.question.correct_meaning}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block mb-1">유사도:</span>
                    <span className="text-primary font-medium">
                      {result.similarity}%
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block mb-1">정답률:</span>
                    <span className="text-foreground">{result.question.success_rate}%</span>
                  </div>
                  {!result.isCorrect && !user?.is_guest && (
                    <button
                      onClick={() => handleAddToNote(result.question.id, result.userAnswer)}
                      disabled={addedNotes.has(result.question.id)}
                      className={`mt-2 w-full py-2 px-4 border border-transparent text-sm font-medium rounded-md text-primary-foreground focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring ${addedNotes.has(result.question.id)
                          ? 'bg-muted text-muted-foreground cursor-not-allowed'
                          : 'bg-primary hover:bg-primary/90'
                        }`}
                    >
                      {addedNotes.has(result.question.id) ? '추가됨' : '오답노트에 추가'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 랭킹 표시 (게스트는 등록 불가, 로그인 유저는 자동 등록됨) */}
      <div className="space-y-4">
        <h3 className="text-xl text-center text-foreground">🏆 글로벌 랭킹</h3>

        {loadingRankings ? (
          <div className="text-center text-muted-foreground">랭킹을 불러오는 중...</div>
        ) : (
          <div className="bg-muted rounded-lg p-4 space-y-2 max-h-96 overflow-y-auto">
            {rankings.length === 0 ? (
              <div className="text-center text-muted-foreground py-4">
                아직 기록이 없습니다
              </div>
            ) : (
              rankings.map((entry, index) => {
                const isCurrentUser = user && entry.nickname === user.username;
                return (
                  <div
                    key={index}
                    id={isCurrentUser ? 'user-rank-entry' : undefined}
                    className={`flex items-center justify-between p-3 rounded-lg border ${isCurrentUser
                      ? 'bg-primary/10 border-primary'
                      : index < 3
                        ? 'bg-yellow-500/10 border-transparent'
                        : 'bg-card border-transparent'
                      }`}
                  >
                    <div className="flex items-center gap-4 text-foreground">
                      <span className="text-lg w-8 font-bold">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                      </span>
                      <span className={isCurrentUser ? 'font-bold text-primary' : ''}>
                        {entry.nickname} {isCurrentUser && '(나)'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-muted-foreground">
                        정답: <span className="text-foreground font-medium">{entry.score}</span>
                      </span>
                      <span className="text-muted-foreground">
                        연속: {entry.max_streak}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {user?.is_guest && (
          <div className="text-center text-sm text-muted-foreground mt-4 bg-muted/50 p-3 rounded-lg">
            로그인하면 랭킹에 이름을 올릴 수 있습니다!
          </div>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <button
          onClick={onRestart}
          className="flex-1 py-4 bg-secondary text-secondary-foreground rounded-xl font-bold hover:bg-secondary/80 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
        >
          메인으로 돌아가기
        </button>
        <button
          onClick={() => window.location.reload()} // Simple reload for restart or pass a restart handler
          className="flex-1 py-4 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-lg hover:shadow-primary/30"
        >
          다시 하기
        </button>
      </div>
    </div>
  );
}
