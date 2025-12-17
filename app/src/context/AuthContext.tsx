import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE_URL } from '../lib/api';

import type { User } from '../types';

interface AuthContextType {
    user: User | null;
    login: (token: string) => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
    isLoading: boolean;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 인증 상태 관리 Provider
export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // 앱 시작 시 로컬 스토리지의 토큰 확인
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            fetchUser(token);
        } else {
            setIsLoading(false);
        }
    }, []);

    // 토큰으로 사용자 정보 가져오기
    const fetchUser = async (token: string) => {
        try {
            const response = await fetch(`${API_BASE_URL}/users/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const userData = await response.json();
                setUser(userData);
            } else {
                // 토큰이 유효하지 않으면 삭제
                localStorage.removeItem('token');
            }
        } catch (error) {
            console.error('Failed to fetch user', error);
            localStorage.removeItem('token');
        } finally {
            setIsLoading(false);
        }
    };

    // 로그인 처리 (토큰 저장 및 사용자 정보 갱신)
    const login = async (token: string) => {
        localStorage.setItem('token', token);
        await fetchUser(token);
    };

    // 로그아웃 처리
    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    // 유저 정보 갱신 (크레딧/테마 변경 시 호출)
    const refreshUser = async () => {
        const token = localStorage.getItem('token');
        if (token) {
            await fetchUser(token);
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, isLoading, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
}

// 인증 Context 사용을 위한 커스텀 훅
export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
