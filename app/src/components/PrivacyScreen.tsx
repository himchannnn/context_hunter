interface PrivacyScreenProps {
    onBack: () => void;
}

export default function PrivacyScreen({ onBack }: PrivacyScreenProps) {
    return (
        <div className="max-w-2xl w-full px-4 pb-8 text-left">
            <button
                onClick={onBack}
                className="mb-6 text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
                ← 돌아가기
            </button>

            <h1 className="text-3xl font-bold mb-8">개인정보처리방침</h1>

            <div className="bg-card border border-border rounded-lg p-6 md:p-8 space-y-6 text-sm md:text-base h-[60vh] overflow-y-auto">
                <section className="space-y-2">
                    <h2 className="text-xl font-bold">1. 수집하는 개인정보 항목</h2>
                    <p className="text-muted-foreground">
                        회사는 회원가입, 상담, 서비스 신청 등을 위해 아래와 같은 개인정보를 수집하고 있습니다.<br />
                        - 수집항목: 아이디(닉네임), 접속 로그, 게임 플레이 기록, 오답 노트 데이터<br />
                        - 게스트 이용 시: 임시 세션 정보(쿠키 등)만 사용하며 개인 식별 정보는 저장하지 않습니다.
                    </p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-xl font-bold">2. 개인정보의 수집 및 이용목적</h2>
                    <p className="text-muted-foreground">
                        회사는 수집한 개인정보를 다음의 목적을 위해 활용합니다.<br />
                        - 서비스 제공에 따른 콘텐츠 제공, 게임 기록 분석, 랭킹 산정<br />
                        - 회원 관리: 회원제 서비스 이용에 따른 본인확인, 개인 식별, 불량회원의 부정 이용 방지와 비인가 사용 방지
                    </p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-xl font-bold">3. 개인정보의 보유 및 이용기간</h2>
                    <p className="text-muted-foreground">
                        원칙적으로 개인정보 수집 및 이용목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다.<br />
                        단, 회원 탈퇴 시 즉시 파기하거나, 관련 법령에 의하여 보존할 필요가 있는 경우에는 법령에서 정한 일정 기간 동안 정보를 보관합니다.
                    </p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-xl font-bold">4. 이용자의 권리와 행사방법</h2>
                    <p className="text-muted-foreground">
                        이용자는 언제든지 등록되어 있는 자신의 개인정보를 조회하거나 수정할 수 있으며 가입해지를 요청할 수 있습니다.<br />
                        문의사항이 있으시면 아래 고객센터로 연락해주시면 신속하게 처리해드리겠습니다.
                    </p>
                </section>

                <p className="text-xs text-muted-foreground pt-4 border-t border-border">
                    공고일자: 2025-12-11 / 시행일자: 2025-12-11
                </p>
            </div>
        </div>
    );
}
