import React, { createContext, useContext, useRef, useEffect } from 'react';

type SoundType = 'correct' | 'wrong' | 'click';

interface SoundContextType {
    playSound: (type: SoundType) => void;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

export function SoundProvider({ children }: { children: React.ReactNode }) {
    const audioContextRef = useRef<AudioContext | null>(null);

    useEffect(() => {
        // Initialize AudioContext on user interaction if needed, but here we init lazily or on mount
        // Browsers might block auto-play until user interaction, so we'll init in playSound if null
        return () => {
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, []);

    const getAudioContext = () => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        return audioContextRef.current;
    };

    const playTone = (freq: number, type: OscillatorType, duration: number, startTime: number, vol: number = 0.1) => {
        const ctx = getAudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(vol, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + duration);
    };

    const playSound = (type: SoundType) => {
        const ctx = getAudioContext();
        // Resume context if suspended (browser policy)
        if (ctx.state === 'suspended') {
            ctx.resume();
        }

        const now = ctx.currentTime;

        switch (type) {
            case 'correct':
                // Success chime (C5 - E5 - G5)
                playTone(523.25, 'sine', 0.1, now, 0.1);       // C5
                playTone(659.25, 'sine', 0.1, now + 0.1, 0.1); // E5
                playTone(783.99, 'sine', 0.2, now + 0.2, 0.1); // G5
                break;
            case 'wrong':
                // 부드러운 불협화음 (낮은 Sine파 두 개를 섞음)
                // G3(196Hz)와 C#3(138.5Hz)는 트라이톤 관계라 미묘하게 어긋난 느낌을 줍니다.
                playTone(196, 'sine', 0.4, now, 0.15);
                playTone(138.5, 'sine', 0.4, now, 0.15);
                break;
            case 'click':
                // Short tick
                playTone(800, 'sine', 0.05, now, 0.05);
                break;
        }
    };

    return (
        <SoundContext.Provider value={{ playSound }}>
            {children}
        </SoundContext.Provider>
    );
}

export function useSound() {
    const context = useContext(SoundContext);
    if (context === undefined) {
        throw new Error('useSound must be used within a SoundProvider');
    }
    return context;
}
