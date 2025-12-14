import React, { useState } from 'react';
import { ShoppingBag, ArrowLeft, Coins, Lock, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { buyTheme } from '../lib/api';

interface ShopScreenProps {
    onBack: () => void;
}

export interface ThemeDef {
    id: string;
    name: string;
    price: number;
    icon: string;
    bgClass: string;
    description: string;
}

export const THEMES: ThemeDef[] = [
    { id: 'spring', name: '봄', price: 100, icon: '🌸', bgClass: 'bg-gradient-to-br from-pink-100 to-rose-200', description: '따스한 봄 기운' },
    { id: 'summer', name: '여름', price: 100, icon: '🌻', bgClass: 'bg-gradient-to-br from-blue-200 to-cyan-300', description: '시원한 여름 바다' },
    { id: 'autumn', name: '가을', price: 100, icon: '🍁', bgClass: 'bg-gradient-to-br from-orange-100 to-amber-200', description: '풍요로운 가을' },
    { id: 'winter', name: '겨울', price: 100, icon: '❄️', bgClass: 'bg-gradient-to-br from-slate-200 to-blue-100', description: '포근한 겨울 눈' },
    { id: 'cyber', name: '사이버', price: 100, icon: '🤖', bgClass: 'bg-gradient-to-br from-slate-900 to-purple-900 text-white', description: '미래지향적 감성' },
    { id: 'animal', name: '동물', price: 100, icon: '🐶', bgClass: 'bg-gradient-to-br from-yellow-100 to-orange-100', description: '귀여운 동물 친구들' },
    { id: 'fruit', name: '과일', price: 100, icon: '🍓', bgClass: 'bg-gradient-to-br from-red-100 to-pink-100', description: '상큼한 과일 나라' },
    { id: 'sf', name: 'SF', price: 100, icon: '🛸', bgClass: 'bg-gradient-to-br from-indigo-900 to-blue-900 text-white', description: '신비로운 SF 세계' },
    { id: 'space', name: '우주', price: 100, icon: '🌌', bgClass: 'bg-gradient-to-br from-black to-slate-800 text-white', description: '광활한 우주' },
];

export default function ShopScreen({ onBack }: ShopScreenProps) {
    const { user, refreshUser } = useAuth();
    const [buying, setBuying] = useState<string | null>(null);

    const owned = user?.owned_themes.split(',') || ['default'];

    const handleBuy = async (themeId: string) => {
        if (!user || buying) return;
        if (user.credits < 100) {
            alert("크레딧이 부족합니다!");
            return;
        }

        if (window.confirm("100 크레딧으로 이 테마를 구매하시겠습니까?")) {
            setBuying(themeId);
            try {
                const token = localStorage.getItem('token');
                if (token) {
                    await buyTheme(token, themeId);
                    await refreshUser();
                    alert("구매 완료!");
                }
            } catch (e) {
                alert("구매 실패: " + e);
            } finally {
                setBuying(null);
            }
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto p-4 space-y-6">
            <div className="flex items-center justify-between">
                <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <div className="flex items-center gap-2 bg-yellow-100 px-4 py-2 rounded-full text-yellow-800 font-bold shadow-sm">
                    <Coins className="w-5 h-5" />
                    <span>{user?.credits || 0} 크레딧</span>
                </div>
            </div>

            <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold flex items-center justify-center gap-2">
                    <ShoppingBag className="w-8 h-8 text-purple-600" />
                    상점
                </h2>
                <p className="text-muted-foreground">테마를 모아 나만의 게임을 꾸며보세요!</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {THEMES.map((theme) => {
                    const isOwned = owned.includes(theme.id);
                    return (
                        <div key={theme.id} className="relative bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col items-center gap-3 overflow-hidden group">
                            {/* 미리보기 (배경) */}
                            <div className={`w-full h-24 rounded-lg flex items-center justify-center text-4xl shadow-inner ${theme.bgClass}`}>
                                {theme.icon}
                            </div>

                            <div className="text-center">
                                <h3 className="font-bold text-gray-800">{theme.name}</h3>
                                <p className="text-xs text-gray-500">{theme.description}</p>
                            </div>

                            <div className="mt-auto w-full">
                                {isOwned ? (
                                    <div className="w-full py-2 bg-gray-100 text-gray-500 rounded-lg font-medium text-sm flex items-center justify-center gap-1 cursor-default">
                                        <Check className="w-4 h-4" />
                                        보유중
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => handleBuy(theme.id)}
                                        disabled={!!buying}
                                        className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium text-sm shadow-md transition-colors flex items-center justify-center gap-1 active:scale-95 disabled:opacity-50">
                                        {buying === theme.id ? '구매 중...' : '100 크레딧'}
                                    </button>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    );
}
