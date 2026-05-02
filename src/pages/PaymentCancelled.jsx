import { Link } from 'react-router-dom';

export default function PaymentCancelled() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-10 text-center shadow-xl">
        <div className="w-20 h-20 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-8">
          <span className="material-symbols-outlined text-secondary text-4xl">cancel</span>
        </div>

        <h1 className="text-3xl font-h1 text-on-surface mb-4">Payment Cancelled</h1>
        <p className="text-on-surface-variant text-body-main mb-8 leading-relaxed">
          No worries! Your payment was cancelled and no charges were made. You can try again whenever you're ready.
        </p>

        <div className="space-y-4">
          <Link 
            to="/resume" 
            className="block w-full py-4 bg-primary text-on-primary rounded-2xl font-h3 shadow-md hover:opacity-90 active:scale-[0.98] transition-all"
          >
            Try Again
          </Link>
          <Link 
            to="/dashboard" 
            className="block w-full py-4 text-on-surface-variant hover:bg-surface-container rounded-2xl font-h3 transition-all"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
