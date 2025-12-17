import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../lib/api';

interface LoginScreenProps {
    onSignupClick: () => void;
    onBack?: () => void;
    onLoginSuccess?: () => void;
}

export default function LoginScreen({ onSignupClick, onBack, onLoginSuccess }: LoginScreenProps) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();

    // 로그인 폼 제출 핸들러 (unchanged)
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    username,
                    password,
                }),
            });

            if (!response.ok) {
                throw new Error('Login failed');
            }

            const data = await response.json();
            await login(data.access_token);
            if (onLoginSuccess) {
                onLoginSuccess();
            }
        } catch (err) {
            setError('아이디 또는 비밀번호가 올바르지 않습니다.');
        }
    };



    return (
        <div className="w-full flex items-center justify-center bg-background p-5 relative">
            {/* Back Button */}
            {onBack && (
                <button
                    onClick={onBack}
                    className="absolute top-3 left-3 p-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m15 18-6-6 6-6" />
                    </svg>
                </button>
            )}

            <div className="max-w-md w-full space-y-3">
                <div className="text-center">
                    <h2 className="mt-2 text-xl font-bold text-foreground">
                        환영합니다! 👋
                    </h2>
                </div>
                <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <input
                                type="text"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-input placeholder:text-muted-foreground text-foreground bg-card rounded-t-md focus:outline-none focus:ring-ring focus:border-ring focus:z-10 sm:text-sm"
                                placeholder="아이디"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>
                        <div>
                            <input
                                type="password"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-input placeholder:text-muted-foreground text-foreground bg-card rounded-b-md focus:outline-none focus:ring-ring focus:border-ring focus:z-10 sm:text-sm"
                                placeholder="비밀번호"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="text-destructive text-sm text-center">{error}</div>
                    )}

                    <div>
                        <button
                            type="submit"
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-primary-foreground bg-primary hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary shadow-lg hover:shadow-primary/30"
                        >
                            로그인
                        </button>
                    </div>
                </form>

                <div className="flex flex-col gap-4">
                    <button
                        onClick={onSignupClick}
                        className="w-full flex justify-center py-3 px-4 border-2 border-input text-sm font-bold rounded-xl text-foreground bg-card hover:bg-accent hover:text-accent-foreground hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring"
                    >
                        계정이 없으신가요? 회원가입
                    </button>
                </div>
            </div>
        </div>
    );
}
