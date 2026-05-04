import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Signup() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signup, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
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
    try {
      await loginWithGoogle();
    } catch (err) {
      setError(err.message || 'Google login failed');
    }
  };

  return (
    <div className="min-h-screen flex bg-white dark:bg-slate-950">
      {/* Visual Side */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden bg-slate-900 flex-col justify-between p-16">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-blue-500/10 pointer-events-none" />
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/20 rounded-full blur-[120px]" />
        
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-xl flex items-center justify-center border border-white/10">
            <span className="material-symbols-outlined text-white text-2xl">rocket_launch</span>
          </div>
          <span className="text-2xl font-black text-white tracking-tight">Applyd</span>
        </div>

        <div className="relative z-10">
          <h2 className="text-5xl font-black text-white leading-tight tracking-tight">
            Start your <br />
            <span className="text-primary">next chapter</span> <br />
            today.
          </h2>
          <p className="text-lg text-slate-400 mt-6 leading-relaxed font-medium">
            Create your account in seconds and unlock the full potential of AI-driven job hunting.
          </p>
          
          <div className="mt-12 space-y-6">
            {[
              { icon: 'verified_user', title: 'Secure & Private', desc: 'Your data is encrypted and never shared.' },
              { icon: 'speed', title: 'Lightning Fast', desc: 'Setup your profile and start tracking in minutes.' },
              { icon: 'auto_awesome', title: 'AI-Powered', desc: 'Get smart suggestions and scoring out of the box.' },
            ].map((f) => (
              <div key={f.title} className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/5">
                  <span className="material-symbols-outlined text-primary text-[20px]">{f.icon}</span>
                </div>
                <div>
                  <p className="text-white font-bold text-sm">{f.title}</p>
                  <p className="text-slate-500 text-xs font-medium mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-xs text-slate-500 font-bold uppercase tracking-widest">
          © 2026 Applyd · Future of Hiring
        </p>
      </div>

      {/* Form Side */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-16">
        <div className="w-full max-w-md space-y-10">
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-slate-900 dark:text-slate-50 tracking-tight">Create account</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Join professionals tracking their career growth.</p>
          </div>

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <span className="material-symbols-outlined text-[20px]">error</span>
              <p className="text-sm font-bold">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Full Name</label>
              <input 
                name="name"
                type="text" 
                required 
                className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border border-transparent dark:border-white/5 rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all font-bold placeholder:text-slate-400 dark:text-slate-100"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Email Address</label>
              <input 
                name="email"
                type="email" 
                required 
                className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border border-transparent dark:border-white/5 rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all font-bold placeholder:text-slate-400 dark:text-slate-100"
                placeholder="name@email.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Password</label>
                <input 
                  name="password"
                  type="password" 
                  required 
                  className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border border-transparent dark:border-white/5 rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all font-bold placeholder:text-slate-400 dark:text-slate-100"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Confirm</label>
                <input 
                  name="confirmPassword"
                  type="password" 
                  required 
                  className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border border-transparent dark:border-white/5 rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all font-bold placeholder:text-slate-400 dark:text-slate-100"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-5 mt-4 bg-primary text-white rounded-2xl font-black text-lg shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center gap-3"
            >
              {loading ? (
                <span className="material-symbols-outlined animate-spin">progress_activity</span>
              ) : (
                <>
                  Create Account
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
            Already have an account? <Link to="/login" className="text-primary font-black hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

