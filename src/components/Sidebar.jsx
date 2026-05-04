import { NavLink, useLocation } from 'react-router-dom';
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

  return (
    <aside className="hidden lg:flex flex-col h-screen bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-white/10 fixed left-0 top-0 w-64 z-50">
      <div className="h-16 flex items-center px-6 border-b border-slate-100 dark:border-white/5 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-[20px]">rocket_launch</span>
          </div>
          <span className="text-xl font-black text-slate-900 dark:text-slate-50 tracking-tighter">Applyd</span>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto custom-scrollbar">
        <div className="px-3 mb-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Main Menu</p>
        </div>
        {navItems.map(({ path, icon, label, fillWhenActive }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-[13.5px] transition-all ${
                isActive
                  ? 'bg-primary/5 text-primary'
                  : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-200'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`material-symbols-outlined text-[22px] ${isActive ? 'text-primary' : 'text-slate-400'}`}
                  style={isActive && fillWhenActive ? { fontVariationSettings: "'FILL' 1" } : {}}
                >
                  {icon}
                </span>
                <span>{label}</span>
                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-100 dark:border-white/5 space-y-2">
        {profile && (
          <div className="px-4 py-4 mb-2 rounded-[20px] bg-slate-50/50 dark:bg-white/2 border border-slate-100 dark:border-white/5 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-slate-200/50 dark:border-white/10 overflow-hidden shrink-0">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-black text-primary">
                  {profile.full_name ? profile.full_name[0].toUpperCase() : user?.email[0].toUpperCase()}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-black text-slate-900 dark:text-slate-50 truncate leading-none mb-1.5">
                {profile.full_name || user?.email.split('@')[0]}
              </p>
              <div className="flex items-center gap-1.5">
                {profile.plan?.toLowerCase() === 'free' ? (
                  <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Free Plan</span>
                ) : (
                  <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest shadow-sm ${
                    profile.plan?.toLowerCase() === 'pro' 
                      ? 'bg-primary text-white' 
                      : 'bg-emerald-500 text-white'
                  }`}>
                    {profile.plan}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-[13.5px] text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition-all group"
        >
          <span className="material-symbols-outlined text-[22px] text-slate-400 dark:text-slate-500 group-hover:text-red-500 dark:group-hover:text-red-400">logout</span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

