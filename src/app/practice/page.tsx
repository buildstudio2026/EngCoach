"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, MessageSquare, CheckCircle2, AlertCircle, Heart, Send, ArrowLeft, Volume2, Mic, MicOff, Plus } from 'lucide-react';

interface Question {
  id: string;
  expressionId: string;
  question: string;
  meaning?: string;
  example?: string;
  targetExpression?: string;
}

export default function Practice() {
  const [userId, setUserId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showMeaning, setShowMeaning] = useState(false);
  const [showExample, setShowExample] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

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
      fetchQuestions();
    }
  }, [userId]);

  const fetchQuestions = async () => {
    if (!userId) return;
    try {
      const res = await fetch(`/api/questions?userId=${userId}`);
      const data = await res.json();
      if (Array.isArray(data)) setQuestions(data);
    } catch (error) {
      console.error('Failed to fetch questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const speakQuestion = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const speak = () => {
      const utterance = new SpeechSynthesisUtterance(questions[currentIdx].question);
      utterance.lang = 'en-US';

      const voices = window.speechSynthesis.getVoices();

      // Look for a high-quality female English voice
      const preferredVoices = [
        'Google US English',
        'Microsoft Zira',
        'Samantha',
        'Victoria',
        'Karen'
      ];

      let femaleVoice = voices.find(v =>
        v.lang.startsWith('en') && preferredVoices.some(pv => v.name.includes(pv))
      );

      // Fallback: any female English voice
      if (!femaleVoice) {
        femaleVoice = voices.find(v =>
          v.lang.startsWith('en') && (v.name.includes('Female') || v.name.includes('female'))
        );
      }

      if (femaleVoice) {
        utterance.voice = femaleVoice;
      } else {
        // Final fallback: just ensure it's English
        const enVoice = voices.find(v => v.lang.startsWith('en'));
        if (enVoice) utterance.voice = enVoice;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    };

    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = speak;
    } else {
      speak();
    }
  };

  const startListening = () => {
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('접속하신 브라우저는 음성 인식을 지원하지 않습니다.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = true; // Use interim results for a more responsive feel
    recognition.continuous = true; // Stay active
    recognitionRef.current = recognition;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }

      if (finalTranscript) {
        setAnswer(prev => prev + (prev ? ' ' : '') + finalTranscript);
      }
    };

    recognition.start();
  };

  const submitAnswer = async () => {
    if (!answer.trim() || submitting || !userId) return;
    setSubmitting(true);

    // Stop listening if active
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: questions[currentIdx].id,
          userAnswer: answer,
          userId,
        }),
      });

      if (res.ok) {
        if (currentIdx < questions.length - 1) {
          setCurrentIdx(prev => prev + 1);
          setAnswer('');
          setShowMeaning(false);
          setShowExample(false);
        } else {
          window.location.href = '/';
        }
      } else {
        const errorData = await res.json();
        alert(`오류가 발생했습니다: ${errorData.error || '답변을 등록하지 못했어요.'}`);
      }
    } catch (error) {
      console.error('Failed to submit:', error);
      alert('네트워크 오류입니다. 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !userId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 space-y-8 bg-[#fffafa]">
        <div className="w-16 h-16 border-4 border-pink-200 border-t-pink-400 rounded-full animate-spin" />
        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">회화 연습을 준비하고 있어요</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-[#fffafa]">
        <div className="premium-card p-12 max-w-lg w-full text-center space-y-8 bg-white/60">
          <div className="w-24 h-24 bg-rose-50 rounded-[2.5rem] flex items-center justify-center mx-auto border border-rose-100">
            <AlertCircle size={40} className="text-rose-400" />
          </div>
          <div className="space-y-3">
            <h2 className="text-3xl font-black text-gray-800 tracking-tight">저장된 표현이 없어요</h2>
            <p className="text-gray-500 font-medium text-base leading-relaxed">
              먼저 새로운 표현을 기록하고 연습을 시작해보세요!
            </p>
          </div>
          <button
            onClick={() => window.location.href = '/'}
            className="btn-primary w-full py-4 flex items-center justify-center gap-3 text-gray-800"
          >
            <ArrowLeft size={20} />
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  const progress = ((currentIdx + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen py-6 md:py-12 px-4 md:px-6 flex flex-col items-center max-w-4xl mx-auto space-y-8 md:space-y-12 text-gray-800">
      {/* Dynamic Header */}
      <header className="w-full space-y-8">
        <div className="flex justify-between items-end">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-pink-400 mb-2">
              <BookOpen size={18} />
              <span className="text-[11px] font-black tracking-widest bg-pink-50 px-2 py-0.5 rounded-md">집중 학습</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-gray-800 tracking-tight">실전 회화 연습</h1>
          </div>
          <div className="text-right">
            <span className="text-3xl md:text-4xl font-black text-pink-500">{currentIdx + 1}</span>
            <span className="text-gray-400 font-bold text-lg md:text-xl ml-1">/ {questions.length}</span>
          </div>
        </div>

        {/* Progress System */}
        <div className="h-3 w-full bg-pink-100 rounded-full overflow-hidden p-0.5 shadow-inner">
          <div
            className="h-full bg-pink-400 rounded-full transition-all duration-1000 ease-in-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      {/* Training Matrix */}
      <main className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <section className="premium-card p-6 md:p-12 space-y-8 md:space-y-10 relative overflow-hidden group bg-white/60">
          <div className="absolute -top-10 -right-10 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity rotate-12">
            <MessageSquare size={260} className="w-[160px] h-[160px] md:w-[260px] md:h-[260px] text-pink-500" />
          </div>

          <div className="space-y-8 md:space-y-10 relative z-10">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pr-0 md:pr-12 gap-4 sm:gap-0">
                <h3 className="text-xs font-black text-blue-400 uppercase tracking-widest px-3 py-1 bg-blue-50 rounded-lg">질문</h3>
                <div className="flex items-center gap-3">
                  <button
                    onClick={speakQuestion}
                    className={`p-2.5 rounded-xl transition-all shadow-sm ${isSpeaking ? 'bg-pink-400 text-white' : 'bg-white text-pink-400 hover:bg-pink-50 border border-pink-100'}`}
                    title="질문 듣기"
                  >
                    <Volume2 size={18} />
                  </button>
                  {questions[currentIdx].meaning && (
                    <button
                      onClick={() => setShowMeaning(!showMeaning)}
                      className="flex items-center gap-1.5 text-[11px] font-black text-gray-400 hover:text-blue-500 transition-colors bg-white px-3 py-2 rounded-xl border border-gray-100 shadow-sm"
                    >
                      <Heart size={14} className={showMeaning ? "text-blue-400" : ""} />
                      {showMeaning ? '해석 숨기기' : '해석 보기'}
                    </button>
                  )}
                </div>
              </div>
              <p className="text-xl md:text-3xl font-bold text-gray-800 leading-[1.3] tracking-tight pr-0 md:pr-12">
                "{questions[currentIdx].question}"
              </p>

              {showMeaning && questions[currentIdx].meaning && (
                <div className="mt-4 p-5 bg-blue-50/80 border border-blue-100 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center gap-2 mb-2 text-blue-500">
                    <Heart size={14} />
                    <span className="text-[10px] font-black tracking-widest">해석</span>
                  </div>
                  <p className="text-lg font-medium text-gray-700 leading-relaxed">
                    {questions[currentIdx].meaning}
                  </p>
                </div>
              )}
            </div>

            <div className="h-px w-full bg-pink-100" />
 
            {/* Answer Tip: Target Expression */}
            {questions[currentIdx].targetExpression && (
              <div className="bg-amber-50/80 border border-amber-100 rounded-2xl p-5 animate-in fade-in slide-in-from-left-4 duration-500">
                <div className="flex items-center gap-2 mb-2 text-amber-600">
                    <div className="p-1 bg-amber-200 rounded-md">
                        <Plus size={12} className="text-amber-700" />
                    </div>
                  <span className="text-[10px] font-black tracking-widest uppercase">답변 팁: 이 표현을 사용해 보세요!</span>
                </div>
                <p className="text-xl font-black text-amber-800 tracking-tight">
                  {questions[currentIdx].targetExpression}
                </p>
                <p className="text-xs font-bold text-amber-600/70 mt-1">이 표현을 사용하면 학습도가 올라갑니다.</p>
              </div>
            )}

            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
                <h3 className="text-xs font-black text-pink-400 uppercase tracking-widest px-3 py-1 bg-pink-50 rounded-lg">나의 답변</h3>
                <div className="flex gap-4">
                  {questions[currentIdx].example && (
                    <button
                      onClick={() => setShowExample(!showExample)}
                      className="flex items-center gap-1.5 text-[11px] font-black text-gray-400 hover:text-pink-500 transition-colors bg-white px-3 py-2 rounded-xl border border-gray-100 shadow-sm"
                    >
                      <Heart size={14} className={showExample ? "text-pink-400" : ""} />
                      {showExample ? '모범 답안 숨기기' : '모범 답안 보기'}
                    </button>
                  )}
                  <span className="text-[10px] font-black text-gray-500 tracking-widest px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl hidden sm:inline-block shadow-sm">직접 입력 혹은 음성 기록</span>
                </div>
              </div>

              {showExample && questions[currentIdx].example && (
                <div className="p-6 bg-pink-50/80 border border-pink-100 rounded-2xl animate-in fade-in zoom-in-95 duration-500">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-pink-300 rounded-md">
                      <BookOpen size={12} className="text-white" />
                    </div>
                    <span className="text-xs font-black text-pink-500 tracking-widest">추천 답변</span>
                  </div>
                  <p className="text-lg font-medium text-gray-700 leading-relaxed">
                    "{questions[currentIdx].example}"
                  </p>
                </div>
              )}

              <div className="relative group/input">
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="이곳에 영어로 답변을 작성하거나, 마이크를 눌러 말해보세요..."
                  className="w-full bg-white px-5 md:px-7 py-5 md:py-7 rounded-[1.5rem] md:rounded-[2rem] text-lg md:text-xl font-medium border-2 border-pink-100 focus:border-pink-300 focus:ring-4 focus:ring-pink-100 focus:outline-none transition-all placeholder:text-gray-300 text-gray-800 min-h-[200px] md:min-h-[240px] resize-none leading-relaxed shadow-sm block"
                  autoFocus
                />
                <div className="absolute top-6 left-6 md:top-8 md:left-8 text-pink-200 hidden sm:block pointer-events-none">
                  <Heart size={20} />
                </div>
                <button
                  onClick={startListening}
                  className={`absolute bottom-6 right-6 md:bottom-8 md:right-8 p-4 md:p-5 rounded-[1.5rem] transition-all duration-300 shadow-sm ${isListening ? 'bg-rose-400 text-white animate-pulse' : 'bg-pink-50 border border-pink-100 text-pink-400 hover:bg-pink-100'}`}
                  title={isListening ? '듣기 중지' : '음성으로 답변하기'}
                >
                  {isListening ? <MicOff size={28} /> : <Mic size={28} />}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Action Gate */}
        <footer className="flex flex-col-reverse sm:flex-row gap-4 w-full">
          <button
            onClick={() => window.location.href = '/'}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white text-gray-500 font-bold hover:bg-gray-50 border border-gray-200 active:scale-95 transition-all flex items-center justify-center gap-2 text-base shadow-sm"
          >
            <ArrowLeft size={18} />
            그만하기
          </button>

          <button
            onClick={submitAnswer}
            disabled={!answer.trim() || submitting}
            className="btn-primary w-full sm:flex-1 text-lg py-4 flex items-center justify-center gap-3 group disabled:opacity-50 text-gray-800"
          >
            {submitting ? (
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-pink-300 border-t-pink-500 rounded-full animate-spin" />
                답변 제출 중...
              </div>
            ) : (
              <>
                답변 제출하기
                <div className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform">
                  <Send size={22} className="text-gray-800" />
                </div>
              </>
            )}
          </button>
        </footer>
      </main>

      {/* Motivational Sublayer */}
      <div className="pt-8 flex items-center justify-center gap-3 opacity-60">
        <CheckCircle2 size={16} className="text-blue-400" />
        <p className="text-[11px] font-bold text-gray-500 tracking-wide">영어 회화 실력이 늘고 있어요!</p>
        <CheckCircle2 size={16} className="text-blue-400" />
      </div>
    </div>
  );
}
