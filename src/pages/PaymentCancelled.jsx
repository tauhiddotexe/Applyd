import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';

export default function PaymentCancelled() {
  const reduce = useReducedMotion();

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
          className="w-24 h-24 bg-slate-100 dark:bg-white/5 rounded-[32px] flex items-center justify-center mx-auto mb-10"
        >
          <span className="material-symbols-outlined text-slate-400 text-5xl">cancel</span>
        </motion.div>

        <h1 className="text-4xl font-black text-slate-900 dark:text-slate-50 mb-4 tracking-tight leading-tight">Payment Cancelled</h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium mb-10 leading-relaxed px-4">
          No worries! Your payment was cancelled and no charges were made. You can try again whenever you're ready.
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
            <span className="material-symbols-outlined text-[20px]">refresh</span>
            Try Again
          </Link>
          <Link
            to="/dashboard"
            className="flex items-center justify-center gap-2 w-full py-4 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 rounded-2xl font-black hover:bg-slate-200 dark:hover:bg-white/10 transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">grid_view</span>
            Dashboard
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
