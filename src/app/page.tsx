"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format, eachDayOfInterval, isSameDay, addWeeks, subWeeks, startOfWeek, endOfWeek } from 'date-fns';
import { ko } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, Trash2, BookOpen, MessageCircle, LogOut, Shield, Gift, Heart, RotateCcw } from 'lucide-react';

interface Expression {
  id: string;
  expression: string;
  meaning?: string;
  explanation?: string;
  type?: 'alternative' | 'expression' | 'grammar';
  priority: number;
  mastery: number;
  createdAt: string;
}

export default function Dashboard() {
  const [userId, setUserId] = useState<string | null>(null);
  const [expressions, setExpressions] = useState<Expression[]>([]);
  const [newExp, setNewExp] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentWeekPivot, setCurrentWeekPivot] = useState(new Date());

  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [suggestionTab, setSuggestionTab] = useState<'alternative' | 'expression' | 'grammar'>('alternative');
  const [listTab, setListTab] = useState<'all' | 'alternative' | 'expression' | 'grammar'>('all');
  
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
      fetchExpressions();
      fetchSuggestions();
    }
  }, [userId]);

  const fetchSuggestions = async () => {
    if (!userId) return;
    try {
      const res = await fetch(`/api/analysis?userId=${userId}`);
      const data = await res.json();
      if (Array.isArray(data)) setSuggestions(data);
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
    }
  };

  const triggerAnalysis = async () => {
    if (!userId) return;
    setAnalyzing(true);
    try {
      const res = await fetch('/api/analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        fetchSuggestions();
      }
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const addToInputBox = async (id: string, exp: string, meaning: string, explanation: string) => {
    if (!userId) return;
    try {
      await fetch('/api/expressions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expression: exp,
          meaning,
          explanation,
          type: id.startsWith('dummy') ? 'expression' : (suggestions.find(s => s.id === id)?.type || 'expression'),
          userId,
          priority: 3,
          createdAt: selectedDate.toISOString(),
        }),
      });

      await fetch('/api/analysis', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      fetchExpressions();
      fetchSuggestions();
    } catch (error) {
      console.error('Failed to add suggestion:', error);
    }
  };

  const fetchExpressions = async () => {
    if (!userId) return;
    try {
      const res = await fetch(`/api/expressions?userId=${userId}`);
      const data = await res.json();
      if (Array.isArray(data)) setExpressions(data);
    } catch (error) {
      console.error('Failed to fetch:', error);
    } finally {
      setLoading(false);
    }
  };

  const addExpression = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExp.trim() || !userId) return;

    try {
      const res = await fetch('/api/expressions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expression: newExp,
          type: 'expression',
          userId,
          createdAt: selectedDate.toISOString(),
        }),
      });
      if (res.ok) {
        setNewExp('');
        fetchExpressions();
      }
    } catch (error) {
      console.error('Failed to add:', error);
    }
  };

  const removeExpression = async (id: string) => {
    try {
      await fetch('/api/expressions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      fetchExpressions();
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const startPractice = async () => {
    if (!userId) return;
    try {
      const res = await fetch('/api/questions/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        window.location.href = '/practice';
      } else {
        const data = await res.json();
        const errorMessage = data.details || data.error || '연습을 시작할 수 없습니다.';
        alert(`${errorMessage}\n\n도움말: OpenAI API Key가 설정되어 있는지 확인해 주세요! (또는 표현을 먼저 추가해 주세요)`);
      }
    } catch (error) {
      console.error('Failed to start practice:', error);
      alert('연습 시작 중 오류가 발생했습니다.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('engcoach_user');
    router.push('/login');
  };

  const days = eachDayOfInterval({
    start: startOfWeek(currentWeekPivot),
    end: endOfWeek(currentWeekPivot),
  });

  const filteredExpressions = expressions.filter(exp =>
    isSameDay(new Date(exp.createdAt), selectedDate)
  );

  const hasExpressions = (date: Date) =>
    expressions.some(exp => isSameDay(new Date(exp.createdAt), date));

  if (!userId) return null;

  return (
    <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-8 md:py-16 space-y-12 md:space-y-24">
      {/* Top Navbar */}
      <nav className="flex justify-between items-center w-full">
        <div className="flex items-center gap-4 bg-white/60 border border-pink-200/50 py-3 px-6 rounded-2xl backdrop-blur-md">
          <Shield size={18} className="text-[#ffb6b9]" />
          <span className="text-sm font-bold tracking-wide text-gray-500">접속중: <span className="text-pink-400 font-bold">{userId}</span></span>
        </div>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 md:gap-3 text-gray-500 hover:text-gray-800 transition-all group font-bold text-sm tracking-wide"
        >
          <span className="hidden sm:inline">로그아웃</span>
          <span className="sm:hidden">로그아웃</span>
          <LogOut size={16} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </nav>

      {/* Hero Header */}
      <header className="flex flex-col items-center text-center space-y-4 animate-in fade-in slide-in-from-top-4 duration-1000">
        <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-pink-100/50 border border-pink-200/50 backdrop-blur-md">
          <BookOpen size={18} className="text-pink-400" />
          <span className="text-sm font-bold tracking-wide text-pink-400">친절한 AI 영어 선생님</span>
        </div>
        <div className="space-y-3">
          <h1 className="text-5xl md:text-6xl font-black brand-gradient-text tracking-tight uppercase leading-[1]">EngCoach</h1>
          <p className="text-gray-500 text-base md:text-lg font-medium max-w-2xl leading-relaxed">
            나만의 <span className="text-gray-800 font-bold underline decoration-pink-300 underline-offset-4">AI 맞춤형</span> 영어 표현 노트로 자연스러운 회화 실력을 키워보세요.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-12 items-start text-gray-800">
        {/* LEFT COLUMN: ACTION & REWARDS */}
        <div className="xl:col-span-5 space-y-12">
          {/* Conversation Core */}
          <section className="premium-card p-6 md:p-10 space-y-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 md:p-8 opacity-[0.05] group-hover:opacity-10 transition-opacity">
              <MessageCircle size={100} className="md:w-[160px] md:h-[160px] text-pink-500" />
            </div>
            
            <div className="space-y-3 relative z-10">
              <div className="flex items-center gap-2 text-pink-400">
                <Heart size={16} />
                <span className="text-xs font-black tracking-widest">실전 회화</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight text-gray-800">영어 회화 연습하기</h2>
              <p className="text-gray-500 font-medium text-base leading-relaxed max-w-sm">
                AI와 즐겁게 대화하며 나만의 표현들을 확실하게 익혀보세요!
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
              <button 
                onClick={() => router.push('/review')}
                className="btn-secondary px-8 py-5 text-lg font-black tracking-tight flex items-center gap-3 active:scale-95 transition-all text-gray-700"
              >
                <div className="p-1 px-1.5 bg-gray-100 rounded-md border border-gray-200">
                   <RotateCcw size={18} className="text-gray-400" />
                </div>
                반복 학습하기
              </button>
              <button 
                onClick={() => router.push('/practice')}
                className="btn-primary px-8 py-5 text-lg font-black tracking-tight flex items-center gap-3 active:scale-95 transition-all text-gray-800"
              >
                <div className="p-1 px-1.5 bg-pink-200 rounded-md border border-pink-300">
                   <Heart size={18} className="text-pink-600 fill-pink-600" />
                </div>
                회화 시작하기
              </button>
              
              <button
                onClick={triggerAnalysis}
                disabled={analyzing}
                className="w-full bg-white/60 hover:bg-white border border-pink-200 px-4 md:px-8 py-4 rounded-2xl font-bold text-gray-600 disabled:opacity-50 transition-all flex items-center justify-center gap-3 active:scale-95 text-base md:col-span-2"
              >
                {analyzing ? (
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-pink-300 border-t-pink-500 rounded-full animate-spin" />
                    분석 중...
                  </div>
                ) : '학습 분석 결과 확인하기'}
              </button>
            </div>
          </section>

          {/* AI Gift Box */}
          <section className="space-y-6 animate-in fade-in duration-1000 delay-300">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-blue-100 border border-blue-200">
                <Gift size={20} className="text-blue-400" />
              </div>
              <div className="space-y-0.5">
                <h2 className="text-xl font-black text-gray-800 tracking-tight">AI 선물 상자</h2>
                <div className="h-0.5 w-10 bg-blue-300 rounded-full" />
              </div>
            </div>

            {suggestions.length > 0 ? (
              <div className="space-y-8">
                <div className="flex p-1.5 bg-white/80 rounded-2xl border border-pink-200/50 backdrop-blur-md">
                  {['alternative', 'expression', 'grammar'].map((tab) => {
                    const tabName = tab === 'alternative' ? '대안 표현' : tab === 'expression' ? '유용한 표현' : '문법 팁';
                    return (
                    <button
                      key={tab}
                      onClick={() => setSuggestionTab(tab as any)}
                      className={`flex-1 py-3 px-1 md:px-3 text-xs font-black tracking-wide rounded-xl transition-all duration-300
                        ${suggestionTab === tab 
                          ? 'bg-blue-200/50 text-blue-600 shadow-sm' 
                          : 'text-gray-400 hover:text-gray-600'}
                      `}
                    >
                      {tabName}
                    </button>
                  )})}
                </div>

                <div className="grid grid-cols-1 gap-5">
                  {suggestions
                    .filter(s => s.type === suggestionTab)
                    .map((s) => (
                      <div key={s.id} className="glass-card p-4 md:p-6 space-y-6 group hover:-translate-y-1 duration-300">
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                          <div className="space-y-4 w-full">
                            {s.original && (
                              <div className="space-y-1 bg-gray-50 p-3 rounded-xl">
                                <span className="text-[10px] font-black text-gray-400">작성한 문장</span>
                                <p className="text-base text-gray-500 font-medium line-through decoration-rose-300 leading-tight">
                                  {s.original}
                                </p>
                              </div>
                            )}
                            <div className="space-y-2">
                               <span className="text-[10px] font-black text-blue-400 tracking-widest bg-blue-50 px-2 py-1 rounded-md">추천 표현</span>
                               <h3 className="text-lg font-bold text-gray-800 leading-tight">{s.expression}</h3>
                               <p className="text-blue-500 font-medium text-base">{s.meaning}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => addToInputBox(s.id, s.expression, s.meaning, s.explanation)}
                            className="shrink-0 w-full sm:w-auto p-3 bg-white hover:bg-blue-50 text-gray-400 hover:text-blue-500 rounded-xl border border-pink-100 hover:border-blue-200 transition-all flex justify-center items-center shadow-sm"
                          >
                            <Plus size={20} />
                          </button>
                        </div>
                        
                        <div className="pt-4 border-t border-pink-100">
                          <div className="flex gap-3 items-start">
                             <div className="p-1.5 rounded-lg bg-pink-100 mt-0.5">
                               <Heart size={14} className="text-pink-400" />
                             </div>
                             <p className="text-base text-gray-600 font-medium leading-relaxed">
                               <span className="font-bold text-pink-400 mr-2">팁:</span>
                               {s.explanation}
                             </p>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              <div className="premium-card p-12 text-center border-dashed border-pink-200/50 opacity-80 bg-white/40">
                <Gift size={32} className="text-gray-300 mx-auto mb-4" />
                <p className="text-gray-400 font-bold text-sm tracking-wide">학습을 완료하고 선물을 확인해보세요!</p>
              </div>
            )}
          </section>
        </div>

        {/* RIGHT COLUMN: CALENDAR & LOG */}
        <div className="xl:col-span-7 space-y-10">
          {/* Header Controls */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 p-4 rounded-3xl bg-white/70 border border-pink-200/40 shadow-sm backdrop-blur-md">
             <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-pink-100 border border-pink-200">
                  <CalendarIcon size={22} className="text-pink-400" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-gray-800 tracking-tight">표현 기록장</h2>
                  <p className="text-xs font-bold text-gray-400 tracking-wide">{format(selectedDate, 'yyyy년 M월 d일', { locale: ko })}</p>
                </div>
             </div>
             
             <form onSubmit={addExpression} className="flex-1 w-full xl:max-w-md flex flex-col sm:flex-row gap-2 md:mr-2">
                <input
                  type="text"
                  value={newExp}
                  onChange={(e) => setNewExp(e.target.value)}
                  placeholder="새로운 표현을 입력해주세요..."
                  className="flex-1 bg-white px-5 py-3.5 rounded-2xl text-base font-medium border border-pink-200 focus:border-pink-300 focus:ring-4 focus:ring-pink-100 focus:outline-none transition-all placeholder:text-gray-300 text-gray-700 shadow-sm"
                />
                <button type="submit" className="p-3.5 bg-pink-300 hover:bg-pink-400 text-white rounded-2xl transition-all shadow-md active:scale-95 flex items-center justify-center">
                  <Plus size={20} />
                </button>
             </form>
          </div>

          {/* Weekly Engine */}
          <div className="premium-card p-6 md:p-8 space-y-6 md:space-y-8 bg-white/50">
            <div className="flex justify-between items-center px-2 md:px-4 text-gray-800">
              <div className="space-y-1">
                <h3 className="text-2xl md:text-3xl font-black text-gray-800 tracking-tight">{format(currentWeekPivot, 'M월')}</h3>
                <p className="text-sm font-bold text-gray-400 tracking-wide">{format(currentWeekPivot, 'yyyy년')}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setCurrentWeekPivot(subWeeks(currentWeekPivot, 1))} className="p-3 bg-white hover:bg-pink-50 rounded-xl border border-pink-100 transition-all shadow-sm">
                  <ChevronLeft size={18} className="text-gray-500" />
                </button>
                <button onClick={() => setCurrentWeekPivot(addWeeks(currentWeekPivot, 1))} className="p-3 bg-white hover:bg-pink-50 rounded-xl border border-pink-100 transition-all shadow-sm">
                  <ChevronRight size={18} className="text-gray-500" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2 md:gap-4">
              {['일', '월', '화', '수', '목', '금', '토'].map((day, idx) => (
                <div key={day} className={`text-center text-xs md:text-sm font-black ${idx === 0 ? 'text-red-400' : idx === 6 ? 'text-blue-400' : 'text-gray-400'} tracking-wide`}>{day}</div>
              ))}
              {days.map((day) => {
                const isSelected = isSameDay(day, selectedDate);
                const hasExps = hasExpressions(day);
                const isToday = isSameDay(day, new Date());
                
                return (
                  <button
                    key={day.toString()}
                    onClick={() => setSelectedDate(day)}
                    className={`relative aspect-square flex flex-col items-center justify-center rounded-2xl text-base md:text-lg font-bold transition-all duration-300
                      ${isSelected ? 'bg-pink-300 text-white shadow-md scale-105 z-10' : 'bg-white hover:bg-pink-50 text-gray-600 border border-pink-100'}
                      ${isToday && !isSelected ? 'text-pink-500 ring-2 ring-pink-200' : ''}
                    `}
                  >
                    <span className="relative z-10">{format(day, 'd')}</span>
                    {hasExps && (
                      <div className={`mt-1.5 h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-pink-300'}`} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Activity Log */}
          <div className="space-y-6 animate-in fade-in duration-1000 delay-500">
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-pink-100 border border-pink-200">
                  <BookOpen size={20} className="text-pink-400" />
                </div>
                <div className="space-y-0.5">
                  <h2 className="text-xl font-black text-gray-800 tracking-tight">나의 노트</h2>
                  <div className="h-0.5 w-10 bg-pink-300 rounded-full" />
                </div>
              </div>

              <div className="flex p-1.5 bg-white/80 rounded-2xl border border-pink-100 shadow-sm max-w-lg mx-auto w-full">
                {['all', 'alternative', 'expression', 'grammar'].map((tab) => {
                  const tabName = tab === 'all' ? '전체' : tab === 'alternative' ? '대안 표현' : tab === 'expression' ? '유용한 표현' : '문법 팁';
                  return (
                  <button
                    key={tab}
                    onClick={() => setListTab(tab as any)}
                    className={`flex-1 py-2.5 text-xs md:text-sm font-black tracking-wide rounded-xl transition-all duration-300
                      ${listTab === tab 
                        ? 'bg-pink-100 text-pink-500 shadow-sm' 
                        : 'text-gray-400 hover:text-gray-600'}
                    `}
                  >
                    {tabName}
                  </button>
                )})}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5">
              {loading ? (
                [1, 2].map(i => <div key={i} className="premium-card h-32 animate-pulse opacity-50 bg-white" />)
              ) : (
                filteredExpressions
                  .filter(exp => {
                    if (listTab === 'all') return true;
                    return (exp.type || 'expression') === listTab;
                  })
                  .map((exp) => (
                  <div key={exp.id} className="glass-card p-6 md:p-8 flex group relative overflow-hidden transition-all duration-300 bg-white">
                    <div className="flex-1 space-y-5">
                      <div className="flex justify-between items-start gap-4">
                        <div className="space-y-1.5">
                          <h4 className="inline-block px-2.5 py-0.5 rounded-md bg-blue-50 text-xs font-black text-blue-400">{exp.type === 'alternative' ? '대안 표현' : exp.type === 'grammar' ? '문법 팁' : '유용한 표현'}</h4>
                          <h3 className="text-lg md:text-xl font-bold text-gray-800 tracking-tight leading-tight">{exp.expression}</h3>
                          {exp.meaning && <p className="text-gray-500 font-medium text-base mt-1.5">{exp.meaning}</p>}
                        </div>
                        <button
                          onClick={() => removeExpression(exp.id)}
                          className="opacity-100 xl:opacity-0 group-hover:opacity-100 p-2 md:p-3 text-gray-300 hover:text-rose-400 hover:bg-rose-50 rounded-xl transition-all"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>

                      <div className="space-y-4 pt-2">
                        {exp.explanation && (
                          <div className="flex gap-3 items-start bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <Heart size={14} className="text-pink-400 shrink-0 mt-0.5" />
                            <p className="text-sm text-gray-600 font-medium leading-relaxed">
                              {exp.explanation}
                            </p>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-4">
                          <span className="text-xs font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-md">학습도</span>
                          <div className="flex gap-1.5">
                            {[0, 1, 2].map(i => (
                              <div key={i} className={`h-1.5 w-8 rounded-full transition-all duration-500 ${i < exp.mastery ? 'bg-pink-300' : 'bg-gray-100'}`} />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
              {!loading && filteredExpressions.length === 0 && (
                <div className="p-16 text-center premium-card border-dashed border-pink-200/50 opacity-70 bg-white/40">
                  <p className="text-gray-400 font-bold text-base">오늘 저장된 연습 내용이 없어요.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

