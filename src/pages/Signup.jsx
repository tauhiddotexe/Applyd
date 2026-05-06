import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Signup() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
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

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col">
      <main className="flex-grow flex items-center justify-center px-lg py-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-secondary opacity-[0.03] rounded-full blur-3xl"></div>
          <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-primary opacity-[0.03] rounded-full blur-3xl"></div>
        </div>

        <div className="w-full max-w-[440px]">
          <div className="flex flex-col items-center mb-xl">
            <div className="mb-md flex items-center justify-center w-12 h-12 rounded-xl bg-primary-container text-on-primary-container">
              <span className="material-symbols-outlined text-3xl">rocket_launch</span>
            </div>
            <h1 className="font-h1 text-h1 tracking-tighter text-on-surface">Applyd</h1>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-xs">Start your career journey</p>
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-[0px_4px_12px_rgba(0,0,0,0.03)] p-xl">
            <div className="mb-lg">
              <h2 className="font-h2 text-h2 text-on-surface">Create your account</h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Join thousands of professionals tracking their career growth.</p>
            </div>

            {error && (
              <div className="mb-lg p-md bg-error-container text-on-error-container rounded-lg text-body-sm font-medium">{error}</div>
            )}

            <form className="space-y-lg" onSubmit={handleSubmit}>
              <div className="space-y-xs">
                <label className="font-label-caps text-label-caps text-on-surface-variant uppercase" htmlFor="name">Full Name</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-md flex items-center pointer-events-none text-outline">
                    <span className="material-symbols-outlined text-lg">person</span>
                  </div>
                  <input className="w-full bg-surface-bright border border-outline-variant rounded-lg py-md pl-[44px] pr-md font-body-main text-body-main focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all duration-200" id="name" name="name" type="text" placeholder="John Doe" value={formData.name} onChange={handleChange} required />
                </div>
              </div>

              <div className="space-y-xs">
                <label className="font-label-caps text-label-caps text-on-surface-variant uppercase" htmlFor="signup-email">Email Address</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-md flex items-center pointer-events-none text-outline">
                    <span className="material-symbols-outlined text-lg">mail</span>
                  </div>
                  <input className="w-full bg-surface-bright border border-outline-variant rounded-lg py-md pl-[44px] pr-md font-body-main text-body-main focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all duration-200" id="signup-email" name="email" type="email" placeholder="name@company.com" value={formData.email} onChange={handleChange} required />
                </div>
              </div>

              <div className="space-y-xs">
                <label className="font-label-caps text-label-caps text-on-surface-variant uppercase" htmlFor="signup-password">Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-md flex items-center pointer-events-none text-outline">
                    <span className="material-symbols-outlined text-lg">lock</span>
                  </div>
                  <input className="w-full bg-surface-bright border border-outline-variant rounded-lg py-md pl-[44px] pr-md font-body-main text-body-main focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all duration-200" id="signup-password" name="password" type="password" placeholder="••••••••" value={formData.password} onChange={handleChange} required />
                </div>
              </div>

              <div className="space-y-xs">
                <label className="font-label-caps text-label-caps text-on-surface-variant uppercase" htmlFor="confirm-password">Confirm Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-md flex items-center pointer-events-none text-outline">
                    <span className="material-symbols-outlined text-lg">lock</span>
                  </div>
                  <input className="w-full bg-surface-bright border border-outline-variant rounded-lg py-md pl-[44px] pr-md font-body-main text-body-main focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all duration-200" id="confirm-password" name="confirmPassword" type="password" placeholder="••••••••" value={formData.confirmPassword} onChange={handleChange} required />
                </div>
              </div>

              <button className="w-full bg-secondary text-on-secondary py-md px-lg rounded-lg font-h3 text-h3 hover:opacity-90 active:scale-[0.98] transition-all duration-200 shadow-sm flex items-center justify-center gap-sm disabled:opacity-50" type="submit" disabled={loading}>
                {loading ? 'Creating account...' : 'Create Account'}
                {!loading && <span className="material-symbols-outlined text-lg">arrow_forward</span>}
              </button>
            </form>

            <div className="relative my-xl">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-outline-variant"></span></div>
              <div className="relative flex justify-center text-label-caps uppercase"><span className="bg-surface-container-lowest px-md text-outline">Or continue with</span></div>
            </div>

            <button className="w-full bg-surface-bright border border-outline-variant text-on-surface py-md px-lg rounded-lg font-body-main text-body-main flex items-center justify-center gap-md hover:bg-surface-container-low transition-colors duration-200" type="button">
              <img alt="Google Logo" className="w-5 h-5" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCRIfAk060UN_l_mmncB1IT1yTxpYtKdgJSDKwC_FpGbs5tGia41zK4K_8he1NaeUM5udB7X5HuuIUWgT0OMPS8tRwqS_WUaFykoahtAqXC7ybjzyHCJOKCQGvrbZncTpl4DLO9v4Xa7xSWZjPgLxaXtmtbHZfRoMHJ0bEN6x4mWSyaB-UecR8hWUsDwK6Z0SkRy2owh6PjHvUUMO5kUqgqpOP8Tj1QXWAGGFMNd1h18u8fj4hh8Whar5VvCKziQS46D3ftMvMAmbc" />
              Continue with Google
            </button>
          </div>

          <p className="mt-lg text-center font-body-main text-body-main text-on-surface-variant">
            Already have an account? <Link className="text-primary font-semibold hover:underline" to="/login">Sign in</Link>
          </p>
        </div>
      </main>

      <footer className="py-lg px-xl flex flex-col md:flex-row items-center justify-between border-t border-outline-variant/30 gap-md">
        <div className="flex items-center gap-xs">
          <span className="material-symbols-outlined text-sm text-outline">verified</span>
          <span className="font-label-caps text-label-caps text-outline uppercase">Secure &amp; Encrypted Professional Suite</span>
        </div>
        <nav className="flex gap-lg">
          <a className="font-label-caps text-label-caps text-outline uppercase hover:text-on-surface transition-colors" href="#">Privacy</a>
          <a className="font-label-caps text-label-caps text-outline uppercase hover:text-on-surface transition-colors" href="#">Terms</a>
          <a className="font-label-caps text-label-caps text-outline uppercase hover:text-on-surface transition-colors" href="#">Support</a>
        </nav>
      </footer>
    </div>
  );
}
