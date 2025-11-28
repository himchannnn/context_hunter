import type { GameMode } from '../types';

interface MainScreenProps {
  onSelectMode: (mode: GameMode) => void;
}

export default function MainScreen({ onSelectMode }: MainScreenProps) {
  return (
    <div className="max-w-2xl w-full text-center space-y-12">
      <div className="space-y-4">
        <h1 className="text-6xl tracking-tight">Context Hunter</h1>
        <p className="text-gray-500">문맥을 찾는 사람</p>
      </div>

      <div className="bg-gray-50 rounded-lg p-8 space-y-4 text-left">
        <h2 className="text-xl">게임 방법</h2>
        <ul className="space-y-2 text-gray-600">
          <li>• 암호화된 문장이 주어집니다</li>
          <li>• 문장을 보고 해석한 후 같은 의미의 문장을 입력하세요</li>
          <li>• 연령층에 맞는 문장이 제공됩니다</li>
          <li>• AI가 답변의 정확도를 판단합니다</li>
        </ul>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg text-gray-700">모드 선택</h3>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => onSelectMode('daily')}
            className="flex-1 max-w-xs p-8 border-2 border-gray-900 rounded-lg hover:bg-gray-900 hover:text-white transition-colors duration-200"
          >
            <div className="text-2xl mb-2">일일</div>
            <div className="text-sm opacity-70">10개의 문제</div>
          </button>
          <button
            onClick={() => onSelectMode('challenge')}
            className="flex-1 max-w-xs p-8 border-2 border-gray-900 rounded-lg hover:bg-gray-900 hover:text-white transition-colors duration-200"
          >
            <div className="text-2xl mb-2">도전</div>
            <div className="text-sm opacity-70">3번 틀릴 때까지</div>
          </button>
        </div>
      </div>
    </div>
  );
}
