import { NavLink } from 'react-router-dom';

const navItems = [
  { path: '/dashboard', icon: 'dashboard', label: 'Home' },
  { path: '/applications', icon: 'work', label: 'Apps', fillWhenActive: true },
  { path: '/analytics', icon: 'bar_chart', label: 'Stats' },
];

export default function MobileNav() {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 flex justify-around items-center h-16">
      {navItems.map(({ path, icon, label, fillWhenActive }) => (
        <NavLink
          key={path}
          to={path}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-1 ${
              isActive ? 'text-blue-600' : 'text-slate-500'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <span
                className="material-symbols-outlined"
                style={isActive && fillWhenActive ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                {icon}
              </span>
              <span className="text-[10px] font-medium uppercase tracking-tight">{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </div>
  );
}
