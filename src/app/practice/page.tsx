"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Brain, MessageSquare, ChevronRight, CheckCircle2, AlertCircle, Sparkles, Send, ArrowLeft, Volume2, Mic, MicOff } from 'lucide-react';

interface Question {
  id: string;
  expressionId: string;
  question: string;
  meaning?: string;
  example?: string;
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
      alert('Your browser does not support Speech Recognition.');
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
        alert(`Error: ${errorData.error || 'Failed to submit answer'}`);
      }
    } catch (error) {
      console.error('Failed to submit:', error);
      alert('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !userId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 space-y-8 bg-[#0b1120]">
        <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        <p className="text-slate-400 font-black uppercase tracking-[0.4em] text-xs">Initializing Training Matrix</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-[#0b1120]">
        <div className="premium-card p-16 max-w-lg w-full text-center space-y-10">
          <div className="w-24 h-24 bg-rose-500/10 rounded-[2.5rem] flex items-center justify-center mx-auto border border-rose-500/20">
            <AlertCircle size={48} className="text-rose-500" />
          </div>
          <div className="space-y-4">
            <h2 className="text-4xl font-black text-white italic uppercase tracking-tight">Empty Reservoir</h2>
            <p className="text-slate-400 font-medium text-lg leading-relaxed">
              Generate new questions in your laboratory to begin a session.
            </p>
          </div>
          <button 
            onClick={() => window.location.href = '/'}
            className="btn-primary w-full py-5 flex items-center justify-center gap-3"
          >
            <ArrowLeft size={24} />
            BACK TO FLOW
          </button>
        </div>
      </div>
    );
  }

  const progress = ((currentIdx + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen py-12 px-6 flex flex-col items-center max-w-4xl mx-auto space-y-12">
      {/* Dynamic Header */}
      <header className="w-full space-y-8">
        <div className="flex justify-between items-end">
          <div className="space-y-1">
             <div className="flex items-center gap-3 text-indigo-400 mb-2">
               <Brain size={18} />
               <span className="text-xs font-black uppercase tracking-[0.3em]">Cognitive Sync</span>
             </div>
             <h1 className="text-5xl font-black text-white italic tracking-tighter uppercase">Active Training</h1>
          </div>
          <div className="text-right">
             <span className="text-4xl font-black text-white italic">{currentIdx + 1}</span>
             <span className="text-slate-600 font-black text-xl italic ml-2">/ {questions.length}</span>
          </div>
        </div>
        
        {/* Progress System */}
        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 p-0.5">
          <div 
            className="h-full brand-gradient rounded-full transition-all duration-1000 cubic-bezier(0.4, 0, 0.2, 1) shadow-[0_0_15px_rgba(168,85,247,0.5)]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      {/* Training Matrix */}
      <main className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <section className="premium-card p-12 space-y-10 relative overflow-hidden group">
          <div className="absolute -top-10 -right-10 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity rotate-12">
            <MessageSquare size={260} />
          </div>

          <div className="space-y-10 relative z-10">
            <div className="space-y-4">
              <div className="flex justify-between items-center pr-12">
                <h3 className="text-xs font-black text-indigo-500 uppercase tracking-[0.4em]">Inbound Question</h3>
                <div className="flex items-center gap-4">
                  <button
                    onClick={speakQuestion}
                    className={`p-2 rounded-lg transition-all ${isSpeaking ? 'bg-indigo-500 text-white' : 'bg-white/5 text-indigo-400 hover:bg-white/10'}`}
                    title="Speak Question"
                  >
                    <Volume2 size={16} />
                  </button>
                  {questions[currentIdx].meaning && (
                    <button 
                      onClick={() => setShowMeaning(!showMeaning)}
                      className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-400/60 hover:text-indigo-400 transition-colors"
                    >
                      <Sparkles size={12} />
                      {showMeaning ? 'Hide Translation' : 'See Translation'}
                    </button>
                  )}
                </div>
              </div>
              <p className="text-4xl font-bold text-white leading-[1.2] tracking-tight pr-12">
                "{questions[currentIdx].question}"
              </p>
              
              {showMeaning && questions[currentIdx].meaning && (
                <div className="mt-4 p-6 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center gap-2 mb-2 text-indigo-400">
                    <Sparkles size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Interpretation</span>
                  </div>
                  <p className="text-lg font-medium text-indigo-100 leading-relaxed italic">
                    {questions[currentIdx].meaning}
                  </p>
                </div>
              )}
            </div>

            <div className="h-px w-full bg-white/5" />

            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.4em]">User Response</h3>
                <div className="flex gap-4">
                  {questions[currentIdx].example && (
                    <button 
                      onClick={() => setShowExample(!showExample)}
                      className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-400/60 hover:text-indigo-400 transition-colors"
                    >
                      <Sparkles size={12} />
                      {showExample ? 'Hide Example' : 'Show Example Answer'}
                    </button>
                  )}
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-3 py-1 bg-white/5 rounded-full">Manual Input</span>
                </div>
              </div>
              
              {showExample && questions[currentIdx].example && (
                <div className="p-8 bg-indigo-600/10 border border-indigo-500/20 rounded-3xl animate-in fade-in zoom-in-95 duration-500">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-indigo-500 rounded-lg">
                      <Brain size={16} className="text-white" />
                    </div>
                    <span className="text-xs font-black text-indigo-300 uppercase tracking-widest">Recommended Response</span>
                  </div>
                  <p className="text-xl font-medium text-white leading-relaxed italic">
                    "{questions[currentIdx].example}"
                  </p>
                </div>
              )}
              
              <div className="relative group/input">
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Formulate your response here..."
                  className="w-full bg-white/5 px-10 py-10 rounded-[2.5rem] text-2xl font-medium border-2 border-white/5 focus:border-indigo-500/40 focus:ring-8 focus:ring-indigo-500/5 focus:outline-none transition-all placeholder:text-slate-700 min-h-[260px] resize-none leading-relaxed"
                  autoFocus
                />
                <div className="absolute top-8 left-8 text-indigo-500/40">
                  <Sparkles size={24} />
                </div>
                <button
                  onClick={startListening}
                  className={`absolute bottom-8 right-8 p-6 rounded-[2rem] transition-all duration-500 ${isListening ? 'bg-rose-500 text-white shadow-[0_0_30px_rgba(244,63,94,0.4)] animate-pulse' : 'bg-white/10 text-slate-400 hover:bg-white/20'}`}
                  title={isListening ? 'Stop Listening' : 'Voice Answer'}
                >
                  {isListening ? <MicOff size={32} /> : <Mic size={32} />}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Action Gate */}
        <footer className="flex gap-4">
           <button 
             onClick={() => window.location.href = '/'}
             className="px-8 py-5 rounded-2xl bg-white/5 text-slate-400 font-bold hover:bg-white/10 border border-white/5 active:scale-95 transition-all flex items-center gap-3"
           >
             <ArrowLeft size={20} />
             ABORT
           </button>
           
           <button
            onClick={submitAnswer}
            disabled={!answer.trim() || submitting}
            className="btn-primary flex-1 text-2xl py-6 flex items-center justify-center gap-4 group"
          >
            {submitting ? (
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                TRANSMITTING...
              </div>
            ) : (
              <>
                TRANSMIT RESPONSE
                <div className="group-hover:translate-x-2 transition-transform">
                  <Send size={28} />
                </div>
              </>
            )}
          </button>
        </footer>
      </main>

      {/* Motivational Sublayer */}
      <div className="pt-12 flex items-center gap-8 opacity-40">
        <CheckCircle2 size={16} className="text-indigo-500" />
        <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">Neural Pathways Strengthening In Progress</p>
        <CheckCircle2 size={16} className="text-indigo-500" />
      </div>
    </div>
  );
}
