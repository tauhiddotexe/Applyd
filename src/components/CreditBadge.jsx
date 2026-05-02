import { useState, useEffect } from 'react';
import { userAPI, paymentsAPI } from '../services/api';

export default function CreditBadge() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const data = await userAPI.getProfile();
      setProfile(data);
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planType) => {
    try {
      const { url } = await paymentsAPI.createCheckoutSession(planType);
      window.location.href = url;
    } catch (err) {
      alert('Failed to start checkout: ' + err.message);
    }
  };

  if (loading) return <div className="h-8 w-24 bg-surface-container animate-pulse rounded-full"></div>;
  if (!profile) return null;

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-high border border-outline-variant/30 rounded-full shadow-sm">
        <span className="material-symbols-outlined text-primary text-[18px]">token</span>
        <span className="font-h3 text-on-surface text-sm">{profile.credits} Credits</span>
      </div>
      
      {profile.credits <= 1 && (
        <div className="flex gap-2">
          <button 
            onClick={() => handleUpgrade('basic')}
            className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-full text-xs font-bold transition-all border border-primary/20"
          >
            +3 (₹5)
          </button>
          <button 
            onClick={() => handleUpgrade('pro')}
            className="px-3 py-1.5 bg-gradient-to-r from-primary to-secondary text-on-primary rounded-full text-xs font-bold transition-all shadow-md hover:scale-105 active:scale-95"
          >
            +10 (₹10)
          </button>
        </div>
      )}
    </div>
  );
}
