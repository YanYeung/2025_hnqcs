
import React, { useState } from 'react';
import { Lock, ArrowRight, Monitor, User, Loader2 } from 'lucide-react';

interface LoginProps {
  onLogin: (username: string, password: string) => Promise<boolean>;
  onGoToDisplay: () => void;
  competitionName: string;
}

const Login: React.FC<LoginProps> = ({ onLogin, onGoToDisplay, competitionName }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    // Clear error state before attempting login
    if (error) setError(false);

    try {
      const success = await onLogin(username, password);
      if (!success) {
        setError(true);
        setShake(true);
        setTimeout(() => setShake(false), 500);
      }
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center max-w-lg">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">{competitionName}</h1>
        <p className="text-indigo-600 font-medium mt-2">成绩统计系统</p>
      </div>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="bg-indigo-600 p-6 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto backdrop-blur-sm">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-white text-xl font-semibold mt-4">系统登录</h2>
          <p className="text-indigo-100 text-sm opacity-90">请验证身份以进行成绩录入</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">账号</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setError(false);
                  }}
                  disabled={isLoading}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none transition-all bg-white disabled:bg-slate-50"
                  placeholder="admin 或 裁判员账号"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">密码</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(false);
                  }}
                  disabled={isLoading}
                  className={`w-full pl-10 pr-4 py-3 rounded-lg border focus:ring-2 outline-none transition-all disabled:bg-slate-50 ${
                    error 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-200 bg-red-50 text-red-900' 
                      : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-200 bg-white'
                  } ${shake ? 'animate-shake' : ''}`}
                  placeholder="请输入密码"
                />
              </div>
              {error && (
                <p className="text-red-500 text-sm mt-2 flex items-center">
                  <span>账号或密码错误</span>
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center group mt-2 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>登录</span>
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100">
             <button
              onClick={onGoToDisplay}
              className="w-full flex items-center justify-center text-slate-500 hover:text-indigo-600 text-sm transition-colors py-2"
             >
               <Monitor className="w-4 h-4 mr-2" />
               <span>无需登录，前往大屏展示端</span>
             </button>
          </div>
        </div>
      </div>
      
      <p className="mt-8 text-slate-400 text-sm">© 2025 竞赛组委会技术支持</p>
      
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
        }
      `}</style>
    </div>
  );
};

export default Login;