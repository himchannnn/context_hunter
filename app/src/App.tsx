import { useState, useEffect } from 'react';
import MainScreen from './components/MainScreen';
import DifficultyScreen from './components/DifficultyScreen';
import GameScreen from './components/GameScreen';
import DailyResultScreen from './components/DailyResultScreen';
import ChallengeResultScreen from './components/ChallengeResultScreen';
import LoginScreen from './components/LoginScreen';
import SignupScreen from './components/SignupScreen';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SoundProvider } from './context/SoundContext';
import type { GameState, GameMode, Difficulty, GameResult } from './types';

import WrongAnswerNoteScreen from './components/WrongAnswerNoteScreen';
import TermsScreen from './components/TermsScreen';
import PrivacyScreen from './components/PrivacyScreen';
import ContactScreen from './components/ContactScreen';

function AppContent() {
  // 게임 상태 관리
  const [gameState, setGameState] = useState<GameState>('main');
  const [gameMode, setGameMode] = useState<GameMode>('daily');
  const [difficulty, setDifficulty] = useState<Difficulty>(1);
  const [results, setResults] = useState<GameResult[]>([]);
  const [maxStreak, setMaxStreak] = useState(0);

  // 인증 훅 사용
  const { isAuthenticated, isLoading, logout, user } = useAuth();
  const [isSignup, setIsSignup] = useState(false);

  // 랭킹 뱃지 계산
  const [userRank, setUserRank] = useState<number | null>(null);

  useEffect(() => {
    const loadUserRank = async () => {
      if (user && !user.is_guest) {
        try {
          const rankings = await import('./lib/api').then(m => m.fetchRankings());
          const rank = rankings.findIndex(r => r.nickname === user.username) + 1;
          if (rank > 0) {
            setUserRank(rank);
          } else {
            setUserRank(null);
          }
        } catch (error) {
          console.error('Failed to load user rank:', error);
        }
      }
    };
    loadUserRank();
  }, [user, gameState]); // gameState가 변경될 때마다(게임 종료 후 등) 랭킹 업데이트 확인

  // 로그아웃 시 게임 상태 초기화
  useEffect(() => {
    if (!isAuthenticated) {
      setGameState('main');
      setResults([]);
      setMaxStreak(0);
      setGameMode('daily');
    }
  }, [isAuthenticated]);

  // 게임 모드 선택 핸들러
  const selectMode = (mode: GameMode) => {
    setGameMode(mode);
    setGameState('difficulty');
  };

  // 게임 시작 핸들러
  const startGame = (selectedDifficulty: Difficulty) => {
    setDifficulty(selectedDifficulty);
    setResults([]);
    setMaxStreak(0);
    setGameState('playing');
  };

  // 게임 종료 핸들러
  const endGame = (gameResults: GameResult[], streak: number) => {
    setResults(gameResults);
    setMaxStreak(streak);
    setGameState('result');
  };

  // 게임 리셋 (메인 화면으로 이동)
  const resetGame = () => {
    setGameState('main');
    setResults([]);
    setMaxStreak(0);
  };

  // 로딩 중 표시
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  // 비로그인 상태일 때 로그인/회원가입 화면 표시
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen transition-colors duration-200">
        {isSignup ?
          <SignupScreen onLoginClick={() => setIsSignup(false)} /> :
          <LoginScreen onSignupClick={() => setIsSignup(true)} />
        }
      </div>
    );
  }

  // 랭킹에 따른 뱃지 및 스타일 결정
  const getRankBadge = (rank: number) => {
    if (rank === 1) return { icon: '🥇', style: 'from-yellow-300 to-yellow-500 shadow-yellow-500/50' };
    if (rank === 2) return { icon: '🥈', style: 'from-slate-300 to-slate-500 shadow-slate-500/50' };
    if (rank === 3) return { icon: '🥉', style: 'from-orange-300 to-orange-500 shadow-orange-500/50' };
    if (rank <= 5) return { icon: '🏅', style: 'from-blue-400 to-indigo-500 shadow-blue-500/50' };
    if (rank <= 10) return { icon: '🎖️', style: 'from-purple-400 to-pink-500 shadow-purple-500/50' };
    if (rank <= 20) return { icon: '💠', style: 'from-cyan-400 to-blue-500 shadow-cyan-500/50' };
    if (rank <= 50) return { icon: '✨', style: 'from-emerald-400 to-teal-500 shadow-emerald-500/50' };
    if (rank <= 100) return { icon: '🎗️', style: 'from-rose-400 to-red-500 shadow-rose-500/50' };
    return null;
  };

  const rankBadge = userRank ? getRankBadge(userRank) : null;

  // 메인 앱 렌더링
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 relative transition-colors duration-200">
      {/* 상단 헤더: 사용자 정보, 로그아웃 */}
      <div className="absolute top-4 right-4 flex items-center gap-4 z-50">
        <div className="flex items-center gap-2">
          {/* 프로필 아이콘 (기본 아이콘 + 랭킹 뱃지) */}
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200 overflow-hidden">
              {/* 기본 유저 아이콘 (SVG) */}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-gray-500">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            {/* 랭킹 뱃지 (조건부 렌더링) */}
            {rankBadge && (
              <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-br ${rankBadge.style} flex items-center justify-center shadow-lg border border-white text-xs`}>
                {rankBadge.icon}
              </div>
            )}
          </div>

          <div className="flex flex-col items-end">
            <span className="text-sm font-bold text-gray-800">
              {user?.is_guest ? 'Guest' : user?.username}
            </span>
            {userRank && (
              <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">
                Rank #{userRank}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={logout}
          className="text-sm text-red-500 hover:text-red-700 font-medium transition-colors"
        >
          Logout
        </button>
      </div>

      {/* 게임 상태에 따른 화면 전환 */}
      {gameState === 'main' && (
        <MainScreen
          onSelectMode={selectMode}
          onOpenNotes={() => setGameState('notes')}
          onTerms={() => setGameState('terms')}
          onPrivacy={() => setGameState('privacy')}
          onContact={() => setGameState('contact')}
        />
      )}
      {gameState === 'notes' && <WrongAnswerNoteScreen onBack={() => setGameState('main')} />}
      {gameState === 'terms' && <TermsScreen onBack={() => setGameState('main')} />}
      {gameState === 'privacy' && <PrivacyScreen onBack={() => setGameState('main')} />}
      {gameState === 'contact' && <ContactScreen onBack={() => setGameState('main')} />}
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
          onExit={resetGame}
        />
      )}
      {gameState === 'result' && gameMode === 'daily' && (
        <DailyResultScreen
          results={results}
          onRetry={() => startGame(difficulty)}
          onHome={resetGame}
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

export default function App() {
  return (
    <AuthProvider>
      <SoundProvider>
        <AppContent />
      </SoundProvider>
    </AuthProvider>
  );
}
