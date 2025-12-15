

interface ThemeBackgroundProps {
    themeId: string;
}

// Helper to generate random positions for particles
const generateParticles = (count: number) => {
    return Array.from({ length: count }).map((_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        animationDuration: `${Math.random() * 5 + 5}s`,
        animationDelay: `${Math.random() * 5}s`,
        opacity: Math.random() * 0.5 + 0.3,
        size: Math.random() * 1.5 + 0.5, // rem
        rotation: Math.random() * 360,
    }));
};

export default function ThemeBackground({ themeId }: ThemeBackgroundProps) {
    if (themeId === 'default') return null;

    // Spring: Floating flowers/petals (Falling Down)
    if (themeId === 'spring') {
        return (
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                {generateParticles(25).map((p) => (
                    <div
                        key={p.id}
                        className="absolute text-rose-400 opacity-80"
                        style={{
                            left: p.left,
                            top: '-10%',
                            fontSize: `${p.size}rem`,
                            animation: `spring-fall ${p.animationDuration} infinite linear ${p.animationDelay}`
                        }}
                    >
                        🌸
                    </div>
                ))}
                <style>{`
          @keyframes spring-fall {
            0% { transform: translateY(0) rotate(0deg); opacity: 0; }
            10% { opacity: 0.8; }
            100% { transform: translateY(110vh) rotate(360deg); opacity: 0; }
          }
        `}</style>
            </div>
        );
    }

    // Summer: Realistic Ocean Waves & Radiant Sun (Fixed to screen)
    if (themeId === 'summer') {
        return (
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 bg-sky-300/20">
                {/* Radiant Sun with rotating rays */}
                <div className="absolute top-10 right-10 w-24 h-24 text-yellow-500 animate-[spin_20s_linear_infinite]">
                    {/* Sun Core */}
                    <div className="absolute inset-0 rounded-full bg-yellow-400 blur-md shadow-[0_0_40px_rgba(250,204,21,0.6)] animate-pulse"></div>
                    {/* Rays (SVG representation) */}
                    <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <line
                                key={i}
                                x1="50" y1="50" x2="50" y2="100"
                                stroke="currentColor"
                                strokeWidth="4"
                                strokeLinecap="round"
                                className="opacity-50"
                                transform={`rotate(${i * 45} 50 50) translate(0 25)`}
                            />
                        ))}
                    </svg>
                </div>

                {/* Lens flare / Glare */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-yellow-200/10 rounded-full blur-[100px] pointer-events-none"></div>

                {/* Layered Waves (Fixed to bottom) */}
                <div className="absolute bottom-0 left-0 right-0 h-48 w-full overflow-hidden">
                    {/* Wave 1 (Back) */}
                    <div className="absolute bottom-0 left-0 w-[200%] h-48 opacity-40 animate-[wave_15s_linear_infinite]"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 1200 120' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'%3E%3Cpath d='M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z' fill='%2360a5fa' opacity='0.5' /%3E%3C/svg%3E")`, backgroundRepeat: 'repeat-x', backgroundSize: '50% 100%' }}>
                    </div>
                    {/* Wave 2 (Middle) */}
                    <div className="absolute bottom-[-10px] left-0 w-[200%] h-48 opacity-60 animate-[wave_10s_linear_infinite]"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 1200 120' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'%3E%3Cpath d='M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z' fill='%233b82f6' opacity='0.7' /%3E%3C/svg%3E")`, backgroundRepeat: 'repeat-x', backgroundSize: '50% 100%', animationDirection: 'reverse' }}>
                    </div>
                    {/* Wave 3 (Front) */}
                    <div className="absolute bottom-[-20px] left-0 w-[200%] h-48 opacity-80 animate-[wave_7s_linear_infinite]"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 1200 120' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'%3E%3Cpath d='M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z' fill='%232563eb' /%3E%3C/svg%3E")`, backgroundRepeat: 'repeat-x', backgroundSize: '50% 100%' }}>
                    </div>
                </div>

                <style>{`
            @keyframes wave {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
          `}</style>
            </div>
        );
    }

    // Autumn: Falling leaves
    if (themeId === 'autumn') {
        return (
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                {generateParticles(20).map((p) => (
                    <div
                        key={p.id}
                        className="absolute text-orange-500/60"
                        style={{
                            left: p.left,
                            top: '-10%',
                            fontSize: `${p.size}rem`,
                            opacity: p.opacity,
                            animation: `fall-sway ${p.animationDuration} infinite linear ${p.animationDelay}`
                        }}
                    >
                        {['🍁', '🍂'][Math.floor(Math.random() * 2)]}
                    </div>
                ))}
                <style>{`
            @keyframes fall-sway {
              0% { transform: translateY(0) translateX(0) rotate(0deg); opacity: 0; }
              10% { opacity: 1; }
              100% { transform: translateY(110vh) translateX(50px) rotate(360deg); opacity: 0; }
            }
          `}</style>
            </div>
        );
    }

    // Winter: Falling Snowflakes (Emoji)
    if (themeId === 'winter') {
        return (
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 bg-slate-100/10">
                {generateParticles(30).map((p) => (
                    <div
                        key={p.id}
                        className="absolute text-slate-300 opacity-80"
                        style={{
                            left: p.left,
                            top: '-10%',
                            fontSize: `${p.size}rem`,
                            animation: `snowfall-flake ${Math.random() * 5 + 5}s infinite linear ${p.animationDelay}`
                        }}
                    >
                        ❄️
                    </div>
                ))}
                <style>{`
        @keyframes snowfall-flake {
            0% { transform: translateY(0) rotate(0deg); opacity: 0.8; }
            100% { transform: translateY(110vh) rotate(180deg); opacity: 0.2; }
        }
        `}</style>
            </div>
        );
    }

    // Cyber: Binary Code Rain (Vertical Column, denser)
    if (themeId === 'cyber') {
        return (
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 bg-black/90">
                {Array.from({ length: 30 }).map((_, i) => (
                    <div
                        key={i}
                        className="absolute flex flex-col items-center text-green-500/60 font-mono text-xs leading-none select-none opacity-0"
                        style={{
                            left: `${i * 3.5}%`, // Denser columns
                            top: '-50%',
                            animation: `matrix-fall ${Math.random() * 5 + 5}s infinite linear ${Math.random() * 5}s`
                        }}
                    >
                        {Array.from({ length: 30 }).map((_, j) => (
                            <span key={j} className="my-0.5">
                                {Math.random() > 0.5 ? '1' : '0'}
                            </span>
                        ))}
                    </div>
                ))}
                <style>{`
            @keyframes matrix-fall {
                0% { transform: translateY(-20%); opacity: 0; }
                10% { opacity: 1; }
                90% { opacity: 1; }
                100% { transform: translateY(150vh); opacity: 0; }
            }
            `}</style>
            </div>
        )
    }

    // Animal: Varied Emojis, Tilted (High Opacity, High Count)
    if (themeId === 'animal') {
        const animals = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯'];
        return (
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 opacity-40">
                {generateParticles(40).map((p, i) => (
                    <div
                        key={p.id}
                        className="absolute"
                        style={{
                            left: p.left,
                            top: `${Math.random() * 100}%`,
                            fontSize: '2.5rem',
                            transform: `rotate(${Math.random() * 40 - 20}deg)`
                        }}
                    >
                        {animals[i % animals.length]}
                    </div>
                ))}
            </div>
        )
    }

    // Fruit: Varied Emojis, Tilted (High Opacity, High Count)
    if (themeId === 'fruit') {
        const fruits = ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍒', '🍑'];
        return (
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 opacity-40">
                {generateParticles(40).map((p, i) => (
                    <div
                        key={p.id}
                        className="absolute"
                        style={{
                            left: p.left,
                            top: `${Math.random() * 100}%`,
                            fontSize: '2.5rem',
                            transform: `rotate(${Math.random() * 40 - 20}deg)`
                        }}
                    >
                        {fruits[i % fruits.length]}
                    </div>
                ))}
            </div>
        )
    }

    // SF: TRON Style (Moving Grid + Vertical Data Beams)
    if (themeId === 'sf') {
        return (
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 bg-[#050510]">
                {/* Moving Perspective Grid */}
                <div className="absolute inset-0 opacity-50"
                    style={{
                        backgroundImage: 'linear-gradient(rgba(0, 255, 255, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 255, 0.2) 1px, transparent 1px)',
                        backgroundSize: '40px 40px',
                        perspective: '500px',
                        transform: 'rotateX(60deg) scale(2.5)',
                        transformOrigin: 'top center',
                        animation: 'grid-scroll 1000ms linear infinite'
                    }}
                />

                {/* Horizon Glow */}
                <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-cyan-500/20 to-transparent blur-xl"></div>

                {/* Vertical Data Beams (Lasers) */}
                {Array.from({ length: 12 }).map((_, i) => (
                    <div
                        key={i}
                        className="absolute w-[2px] bg-cyan-400 box-shadow-[0_0_15px_#22d3ee]"
                        style={{
                            left: `${Math.random() * 100}%`,
                            bottom: '-20%',
                            height: '40%',
                            opacity: 0,
                            boxShadow: '0 0 10px #22d3ee, 0 0 20px #22d3ee', // Stronger Neon Glow
                            animation: `laser-shot-vert ${Math.random() * 1 + 0.8}s infinite linear ${Math.random() * 2}s`
                        }}
                    />
                ))}
                <style>{`
               @keyframes grid-scroll {
                 0% { background-position: 0 0; }
                 100% { background-position: 0 40px; }
               }
               @keyframes laser-shot-vert {
                 0% { transform: translateY(0); opacity: 0; }
                 10% { opacity: 1; }
                 100% { transform: translateY(-120vh); opacity: 0; }
               }
             `}</style>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#050510] opacity-80 pointer-events-none"></div>
            </div>
        )
    }

    // Space: Stars (Good as is)
    if (themeId === 'space') {
        return (
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 bg-black">
                {generateParticles(50).map((p) => (
                    <div
                        key={p.id}
                        className="absolute bg-white rounded-full animate-pulse"
                        style={{
                            left: p.left,
                            top: `${Math.random() * 100}%`,
                            width: `${Math.random() * 3}px`,
                            height: `${Math.random() * 3}px`,
                            opacity: Math.random(),
                            animationDuration: `${Math.random() * 3 + 1}s`
                        }}
                    />
                ))}
                <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
            </div>
        )
    }

    return null;
}
