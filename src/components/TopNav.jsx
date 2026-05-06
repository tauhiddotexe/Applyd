import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const navItems = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/applications', label: 'Applications' },
  { path: '/analytics', label: 'Analytics' },
];

export default function TopNav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-40 fixed top-0 left-0 right-0 shadow-sm dark:shadow-none flex items-center justify-between w-full h-16 px-10">
      <div className="flex items-center gap-6">
        <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tighter">Applyd</span>
        <div className="hidden md:flex gap-6 items-center">
          {navItems.map(({ path, label }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `font-['Inter'] text-sm tracking-tight transition-colors duration-200 ${
                  isActive
                    ? 'text-blue-600 dark:text-blue-400 font-semibold border-b-2 border-blue-600 py-5'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="relative hidden lg:block">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined text-sm">search</span>
            <input
              className="pl-10 pr-4 py-1.5 border border-slate-200 rounded-full text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all w-64 bg-slate-50"
              placeholder="Search applications..."
              type="text"
            />
          </div>
          <button className="p-2 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-colors duration-200">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button className="p-2 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-colors duration-200">
            <span className="material-symbols-outlined">settings</span>
          </button>
        </div>
        <div className="h-8 w-[1px] bg-slate-200 mx-2"></div>
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-slate-200 overflow-hidden">
            <img
              className="h-full w-full object-cover"
              alt="User avatar"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCp_ZeRpP-JXhtMeFoDEqKePr7N_DpijZwUpfY6FGf2FKSGM0wjV3RO61v6h7T-l5xte-S6hYKvaaWKd1q-A3pw83QJs_RWbXuDRx1Dlg7uLY_P3sAE-mTtScwEaeMVtrw5nBq3T_sxqtiIdoKZgeafkpyC_z0luYdV4zIrPYlrbko5q5DDTRjefSHaYUlFtnjVAqrDvjnUlaNq1s9HFyEN6gFpVFTHuuG8PY3F_6OttS6AIzFwZW7eSSWQptL5sV8YaQs4Ajni8sU"
            />
          </div>
          <button
            onClick={handleLogout}
            className="font-['Inter'] text-sm text-slate-500 hover:text-slate-900 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
