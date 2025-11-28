import { useState, useEffect } from 'react';
import type { GameResult, Difficulty } from '../types';
import { saveGuestbook, fetchRankings, type RankingEntry } from '../lib/api';

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
  const [nickname, setNickname] = useState('');
  const [showGuestbook, setShowGuestbook] = useState(false);
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [loadingRankings, setLoadingRankings] = useState(false);
  const [saving, setSaving] = useState(false);

  const correctCount = results.filter((r) => r.isCorrect).length;

  useEffect(() => {
    loadRankings();
  }, [difficulty]);

  const loadRankings = async () => {
    setLoadingRankings(true);
    try {
      const data = await fetchRankings(difficulty);
      setRankings(data);
    } catch (error) {
      console.error('Failed to load rankings:', error);
    } finally {
      setLoadingRankings(false);
    }
  };

  const handleSaveGuestbook = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nickname.trim()) return;

    setSaving(true);
    try {
      await saveGuestbook({
        nickname: nickname.trim(),
        score: correctCount,
        maxStreak,
        difficulty,
      });

      setShowGuestbook(true);
      await loadRankings();
    } catch (error) {
      console.error('Failed to save guestbook:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl w-full space-y-8">
      <div className="text-center space-y-4">
        <h2 className="text-2xl">도전 모드 결과</h2>
        <div className="text-6xl">{correctCount}</div>
        <div className="space-y-1">
          <div className="text-xl text-gray-600">정답 개수</div>
          <div className="text-sm text-gray-500">최대 연속 정답: {maxStreak}개</div>
        </div>
      </div>

      {!showGuestbook ? (
        <form onSubmit={handleSaveGuestbook} className="space-y-4">
          <div className="text-center text-gray-600 mb-4">
            기록을 남기시겠습니까?
          </div>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="닉네임을 입력하세요"
            maxLength={20}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-gray-900 focus:outline-none"
            autoFocus
            disabled={saving}
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 disabled:opacity-50"
              disabled={!nickname.trim() || saving}
            >
              {saving ? '저장 중...' : '기록 남기기'}
            </button>
            <button
              type="button"
              onClick={() => setShowGuestbook(true)}
              className="px-6 py-3 border-2 border-gray-900 rounded-lg hover:bg-gray-100 transition-colors duration-200"
              disabled={saving}
            >
              건너뛰기
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <h3 className="text-xl text-center">랭킹</h3>

          {loadingRankings ? (
            <div className="text-center text-gray-500">랭킹을 불러오는 중...</div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 max-h-96 overflow-y-auto">
              {rankings.length === 0 ? (
                <div className="text-center text-gray-500 py-4">
                  아직 기록이 없습니다
                </div>
              ) : (
                rankings.map((entry, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-3 rounded-lg ${index < 3 ? 'bg-yellow-100' : 'bg-white'
                      }`}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-lg w-8">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                      </span>
                      <span>{entry.nickname}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-600">
                        정답: {entry.score}개
                      </span>
                      <span className="text-gray-500">
                        연속: {entry.maxStreak}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      <button
        onClick={onRestart}
        className="w-full py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
      >
        메인으로 돌아가기
      </button>
    </div>
  );
}
