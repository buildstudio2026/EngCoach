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
      setError('로그인 정보가 올바르지 않습니다.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-[#fffafa]">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full opacity-40 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#ffb6b9] rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#bae1ff] rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <div className="text-center mb-12 space-y-4">
          <div className="inline-flex p-4 rounded-3xl bg-[#ffb6b9]/20 border border-[#ffb6b9]/30 mb-4">
             <ShieldCheck size={40} className="text-[#f48eb1]" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-800 tracking-tight">관리자 접속</h1>
          <p className="text-gray-400 font-medium tracking-wide text-sm">보안 접근 권한이 필요합니다</p>
        </div>

        <form onSubmit={handleLogin} className="premium-card p-6 md:p-10 space-y-6 md:space-y-8 bg-white/60">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">아이디</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#f48eb1] transition-colors">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin1 또는 admin2"
                  className="w-full bg-white/80 border border-pink-200/50 rounded-2xl py-4 pl-12 pr-5 text-gray-700 text-lg placeholder:text-gray-300 focus:outline-none focus:border-[#ffb6b9] focus:ring-4 focus:ring-[#ffb6b9]/20 transition-all font-medium"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">비밀번호</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#f48eb1] transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/80 border border-pink-200/50 rounded-2xl py-4 pl-14 pr-6 text-gray-700 text-lg placeholder:text-gray-300 focus:outline-none focus:border-[#ffb6b9] focus:ring-4 focus:ring-[#ffb6b9]/20 transition-all font-medium"
                  required
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-500 text-sm font-bold text-center animate-shake">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn-primary w-full py-5 text-lg font-bold flex items-center justify-center gap-3 active:scale-95 text-gray-700"
          >
            로그인
            <ArrowRight size={20} className="text-gray-700" />
          </button>
        </form>

        <p className="mt-12 text-center text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
          EngCoach 모니터링 시스템 v2.0
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

