import { useState, useEffect, useRef } from 'react';
import type { GameResult } from '../types';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { createNote, updateDailyProgress } from '../lib/api';
import { useAuth } from '../context/AuthContext';

interface DailyResultScreenProps {
  results: GameResult[];
  onRetry: () => void;
  onHome: () => void;
}

export default function DailyResultScreen({ results, onRetry, onHome }: DailyResultScreenProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [addedNotes, setAddedNotes] = useState<Set<string>>(new Set());
  const updateAttempted = useRef(false);

  const correctCount = results.filter((r) => r.isCorrect).length;
  const totalCount = results.length;
  const isClear = totalCount > 0; // 문제를 풀기만 하면 클리어 처리 (4/5 조건 제거)

  const { user, refreshUser } = useAuth();

  // Credit Awarded State
  const [creditsEarned, setCreditsEarned] = useState<number>(0);

  useEffect(() => {
    const handleProgress = async () => {
      if (isClear && !updateAttempted.current && results.length > 0) {
        updateAttempted.current = true;
        const domain = results[0].question.category;
        if (domain) {
          try {
            const date = new Date().toISOString().split('T')[0];
            const token = localStorage.getItem('token');
            const response = await updateDailyProgress(token, date, domain);

            if (response && response.credits_awarded && response.credits_awarded > 0) {
              setCreditsEarned(response.credits_awarded);
              // alert is optional now if we show UI, but user asked for "message in result window"
              // Keeping alert off or customized? User said "result window content".
              // Let's keep alert for now or remove if UI is sufficient? 
              // "결과창에 크레딧 지급을 했음을 알려주는 내용이 있었으면 좋겠음" implies UI text.
              // alert(`🎉 '${domain}' 분야 클리어! ${response.credits_awarded} 크레딧을 획득했습니다!`); 
              // Let's remove alert to be cleaner, or keep as fallback? 
              // User disliked "claim button", so auto-award + UI badge is best.
              await refreshUser();
            } else {
              await refreshUser();
            }

          } catch (e) {
            console.error("Failed to update daily progress", e);
          }
        }
      }
    };
    handleProgress();
  }, [isClear, results]);

  // 오답노트에 추가 핸들러
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
      console.error('Failed to add note:', error);
      alert('오답노트 추가 실패');
    }
  };

  return (
    <div className="max-w-2xl w-full mx-auto p-4 md:p-6">
      {/* 결과 요약 카드 */}
      <div className="bg-card rounded-xl shadow-lg p-6 md:p-8 mb-8 text-center border border-border">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">오늘의 학습 결과</h2>
        <div className="text-4xl md:text-6xl font-bold text-primary mb-4">
          {correctCount} / {totalCount}
        </div>
        {creditsEarned > 0 && (
          <div className="mb-4 animate-bounce">
            <span className="bg-yellow-100 text-yellow-800 text-lg font-bold px-4 py-2 rounded-full border border-yellow-300 shadow-sm flex items-center justify-center gap-2 w-fit mx-auto">
              <span>💎</span> {creditsEarned} 크레딧 획득!
            </span>
          </div>
        )}
        <p className="text-muted-foreground text-sm md:text-base">
          {correctCount === totalCount
            ? '완벽합니다! 모든 문제를 맞추셨어요.'
            : '수고하셨습니다! 틀린 문제를 복습해보세요.'}
        </p>
      </div>

      {/* 문제별 상세 결과 리스트 */}
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

            {/* 상세 내용 (확장 시 표시) */}
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

      {/* 하단 버튼 */}
      <div className="flex flex-col md:flex-row gap-4">
        <button
          onClick={onHome}
          className="flex-1 py-4 px-4 border-2 border-input rounded-xl text-foreground font-bold hover:bg-accent hover:text-accent-foreground hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
        >
          홈으로
        </button>
        <button
          onClick={async () => {
            const emojiResult = results.map(r => r.isCorrect ? '🟩' : '🟥').join('');
            const link = window.location.origin;
            const text = `Context Hunter [Daily]\nScore: ${correctCount}/${totalCount}\n\n${emojiResult}\n\n문맥을 파악하는 힘, Context Hunter!\n당신의 문해력을 테스트해보세요.\n`;

            try {
              if (navigator.share) {
                await navigator.share({
                  title: 'Context Hunter Result',
                  text: text,
                });
              } else {
                throw new Error('Web Share API not supported');
              }
            } catch (err) {
              try {
                const isProd = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
                let shareText = text;
                if (isProd) {
                  shareText += `\n👉 ${link}`;
                }

                if (navigator.clipboard && navigator.clipboard.writeText) {
                  await navigator.clipboard.writeText(shareText);
                  alert('결과가 클립보드에 복사되었습니다! 친구들에게 공유해보세요.');
                } else {
                  const textArea = document.createElement("textarea");
                  textArea.value = shareText;
                  document.body.appendChild(textArea);
                  textArea.focus();
                  textArea.select();
                  document.execCommand('copy');
                  document.body.removeChild(textArea);
                  alert('결과가 클립보드에 복사되었습니다! 친구들에게 공유해보세요.');
                }
              } catch (clipboardErr) {
                console.error('Share failed:', clipboardErr);
                alert('공유하기에 실패했습니다.');
              }
            }
          }}
          className="flex-1 py-4 px-4 bg-secondary text-secondary-foreground rounded-xl font-bold hover:bg-secondary/80 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
        >
          결과 공유하기 📤
        </button>
        <button
          onClick={onRetry}
          className="flex-1 py-4 px-4 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-lg hover:shadow-primary/30"
        >
          다시 하기
        </button>
      </div>
    </div>
  );
}
