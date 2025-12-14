
import React from 'react';
import { BookOpen, TrendingUp, Users, Coffee, Cpu, Globe, ArrowLeft } from 'lucide-react';

export type Domain = 'Politics' | 'Economy' | 'Society' | 'Life/Culture' | 'IT/Science' | 'World';

interface DomainSelectorProps {
    onSelectDomain: (domain: Domain) => void;
    onBack: () => void;
    clearedDomains?: string[];
}

const domains: { id: Domain; label: string; icon: React.ReactNode; color: string }[] = [
    { id: 'Politics', label: '정치', icon: <BookOpen className="w-8 h-8" />, color: 'bg-red-100 text-red-600 hover:bg-red-200' },
    { id: 'Economy', label: '경제', icon: <TrendingUp className="w-8 h-8" />, color: 'bg-blue-100 text-blue-600 hover:bg-blue-200' },
    { id: 'Society', label: '사회', icon: <Users className="w-8 h-8" />, color: 'bg-green-100 text-green-600 hover:bg-green-200' },
    { id: 'Life/Culture', label: '생활/문화', icon: <Coffee className="w-8 h-8" />, color: 'bg-orange-100 text-orange-600 hover:bg-orange-200' },
    { id: 'IT/Science', label: 'IT/과학', icon: <Cpu className="w-8 h-8" />, color: 'bg-purple-100 text-purple-600 hover:bg-purple-200' },
    { id: 'World', label: '세계', icon: <Globe className="w-8 h-8" />, color: 'bg-cyan-100 text-cyan-600 hover:bg-cyan-200' },
];

export default function DomainSelector({ onSelectDomain, onBack, clearedDomains = [] }: DomainSelectorProps) {

    // 모든 분야 클리어 여부
    const allCleared = domains.every(d => clearedDomains.includes(d.id));

    return (
        <div className="max-w-4xl mx-auto p-4 flex flex-col items-center">
            <div className="w-full flex items-center justify-between mb-8">
                <button
                    onClick={onBack}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                    <ArrowLeft className="w-6 h-6 text-gray-600" />
                </button>
                <h2 className="text-2xl font-bold text-gray-800">
                    {allCleared ? '🎉 오늘의 보상 획득! 🎉' : '분야를 선택하세요'}
                </h2>
                <div className="w-10" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 w-full max-w-2xl">
                {domains.map((domain) => {
                    const isCleared = clearedDomains.includes(domain.id);
                    return (
                        <button
                            key={domain.id}
                            onClick={() => onSelectDomain(domain.id)}
                            onClick={() => onSelectDomain(domain.id)}
                            // disabled={isCleared} // Remove disabled to allow replay
                            className={`
                relative flex flex-col items-center justify-center p-6 md:p-8 rounded-2xl
                transition-all duration-200 shadow-sm
                border-2
                ${isCleared
                                    ? `${domain.color} ring-4 ring-green-400/50 scale-[0.98] opacity-100`
                                    : `${domain.color} border-transparent hover:border-current hover:scale-105 active:scale-95 hover:shadow-md`
                                }
              `}
                        >
                            <div className="mb-3">{domain.icon}</div>
                            <span className="font-bold text-lg">{domain.label}</span>
                            {isCleared && (
                                <div className="absolute top-3 right-3 bg-green-500 text-white rounded-full p-1 shadow-md z-10 animate-in zoom-in">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
