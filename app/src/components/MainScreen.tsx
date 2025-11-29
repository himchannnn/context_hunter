import { useState, useEffect } from 'react';
import type { GameMode } from '../types';
import { useAuth } from '../context/AuthContext';
import { fetchRankings, type RankingEntry } from '../lib/api';

interface MainScreenProps {
  onSelectMode: (mode: GameMode) => void;
  onOpenNotes: () => void;
}

export default function MainScreen({ onSelectMode, onOpenNotes }: MainScreenProps) {
  const { user } = useAuth();

  return (
    <div className="max-w-2xl w-full text-center space-y-8 md:space-y-12 px-4 pb-8">
      {/* 타이틀 섹션 */}
      <div className="space-y-4">
        <h1 className="text-4xl md:text-6xl tracking-tight text-foreground">Context Hunter</h1>
        <p className="text-muted-foreground">문맥을 찾는 사람</p>
      </div>

      {/* 게임 설명 섹션 */}
      <div className="bg-card border border-border rounded-lg p-6 md:p-8 space-y-4 text-left">
        <h2 className="text-xl text-card-foreground">게임 방법</h2>
        <ul className="space-y-2 text-muted-foreground text-sm md:text-base">
          <li>• 암호화된 문장이 주어집니다</li>
          <li>• 문장을 보고 해석한 후 같은 의미의 문장을 입력하세요</li>
          <li>• 연령층에 맞는 문장이 제공됩니다</li>
          <li>• AI가 답변의 정확도를 판단합니다</li>
        </ul>
      </div>

      {/* 모드 선택 섹션 */}
      <div className="space-y-4">
        <h3 className="text-lg text-foreground">모드 선택</h3>
        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <button
            onClick={() => onSelectMode('daily')}
            className="flex-1 w-full md:max-w-xs p-6 md:p-8 border-2 border-primary rounded-xl hover:bg-primary hover:text-primary-foreground hover:scale-105 active:scale-95 transition-all duration-200 text-foreground shadow-sm hover:shadow-xl"
          >
            <div className="text-2xl mb-2 font-bold">일일</div>
            <div className="text-sm opacity-90">10개의 문제</div>
          </button>
          <button
            onClick={() => onSelectMode('challenge')}
            className="flex-1 w-full md:max-w-xs p-6 md:p-8 border-2 border-primary rounded-xl hover:bg-primary hover:text-primary-foreground hover:scale-105 active:scale-95 transition-all duration-200 text-foreground shadow-sm hover:shadow-xl"
          >
            <div className="text-2xl mb-2 font-bold">도전</div>
            <div className="text-sm opacity-90">3번 틀릴 때까지</div>
          </button>
        </div>
      </div>

      {/* 오답노트 버튼 (로그인한 사용자만 표시) */}
      {user && !user.is_guest && (
        <div>
          <button
            onClick={onOpenNotes}
            className="text-muted-foreground hover:text-foreground underline"
          >
            오답노트 보기
          </button>
        </div>
      )}

      {/* 명예의 전당 (Mini Leaderboard) */}
      <div className="w-full max-w-md mx-auto mt-8">
        <h3 className="text-lg font-bold text-foreground mb-4 flex items-center justify-center gap-2">
          <span>🏆</span> 명예의 전당 <span>🏆</span>
        </h3>
        <MiniLeaderboard />
      </div>

      {/* 푸터 */}
      <footer className="mt-16 pt-8 border-t border-border text-center text-sm text-muted-foreground">
        <p>&copy; 2024 Context Hunter. All rights reserved.</p>
        <div className="flex justify-center gap-4 mt-2">
          <a href="#" className="hover:text-foreground transition-colors">이용약관</a>
          <a href="#" className="hover:text-foreground transition-colors">개인정보처리방침</a>
          <a href="#" className="hover:text-foreground transition-colors">문의하기</a>
        </div>
      </footer>
    </div>
  );
}

function MiniLeaderboard() {
  const [topRankers, setTopRankers] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const load = async () => {
      if (user && !user.is_guest) { // Only fetch if logged in
        try {
          const data = await fetchRankings();
          // 점수 내림차순 정렬 후 상위 3명만
          const sorted = data.sort((a, b) => b.score - a.score).slice(0, 3);
          setTopRankers(sorted);
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
        setTopRankers([]);
      }
    };
    load();
  }, [user]);

  if (loading) return <div className="text-sm text-muted-foreground">랭킹 불러오는 중...</div>;
  if (!user || user.is_guest) return <div className="text-sm text-muted-foreground">로그인 후 랭킹을 볼 수 있습니다.</div>;
  if (topRankers.length === 0) return <div className="text-sm text-muted-foreground">아직 랭킹이 없습니다.</div>;

  return (
    <div className="bg-card/50 rounded-lg border border-border p-4 shadow-sm">
      <div className="space-y-3">
        {topRankers.map((ranker, index) => (
          <div key={index} className="flex items-center justify-between p-2 rounded bg-background/50">
            <div className="flex items-center gap-3">
              <div className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${index === 0 ? 'bg-yellow-100 text-yellow-700' :
                  index === 1 ? 'bg-gray-100 text-gray-700' :
                    'bg-orange-100 text-orange-700'
                }`}>
                {index + 1}
              </div>
              <span className="font-medium text-sm">{ranker.nickname}</span>
            </div>
            <span className="text-sm font-bold text-primary">{ranker.score}점</span>
          </div>
        ))}
      </div>
    </div>
  );
}
