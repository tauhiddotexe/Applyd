import { NavLink, useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const { logout } = useAuth();

  return (
    <aside className="hidden lg:flex flex-col h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 fixed left-0 top-0 w-64 z-50">
      <div className="h-16 flex items-center px-6 border-b border-slate-100 dark:border-slate-800 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-[20px]">rocket_launch</span>
          </div>
          <span className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">Applyd</span>
        </div>
      </div>

      <div className="px-4 mb-6">
        <button
          onClick={() => navigate('/applications/new')}
          className="w-full bg-primary text-white py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <span className="material-symbols-outlined text-[20px]">add_circle</span>
          <span>Add Application</span>
        </button>
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
                  : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900'
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

      <div className="p-4 border-t border-slate-100 dark:border-slate-800">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-[13.5px] text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all group"
        >
          <span className="material-symbols-outlined text-[22px] text-slate-400 group-hover:text-red-500">logout</span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

