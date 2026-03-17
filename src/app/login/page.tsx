"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, User, ShieldCheck, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple test credentials
    if ((username === 'admin1' && password === 'admin1') || 
        (username === 'admin2' && password === 'admin2')) {
      localStorage.setItem('engcoach_user', username);
      router.push('/');
    } else {
      setError('Invalid credentials. Access Denied.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-[#0b1120]">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <div className="text-center mb-12 space-y-4">
          <div className="inline-flex p-4 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 mb-4">
             <ShieldCheck size={40} className="text-indigo-400" />
          </div>
          <h1 className="text-5xl font-black text-white italic tracking-tighter uppercase leading-none">Admin Gate</h1>
          <p className="text-slate-400 font-medium tracking-widest text-[10px] uppercase">Secure Access Protocol Required</p>
        </div>

        <form onSubmit={handleLogin} className="premium-card p-10 space-y-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Identity</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin1 or admin2"
                  className="w-full bg-slate-950/50 border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-white text-lg placeholder:text-slate-700 focus:outline-none focus:border-indigo-500/30 focus:ring-4 focus:ring-indigo-500/5 transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Access Key</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950/50 border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-white text-lg placeholder:text-slate-700 focus:outline-none focus:border-indigo-500/30 focus:ring-4 focus:ring-indigo-500/5 transition-all"
                  required
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 text-sm font-bold text-center animate-shake">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn-primary w-full py-5 text-xl flex items-center justify-center gap-3 active:scale-95"
          >
            AUTHORIZE
            <ArrowRight size={22} />
          </button>
        </form>

        <p className="mt-12 text-center text-[10px] font-black text-slate-700 uppercase tracking-[0.4em]">
          EngCoach Monitoring System v2.0
        </p>
      </div>

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.2s ease-in-out 0s 2;
        }
      `}</style>
    </div>
  );
}
