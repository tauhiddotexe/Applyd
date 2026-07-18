import { NavLink, useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';

const navItems = [
  { path: '/dashboard', icon: 'grid_view', label: 'Overview' },
  { path: '/applications', icon: 'layers', label: 'Applications', fillWhenActive: true },
  { path: '/analytics', icon: 'insights', label: 'Analytics' },
  { path: '/resume', icon: 'description', label: 'Resume Match', fillWhenActive: true },
  { path: '/resume-tailor', icon: 'auto_fix', label: 'Resume Tailor', fillWhenActive: true },
  { path: '/settings', icon: 'settings', label: 'Settings' },
];

export default function Sidebar() {
  const { user, profile, logout } = useAuth();
  const location = useLocation();
  const reduce = useReducedMotion();

  return (
    <aside className="hidden lg:flex flex-col h-screen bg-white dark:bg-dark-surface border-r border-slate-200 dark:border-white/[0.06] fixed left-0 top-0 w-64 z-50">
      <div className="h-16 flex items-center px-6 border-b border-slate-100 dark:border-white/[0.04] mb-6">
        <NavLink to="/dashboard" className="flex items-center gap-2.5 group">
          <motion.div
            className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20"
            whileHover={{ scale: 1.05, rotate: -5 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
          >
            <span className="material-symbols-outlined text-white text-[20px]">rocket_launch</span>
          </motion.div>
          <span className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">Applyd</span>
        </NavLink>
      </div>

      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto custom-scrollbar">
        <div className="px-4 mb-3 mt-1">
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">Main Menu</p>
        </div>
        {navItems.map(({ path, icon, label, fillWhenActive }, idx) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-2xl font-semibold text-[13.5px] transition-all duration-200 ${
                isActive
                  ? 'bg-primary/10 dark:bg-primary/[0.12] text-primary dark:text-primary-fixed'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.04] hover:text-slate-900 dark:hover:text-slate-200'
              }`
            }
            style={!reduce ? { animationDelay: `${idx * 40}ms` } : {}}
          >
            {({ isActive }) => (
              <>
                <span
                  className={`material-symbols-outlined text-[22px] transition-colors ${
                    isActive ? 'text-primary' : 'text-slate-400 dark:text-slate-500'
                  }`}
                  style={isActive && fillWhenActive ? { fontVariationSettings: "'FILL' 1" } : {}}
                >
                  {icon}
                </span>
                <span>{label}</span>
                {isActive && (
                  <motion.div
                    layoutId="sidebar-indicator"
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 mt-auto border-t border-slate-100 dark:border-white/[0.04] space-y-2">
        {profile && (
          <NavLink
            to="/profile"
            className="px-4 py-3.5 rounded-[20px] bg-slate-50/50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.05] flex items-center gap-3 hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-all group"
          >
            <motion.div
              className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-slate-200/50 dark:border-white/[0.08] overflow-hidden shrink-0"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
            >
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-black text-primary">
                  {profile.full_name ? profile.full_name[0].toUpperCase() : user?.email[0].toUpperCase()}
                </span>
              )}
            </motion.div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-black text-slate-900 dark:text-white truncate leading-none mb-1.5">
                {profile.full_name || user?.email.split('@')[0]}
              </p>
              <div className="flex items-center gap-1.5">
                {profile.plan?.toLowerCase() === 'free' ? (
                  <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.12em]">Free Plan</span>
                ) : (
                  <motion.span
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest shadow-sm ${
                      profile.plan?.toLowerCase() === 'pro'
                        ? 'bg-primary text-white'
                        : 'bg-emerald-500 text-white'
                    }`}
                  >
                    {profile.plan}
                  </motion.span>
                )}
              </div>
            </div>
          </NavLink>
        )}
        <motion.button
          onClick={logout}
          whileHover={{ x: 2 }}
          whileTap={{ scale: 0.98 }}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl font-semibold text-[13.5px] text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition-all group"
        >
          <span className="material-symbols-outlined text-[22px] text-slate-400 dark:text-slate-500 group-hover:text-red-500 dark:group-hover:text-red-400 transition-colors">logout</span>
          <span>Logout</span>
        </motion.button>
      </div>
    </aside>
  );
}
