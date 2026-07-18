import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const { refreshProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (sessionId) {
      const timer = setTimeout(() => {
        verifyPayment();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [sessionId]);

  const verifyPayment = async () => {
    try {
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
      <motion.div
        initial={reduce ? {} : { opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="max-w-lg w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[40px] p-12 text-center shadow-2xl shadow-slate-200/50 dark:shadow-none"
      >
        <motion.div
          initial={reduce ? {} : { scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
          className="w-24 h-24 bg-primary/10 rounded-[32px] flex items-center justify-center mx-auto mb-10 relative"
        >
          <motion.div
            initial={{ opacity: 0.5 }}
            animate={{ opacity: [0.5, 0.2, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-0 rounded-[32px] border-4 border-primary/20"
          />
          <span className="material-symbols-outlined text-primary text-5xl">verified</span>
        </motion.div>

        <h1 className="text-4xl font-black text-slate-900 dark:text-slate-50 mb-4 tracking-tight leading-tight">Payment Successful!</h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium mb-10 leading-relaxed px-4">
          Thank you for upgrading. Your credits have been added to your account. You're all set to dominate your next application!
        </p>

        <motion.div
          initial={reduce ? {} : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-4 max-w-xs mx-auto"
        >
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
        </motion.div>

        {error && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-8 p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-2xl">
            <p className="text-xs text-red-600 dark:text-red-400 font-bold">{error}</p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
