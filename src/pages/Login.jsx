import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const reduce = useReducedMotion();

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
    <div className="min-h-screen flex bg-white dark:bg-dark-surface">
      {/* Visual Side */}
      <motion.div
        initial={reduce ? undefined : { opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="hidden lg:flex lg:w-[55%] relative overflow-hidden bg-slate-900 flex-col justify-between p-16"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-purple-500/10 pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/20 rounded-full blur-[120px]" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px]" />

        <div className="relative z-10">
          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <motion.div
              className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-xl flex items-center justify-center border border-white/10"
              whileHover={{ scale: 1.05, rotate: -5 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
            >
              <span className="material-symbols-outlined text-white text-2xl">rocket_launch</span>
            </motion.div>
            <span className="text-2xl font-black text-white tracking-tight">Applyd</span>
          </motion.div>
        </div>

        <div className="relative z-10 max-w-xl">
          <motion.h2
            className="text-5xl xl:text-6xl font-black text-white leading-[1.1] tracking-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            Elevate your <br />
            <span className="text-primary">career journey</span> <br />
            with intelligence.
          </motion.h2>
          <motion.p
            className="text-lg xl:text-xl text-slate-400 mt-6 leading-relaxed font-medium"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            Join thousands of professionals using AI to track, optimize, and land their dream roles faster than ever.
          </motion.p>

          <motion.div
            className="mt-10 grid grid-cols-2 gap-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            {[
              { icon: 'psychology', title: 'AI Resume Scoring', desc: 'Instantly check your match score against any job description.', color: 'text-primary' },
              { icon: 'auto_awesome', title: 'Smart Tailoring', desc: 'Tailor your resume for specific roles with one click.', color: 'text-purple-400' },
            ].map((item) => (
              <motion.div
                key={item.title}
                className="p-6 bg-white/5 backdrop-blur-md rounded-3xl border border-white/[0.06] space-y-3 hover:bg-white/[0.08] transition-all"
                whileHover={{ y: -2 }}
              >
                <span className={`material-symbols-outlined ${item.color} text-3xl block`}>{item.icon}</span>
                <p className="text-white font-bold">{item.title}</p>
                <p className="text-slate-500 text-sm font-medium">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>

        <motion.div
          className="relative z-10 flex items-center gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <div className="flex -space-x-3">
            {[1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                className="w-10 h-10 rounded-full border-2 border-slate-900 bg-slate-800"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.05 }}
              />
            ))}
          </div>
          <p className="text-slate-500 text-sm font-bold uppercase tracking-[0.12em]">Trusted by 10k+ seekers</p>
        </motion.div>
      </motion.div>

      {/* Form Side */}
      <motion.div
        className="flex-1 flex flex-col items-center justify-center p-6 md:p-16"
        initial={reduce ? undefined : { opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="w-full max-w-md space-y-8">
          <motion.div
            className="space-y-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">Welcome back</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Enter your details to access your dashboard.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl flex items-center gap-3">
                <span className="material-symbols-outlined text-[20px]">error</span>
                <p className="text-sm font-bold">{error}</p>
              </div>
            )}
          </motion.div>

          <motion.form
            onSubmit={handleSubmit}
            className="space-y-5"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.12em] px-1">Email Address</label>
              <input
                type="email"
                required
                className="w-full px-5 py-4 bg-slate-50 dark:bg-white/[0.04] border border-transparent dark:border-white/[0.06] rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all font-bold placeholder:text-slate-400 dark:text-white text-sm"
                placeholder="name@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.12em]">Password</label>
                <button type="button" onClick={() => toast('Password reset not available in dev mode')} className="text-xs font-bold text-primary hover:underline">Forgot?</button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-white/[0.04] border border-transparent dark:border-white/[0.06] rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all font-bold placeholder:text-slate-400 dark:text-white text-sm"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={loading ? undefined : { scale: 1.01 }}
              whileTap={loading ? undefined : { scale: 0.99 }}
              className="w-full py-4 bg-primary text-white rounded-2xl font-black text-base shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 disabled:opacity-50 transition-all flex items-center justify-center gap-3"
            >
              {loading ? (
                <span className="material-symbols-outlined animate-spin">progress_activity</span>
              ) : (
                <>
                  Sign In
                  <span className="material-symbols-outlined">arrow_forward</span>
                </>
              )}
            </motion.button>
          </motion.form>

          <motion.div
            className="relative"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
          >
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100 dark:border-slate-800" /></div>
            <div className="relative flex justify-center text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.1em]">
              <span className="bg-white dark:bg-dark-surface px-4">Or continue with</span>
            </div>
          </motion.div>

          <motion.button
            onClick={handleGoogleLogin}
            type="button"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="w-full py-4 bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-2xl font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/[0.08] transition-all flex items-center justify-center gap-3 shadow-sm"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google Account
          </motion.button>

          <motion.p
            className="text-center text-slate-500 font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
          >
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary font-black hover:underline">Sign up free</Link>
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
}
