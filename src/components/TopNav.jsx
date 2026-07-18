import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import PricingModal from './PricingModal';
import { notificationsAPI, applicationsAPI } from '../services/api';

const formatRelativeTime = (date) => {
  const diff = Math.floor((new Date() - new Date(date)) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const navItems = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/applications', label: 'Applications' },
  { path: '/analytics', label: 'Analytics' },
  { path: '/resume', label: 'Resume Match' },
  { path: '/profile', label: 'Profile' },
  { path: '/settings', label: 'Settings' },
];

export default function TopNav() {
  const { user, profile, loading } = useAuth();
  const [showPricing, setShowPricing] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef(null);
  const searchContainerRef = useRef(null);
  const searchInputRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const reduce = useReducedMotion();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ apps: [], pages: [] });
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [appsCache, setAppsCache] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const flatResults = [...searchResults.pages, ...searchResults.apps];
  const unreadCount = notifications.filter(n => !n.is_read).length;

  useEffect(() => {
    if (user) fetchNotifications();
  }, [user, location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setShowNotifications(false);
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) setShowSearchResults(false);
    };
    const handleGlobalKeys = (e) => {
      if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setShowSearchResults(false);
        searchInputRef.current?.blur();
      }
      if (showSearchResults) {
        if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(prev => prev < flatResults.length - 1 ? prev + 1 : prev); }
        if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(prev => prev > 0 ? prev - 1 : prev); }
        if (e.key === 'Enter' && selectedIndex >= 0) {
          e.preventDefault();
          const item = flatResults[selectedIndex];
          if (item) {
            navigate(item.type === 'page' ? item.path : `/applications/${item.id}`);
            setShowSearchResults(false);
            setSearchQuery('');
          }
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleGlobalKeys);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleGlobalKeys);
    };
  }, [showSearchResults, selectedIndex, flatResults, navigate]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults({ apps: [], pages: [] });
      setShowSearchResults(false);
      setSelectedIndex(-1);
      return;
    }
    const timer = setTimeout(() => {
      const query = searchQuery.toLowerCase();
      const filteredPages = navItems.filter(p => p.label.toLowerCase().includes(query)).map(p => ({ ...p, type: 'page' }));
      const filteredApps = appsCache.filter(a => a.company.toLowerCase().includes(query) || a.role.toLowerCase().includes(query)).slice(0, 5).map(a => ({ ...a, type: 'app' }));
      setSearchResults({ apps: filteredApps, pages: filteredPages });
      setShowSearchResults(true);
      setSelectedIndex(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, appsCache]);

  const handleSearchFocus = async () => {
    if (appsCache.length === 0) {
      setIsSearching(true);
      try {
        const data = await applicationsAPI.list();
        setAppsCache(data);
      } catch (err) {
        console.error('Failed to fetch apps for search:', err);
      } finally {
        setIsSearching(false);
      }
    }
  };

  const fetchNotifications = async () => {
    try {
      const data = await notificationsAPI.list();
      setNotifications(data);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await notificationsAPI.markRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  if (loading || !user) {
    return (
      <nav className="glass border-b border-slate-200 dark:border-white/[0.06] z-40 fixed top-0 left-0 right-0 h-16 px-6 flex items-center justify-between">
        <motion.span
          className="text-xl font-black text-slate-900 dark:text-white tracking-tighter"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          Applyd
        </motion.span>
        <span className="material-symbols-outlined text-primary animate-spin">progress_activity</span>
      </nav>
    );
  }

  return (
    <nav className="glass border-b border-slate-200 dark:border-white/[0.06] z-40 fixed top-0 left-0 right-0 h-16 px-4 md:px-6 flex items-center justify-between">
      <div className="flex items-center gap-4 md:gap-8 flex-1 min-w-0">
        <NavLink to="/dashboard" className="text-xl font-black text-slate-900 dark:text-white tracking-tighter hidden lg:block w-56 hover:text-primary transition-colors shrink-0">
          Applyd
        </NavLink>

        {/* Search */}
        <motion.div
          className="relative max-w-md w-full hidden md:block"
          ref={searchContainerRef}
          initial={false}
          animate={{ scale: searchQuery ? 1.01 : 1 }}
          transition={{ duration: 0.2 }}
        >
          <div className="relative group">
            <span className={`absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[20px] transition-colors duration-200 ${showSearchResults ? 'text-primary' : 'text-slate-400 group-focus-within:text-primary'}`}>
              {isSearching ? 'progress_activity' : 'search'}
            </span>
            <input
              ref={searchInputRef}
              className="w-full pl-10 pr-12 py-2.5 bg-slate-100/50 dark:bg-white/[0.05] border border-transparent focus:border-primary/20 rounded-2xl text-sm focus:ring-4 focus:ring-primary/5 outline-none transition-all duration-200 placeholder:text-slate-400 dark:text-slate-200 font-medium"
              placeholder="Quick search... (Press '/')"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={handleSearchFocus}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.05] px-1.5 font-mono text-[10px] font-medium text-slate-400">
                /
              </kbd>
            </div>
          </div>

          <AnimatePresence>
            {showSearchResults && searchQuery.trim().length > 0 && (
              <motion.div
                initial={reduce ? undefined : { opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-dark-surface border border-slate-200 dark:border-white/[0.08] rounded-2xl shadow-2xl shadow-black/5 dark:shadow-black/20 z-50 overflow-hidden"
              >
                <div className="p-2 max-h-[480px] overflow-y-auto no-scrollbar">
                  {searchResults.pages.length > 0 && (
                    <div className="mb-2">
                      <div className="px-3 py-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">Navigation</div>
                      {searchResults.pages.map((page, idx) => {
                        const isSelected = idx === selectedIndex;
                        return (
                          <button
                            key={page.path}
                            onClick={() => { navigate(page.path); setShowSearchResults(false); setSearchQuery(''); }}
                            onMouseEnter={() => setSelectedIndex(idx)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left group transition-all duration-150 ${isSelected ? 'bg-primary/10 dark:bg-primary/[0.15]' : 'hover:bg-slate-50 dark:hover:bg-white/[0.04]'}`}
                          >
                            <span className={`material-symbols-outlined text-[20px] transition-colors ${isSelected ? 'text-primary' : 'text-slate-400 group-hover:text-primary'}`}>explore</span>
                            <span className={`text-sm font-bold transition-colors ${isSelected ? 'text-primary' : 'text-slate-700 dark:text-slate-200'}`}>{page.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {searchResults.apps.length > 0 && (
                    <div>
                      <div className="px-3 py-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">Applications</div>
                      {searchResults.apps.map((app, idx) => {
                        const globalIdx = idx + searchResults.pages.length;
                        const isSelected = globalIdx === selectedIndex;
                        return (
                          <button
                            key={app.id}
                            onClick={() => { navigate(`/applications/${app.id}`); setShowSearchResults(false); setSearchQuery(''); }}
                            onMouseEnter={() => setSelectedIndex(globalIdx)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left group transition-all duration-150 ${isSelected ? 'bg-primary/10 dark:bg-primary/[0.15]' : 'hover:bg-slate-50 dark:hover:bg-white/[0.04]'}`}
                          >
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 transition-colors ${isSelected ? 'bg-primary text-white' : 'bg-primary/10 text-primary'}`}>
                              {app.company[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className={`text-sm font-bold truncate transition-colors ${isSelected ? 'text-primary' : 'text-slate-900 dark:text-white'}`}>{app.role}</div>
                              <div className={`text-[11px] font-medium truncate transition-colors ${isSelected ? 'text-primary/70' : 'text-slate-500 dark:text-slate-400'}`}>{app.company}</div>
                            </div>
                            <motion.span
                              className="material-symbols-outlined text-[18px]"
                              initial={false}
                              animate={isSelected ? { x: 2, opacity: 1 } : { x: 0, opacity: 0 }}
                              style={{ color: isSelected ? 'var(--primary)' : '#94a3b8' }}
                            >arrow_forward</motion.span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {searchResults.pages.length === 0 && searchResults.apps.length === 0 && (
                    <div className="p-8 text-center">
                      <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 text-3xl mb-2">search_off</span>
                      <p className="text-sm font-medium text-slate-400">No results for "{searchQuery}"</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        {/* Credits */}
        {profile && (
          <motion.button
            onClick={() => setShowPricing(true)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-full cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-all group"
          >
            <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-[18px] group-hover:rotate-12 transition-transform duration-300">token</span>
            <span className="text-xs font-bold text-blue-700 dark:text-blue-300">{profile.credits} Credits</span>
          </motion.button>
        )}

        <div className="flex items-center gap-1 border-l border-slate-200 dark:border-white/[0.06] ml-2 pl-2 md:pl-4 relative" ref={dropdownRef}>
          <motion.button
            onClick={() => setShowNotifications(!showNotifications)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`p-2 rounded-xl transition-all relative ${showNotifications ? 'bg-primary/10 text-primary' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.05]'}`}
          >
            <span className="material-symbols-outlined text-[22px]">notifications</span>
            <AnimatePresence>
              {unreadCount > 0 && (
                <motion.span
                  key={unreadCount}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                  className="absolute top-1.5 right-1.5 w-4.5 h-4.5 bg-primary text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-dark-surface"
                  style={{ width: '18px', height: '18px' }}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={reduce ? undefined : { opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                className="absolute top-full right-0 mt-3 w-80 bg-white dark:bg-dark-surface border border-slate-200 dark:border-white/[0.08] rounded-2xl shadow-2xl shadow-black/5 dark:shadow-black/20 z-50 overflow-hidden"
              >
                <div className="p-4 border-b border-slate-100 dark:border-white/[0.04] flex items-center justify-between bg-slate-50/50 dark:bg-white/[0.02]">
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">Notifications</h4>
                  {unreadCount > 0 && (
                    <button onClick={handleMarkAllRead} className="text-[10px] font-black text-primary uppercase tracking-wider hover:underline">
                      Mark all as read
                    </button>
                  )}
                </div>
                <div className="max-h-[400px] overflow-y-auto no-scrollbar">
                  {notifications.length > 0 ? (
                    notifications.map((n) => (
                      <motion.div
                        key={n.id}
                        onClick={() => !n.is_read && handleMarkRead(n.id)}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2 }}
                        className={`p-4 border-b border-slate-100 dark:border-white/[0.04] transition-all cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.02] ${!n.is_read ? 'bg-primary/[0.02]' : ''}`}
                      >
                        <div className="flex gap-3">
                          <motion.div
                            className={`mt-1 h-2 w-2 rounded-full shrink-0 ${!n.is_read ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`}
                            animate={{ scale: n.is_read ? 1 : [1, 1.3, 1] }}
                            transition={{ duration: 0.3 }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className={`text-[13px] leading-relaxed mb-1 ${!n.is_read ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-500 dark:text-slate-400'}`}>
                              {n.message}
                            </p>
                            <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-tight">
                              {formatRelativeTime(n.created_at)}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="p-10 text-center">
                      <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 text-4xl mb-2 block">notifications_off</span>
                      <p className="text-sm font-medium text-slate-400">No notifications yet</p>
                    </div>
                  )}
                </div>
                <div className="p-3 bg-slate-50/50 dark:bg-white/[0.02] border-t border-slate-100 dark:border-white/[0.04] text-center">
                  <NavLink
                    to="/notifications"
                    onClick={() => setShowNotifications(false)}
                    className="text-[11px] font-black text-slate-500 dark:text-slate-400 hover:text-primary transition-colors uppercase tracking-widest"
                  >
                    View All Notifications
                  </NavLink>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <NavLink to="/profile">
            <motion.div
              className="ml-1 md:ml-2 flex items-center gap-3 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-all group cursor-pointer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-white/[0.08] group-hover:border-primary/30 transition-all">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xs font-black text-primary">
                    {profile?.full_name ? profile.full_name[0].toUpperCase() : user?.email[0].toUpperCase()}
                  </span>
                )}
              </div>
            </motion.div>
          </NavLink>
        </div>
      </div>

      <PricingModal isOpen={showPricing} onClose={() => setShowPricing(false)} />
    </nav>
  );
}
