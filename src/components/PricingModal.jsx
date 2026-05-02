import { paymentsAPI } from '../services/api';

export default function PricingModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const handleUpgrade = async (planType) => {
    try {
      const { url } = await paymentsAPI.createCheckoutSession(planType);
      window.location.href = url;
    } catch (err) {
      alert('Failed to start checkout: ' + err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      <div className="relative bg-surface-container-lowest border border-outline-variant/30 rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-8 border-b border-outline-variant/20 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-h1 text-on-surface">Upgrade Your Plan</h2>
            <p className="text-on-surface-variant text-body-sm mt-1">Choose a plan to get more AI tailoring credits.</p>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-surface-container transition-colors flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-on-surface-variant">close</span>
          </button>
        </div>

        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Plan */}
          <div className="bg-surface border border-outline-variant/50 rounded-2xl p-6 hover:border-primary/30 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-bold uppercase tracking-wider">Starter</span>
              <span className="text-2xl font-h1 text-on-surface">₹5</span>
            </div>
            <h3 className="text-xl font-h2 text-on-surface mb-2">Basic Pack</h3>
            <p className="text-on-surface-variant text-body-sm mb-6">Perfect for a few quick optimizations.</p>
            
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-2 text-body-sm text-on-surface">
                <span className="material-symbols-outlined text-primary text-lg">check_circle</span>
                3 AI Tailoring Credits
              </li>
              <li className="flex items-center gap-2 text-body-sm text-on-surface">
                <span className="material-symbols-outlined text-primary text-lg">check_circle</span>
                Gemini 2.0 Flash AI
              </li>
              <li className="flex items-center gap-2 text-body-sm text-on-surface">
                <span className="material-symbols-outlined text-primary text-lg">check_circle</span>
                ATS Keyword Matching
              </li>
            </ul>

            <button 
              onClick={() => handleUpgrade('basic')}
              className="w-full py-3 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl font-h3 transition-all border border-primary/20"
            >
              Get Credits
            </button>
          </div>

          {/* Pro Plan */}
          <div className="bg-surface-container-high border-2 border-primary rounded-2xl p-6 relative overflow-hidden shadow-lg hover:scale-[1.02] transition-all group">
            <div className="absolute top-0 right-0">
              <div className="bg-primary text-on-primary px-4 py-1 text-[10px] font-bold uppercase tracking-tighter rotate-45 translate-x-4 translate-y-2 shadow-sm">Best Value</div>
            </div>
            
            <div className="flex justify-between items-start mb-4">
              <span className="px-3 py-1 bg-primary text-on-primary rounded-full text-[10px] font-bold uppercase tracking-wider">Pro</span>
              <span className="text-2xl font-h1 text-on-surface">₹10</span>
            </div>
            <h3 className="text-xl font-h2 text-on-surface mb-2">Pro Pack</h3>
            <p className="text-on-surface-variant text-body-sm mb-6">For power users applying to multiple roles.</p>
            
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-2 text-body-sm text-on-surface font-semibold">
                <span className="material-symbols-outlined text-primary text-lg">verified</span>
                10 AI Tailoring Credits
              </li>
              <li className="flex items-center gap-2 text-body-sm text-on-surface">
                <span className="material-symbols-outlined text-primary text-lg">check_circle</span>
                Priority AI Processing
              </li>
              <li className="flex items-center gap-2 text-body-sm text-on-surface">
                <span className="material-symbols-outlined text-primary text-lg">check_circle</span>
                Strategic Career Advice
              </li>
            </ul>

            <button 
              onClick={() => handleUpgrade('pro')}
              className="w-full py-3 bg-gradient-to-r from-primary to-secondary text-on-primary rounded-xl font-h3 transition-all shadow-md hover:opacity-90 active:scale-95"
            >
              Upgrade Now
            </button>
          </div>
        </div>

        <div className="px-8 py-4 bg-surface-container-low text-center">
          <p className="text-[11px] text-on-surface-variant uppercase tracking-widest font-bold">Secure Payment via Stripe</p>
        </div>
      </div>
    </div>
  );
}
