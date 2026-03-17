"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format, eachDayOfInterval, isSameDay, addWeeks, subWeeks, startOfWeek, endOfWeek } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, Trash2, Sparkles, Brain, Gift, MessageCircle, ArrowRight, LogOut, Shield } from 'lucide-react';

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
    <div className="max-w-[1400px] mx-auto px-8 py-16 space-y-24">
      {/* Top Navbar */}
      <nav className="flex justify-between items-center w-full">
        <div className="flex items-center gap-4 bg-white/5 border border-white/5 py-3 px-6 rounded-2xl backdrop-blur-md">
          <Shield size={18} className="text-indigo-400" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Authenticated: <span className="text-indigo-400 italic font-black">{userId}</span></span>
        </div>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 text-slate-500 hover:text-white transition-all group font-black uppercase text-[10px] tracking-widest"
        >
          LOGOUT SESSION
          <LogOut size={16} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </nav>

      {/* Hero Header */}
      <header className="flex flex-col items-center text-center space-y-8 animate-in fade-in slide-in-from-top-4 duration-1000">
        <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 backdrop-blur-md">
          <Brain size={20} className="text-indigo-400" />
          <span className="text-sm font-black uppercase tracking-[0.3em] text-indigo-300">Next-Gen Language Coach</span>
        </div>
        <div className="space-y-4">
          <h1 className="text-8xl font-black brand-gradient-text tracking-tighter uppercase leading-[0.9]">EngCoach</h1>
          <p className="text-slate-300 text-2xl font-medium max-w-3xl leading-relaxed">
            Elevate your lexical precision with <span className="text-white font-black underline decoration-indigo-500/50 underline-offset-8 leading-loose">AI-driven</span> daily expression tracking.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-12 items-start text-white">
        {/* LEFT COLUMN: ACTION & REWARDS */}
        <div className="xl:col-span-5 space-y-12">
          {/* Conversation Core */}
          <section className="premium-card p-12 space-y-10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-[0.05] group-hover:opacity-10 transition-opacity">
              <MessageCircle size={160} />
            </div>
            
            <div className="space-y-3 relative z-10">
              <div className="flex items-center gap-2 text-indigo-400">
                <Sparkles size={18} />
                <span className="text-xs font-black uppercase tracking-[0.2em]">Active Practice</span>
              </div>
              <h2 className="text-4xl font-black tracking-tight text-white uppercase italic">Conversation</h2>
              <p className="text-slate-300 font-medium text-lg leading-relaxed max-w-sm">
                Unlock native-level fluency through immersive AI interactions.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 relative z-10">
              <button
                onClick={startPractice}
                className="btn-primary w-full text-2xl py-6 flex items-center justify-center gap-4 group/btn"
              >
                START SESSION
                <ArrowRight size={28} className="group-hover:translate-x-2 transition-transform" />
              </button>
              
              <button
                onClick={triggerAnalysis}
                disabled={analyzing}
                className="w-full bg-white/5 hover:bg-white/10 border border-white/10 px-8 py-5 rounded-2xl font-bold text-slate-200 disabled:opacity-50 transition-all flex items-center justify-center gap-3 active:scale-95"
              >
                {analyzing ? (
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                    Analyzing Patterns...
                  </div>
                ) : 'GENERATE ANALYSIS ✨'}
              </button>
            </div>
          </section>

          {/* AI Gift Box */}
          <section className="space-y-8 animate-in fade-in duration-1000 delay-300">
            <div className="flex items-center gap-6">
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                <Gift size={24} className="text-rose-500" />
              </div>
              <div className="space-y-0.5">
                <h2 className="text-2xl font-black text-white italic tracking-tight uppercase">AI Gift Box</h2>
                <div className="h-0.5 w-12 bg-indigo-500 rounded-full" />
              </div>
            </div>

            {suggestions.length > 0 ? (
              <div className="space-y-8">
                <div className="flex p-1.5 bg-slate-950/60 rounded-2xl border border-white/5 backdrop-blur-md">
                  {['alternative', 'expression', 'grammar'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setSuggestionTab(tab as any)}
                      className={`flex-1 py-3 text-[11px] font-black uppercase tracking-[0.15em] rounded-xl transition-all duration-500
                        ${suggestionTab === tab 
                          ? 'bg-indigo-600 text-white shadow-lg' 
                          : 'text-slate-400 hover:text-slate-200'}
                      `}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 gap-5">
                  {suggestions
                    .filter(s => s.type === suggestionTab)
                    .map((s) => (
                      <div key={s.id} className="glass-card p-8 space-y-6 group hover:-translate-y-1 duration-500">
                        <div className="flex justify-between items-start gap-4 text-white">
                          <div className="space-y-4">
                            {s.original && (
                              <div className="space-y-1">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Original Input</span>
                                <p className="text-lg text-slate-400 font-medium italic line-through decoration-rose-500/30 leading-tight">
                                  {s.original}
                                </p>
                              </div>
                            )}
                            <div className="space-y-1">
                               <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Enhanced Insight</span>
                               <h3 className="text-2xl font-bold text-white tracking-tight leading-tight">{s.expression}</h3>
                               <p className="text-indigo-400 font-black text-sm tracking-wide uppercase">{s.meaning}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => addToInputBox(s.id, s.expression, s.meaning, s.explanation)}
                            className="shrink-0 p-4 bg-white/5 text-slate-300 hover:text-white hover:bg-indigo-600 rounded-2xl border border-white/5 hover:border-indigo-400 transition-all"
                          >
                            <Plus size={24} />
                          </button>
                        </div>
                        
                        <div className="pt-6 border-t border-white/10">
                          <div className="flex gap-4 items-start">
                             <div className="p-1.5 rounded-lg bg-indigo-500/10">
                               <Sparkles size={16} className="text-indigo-400" />
                             </div>
                             <p className="text-sm text-slate-300 font-medium leading-relaxed">
                               <span className="font-black text-indigo-400 mr-2 uppercase tracking-tighter">Tip:</span>
                               {s.explanation}
                             </p>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              <div className="premium-card p-16 text-center border-dashed border-white/10 opacity-60">
                <Gift size={40} className="text-slate-500 mx-auto mb-6" />
                <p className="text-slate-400 font-black text-xs tracking-widest uppercase">Complete a session to reveal insights</p>
              </div>
            )}
          </section>
        </div>

        {/* RIGHT COLUMN: CALENDAR & LOG */}
        <div className="xl:col-span-7 space-y-12">
          {/* Header Controls */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 p-4 rounded-[2.5rem] bg-slate-900/60 border border-white/5 backdrop-blur-xl">
             <div className="flex items-center gap-5 ml-4">
                <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
                  <CalendarIcon size={22} className="text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white italic uppercase tracking-tight">Input Lab</h2>
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{format(selectedDate, 'MMM d, yyyy')}</p>
                </div>
             </div>
             
             <form onSubmit={addExpression} className="flex-1 max-w-md w-full flex gap-3 mr-2">
                <input
                  type="text"
                  value={newExp}
                  onChange={(e) => setNewExp(e.target.value)}
                  placeholder="Inject new lexical units..."
                  className="flex-1 bg-white/5 px-6 py-3.5 rounded-2xl text-base font-medium border border-white/5 focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5 focus:outline-none transition-all placeholder:text-slate-500 text-white"
                />
                <button type="submit" className="p-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl transition-all shadow-lg active:scale-90">
                  <Plus size={24} />
                </button>
             </form>
          </div>

          {/* Weekly Engine */}
          <div className="premium-card p-10 space-y-12">
            <div className="flex justify-between items-center px-6 text-white">
              <div className="space-y-1">
                <h3 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">{format(currentWeekPivot, 'MMMM')}</h3>
                <p className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.4em] translate-x-1">{format(currentWeekPivot, 'yyyy')}</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setCurrentWeekPivot(subWeeks(currentWeekPivot, 1))} className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all">
                  <ChevronLeft size={22} className="text-slate-300" />
                </button>
                <button onClick={() => setCurrentWeekPivot(addWeeks(currentWeekPivot, 1))} className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all">
                  <ChevronRight size={22} className="text-slate-300" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-6">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase">{day}</div>
              ))}
              {days.map((day) => {
                const isSelected = isSameDay(day, selectedDate);
                const hasExps = hasExpressions(day);
                const isToday = isSameDay(day, new Date());
                
                return (
                  <button
                    key={day.toString()}
                    onClick={() => setSelectedDate(day)}
                    className={`relative aspect-square flex flex-col items-center justify-center rounded-[2rem] text-lg font-black transition-all duration-300
                      ${isSelected ? 'bg-indigo-600 text-white shadow-xl scale-110 z-10 rotate-3' : 'hover:bg-white/5 text-slate-400 border border-transparent hover:border-white/5'}
                      ${isToday && !isSelected ? 'text-indigo-400 ring-2 ring-indigo-500/20' : ''}
                    `}
                  >
                    <span className="relative z-10">{format(day, 'd')}</span>
                    {hasExps && (
                      <div className={`mt-2 h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-white shadow-[0_0_8px_#fff]' : 'bg-indigo-400'}`} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Activity Log */}
          <div className="space-y-8 animate-in fade-in duration-1000 delay-500">
            <div className="flex flex-col gap-8">
              <div className="flex items-center gap-6">
                <div className="h-px flex-1 bg-white/10"></div>
                <h3 className="text-[10px] font-black text-slate-400 tracking-[0.4em] uppercase py-2 italic text-center">
                  Temporal Extraction Log
                </h3>
                <div className="h-px flex-1 bg-white/10"></div>
              </div>

              <div className="flex p-1.5 bg-slate-900/60 rounded-2xl border border-white/5 backdrop-blur-md max-w-lg mx-auto w-full">
                {['all', 'alternative', 'expression', 'grammar'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setListTab(tab as any)}
                    className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-500
                      ${listTab === tab 
                        ? 'bg-white/10 text-white border border-white/10' 
                        : 'text-slate-400 hover:text-slate-200'}
                    `}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {loading ? (
                [1, 2].map(i => <div key={i} className="premium-card h-32 animate-pulse opacity-20" />)
              ) : (
                filteredExpressions
                  .filter(exp => {
                    if (listTab === 'all') return true;
                    return (exp.type || 'expression') === listTab;
                  })
                  .map((exp) => (
                  <div key={exp.id} className="glass-card p-10 flex group relative overflow-hidden transition-all duration-500 bg-slate-900/40">
                    <div className="flex-1 space-y-6">
                      <div className="flex justify-between items-start gap-8">
                        <div className="space-y-2">
                          <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">{exp.type || 'expression'}</h4>
                          <h3 className="text-3xl font-bold text-white tracking-tight leading-tight">{exp.expression}</h3>
                          {exp.meaning && <p className="text-slate-300 font-bold text-lg">{exp.meaning}</p>}
                        </div>
                        <button
                          onClick={() => removeExpression(exp.id)}
                          className="opacity-0 group-hover:opacity-100 p-4 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-[1.5rem] transition-all"
                        >
                          <Trash2 size={24} />
                        </button>
                      </div>

                      <div className="space-y-6">
                        {exp.explanation && (
                          <div className="flex gap-4 items-start bg-slate-950/50 p-6 rounded-3xl border border-white/5">
                            <Sparkles size={16} className="text-rose-500 shrink-0 mt-1" />
                            <p className="text-sm text-slate-300 font-medium leading-relaxed italic pr-4">
                              {exp.explanation}
                            </p>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-6 px-1">
                          <span className="uppercase tracking-[0.3em] text-[10px] font-black text-slate-500">Cognitive Mastery</span>
                          <div className="flex gap-2">
                            {[0, 1, 2].map(i => (
                              <div key={i} className={`h-1.5 w-10 rounded-full transition-all duration-1000 ${i < exp.mastery ? 'bg-indigo-500 shadow-[0_0_10px_#6366f1]' : 'bg-white/5'}`} />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
              {!loading && filteredExpressions.length === 0 && (
                <div className="p-20 text-center premium-card border-dashed border-white/10 opacity-30">
                  <p className="text-slate-400 font-black uppercase tracking-[0.4em] text-xs">Zero spectral entries detected</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
