interface TermsScreenProps {
    onBack: () => void;
}

export default function TermsScreen({ onBack }: TermsScreenProps) {
    return (
        <div className="max-w-2xl w-full px-4 pb-8 text-left">
            <button
                onClick={onBack}
                className="mb-6 text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
                ← 돌아가기
            </button>

            <h1 className="text-3xl font-bold mb-8">이용약관</h1>

            <div className="bg-card border border-border rounded-lg p-6 md:p-8 space-y-6 text-sm md:text-base h-[60vh] overflow-y-auto">
                <section className="space-y-2">
                    <h2 className="text-xl font-bold">제1조 (목적)</h2>
                    <p className="text-muted-foreground">
                        본 약관은 Context Hunter(이하 "회사")가 제공하는 인터넷 관련 서비스(이하 "서비스")를 이용함에 있어 사이버 몰과 이용자의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
                    </p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-xl font-bold">제2조 (용어의 정의)</h2>
                    <p className="text-muted-foreground">
                        1. "서비스"란 구현되는 단말기(PC, 휴대형단말기 등의 각종 유무선 장치를 포함)와 상관없이 회원이 이용할 수 있는 Context Hunter 및 관련 제반 서비스를 의미합니다.<br />
                        2. "회원"이라 함은 회사의 서비스에 접속하여 이 약관에 따라 회사가 제공하는 서비스를 이용하는 고객을 말합니다.<br />
                        3. "게스트"라 함은 회원가입 없이 서비스를 이용하는 자를 말하며, 일부 기능에 제한이 있을 수 있습니다.
                    </p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-xl font-bold">제3조 (서비스의 제공)</h2>
                    <p className="text-muted-foreground">
                        회사는 다음과 같은 업무를 수행합니다.<br />
                        1. 문맥 맞추기 게임 및 학습 콘텐츠 제공<br />
                        2. 개인화된 오답 노트 및 랭킹 서비스<br />
                        3. 기타 회사가 정하는 업무
                    </p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-xl font-bold">제4조 (면책조항)</h2>
                    <p className="text-muted-foreground">
                        1. 회사는 AI가 생성한 문제 및 평가 결과의 완전무결성을 보장하지 않으며, 학습 보조 도구로서의 역할만 수행합니다.<br />
                        2. 회사는 천재지변 또는 이에 준하는 불가항력으로 인하여 서비스를 제공할 수 없는 경우에는 서비스 제공에 관한 책임이 면제됩니다.
                    </p>
                </section>

                <p className="text-xs text-muted-foreground pt-4 border-t border-border">
                    본 약관은 2025년 12월 11일부터 시행됩니다.
                </p>
            </div>
        </div>
    );
}
