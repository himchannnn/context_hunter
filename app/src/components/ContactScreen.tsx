import { useState } from 'react';

interface ContactScreenProps {
    onBack: () => void;
}

export default function ContactScreen({ onBack }: ContactScreenProps) {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // 실제 백엔드 연동은 없으므로 UI 상으로만 처리
        setSubmitted(true);
    };

    return (
        <div className="max-w-xl w-full px-4 pb-8 text-left">
            <button
                onClick={onBack}
                className="mb-6 text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
                ← 돌아가기
            </button>

            <h1 className="text-3xl font-bold mb-8">문의하기</h1>

            <div className="bg-card border border-border rounded-lg p-6 md:p-8 space-y-6">
                {!submitted ? (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label htmlFor="email" className="block text-sm font-medium text-foreground">
                                이메일 주소
                            </label>
                            <input
                                type="email"
                                id="email"
                                required
                                className="block w-full px-3 py-2 border border-input bg-background/50 rounded-md focus:outline-none focus:ring-2 focus:ring-primary shadow-sm sm:text-sm"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="message" className="block text-sm font-medium text-foreground">
                                문의 내용
                            </label>
                            <textarea
                                id="message"
                                required
                                rows={5}
                                className="block w-full px-3 py-2 border border-input bg-background/50 rounded-md focus:outline-none focus:ring-2 focus:ring-primary shadow-sm sm:text-sm resize-none"
                                placeholder="문의하실 내용을 자유롭게 적어주세요."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-bold rounded-md text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
                        >
                            보내기
                        </button>

                        <div className="mt-4 text-xs text-muted-foreground text-center">
                            * 보내주신 의견은 서비스 개선을 위해 소중하게 사용됩니다.
                        </div>
                    </form>
                ) : (
                    <div className="text-center py-12 space-y-4 animate-in fade-in zoom-in duration-300">
                        <div className="text-5xl mb-4">✨</div>
                        <h3 className="text-xl font-bold text-foreground">문의가 접수되었습니다!</h3>
                        <p className="text-muted-foreground">
                            소중한 의견 감사합니다.<br />
                            최대한 빠르게 답변 드리겠습니다.
                        </p>
                        <button
                            onClick={onBack}
                            className="mt-6 inline-flex justify-center py-2 px-4 border border-input rounded-md text-sm font-medium bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
                        >
                            메인으로 돌아가기
                        </button>
                    </div>
                )}
            </div>

            <div className="mt-8 p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                <h4 className="font-bold mb-2">고객센터 운영 안내</h4>
                <p>운영시간: 평일 10:00 ~ 18:00 (주말 및 공휴일 휴무)</p>
                <p>이메일: spt_contexthunter@gachon.ac.kr</p>
            </div>
        </div>
    );
}
