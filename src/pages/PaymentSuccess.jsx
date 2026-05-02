import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { userAPI } from '../services/api';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const navigate = useNavigate();
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
      // Just fetch profile to see updated credits
      const profile = await userAPI.getProfile();
      setLoading(false);
    } catch (err) {
      console.error('Verification failed:', err);
      setError('We are still processing your payment. Your credits will appear shortly.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-10 text-center shadow-2xl animate-in fade-in zoom-in-95 duration-500">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-8 relative">
          <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-ping duration-1000"></div>
          <span className="material-symbols-outlined text-primary text-4xl">check_circle</span>
        </div>

        <h1 className="text-3xl font-h1 text-on-surface mb-4">Payment Successful!</h1>
        <p className="text-on-surface-variant text-body-main mb-8 leading-relaxed">
          Thank you for upgrading. Your credits have been added to your account. You're all set to tailor your next resume!
        </p>

        <div className="space-y-4">
          <Link 
            to="/resume" 
            className="block w-full py-4 bg-primary text-on-primary rounded-2xl font-h3 shadow-md hover:opacity-90 active:scale-[0.98] transition-all"
          >
            Back to Resume Tailor
          </Link>
          <Link 
            to="/dashboard" 
            className="block w-full py-4 text-on-surface-variant hover:bg-surface-container rounded-2xl font-h3 transition-all"
          >
            Go to Dashboard
          </Link>
        </div>

        {error && (
          <p className="mt-6 text-xs text-secondary font-medium animate-pulse">{error}</p>
        )}
      </div>
    </div>
  );
}
