import { NavLink, useNavigate } from 'react-router-dom';

const navItems = [
  { path: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
  { path: '/applications', icon: 'work', label: 'Applications', fillWhenActive: true },
  { path: '/analytics', icon: 'bar_chart', label: 'Analytics' },
];

export default function Sidebar() {
  const navigate = useNavigate();

  return (
    <aside className="hidden lg:flex flex-col gap-1 p-4 h-full bg-slate-50 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 fixed left-0 top-16 w-64 z-30">
      <div className="mb-6 px-4 py-2">
        <h2 className="text-lg font-black text-blue-600 dark:text-blue-500">Smart Tracker</h2>
        <p className="text-[11px] text-slate-500 uppercase tracking-widest font-semibold">Professional Suite</p>
      </div>
      <nav className="flex-1 space-y-1">
        {navItems.map(({ path, icon, label, fillWhenActive }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium text-[13px] transition-all ${
                isActive
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 hover:text-slate-900'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className="material-symbols-outlined text-[20px]"
                  style={isActive && fillWhenActive ? { fontVariationSettings: "'FILL' 1" } : {}}
                >
                  {icon}
                </span>
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto pt-4 border-t border-slate-200 dark:border-slate-800">
        <button
          onClick={() => navigate('/applications/new')}
          className="w-full bg-primary text-on-primary py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 font-semibold text-[13px] hover:opacity-90 transition-opacity"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span>Add Application</span>
        </button>
      </div>
    </aside>
  );
}
