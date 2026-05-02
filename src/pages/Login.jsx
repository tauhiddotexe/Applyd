import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
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

  return (
    <div className="bg-surface text-on-surface min-h-screen flex">
      {/* Branding Side - Hidden on mobile */}
      <div className="hidden lg:flex lg:w-[45%] bg-gradient-to-br from-primary/8 via-secondary/5 to-primary/3 relative overflow-hidden flex-col justify-between p-12">
        {/* Decorative blurs */}
        <div className="absolute top-[-15%] right-[-10%] w-[500px] h-[500px] bg-primary opacity-[0.06] rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-15%] left-[-10%] w-[400px] h-[400px] bg-secondary opacity-[0.06] rounded-full blur-3xl"></div>

        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-2xl">rocket_launch</span>
            </div>
            <span className="font-h2 text-[20px] tracking-tight text-on-surface">Applyd</span>
          </div>
        </div>

        <div className="max-w-sm">
          <h2 className="font-h1 text-[32px] text-on-surface leading-tight mb-4">
            Track, analyze, and land your dream job.
          </h2>
          <p className="text-[14px] text-on-surface-variant leading-relaxed mb-8">
            Join professionals who use AI-powered tools to optimize their resumes, track applications, and close offers faster.
          </p>

          <div className="space-y-4">
            {[
              { icon: 'analytics', text: 'AI Resume Analysis & Scoring' },
              { icon: 'auto_awesome', text: 'Smart Resume Tailoring' },
              { icon: 'monitoring', text: 'Application Pipeline Tracking' },
            ].map((feature) => (
              <div key={feature.text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-primary text-[18px]">{feature.icon}</span>
                </div>
                <span className="text-[13px] text-on-surface font-medium">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-[11px] text-on-surface-variant">
          © 2026 Applyd · Professional Career Tools
        </p>
      </div>

      {/* Form Side */}
      <div className="flex-1 flex flex-col">
        <main className="flex-grow flex items-center justify-center px-6 py-12 relative overflow-hidden">
          {/* Background blurs (mobile only aesthetic) */}
          <div className="absolute top-0 left-0 w-full h-full -z-10 overflow-hidden pointer-events-none lg:hidden">
            <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-secondary opacity-[0.03] rounded-full blur-3xl"></div>
            <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-primary opacity-[0.03] rounded-full blur-3xl"></div>
          </div>

          <div className="w-full max-w-[400px]">
            {/* Brand - Mobile only */}
            <div className="flex flex-col items-center mb-8 lg:hidden">
              <div className="mb-3 flex items-center justify-center w-12 h-12 rounded-xl bg-primary-container text-on-primary-container">
                <span className="material-symbols-outlined text-3xl">rocket_launch</span>
              </div>
              <h1 className="font-h1 text-h1 tracking-tighter text-on-surface">Applyd</h1>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Professional Job Application Tracker</p>
            </div>

            {/* Login Card */}
            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-[0px_4px_16px_rgba(0,0,0,0.04)] p-8">
              <div className="mb-6">
                <h2 className="font-h2 text-[22px] text-on-surface mb-1">Welcome back</h2>
                <p className="text-[13px] text-on-surface-variant">Enter your credentials to continue.</p>
              </div>

              {error && (
                <div className="mb-5 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-[13px] font-medium flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">error</span>
                  {error}
                </div>
              )}

              <form className="space-y-5" onSubmit={handleSubmit}>
                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-[11px] text-on-surface-variant uppercase tracking-wider font-bold" htmlFor="email">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-outline">
                      <span className="material-symbols-outlined text-[18px]">mail</span>
                    </div>
                    <input
                      className="w-full bg-surface border border-outline-variant/50 rounded-lg py-3 pl-10 pr-4 text-[14px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      id="email"
                      type="email"
                      placeholder="name@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] text-on-surface-variant uppercase tracking-wider font-bold" htmlFor="password">Password</label>
                    <a className="text-[11px] text-primary font-semibold hover:underline" href="#">Forgot?</a>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-outline">
                      <span className="material-symbols-outlined text-[18px]">lock</span>
                    </div>
                    <input
                      className="w-full bg-surface border border-outline-variant/50 rounded-lg py-3 pl-10 pr-10 text-[14px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-outline hover:text-on-surface transition-colors cursor-pointer"
                      tabIndex={-1}
                    >
                      <span className="material-symbols-outlined text-[18px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <button
                  className="w-full bg-primary text-on-primary py-3 px-6 rounded-lg font-semibold text-[14px] hover:opacity-90 active:scale-[0.98] transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In
                      <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-outline-variant/30"></span>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-surface-container-lowest px-3 text-[10px] text-outline uppercase tracking-wider">Or continue with</span>
                </div>
              </div>

              {/* Google SSO */}
              <button className="w-full bg-surface border border-outline-variant/40 text-on-surface py-3 px-6 rounded-lg text-[14px] flex items-center justify-center gap-3 hover:bg-surface-container-low transition-colors cursor-pointer" type="button">
                <img
                  alt="Google Logo"
                  className="w-5 h-5"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCRIfAk060UN_l_mmncB1IT1yTxpYtKdgJSDKwC_FpGbs5tGia41zK4K_8he1NaeUM5udB7X5HuuIUWgT0OMPS8tRwqS_WUaFykoahtAqXC7ybjzyHCJOKCQGvrbZncTpl4DLO9v4Xa7xSWZjPgLxaXtmtbHZfRoMHJ0bEN6x4mWSyaB-UecR8hWUsDwK6Z0SkRy2owh6PjHvUUMO5kUqgqpOP8Tj1QXWAGGFMNd1h18u8fj4hh8Whar5VvCKziQS46D3ftMvMAmbc"
                />
                Continue with Google
              </button>
            </div>

            {/* Footer */}
            <p className="mt-6 text-center text-[13px] text-on-surface-variant">
              Don't have an account?{' '}
              <Link className="text-primary font-semibold hover:underline" to="/signup">Sign up for free</Link>
            </p>
          </div>
        </main>

        <footer className="py-4 px-6 flex flex-col md:flex-row items-center justify-between border-t border-outline-variant/20 gap-3">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[14px] text-outline">verified</span>
            <span className="text-[10px] text-outline uppercase tracking-wider font-medium">Secure &amp; Encrypted</span>
          </div>
          <nav className="flex gap-6">
            <a className="text-[10px] text-outline uppercase tracking-wider hover:text-on-surface transition-colors" href="#">Privacy</a>
            <a className="text-[10px] text-outline uppercase tracking-wider hover:text-on-surface transition-colors" href="#">Terms</a>
            <a className="text-[10px] text-outline uppercase tracking-wider hover:text-on-surface transition-colors" href="#">Support</a>
          </nav>
        </footer>
      </div>
    </div>
  );
}
