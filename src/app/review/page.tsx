"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, RotateCcw, Heart, Send, BookOpen, AlertCircle, Volume2 } from 'lucide-react';

interface Quiz {
    type: 'blank' | 'translate';
    question: string;
    meaning: string;
    answer: string;
    originalId: string;
    fullExpression: string;
}

export default function ReviewPage() {
    const [userId, setUserId] = useState<string | null>(null);
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [userInput, setUserInput] = useState('');
    const [loading, setLoading] = useState(true);
    const [showResult, setShowResult] = useState<null | boolean>(null);
    const [score, setScore] = useState(0);
    const [isFinished, setIsFinished] = useState(false);
    const [shaking, setShaking] = useState(false);

    const router = useRouter();

    useEffect(() => {
        const user = localStorage.getItem('engcoach_user');
        if (!user) {
            router.push('/login');
        } else {
            setUserId(user);
        }
    }, [router]);

    useEffect(() => {
        if (userId) {
            fetchQuizzes();
        }
    }, [userId]);

    const fetchQuizzes = async () => {
        if (!userId) return;
        setLoading(true);
        try {
            const res = await fetch('/api/review/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId }),
            });
            const data = await res.json();
            if (data.quizzes) {
                setQuizzes(data.quizzes);
                setLoading(false);
            } else {
                alert('노트에 저장된 표현이 부족합니다.');
                router.push('/');
            }
        } catch (error) {
            console.error('Failed to fetch quizzes:', error);
            alert('퀴즈를 생성하지 못했습니다.');
            router.push('/');
        }
    };

    const handleNext = () => {
        if (currentIdx < quizzes.length - 1) {
            setCurrentIdx(prev => prev + 1);
            setUserInput('');
            setShowResult(null);
        } else {
            setIsFinished(true);
        }
    };

    const checkAnswer = () => {
        const correctAnswer = quizzes[currentIdx].answer.toLowerCase().trim().replace(/[.,!?;:]/g, '');
        const entry = userInput.toLowerCase().trim().replace(/[.,!?;:]/g, '');

        if (entry === correctAnswer) {
            setShowResult(true);
            setScore(prev => prev + 1);
        } else {
            setShowResult(false);
            setShaking(true);
            setTimeout(() => setShaking(false), 500);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 space-y-8 bg-[#fffafa]">
                <div className="w-16 h-16 border-4 border-pink-200 border-t-pink-400 rounded-full animate-spin" />
                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">노트에서 문제를 뽑고 있어요</p>
            </div>
        );
    }

    if (isFinished) {
        return (
            <div className="min-h-screen flex items-center justify-center p-8 bg-[#fffafa]">
                <div className="premium-card p-12 max-w-lg w-full text-center space-y-8 bg-white/60">
                    <div className="w-24 h-24 bg-green-50 rounded-[2.5rem] flex items-center justify-center mx-auto border border-green-100">
                        <CheckCircle2 size={40} className="text-green-400" />
                    </div>
                    <div className="space-y-3">
                        <h2 className="text-3xl font-black text-gray-800 tracking-tight">학습 완료!</h2>
                        <p className="text-4xl font-black text-pink-500">{score} <span className="text-gray-300">/ {quizzes.length}</span></p>
                        <p className="text-gray-500 font-medium text-base leading-relaxed">
                            {score === quizzes.length ? '완벽해요! 모든 표현을 기억하고 계시네요!' : '조금 더 복습해서 완벽해져 봅시다!'}
                        </p>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                        <button
                            onClick={() => window.location.reload()}
                            className="btn-primary w-full py-4 flex items-center justify-center gap-3 text-gray-800"
                        >
                            <RotateCcw size={20} />
                            다시 도전하기
                        </button>
                        <button
                            onClick={() => router.push('/')}
                            className="w-full py-4 bg-white text-gray-500 font-bold hover:bg-gray-50 border border-gray-100 rounded-2xl"
                        >
                            홈으로 돌아가기
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const currentQuiz = quizzes[currentIdx];
    const progress = ((currentIdx + 1) / quizzes.length) * 100;

    return (
        <div className="min-h-screen py-6 md:py-12 px-4 md:px-6 flex flex-col items-center max-w-2xl mx-auto space-y-8 text-gray-800">
            <header className="w-full space-y-6">
                <div className="flex justify-between items-end">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-blue-400 mb-2">
                            <BookOpen size={18} />
                            <span className="text-[11px] font-black tracking-widest bg-blue-50 px-2 py-0.5 rounded-md">나의 노트 복습</span>
                        </div>
                        <h1 className="text-3xl font-black text-gray-800 tracking-tight">반복 학습하기</h1>
                    </div>
                    <div className="text-right">
                        <span className="text-2xl font-black text-blue-500">{currentIdx + 1}</span>
                        <span className="text-gray-400 font-bold text-lg ml-1">/ {quizzes.length}</span>
                    </div>
                </div>
                <div className="h-2 w-full bg-blue-100 rounded-full overflow-hidden p-0.5 shadow-inner">
                    <div
                        className="h-full bg-blue-400 rounded-full transition-all duration-500 ease-in-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </header>

            <main className="w-full space-y-8">
                <section className={`premium-card p-8 md:p-12 space-y-8 relative overflow-hidden bg-white/60 transition-all ${shaking ? 'animate-shake' : ''}`}>
                    <div className="space-y-6 text-center">
                        <div className="inline-block px-3 py-1 bg-amber-50 text-amber-500 rounded-lg text-xs font-black tracking-widest uppercase">
                            {currentQuiz.type === 'blank' ? '빈칸 채우기' : '영어로 말하기'}
                        </div>
                        
                        <div className="space-y-2">
                             <p className="text-gray-400 font-medium text-sm">"{currentQuiz.meaning}"</p>
                             <h2 className="text-2xl md:text-3xl font-bold text-gray-800 leading-tight">
                                {currentQuiz.question}
                             </h2>
                        </div>

                        <div className="relative">
                            <input
                                autoFocus
                                type="text"
                                value={userInput}
                                onChange={(e) => {
                                    setUserInput(e.target.value);
                                    if (showResult !== null) setShowResult(null);
                                }}
                                onKeyPress={(e) => e.key === 'Enter' && (showResult === null ? checkAnswer() : handleNext())}
                                placeholder="정답을 입력하세요..."
                                disabled={showResult === true}
                                className={`w-full bg-white px-6 py-5 rounded-2xl text-xl font-bold border-2 transition-all text-center
                                    ${showResult === true ? 'border-green-300 bg-green-50 text-green-700' : 
                                      showResult === false ? 'border-rose-300 bg-rose-50' : 
                                      'border-blue-100 focus:border-blue-300 focus:ring-4 focus:ring-blue-50 outline-none'}
                                `}
                            />
                            {showResult === true && <div className="absolute -top-3 -right-3 bg-green-400 text-white p-2 rounded-full animate-bounce"><CheckCircle2 size={24} /></div>}
                        </div>

                        {showResult === false && (
                            <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl animate-in fade-in slide-in-from-top-2">
                                <p className="text-xs font-black text-rose-400 mb-1">오답입니다. 정답은:</p>
                                <p className="text-lg font-bold text-gray-700">{currentQuiz.answer}</p>
                                <div className="mt-2 pt-2 border-t border-rose-100/50">
                                     <p className="text-[10px] font-black text-rose-300 uppercase tracking-widest mb-1">전체 문장</p>
                                     <p className="text-sm font-medium text-gray-500 italic">{currentQuiz.fullExpression}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                <div className="flex gap-4">
                    <button
                        onClick={() => router.push('/')}
                        className="px-6 py-4 rounded-2xl bg-white text-gray-500 font-bold hover:bg-gray-50 border border-gray-200 active:scale-95 transition-all flex items-center gap-2"
                    >
                        <ArrowLeft size={18} />
                        그만하기
                    </button>
                    {showResult === true || showResult === false ? (
                        <button
                            onClick={handleNext}
                            className="flex-1 btn-primary py-4 text-gray-800 text-lg font-black flex items-center justify-center gap-2"
                        >
                            다음 문제
                            <Send size={20} />
                        </button>
                    ) : (
                        <button
                            onClick={checkAnswer}
                            disabled={!userInput.trim()}
                            className="flex-1 btn-primary py-4 text-gray-800 text-lg font-black disabled:opacity-50"
                        >
                            정답 확인
                        </button>
                    )}
                </div>
            </main>
        </div>
    );
}
