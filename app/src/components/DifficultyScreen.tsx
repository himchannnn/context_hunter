import type { Difficulty } from '../types';
import { ChevronLeft } from 'lucide-react';

interface DifficultyScreenProps {
  onSelectDifficulty: (difficulty: Difficulty) => void;
  onBack: () => void;
}

export default function DifficultyScreen({ onSelectDifficulty, onBack }: DifficultyScreenProps) {
  return (
    <div className="max-w-2xl w-full text-center space-y-8 md:space-y-12 px-4">
      {/* 뒤로가기 버튼 */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft size={20} />
        뒤로가기
      </button>

      {/* 타이틀 */}
      <div className="space-y-4">
        <h2 className="text-3xl md:text-4xl tracking-tight text-foreground">연령층 선택</h2>
        <p className="text-muted-foreground">자신에게 맞는 연령층을 선택하세요</p>
      </div>

      {/* 난이도 선택 버튼 */}
      <div className="flex flex-col md:flex-row gap-4 justify-center">
        <button
          onClick={() => onSelectDifficulty(1)}
          className="px-8 py-6 md:py-8 border-2 border-primary rounded-xl text-foreground hover:bg-primary hover:text-primary-foreground hover:scale-105 active:scale-95 transition-all duration-200 shadow-sm hover:shadow-xl font-bold text-lg"
        >
          청년층
        </button>
        <button
          onClick={() => onSelectDifficulty(2)}
          className="px-8 py-6 md:py-8 border-2 border-primary rounded-xl text-foreground hover:bg-primary hover:text-primary-foreground hover:scale-105 active:scale-95 transition-all duration-200 shadow-sm hover:shadow-xl font-bold text-lg"
        >
          중장년층
        </button>
        <button
          onClick={() => onSelectDifficulty(3)}
          className="px-8 py-6 md:py-8 border-2 border-primary rounded-xl text-foreground hover:bg-primary hover:text-primary-foreground hover:scale-105 active:scale-95 transition-all duration-200 shadow-sm hover:shadow-xl font-bold text-lg"
        >
          노년층
        </button>
      </div>
    </div>
  );
}
