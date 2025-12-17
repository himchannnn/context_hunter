import { User as UserIcon, LogOut, Coins, CheckCircle } from 'lucide-react';
import type { User } from '../types';

interface UserProfileModalProps {
    user: User | null;
    userRank: number | null;
    onLogout: () => void;
    onClose: () => void;
}

export default function UserProfileModal({ user, userRank, onLogout, onClose }: UserProfileModalProps) {
    if (!user) return null;

    // Rank badge helper (same logic as App.tsx)
    const getRankBadge = (rank: number) => {
        if (rank === 1) return { icon: '🥇', style: 'from-yellow-300 to-yellow-500 shadow-yellow-500/50', label: '1st Place' };
        if (rank === 2) return { icon: '🥈', style: 'from-slate-300 to-slate-500 shadow-slate-500/50', label: '2nd Place' };
        if (rank === 3) return { icon: '🥉', style: 'from-orange-300 to-orange-500 shadow-orange-500/50', label: '3rd Place' };
        if (rank <= 5) return { icon: '🏅', style: 'from-blue-400 to-indigo-500 shadow-blue-500/50', label: `Top 5 (#${rank})` };
        if (rank <= 10) return { icon: '🎖️', style: 'from-purple-400 to-pink-500 shadow-purple-500/50', label: `Top 10 (#${rank})` };
        if (rank <= 20) return { icon: '💠', style: 'from-cyan-400 to-blue-500 shadow-cyan-500/50', label: `Top 20 (#${rank})` };
        if (rank <= 50) return { icon: '✨', style: 'from-emerald-400 to-teal-500 shadow-emerald-500/50', label: `Top 50 (#${rank})` };
        if (rank <= 100) return { icon: '🎗️', style: 'from-rose-400 to-red-500 shadow-rose-500/50', label: `Top 100 (#${rank})` };
        return null;
    };

    const rankBadge = userRank ? getRankBadge(userRank) : null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-40"
                onClick={onClose}
            />

            {/* Dropdown Panel - positioned from top-right */}
            <div className="fixed top-16 right-4 z-50 w-80 bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 animate-in slide-in-from-top-2 fade-in duration-200">

                <div className="p-6 flex flex-col gap-5">

                    {/* Profile Header */}
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center shadow-inner">
                                <UserIcon className="w-8 h-8 text-blue-500" />
                            </div>
                            {rankBadge && (
                                <div
                                    className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center text-sm shadow-lg bg-gradient-to-br ${rankBadge.style}`}
                                    title={rankBadge.label}
                                >
                                    {rankBadge.icon}
                                </div>
                            )}
                        </div>
                        <div className="flex-1">
                            <h2 className="text-lg font-bold text-slate-800">{user.username}</h2>
                            <p className="text-xs text-slate-500">
                                {user.is_guest ? 'Guest Account' : 'Member'}
                            </p>
                            {rankBadge && (
                                <p className="text-xs font-semibold text-blue-600 mt-0.5">
                                    {rankBadge.label}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="w-full h-px bg-slate-200"></div>

                    {/* Stats */}
                    {/* Credits */}
                    <div className="w-full bg-amber-50 rounded-xl p-4 flex justify-between items-center border border-amber-100">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                                <Coins className="w-5 h-5" />
                            </div>
                            <div className="text-sm text-amber-800 font-bold">보유 크레딧</div>
                        </div>
                        <div className="text-2xl font-bold text-amber-600">
                            {user.credits}
                        </div>
                    </div>

                    {/* Total Solved */}
                    <div className="w-full bg-blue-50 rounded-xl p-4 flex justify-between items-center border border-blue-100">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                <CheckCircle className="w-5 h-5" />
                            </div>
                            <div className="text-sm text-blue-800 font-bold">총 푼 문제</div>
                        </div>
                        <div className="text-2xl font-bold text-blue-600">
                            {user.total_solved}
                        </div>
                    </div>

                    {/* Logout Button */}
                    <button
                        onClick={() => {
                            onLogout();
                            onClose();
                        }}
                        className="w-full py-2.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                    >
                        <LogOut className="w-4 h-4" />
                        <span>로그아웃</span>
                    </button>

                </div>
            </div>
        </>
    );
}
