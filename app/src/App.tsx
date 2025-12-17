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
import DomainSelector, { type Domain } from './components/DomainSelector';
import ShopScreen, { THEMES } from './components/ShopScreen';
import ThemeScreen from './components/ThemeScreen';
import ThemeBackground from './components/ThemeBackground';
import UserProfileModal from './components/UserProfileModal';
import { User } from 'lucide-react';

const getThemeClass = (themeId: string) => {
  const theme = THEMES.find(t => t.id === themeId);
  return theme ? theme.bgClass : 'bg-white';
};



function AppContent() {
  const { isAuthenticated, isLoading, logout, user, login } = useAuth();

  // Game State
  const [gameState, setGameState] = useState<GameState>('main');
  const [gameMode, setGameMode] = useState<GameMode>('daily');
  const [difficulty, setDifficulty] = useState<Difficulty>(1);
  const [results, setResults] = useState<GameResult[]>([]);
  const [maxStreak, setMaxStreak] = useState(0);
  const [selectedDomain, setSelectedDomain] = useState<string | undefined>(undefined);

  // UI State
  const [clearedDomains, setClearedDomains] = useState<string[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);

  // Auth Modal State
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [authView, setAuthView] = useState<'login' | 'signup'>('login');

  // Load User Rank
  useEffect(() => {
    const loadUserRank = async () => {
      if (user && !user.is_guest) {
        try {
          const { fetchRankings } = await import('./lib/api');
          const rankings = await fetchRankings();
          const rank = rankings.findIndex(r => r.nickname === user.username) + 1;
          setUserRank(rank > 0 ? rank : null);
        } catch (error) {
          console.error('Failed to load user rank:', error);
        }
      }
    };
    loadUserRank();
  }, [user, gameState]);

  // Reset check on logout
  useEffect(() => {
    if (!isAuthenticated) {
      if (gameState !== 'main') {
        setGameState('main');
      }
      setResults([]);
      setMaxStreak(0);
      setGameMode('daily');
    }
  }, [isAuthenticated, gameState]);

  // Load daily progress for Domain Selector
  useEffect(() => {
    if (gameState === 'domainSelect' && isAuthenticated) {
      const fetchProgress = async () => {
        try {
          const date = new Date().toISOString().split('T')[0];
          const token = localStorage.getItem('token');
          if (token) {
            const { getDailyProgress } = await import('./lib/api');
            const data = await getDailyProgress(token, date);
            if (data && data.cleared_domains) {
              setClearedDomains(data.cleared_domains.split(','));
            } else {
              setClearedDomains([]);
            }
          }
        } catch (e) {
          console.error("Failed to fetch daily progress", e);
        }
      };
      fetchProgress();
    }
  }, [gameState, isAuthenticated]);

  // Handlers
  const selectMode = async (mode: GameMode) => {
    // If not authenticated, auto-login as guest first
    if (!isAuthenticated) {
      try {
        const { guestLogin } = await import('./lib/api');
        const data = await guestLogin();
        await login(data.access_token);
        // After login, state will update. 
        // We need to wait for auth to complete/re-render? 
        // Actually login() updates context state. 
        // Proceeding to set game mode might work if state update is fast or we assume success.
      } catch (e) {
        alert("게스트 로그인 실패: " + e);
        return;
      }
    }

    setGameMode(mode);
    if (mode === 'daily') {
      setGameState('domainSelect');
    } else {
      startGame(1, 'random');
    }
  };

  const handleDomainSelect = (domain: Domain) => {
    startGame(1, domain);
  };

  const startGame = (selectedDifficulty: Difficulty, domain?: string) => {
    setDifficulty(selectedDifficulty);
    setSelectedDomain(domain);
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

  // Render logic helpers


  // Rendering
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  // NOTE: Removed isAuthenticated check here to allow Main Screen access

  const themeClass = (user?.equipped_theme && user.equipped_theme !== 'default')
    ? getThemeClass(user.equipped_theme)
    : 'bg-white';



  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 relative transition-colors duration-500 bg-cover bg-center ${themeClass}`}>
      {/* Header / User Info */}
      <div className="absolute top-4 right-4 flex items-center gap-3 z-50">
        {isAuthenticated ? (
          <>
            <button
              onClick={() => setShowProfileModal(true)}
              className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm border border-gray-100 hover:bg-white hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 group-hover:bg-blue-200 transition-colors">
                <User size={16} />
              </div>
              <span className="font-semibold text-sm text-gray-700">
                {user?.is_guest ? 'Guest' : user?.username}
              </span>
            </button>
          </>
        ) : (
          <button
            onClick={() => {
              setAuthView('login');
              setShowAuthModal(true);
            }}
            className="p-2 bg-white/80 backdrop-blur-sm hover:bg-blue-50 text-blue-600 rounded-full shadow-sm border border-blue-100 transition-all"
            title="로그인 / 회원가입"
          >
            <User size={20} />
          </button>
        )}
      </div>

      {/* Rich Theme Background */}
      {user?.equipped_theme && (
        <ThemeBackground themeId={user.equipped_theme} />
      )}

      {/* Main Content Switch */}
      <div className="w-full max-w-4xl z-10 relative">
        {gameState === 'main' && (
          <MainScreen
            onSelectMode={selectMode}
            onOpenNotes={() => setGameState('notes')}
            onTerms={() => setGameState('terms')}
            onPrivacy={() => setGameState('privacy')}
            onContact={() => setGameState('contact')}
            onShop={() => setGameState('shop')}
            onTheme={() => setGameState('theme')}
          />
        )}

        {gameState === 'difficulty' && (
          <DifficultyScreen
            onSelectDifficulty={(diff) => startGame(diff, 'random')}
            onBack={resetGame}
          />
        )}

        {gameState === 'domainSelect' && (
          <DomainSelector
            onSelectDomain={handleDomainSelect}
            onBack={resetGame}
            clearedDomains={clearedDomains}
          />
        )}

        {gameState === 'playing' && (
          <GameScreen
            gameMode={gameMode}
            difficulty={difficulty}
            domain={selectedDomain}
            onGameEnd={endGame}
            onExit={resetGame}
          />
        )}

        {gameState === 'result' && gameMode === 'daily' && (
          <DailyResultScreen
            results={results}
            onRetry={resetGame}
            onHome={resetGame}
          />
        )}

        {gameState === 'result' && gameMode === 'challenge' && (
          <ChallengeResultScreen
            results={results}
            maxStreak={maxStreak}
            difficulty={difficulty}
            onRestart={() => startGame(difficulty, 'random')}
            onHome={resetGame}
          />
        )}

        {gameState === 'notes' && (
          <WrongAnswerNoteScreen onBack={resetGame} />
        )}

        {gameState === 'shop' && (
          <ShopScreen onBack={resetGame} />
        )}

        {gameState === 'theme' && (
          <ThemeScreen onBack={resetGame} />
        )}

        {gameState === 'terms' && <TermsScreen onBack={resetGame} />}
        {gameState === 'privacy' && <PrivacyScreen onBack={resetGame} />}
        {gameState === 'contact' && <ContactScreen onBack={resetGame} />}
      </div>

      {/* Auth Modal Overlay */}
      {/* Auth Dropdown */}
      {showAuthModal && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowAuthModal(false)}
          />
          <div className="fixed top-16 right-4 z-50 w-80 bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 animate-in slide-in-from-top-2 fade-in duration-200">
            {authView === 'login' ? (
              <LoginScreen
                onSignupClick={() => setAuthView('signup')}
                onBack={() => setShowAuthModal(false)}
                onLoginSuccess={() => setShowAuthModal(false)}
              />
            ) : (
              <SignupScreen
                onLoginClick={() => setAuthView('login')}
                onBack={() => setAuthView('login')}
              />
            )}
          </div>
        </>
      )}


      {/* User Profile Modal */}
      {showProfileModal && (
        <UserProfileModal
          user={user}
          userRank={userRank}
          onLogout={logout}
          onClose={() => setShowProfileModal(false)}
        />
      )}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
        .animate-scaleIn { animation: scaleIn 0.2s ease-out; }
      `}</style>
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
