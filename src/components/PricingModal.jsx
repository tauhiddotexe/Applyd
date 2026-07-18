import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { paymentsAPI } from '../services/api';

export default function PricingModal({ isOpen, onClose }) {
  const reduce = useReducedMotion();

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleUpgrade = async (planType) => {
    try {
      const { url } = await paymentsAPI.createCheckoutSession(planType);
      window.location.href = url;
    } catch (err) {
      alert('Failed to start checkout: ' + err.message);
    }
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-8 overflow-y-auto"
        >
          <motion.div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.div
            initial={reduce ? undefined : { opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative bg-white dark:bg-dark-surface border border-slate-200 dark:border-slate-800 rounded-[40px] shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto flex flex-col md:flex-row no-scrollbar"
          >
            {/* Visual Side */}
            <div className="hidden md:flex md:w-1/3 bg-slate-50 dark:bg-slate-950 p-10 flex-col justify-between border-r border-slate-100 dark:border-slate-800">
              <div className="space-y-6">
                <motion.div
                  className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center"
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                >
                  <span className="material-symbols-outlined text-primary text-2xl">auto_awesome</span>
                </motion.div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white leading-tight">Elevate your application game.</h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">Unlock the full power of AI to tailor your resume and stand out to recruiters.</p>
              </div>

              <motion.div
                className="space-y-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-emerald-500 text-[18px]">verified</span>
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Trusted by 10k+ seekers</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-blue-500 text-[18px]">security</span>
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Secure Stripe Payment</span>
                </div>
              </motion.div>
            </div>

            {/* Pricing Cards */}
            <div className="flex-1 p-6 md:p-12 space-y-8 relative">
              <motion.button
                onClick={onClose}
                whileHover={{ rotate: 90 }}
                transition={{ duration: 0.2 }}
                className="absolute top-6 right-6 w-10 h-10 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <span className="material-symbols-outlined">close</span>
              </motion.button>

              <motion.div
                className="text-center md:text-left"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Choose your pack</h3>
                <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Get instant access to AI tailoring credits.</p>
              </motion.div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Basic */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full text-[10px] font-black uppercase tracking-widest">Basic</span>
                      <div className="text-right">
                        <span className="text-2xl font-black text-slate-900 dark:text-white">₹100</span>
                        <span className="text-[10px] text-slate-400 block font-bold uppercase">one-time</span>
                      </div>
                    </div>
                    <div className="mb-6">
                      <p className="text-lg font-black text-slate-900 dark:text-white">15 AI Credits</p>
                      <p className="text-xs text-slate-500 font-medium mt-1">Perfect for essential tailoring.</p>
                    </div>
                    <ul className="space-y-3 mb-8">
                      {['AI Resume Matching', 'ATS Keyword Scoring', 'Standard Support'].map((feat) => (
                        <li key={feat} className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400">
                          <span className="material-symbols-outlined text-primary text-[16px]">check_circle</span>
                          {feat}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <motion.button
                    onClick={() => handleUpgrade('basic')}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-4 bg-slate-50 dark:bg-slate-800 hover:bg-primary/10 hover:text-primary text-slate-600 dark:text-slate-400 rounded-2xl font-black text-sm transition-all border border-transparent hover:border-primary/20"
                  >
                    Buy Credits
                  </motion.button>
                </motion.div>

                {/* Pro */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-slate-900 dark:bg-slate-950 border-2 border-primary rounded-3xl p-6 relative overflow-hidden shadow-2xl flex flex-col justify-between group"
                >
                  <div className="absolute -top-3 -right-3 w-28 h-28 bg-primary/20 rounded-full blur-3xl" />
                  <div className="absolute -bottom-3 -left-3 w-20 h-20 bg-purple-500/20 rounded-full blur-3xl" />

                  <div className="relative z-10">
                    <div className="flex justify-between items-center mb-6">
                      <motion.span
                        className="px-3 py-1 bg-primary text-white rounded-full text-[10px] font-black uppercase tracking-widest"
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        Recommended
                      </motion.span>
                      <div className="text-right">
                        <span className="text-2xl font-black text-white">₹180</span>
                        <span className="text-[10px] text-primary block font-bold uppercase">value pack</span>
                      </div>
                    </div>
                    <div className="mb-6">
                      <p className="text-lg font-black text-white">40 AI Credits</p>
                      <p className="text-xs text-slate-400 font-medium mt-1">For serious job seekers.</p>
                    </div>
                    <ul className="space-y-3 mb-8">
                      {['Everything in Basic', 'Priority AI Processing', 'Strategic AI Tips', 'Premium Support'].map((feat) => (
                        <li key={feat} className="flex items-center gap-2 text-xs font-bold text-slate-300">
                          <span className="material-symbols-outlined text-primary text-[16px]">verified</span>
                          {feat}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <motion.button
                    onClick={() => handleUpgrade('pro')}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-4 bg-primary text-white rounded-2xl font-black text-sm transition-all shadow-xl shadow-primary/40 hover:shadow-2xl hover:shadow-primary/50 relative z-10"
                  >
                    Upgrade to Pro
                  </motion.button>
                </motion.div>
              </div>

              <p className="text-center text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-[0.2em]">
                Payments secured by Stripe · Instant Activation
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
