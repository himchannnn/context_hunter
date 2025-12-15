import { useState } from 'react';
import { Palette, ArrowLeft, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { equipTheme } from '../lib/api';
import { THEMES } from './ShopScreen'; // Reuse definitions

interface ThemeScreenProps {
    onBack: () => void;
}

export default function ThemeScreen({ onBack }: ThemeScreenProps) {
    const { user, refreshUser } = useAuth();
    const [equipping, setEquipping] = useState<string | null>(null);

    const owned = user?.owned_themes.split(',') || ['default'];
    const currentTheme = user?.equipped_theme || 'default';

    // Include 'default' theme
    const allThemes = [
        { id: 'default', name: '기본', icon: '🎨', bgClass: 'bg-white', description: '깔끔한 기본 테마' },
        ...THEMES
    ];

    // Filter only owned themes
    const myThemes = allThemes.filter(t => owned.includes(t.id) || t.id === 'default');

    const handleEquip = async (themeId: string) => {
        if (!user || equipping || currentTheme === themeId) return;

        setEquipping(themeId);
        try {
            const token = localStorage.getItem('token');
            if (token) {
                await equipTheme(token, themeId);
                await refreshUser();
            }
        } catch (e) {
            alert("장착 실패: " + e);
        } finally {
            setEquipping(null);
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto p-4 space-y-6">
            <div className="flex items-center justify-start">
                <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft className="w-6 h-6" />
                </button>
            </div>

            <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold flex items-center justify-center gap-2">
                    <Palette className="w-8 h-8 text-pink-600" />
                    테마 설정
                </h2>
                <p className="text-muted-foreground">보유한 테마를 선택하여 분위기를 바꿔보세요.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {myThemes.map((theme) => {
                    const isEquipped = currentTheme === theme.id;
                    return (
                        <div
                            key={theme.id}
                            onClick={() => handleEquip(theme.id)}
                            className={`relative border rounded-xl p-4 shadow-sm transition-all flex flex-col items-center gap-3 overflow-hidden cursor-pointer
                        ${isEquipped ? 'border-pink-500 bg-pink-50 ring-2 ring-pink-200' : 'border-gray-200 bg-white hover:shadow-md hover:border-pink-300'}
                    `}
                        >
                            {/* 미리보기 (배경) */}
                            <div className={`w-full h-24 rounded-lg flex items-center justify-center text-4xl shadow-inner ${theme.bgClass}`}>
                                {theme.icon}
                            </div>

                            <div className="text-center">
                                <h3 className="font-bold text-gray-800">{theme.name}</h3>
                                <p className="text-xs text-gray-500">{theme.description}</p>
                            </div>

                            <div className="mt-auto w-full">
                                {isEquipped ? (
                                    <div className="w-full py-2 bg-pink-600 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-1">
                                        <Check className="w-4 h-4" />
                                        사용 중
                                    </div>
                                ) : (
                                    <div className="w-full py-2 bg-gray-100 text-gray-600 rounded-lg font-medium text-sm flex items-center justify-center gap-1 group-hover:bg-pink-100 group-hover:text-pink-600 transition-colors">
                                        {equipping === theme.id ? '장착 중...' : '장착하기'}
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    );
}
