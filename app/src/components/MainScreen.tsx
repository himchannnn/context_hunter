import { useState, useEffect } from 'react';
import type { GameMode } from '../types';
import { useAuth } from '../context/AuthContext';
import { fetchRankings, type RankingEntry } from '../lib/api';
import { ShoppingBag, Palette, BookOpen } from 'lucide-react';

interface MainScreenProps {
  onSelectMode: (mode: GameMode) => void;
  onOpenNotes: () => void;
  onTerms: () => void;
  onPrivacy: () => void;
  onContact: () => void;
  onShop: () => void;
  onTheme: () => void;
}

export default function MainScreen({ onSelectMode, onOpenNotes, onTerms, onPrivacy, onContact, onShop, onTheme }: MainScreenProps) {
  const { user } = useAuth();
  // ... (keep existing code up to button section)
  // Replacing button section:

  return (
    <div className="max-w-2xl w-full mx-auto text-center space-y-8 md:space-y-12 px-4 pb-8">
      {/* ... keeping previous sections ... */}

      {/* 타이틀 섹션 */}
      <div className="space-y-4">
        <h1 className="text-4xl md:text-6xl tracking-tight font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
          Context Hunter
        </h1>
      </div>

      {/* 게임 설명 섹션 */}
      <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-6 md:p-8 space-y-4 text-left shadow-lg">
        <h2 className="text-xl font-bold text-card-foreground flex items-center gap-2">
          🎯 게임 방법
        </h2>
        <ul className="space-y-3 text-muted-foreground text-sm md:text-base">
          <li className="flex items-start gap-2">
            <span className="bg-blue-100 text-blue-600 rounded-full w-5 h-5 flex items-center justify-center text-xs mt-0.5">1</span>
            <span>다양한 분야의 문장을 읽고 문맥을 파악하세요</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="bg-blue-100 text-blue-600 rounded-full w-5 h-5 flex items-center justify-center text-xs mt-0.5">2</span>
            <span>주어진 문장과 비슷한 의미의 문장을 입력하세요</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="bg-blue-100 text-blue-600 rounded-full w-5 h-5 flex items-center justify-center text-xs mt-0.5">3</span>
            <span>AI가 당신의 문해력을 측정합니다</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="bg-blue-100 text-blue-600 rounded-full w-5 h-5 flex items-center justify-center text-xs mt-0.5">4</span>
            <span>일일 도전 각 분야 완료 시 10 크레딧을 부여합니다</span>
          </li>
        </ul>
      </div>

      {/* 모드 선택 섹션 */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => onSelectMode('daily')}
            className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 group"
          >
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
              <span className="text-2xl">📅</span>
            </div>
            <div className="text-xl font-bold text-green-700 mb-1">일일 도전</div>
            <div className="text-sm text-green-600/80">매일 새로운 6개 분야</div>
          </button>

          <button
            onClick={() => onSelectMode('challenge')}
            className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-2xl hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 group"
          >
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-orange-200 transition-colors">
              <span className="text-2xl">⚡</span>
            </div>
            <div className="text-xl font-bold text-orange-700 mb-1">무한 도전</div>
            <div className="text-sm text-orange-600/80">한계에 도전하세요</div>
          </button>
        </div>
      </div>

      {/* 사용자 기능 (오답노트, 상점, 테마) - 게스트 숨김 */}
      {user && !user.is_guest && (
        <div className="flex justify-center gap-4">
          <button
            onClick={onOpenNotes}
            className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-50 transition-colors text-gray-600 hover:text-blue-600"
          >
            <div className="p-2 bg-gray-100 rounded-lg">
              <BookOpen className="w-6 h-6" />
            </div>
            <span className="text-xs font-medium">오답노트</span>
          </button>

          <button
            onClick={onShop}
            className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-50 transition-colors text-gray-600 hover:text-purple-600"
          >
            <div className="p-2 bg-gray-100 rounded-lg">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <span className="text-xs font-medium">상점</span>
          </button>

          <button
            onClick={onTheme}
            className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-50 transition-colors text-gray-600 hover:text-pink-600"
          >
            <div className="p-2 bg-gray-100 rounded-lg">
              <Palette className="w-6 h-6" />
            </div>
            <span className="text-xs font-medium">테마</span>
          </button>
        </div>
      )}

      {/* 명예의 전당 (Mini Leaderboard) */}
      <div className="w-full max-w-md mx-auto mt-8">
        <MiniLeaderboard />
      </div>

      {/* 푸터 */}
      <footer className="mt-16 pt-8 border-t border-border text-center text-sm text-muted-foreground">
        <p>&copy; 2025 Context Hunter. All rights reserved.</p>
        <div className="flex justify-center gap-4 mt-2">
          <button onClick={onTerms} className="hover:text-foreground transition-colors">이용약관</button>
          <button onClick={onPrivacy} className="hover:text-foreground transition-colors">개인정보처리방침</button>
          <button onClick={onContact} className="hover:text-foreground transition-colors">문의하기</button>
        </div>
      </footer>
    </div>
  );
}

function MiniLeaderboard() {
  const [topRankers, setTopRankers] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      // 누구나 랭킹 볼 수 있음
      try {
        const data = await fetchRankings();
        // 점수 내림차순 정렬 (score DESC, max_streak DESC)
        // Backend should do sorting, but let's double check or sort here
        const sorted = data.sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          return b.max_streak - a.max_streak;
        }).slice(0, 3);
        setTopRankers(sorted);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className="text-sm text-muted-foreground animate-pulse">랭킹 불러오는 중...</div>;
  if (topRankers.length === 0) return <div className="text-sm text-muted-foreground bg-gray-50 p-4 rounded-lg">아직 랭킹이 없습니다. 첫 번째 주인공이 되어보세요!</div>;

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center justify-center gap-2">
        <span>🏆</span> 명예의 전당 <span>🏆</span>
      </h3>
      <div className="space-y-3">
        {topRankers.map((ranker, index) => (
          <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50/50 hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold shadow-sm ${index === 0 ? 'bg-gradient-to-br from-yellow-300 to-yellow-500 text-white' :
                index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white' :
                  'bg-gradient-to-br from-orange-300 to-orange-500 text-white'
                }`}>
                {index + 1}
              </div>
              <span className="font-medium text-gray-700">{ranker.nickname}</span>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-gray-900">{ranker.score}문제</div>
              <div className="text-xs text-gray-500">{ranker.max_streak}연속</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
