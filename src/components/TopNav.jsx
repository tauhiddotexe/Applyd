import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';
import { userAPI } from '../services/api';
import PricingModal from './PricingModal';

const navItems = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/applications', label: 'Applications' },
  { path: '/analytics', label: 'Analytics' },
  { path: '/resume', label: 'Resume Match' },
];

export default function TopNav() {
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState(null);
  const [showPricing, setShowPricing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const data = await userAPI.getProfile();
      setProfile(data);
    } catch (err) {
      console.error('[TopNav] Failed to fetch profile:', err);
    }
  };

  if (loading || !user) {
    return (
      <nav className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 z-40 fixed top-0 left-0 right-0 h-16 px-6 flex items-center justify-between">
        <span className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">Applyd</span>
        <span className="material-symbols-outlined text-primary animate-spin">progress_activity</span>
      </nav>
    );
  }

  return (
    <nav className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 z-40 fixed top-0 left-0 right-0 h-16 px-6 flex items-center justify-between">
      <div className="flex items-center gap-8 flex-1">
        <span className="text-xl font-black text-slate-900 dark:text-white tracking-tighter hidden lg:block w-56">Applyd</span>
        
        {/* Search - Minimal and clean */}
        <div className="relative max-w-md w-full hidden md:block">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined text-[20px]">search</span>
          <input
            className="w-full pl-10 pr-4 py-2 bg-slate-100/50 dark:bg-slate-800/50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-slate-400"
            placeholder="Search anything..."
            type="text"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Credits */}
        {profile && (
          <div 
            onClick={() => setShowPricing(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-full cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all group"
          >
            <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-[18px] group-hover:rotate-12 transition-transform">token</span>
            <span className="text-xs font-bold text-blue-700 dark:text-blue-300">{profile.credits} Credits</span>
          </div>
        )}

        <div className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-800 ml-2 pl-4">
          <NavLink 
            to="/notifications"
            className={({ isActive }) => `p-2 rounded-xl transition-all ${isActive ? 'bg-primary/10 text-primary' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900'}`}
          >
            <span className="material-symbols-outlined text-[22px]">notifications</span>
          </NavLink>
          
          <NavLink 
            to="/profile"
            className="ml-2 flex items-center gap-3 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all group"
          >
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-700 group-hover:border-primary/30 transition-all">
              <img
                className="h-full w-full object-cover"
                alt="Avatar"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCp_ZeRpP-JXhtMeFoDEqKePr7N_DpijZwUpfY6FGf2FKSGM0wjV3RO61v6h7T-l5xte-S6hYKvaaWKd1q-A3pw83QJs_RWbXuDRx1Dlg7uLY_P3sAE-mTtScwEaeMVtrw5nBq3T_sxqtiIdoKZgeafkpyC_z0luYdV4zIrPYlrbko5q5DDTRjefSHaYUlFtnjVAqrDvjnUlaNq1s9HFyEN6gFpVFTHuuG8PY3F_6OttS6AIzFwZW7eSSWQptL5sV8YaQs4Ajni8sU"
              />
            </div>
          </NavLink>
        </div>
      </div>

      <PricingModal 
        isOpen={showPricing} 
        onClose={() => setShowPricing(false)} 
      />
    </nav>
  );
}

