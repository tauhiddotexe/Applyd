import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    try {
      await loginWithGoogle();
    } catch (err) {
      setError(err.message || 'Google login failed');
    }
  };

  return (
    <div className="min-h-screen flex bg-white dark:bg-slate-950">
      {/* Visual Side */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden bg-slate-900 flex-col justify-between p-16">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-purple-500/10 pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/20 rounded-full blur-[120px]" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px]" />
        
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-xl flex items-center justify-center border border-white/10">
            <span className="material-symbols-outlined text-white text-2xl">rocket_launch</span>
          </div>
          <span className="text-2xl font-black text-white tracking-tight">Applyd</span>
        </div>

        <div className="relative z-10 max-w-xl">
          <h2 className="text-6xl font-black text-white leading-[1.1] tracking-tight">
            Elevate your <br />
            <span className="text-primary">career journey</span> <br />
            with intelligence.
          </h2>
          <p className="text-xl text-slate-400 mt-8 leading-relaxed font-medium">
            Join thousands of professionals using AI to track, optimize, and land their dream roles faster than ever.
          </p>
          
          <div className="mt-12 grid grid-cols-2 gap-6">
            <div className="p-6 bg-white/5 backdrop-blur-md rounded-3xl border border-white/5 space-y-3">
              <span className="material-symbols-outlined text-primary text-3xl">psychology</span>
              <p className="text-white font-bold">AI Resume Scoring</p>
              <p className="text-slate-500 text-sm font-medium">Instantly check your match score against any job description.</p>
            </div>
            <div className="p-6 bg-white/5 backdrop-blur-md rounded-3xl border border-white/5 space-y-3">
              <span className="material-symbols-outlined text-purple-400 text-3xl">auto_awesome</span>
              <p className="text-white font-bold">Smart Tailoring</p>
              <p className="text-slate-500 text-sm font-medium">Tailor your resume for specific roles with one click.</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-6">
          <div className="flex -space-x-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="w-10 h-10 rounded-full border-2 border-slate-900 bg-slate-800" />
            ))}
          </div>
          <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">Trusted by 10k+ seekers</p>
        </div>
      </div>

      {/* Form Side */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-16">
        <div className="w-full max-w-md space-y-10">
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-slate-900 dark:text-slate-50 tracking-tight">Welcome back</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Enter your details to access your dashboard.</p>
          </div>

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <span className="material-symbols-outlined text-[20px]">error</span>
              <p className="text-sm font-bold">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Email Address</label>
              <input 
                type="email" 
                required 
                className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border border-transparent dark:border-white/5 rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all font-bold placeholder:text-slate-400 dark:text-slate-100"
                placeholder="name@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Password</label>
                <button type="button" className="text-xs font-bold text-primary hover:underline">Forgot?</button>
              </div>
              <div className="relative">
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  required 
                  className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border border-transparent dark:border-white/5 rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all font-bold placeholder:text-slate-400 dark:text-slate-100"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-5 bg-primary text-white rounded-2xl font-black text-lg shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center gap-3"
            >
              {loading ? (
                <span className="material-symbols-outlined animate-spin">progress_activity</span>
              ) : (
                <>
                  Sign In
                  <span className="material-symbols-outlined">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100 dark:border-slate-800" /></div>
            <div className="relative flex justify-center text-xs font-black text-slate-400 uppercase tracking-widest"><span className="bg-white dark:bg-slate-950 px-4">Or continue with</span></div>
          </div>

          <button 
            onClick={handleGoogleLogin}
            type="button"
            className="w-full py-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/10 transition-all flex items-center justify-center gap-3 shadow-sm"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
            Google Account
          </button>

          <p className="text-center text-slate-500 font-medium">
            Don't have an account? <Link to="/signup" className="text-primary font-black hover:underline">Sign up free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

