import { useState, useEffect } from 'react';
import { getNotes } from '../lib/api';
import { ArrowLeft, BookOpen, TrendingUp, Users, Coffee, Cpu, Globe } from 'lucide-react';

interface Note {
    id: number;
    question_id: string;
    user_answer: string;
    created_at: string;
    question: {
        id: string;
        encoded: string;
        correct_meaning: string;
        success_rate: number;
        category: string;
    };
}

interface WrongAnswerNoteScreenProps {
    onBack: () => void;
}

// Domain Mapping (copied from DomainSelector but simplified for display)
const getCategoryInfo = (category: string) => {
    const normalize = category.toLowerCase();
    switch (normalize) {
        case 'politics': return { label: '정치', icon: <BookOpen size={16} />, color: 'bg-red-100 text-red-700 border-red-200' };
        case 'economy': return { label: '경제', icon: <TrendingUp size={16} />, color: 'bg-blue-100 text-blue-700 border-blue-200' };
        case 'society': return { label: '사회', icon: <Users size={16} />, color: 'bg-green-100 text-green-700 border-green-200' };
        case 'life/culture': return { label: '생활/문화', icon: <Coffee size={16} />, color: 'bg-orange-100 text-orange-700 border-orange-200' };
        case 'it/science': return { label: 'IT/과학', icon: <Cpu size={16} />, color: 'bg-purple-100 text-purple-700 border-purple-200' };
        case 'world': return { label: '세계', icon: <Globe size={16} />, color: 'bg-cyan-100 text-cyan-700 border-cyan-200' };
        default: return { label: '일반', icon: <BookOpen size={16} />, color: 'bg-gray-100 text-gray-700 border-gray-200' };
    }
};

export default function WrongAnswerNoteScreen({ onBack }: WrongAnswerNoteScreenProps) {
    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // 오답노트 데이터 불러오기
    useEffect(() => {
        const fetchNotes = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    setError('로그인이 필요합니다.');
                    setLoading(false);
                    return;
                }
                const data = await getNotes(token);
                setNotes(data);
            } catch (err) {
                setError('오답노트를 불러오는데 실패했습니다.');
            } finally {
                setLoading(false);
            }
        };

        fetchNotes();
    }, []);

    if (loading) {
        return <div className="text-center p-8">로딩 중...</div>;
    }

    if (error) {
        return (
            <div className="text-center p-8">
                <div className="text-destructive mb-4">{error}</div>
                <button onClick={onBack} className="text-primary hover:text-primary/80 font-bold underline transition-colors duration-200">
                    돌아가기
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="flex items-center mb-8">
                <button onClick={onBack} className="mr-4 p-2 hover:bg-muted rounded-full transition-colors duration-200">
                    <ArrowLeft size={24} className="text-foreground" />
                </button>
                <h2 className="text-2xl font-bold text-foreground">오답노트</h2>
            </div>

            {notes.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                    아직 오답노트에 추가된 문제가 없습니다.
                </div>
            ) : (
                <div className="grid gap-6">
                    {notes.map((note) => {
                        const categoryInfo = getCategoryInfo(note.question.category || 'general');
                        return (
                            <div key={note.id} className="bg-card rounded-lg shadow p-6 border border-border">
                                <div className="mb-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="text-sm text-muted-foreground">문제</div>
                                        {/* Category Badge */}
                                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${categoryInfo.color}`}>
                                            {categoryInfo.icon}
                                            {categoryInfo.label}
                                        </div>
                                    </div>
                                    <div className="text-lg font-medium text-card-foreground">{note.question.encoded}</div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="bg-destructive/10 p-4 rounded-md">
                                        <div className="text-sm text-destructive mb-1">내가 쓴 답</div>
                                        <div className="text-foreground">{note.user_answer}</div>
                                    </div>
                                    <div className="bg-green-500/10 p-4 rounded-md">
                                        <div className="text-sm text-green-600 mb-1">정답</div>
                                        <div className="text-foreground">{note.question.correct_meaning}</div>
                                    </div>
                                </div>

                                <div className="mt-4 text-right text-sm text-muted-foreground">
                                    정답률: {note.question.success_rate}% | 추가일: {new Date(note.created_at).toLocaleDateString()}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
