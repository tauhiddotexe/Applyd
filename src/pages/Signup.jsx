import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';

export default function Signup() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signup, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const reduce = useReducedMotion();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (formData.password !== formData.confirmPassword) { setError('Passwords do not match'); return; }
    if (formData.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await signup({ name: formData.name, email: formData.email, password: formData.password });
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    try { await loginWithGoogle(); } catch (err) { setError(err.message || 'Google login failed'); }
  };

  return (
    <div className="min-h-screen flex bg-white dark:bg-dark-surface">
      {/* Visual Side */}
      <motion.div
        initial={reduce ? undefined : { opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="hidden lg:flex lg:w-[45%] relative overflow-hidden bg-slate-900 flex-col justify-between p-16"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-blue-500/10 pointer-events-none" />
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/20 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/3 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[150px]" />

        <div className="relative z-10">
          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <motion.div
              className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-xl flex items-center justify-center border border-white/10"
              whileHover={{ scale: 1.05, rotate: -5 }}
            >
              <span className="material-symbols-outlined text-white text-2xl">rocket_launch</span>
            </motion.div>
            <span className="text-2xl font-black text-white tracking-tight">Applyd</span>
          </motion.div>
        </div>

        <div className="relative z-10">
          <motion.h2
            className="text-5xl font-black text-white leading-tight tracking-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            Start your <br />
            <span className="text-primary">next chapter</span> <br />
            today.
          </motion.h2>
          <motion.p
            className="text-lg text-slate-400 mt-6 leading-relaxed font-medium"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            Create your account in seconds and unlock the full potential of AI-driven job hunting.
          </motion.p>

          <motion.div
            className="mt-12 space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            {[
              { icon: 'verified_user', title: 'Secure & Private', desc: 'Your data is encrypted and never shared.' },
              { icon: 'speed', title: 'Lightning Fast', desc: 'Setup your profile and start tracking in minutes.' },
              { icon: 'auto_awesome', title: 'AI-Powered', desc: 'Get smart suggestions and scoring out of the box.' },
            ].map((f, idx) => (
              <motion.div
                key={f.title}
                className="flex gap-4"
                whileHover={{ x: 4 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/5">
                  <span className="material-symbols-outlined text-primary text-[20px]">{f.icon}</span>
                </div>
                <div>
                  <p className="text-white font-bold text-sm">{f.title}</p>
                  <p className="text-slate-500 text-xs font-medium mt-0.5">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        <motion.p
          className="relative z-10 text-[11px] text-slate-500 font-bold uppercase tracking-[0.12em]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          &copy; 2026 Applyd &middot; Future of Hiring
        </motion.p>
      </motion.div>

      {/* Form Side */}
      <motion.div
        className="flex-1 flex flex-col items-center justify-center p-6 md:p-16"
        initial={reduce ? undefined : { opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="w-full max-w-md space-y-7">
          <motion.div
            className="space-y-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">Create account</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Join professionals tracking their career growth.</p>
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
            className="space-y-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.12em] px-1">Full Name</label>
              <input
                name="name"
                type="text"
                required
                className="w-full px-5 py-4 bg-slate-50 dark:bg-white/[0.04] border border-transparent dark:border-white/[0.06] rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all font-bold placeholder:text-slate-400 dark:text-white text-sm"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.12em] px-1">Email Address</label>
              <input
                name="email"
                type="email"
                required
                className="w-full px-5 py-4 bg-slate-50 dark:bg-white/[0.04] border border-transparent dark:border-white/[0.06] rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all font-bold placeholder:text-slate-400 dark:text-white text-sm"
                placeholder="name@email.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.12em] px-1">Password</label>
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-white/[0.04] border border-transparent dark:border-white/[0.06] rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all font-bold placeholder:text-slate-400 dark:text-white text-sm"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.12em] px-1">Confirm</label>
                <input
                  name="confirmPassword"
                  type="password"
                  required
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-white/[0.04] border border-transparent dark:border-white/[0.06] rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all font-bold placeholder:text-slate-400 dark:text-white text-sm"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={loading ? undefined : { scale: 1.01 }}
              whileTap={loading ? undefined : { scale: 0.99 }}
              className="w-full py-4 mt-2 bg-primary text-white rounded-2xl font-black text-base shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 disabled:opacity-50 transition-all flex items-center justify-center gap-3"
            >
              {loading ? (
                <span className="material-symbols-outlined animate-spin">progress_activity</span>
              ) : (
                <>
                  Create Account
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
            Already have an account? <Link to="/login" className="text-primary font-black hover:underline">Sign in</Link>
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
}
