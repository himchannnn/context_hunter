import type { Difficulty } from '../types';
import { ChevronLeft } from 'lucide-react';

interface DifficultyScreenProps {
  onStartGame: (difficulty: Difficulty) => void;
  onBack: () => void;
}

export default function DifficultyScreen({ onStartGame, onBack }: DifficultyScreenProps) {
  return (
    <div className="max-w-2xl w-full text-center space-y-12">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ChevronLeft size={20} />
        뒤로가기
      </button>

      <div className="space-y-4">
        <h2 className="text-4xl tracking-tight">연령층 선택</h2>
        <p className="text-gray-500">자신에게 맞는 연령층을 선택하세요</p>
      </div>

      <div className="flex gap-4 justify-center">
        <button
          onClick={() => onStartGame(1)}
          className="px-6 py-8 border-2 border-gray-900 rounded-lg hover:bg-gray-900 hover:text-white transition-colors duration-200"
        >
          청년층
        </button>
        <button
          onClick={() => onStartGame(2)}
          className="px-6 py-8 border-2 border-gray-900 rounded-lg hover:bg-gray-900 hover:text-white transition-colors duration-200"
        >
          중장년층
        </button>
        <button
          onClick={() => onStartGame(3)}
          className="px-6 py-8 border-2 border-gray-900 rounded-lg hover:bg-gray-900 hover:text-white transition-colors duration-200"
        >
          노년층
        </button>
      </div>
    </div>
  );
}
