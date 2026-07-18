import { NavLink, useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';

const navItems = [
  { path: '/dashboard', icon: 'dashboard', label: 'Home' },
  { path: '/applications', icon: 'work', label: 'Apps', fillWhenActive: true },
  { path: '/analytics', icon: 'bar_chart', label: 'Stats' },
  { path: '/resume', icon: 'psychology', label: 'Match', fillWhenActive: true },
  { path: '/resume-tailor', icon: 'auto_awesome', label: 'Tailor', fillWhenActive: true },
];

export default function MobileNav() {
  const location = useLocation();
  const reduce = useReducedMotion();

  return (
    <motion.div
      initial={reduce ? undefined : { y: 60 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-dark-surface/90 backdrop-blur-lg border-t border-slate-200 dark:border-white/[0.06] z-50 flex justify-around items-center h-[72px] pb-safe"
    >
      {navItems.map(({ path, icon, label, fillWhenActive }) => {
        const isActive = location.pathname === path || location.pathname.startsWith(path + '/');
        return (
          <NavLink
            key={path}
            to={path}
            className="flex flex-col items-center justify-center gap-0.5 relative w-16 py-1"
          >
            {({ isActive: active }) => (
              <>
                <div className="relative">
                  {active && !reduce && (
                    <motion.div
                      layoutId="mobile-nav-indicator"
                      className="absolute -inset-2 bg-primary/10 dark:bg-primary/[0.15] rounded-xl"
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    />
                  )}
                  <span
                    className={`material-symbols-outlined text-[22px] relative z-10 transition-colors ${
                      active ? 'text-primary' : 'text-slate-400 dark:text-slate-500'
                    }`}
                    style={active && fillWhenActive ? { fontVariationSettings: "'FILL' 1" } : {}}
                  >
                    {icon}
                  </span>
                </div>
                <span className={`text-[9px] font-bold uppercase tracking-tight relative z-10 ${
                  active ? 'text-primary' : 'text-slate-500 dark:text-slate-400'
                }`}>
                  {label}
                </span>
              </>
            )}
          </NavLink>
        );
      })}
    </motion.div>
  );
}
