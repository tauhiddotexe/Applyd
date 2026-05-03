import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { paymentsAPI } from '../services/api';

export default function PricingModal({ isOpen, onClose }) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!isOpen) return null;

  const handleUpgrade = async (planType) => {
    try {
      const { url } = await paymentsAPI.createCheckoutSession(planType);
      window.location.href = url;
    } catch (err) {
      alert('Failed to start checkout: ' + err.message);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-8 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity duration-300" 
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[40px] shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-300 flex flex-col md:flex-row no-scrollbar">
        
        {/* Visual Side (Left) */}
        <div className="hidden md:flex md:w-1/3 bg-slate-50 dark:bg-slate-950 p-10 flex-col justify-between border-r border-slate-100 dark:border-slate-800">
          <div className="space-y-6">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-2xl">auto_awesome</span>
            </div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white leading-tight">Elevate your application game.</h2>
            <p className="text-slate-500 font-medium leading-relaxed">Unlock the full power of AI to tailor your resume and stand out to recruiters.</p>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-emerald-500 text-[18px]">verified</span>
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Trusted by 10k+ seekers</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-blue-500 text-[18px]">security</span>
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Secure Stripe Payment</span>
            </div>
          </div>
        </div>

        {/* Pricing Cards (Right) */}
        <div className="flex-1 p-8 md:p-12 space-y-10 relative">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 w-10 h-10 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center justify-center text-slate-400 hover:text-slate-900"
          >
            <span className="material-symbols-outlined">close</span>
          </button>

          <div className="text-center md:text-left">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Choose your pack</h3>
            <p className="text-slate-500 font-medium mt-1">Get instant access to AI tailoring credits.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Basic Plan */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all flex flex-col justify-between group">
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

              <button 
                onClick={() => handleUpgrade('basic')}
                className="w-full py-4 bg-slate-50 dark:bg-slate-800 hover:bg-primary/10 hover:text-primary text-slate-600 dark:text-slate-400 rounded-2xl font-black text-sm transition-all border border-transparent hover:border-primary/20"
              >
                Buy Credits
              </button>
            </div>

            {/* Pro Plan */}
            <div className="bg-slate-900 dark:bg-slate-950 border-2 border-primary rounded-3xl p-6 relative overflow-hidden shadow-2xl flex flex-col justify-between group hover:scale-[1.02] transition-all">
              <div className="absolute -top-3 -right-3 w-20 h-20 bg-primary/20 rounded-full blur-2xl" />
              
              <div className="relative z-10">
                <div className="flex justify-between items-center mb-6">
                  <span className="px-3 py-1 bg-primary text-white rounded-full text-[10px] font-black uppercase tracking-widest">Recommended</span>
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

              <button 
                onClick={() => handleUpgrade('pro')}
                className="w-full py-4 bg-primary text-white rounded-2xl font-black text-sm transition-all shadow-xl shadow-primary/40 hover:bg-primary/90 relative z-10"
              >
                Upgrade to Pro
              </button>
            </div>
          </div>

          <p className="text-center text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">
            Payments secured by Stripe · Instant Activation
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}

