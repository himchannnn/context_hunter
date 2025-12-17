import { useState } from 'react';
import { API_BASE_URL } from '../lib/api';

interface SignupScreenProps {
    onLoginClick: () => void;
    onBack?: () => void;
}

export default function SignupScreen({ onLoginClick, onBack }: SignupScreenProps) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // 회원가입 폼 제출 핸들러 (unchanged)
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.detail || 'Signup failed');
            }

            setSuccess(true);
            setTimeout(() => {
                onLoginClick();
            }, 2000);
        } catch (err: any) {
            setError(err.message);
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
                <div>
                    <h2 className="mt-4 text-center text-xl font-extrabold text-foreground">
                        회원가입
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

                    {success && (
                        <div className="text-green-600 text-sm text-center">
                            계정이 생성되었습니다! 로그인 페이지로 이동합니다...
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-primary-foreground bg-primary hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary shadow-lg hover:shadow-primary/30"
                        >
                            가입하기
                        </button>
                    </div>
                </form>

                <div className="text-center">
                    <button
                        onClick={onLoginClick}
                        className="w-full flex justify-center py-3 px-4 border-2 border-input text-sm font-bold rounded-xl text-foreground bg-card hover:bg-accent hover:text-accent-foreground hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring"
                    >
                        이미 계정이 있으신가요? 로그인
                    </button>
                </div>
            </div>
        </div>
    );
}
