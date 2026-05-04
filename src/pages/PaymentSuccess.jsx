import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { userAPI } from '../services/api';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (sessionId) {
      // Small delay to allow webhook to process (though idempotent backend handles this)
      const timer = setTimeout(() => {
        verifyPayment();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [sessionId]);

  const verifyPayment = async () => {
    try {
      // Refresh the global profile state to update credits/plan everywhere
      await refreshProfile();
      setLoading(false);
    } catch (err) {
      console.error('Verification failed:', err);
      setError('We are still processing your payment. Your credits will appear shortly.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[40px] p-12 text-center shadow-2xl shadow-slate-200/50 dark:shadow-none animate-in fade-in zoom-in-95 duration-500">
        <div className="w-24 h-24 bg-primary/10 rounded-[32px] flex items-center justify-center mx-auto mb-10 relative">
          <div className="absolute inset-0 rounded-[32px] border-4 border-primary/20 animate-ping duration-1000"></div>
          <span className="material-symbols-outlined text-primary text-5xl">verified</span>
        </div>

        <h1 className="text-4xl font-black text-slate-900 dark:text-slate-50 mb-4 tracking-tight leading-tight">Payment Successful!</h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium mb-10 leading-relaxed px-4">
          Thank you for upgrading. Your credits have been added to your account. You're all set to dominate your next application!
        </p>

        <div className="space-y-4 max-w-xs mx-auto">
          <Link 
            to="/resume" 
            className="flex items-center justify-center gap-2 w-full py-4 bg-primary text-white rounded-2xl font-black shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">auto_fix</span>
            Resume Tailor
          </Link>
          <Link 
            to="/dashboard" 
            className="flex items-center justify-center gap-2 w-full py-4 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 rounded-2xl font-black hover:bg-slate-200 dark:hover:bg-white/10 transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">grid_view</span>
            Dashboard
          </Link>
        </div>

        {error && (
          <div className="mt-8 p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-2xl">
            <p className="text-xs text-red-600 dark:text-red-400 font-bold">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
