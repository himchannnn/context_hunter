import { useState } from 'react';
import type { GameResult } from '../types';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface DailyResultScreenProps {
  results: GameResult[];
  onRestart: () => void;
}

export default function DailyResultScreen({ results, onRestart }: DailyResultScreenProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const correctCount = results.filter((r) => r.isCorrect).length;
  const totalCount = results.length;
  const percentage = Math.round((correctCount / totalCount) * 100);
  const averageSimilarity = Math.round(
    results.reduce((sum, r) => sum + r.similarity, 0) / totalCount
  );

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <div className="max-w-2xl w-full space-y-8">
      <div className="text-center space-y-4">
        <h2 className="text-2xl">일일 게임 결과</h2>
        <div className="text-6xl">{percentage}%</div>
        <div className="space-y-1">
          <div className="text-xl text-gray-600">
            {correctCount} / {totalCount} 정답
          </div>
          <div className="text-sm text-gray-500">
            평균 유사도: {averageSimilarity}%
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {results.map((result, index) => (
          <div
            key={index}
            className={`border-2 rounded-lg ${result.isCorrect
                ? 'border-green-200 bg-green-50'
                : 'border-red-200 bg-red-50'
              }`}
          >
            <button
              onClick={() => toggleExpand(index)}
              className="w-full p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">라운드 {result.round}</span>
                <span className={result.isCorrect ? 'text-green-600' : 'text-red-600'}>
                  {result.isCorrect ? '✓' : '✗'}
                </span>
                <span className="text-sm text-gray-600">
                  유사도: {result.similarity}%
                </span>
              </div>
              {expandedIndex === index ? (
                <ChevronUp size={20} className="text-gray-400" />
              ) : (
                <ChevronDown size={20} className="text-gray-400" />
              )}
            </button>

            {expandedIndex === index && (
              <div className="px-4 pb-4 space-y-2 text-sm border-t pt-4">
                <div className="text-gray-500">문제: {result.question}</div>
                <div className={result.isCorrect ? 'text-green-600' : 'text-red-600'}>
                  입력: {result.userAnswer}
                </div>
                <div className="text-green-600">정답 예시: {result.correctAnswer}</div>
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={onRestart}
        className="w-full py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
      >
        메인으로 돌아가기
      </button>
    </div>
  );
}
