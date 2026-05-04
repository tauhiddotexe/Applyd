import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect, useRef } from 'react';
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

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ apps: [], pages: [] });
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [appsCache, setAppsCache] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const flatResults = [...searchResults.pages, ...searchResults.apps];

  const unreadCount = notifications.filter(n => !n.is_read).length;

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user, location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
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
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex(prev => (prev < flatResults.length - 1 ? prev + 1 : prev));
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
        }
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
  }, [showSearchResults, selectedIndex, flatResults]);

  // Debounced Search Logic
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults({ apps: [], pages: [] });
      setShowSearchResults(false);
      setSelectedIndex(-1);
      return;
    }

    const timer = setTimeout(() => {
      const query = searchQuery.toLowerCase();
      
      // Filter Pages
      const filteredPages = navItems.filter(p => 
        p.label.toLowerCase().includes(query)
      ).map(p => ({ ...p, type: 'page' }));

      // Filter Apps
      const filteredApps = appsCache.filter(a => 
        a.company.toLowerCase().includes(query) || 
        a.role.toLowerCase().includes(query)
      ).slice(0, 5).map(a => ({ ...a, type: 'app' }));

      setSearchResults({
        apps: filteredApps,
        pages: filteredPages
      });
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
      <nav className="bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-white/10 z-40 fixed top-0 left-0 right-0 h-16 px-6 flex items-center justify-between">
        <span className="text-xl font-black text-slate-900 dark:text-slate-50 tracking-tighter">Applyd</span>
        <span className="material-symbols-outlined text-primary animate-spin">progress_activity</span>
      </nav>
    );
  }

  return (
    <nav className="bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-white/10 z-40 fixed top-0 left-0 right-0 h-16 px-6 flex items-center justify-between">
      <div className="flex items-center gap-8 flex-1">
        <NavLink to="/dashboard" className="text-xl font-black text-slate-900 dark:text-slate-50 tracking-tighter hidden lg:block w-56 hover:text-primary transition-colors">Applyd</NavLink>
        
        {/* Search - Command Palette Style */}
        <div className="relative max-w-md w-full hidden md:block" ref={searchContainerRef}>
          <div className="relative group">
            <span className={`absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[20px] transition-colors ${showSearchResults ? 'text-primary' : 'text-slate-400 group-focus-within:text-primary'}`}>
              {isSearching ? 'progress_activity' : 'search'}
            </span>
            <input
              ref={searchInputRef}
              className="w-full pl-10 pr-12 py-2 bg-slate-100/50 dark:bg-white/5 border border-transparent focus:border-primary/20 rounded-xl text-sm focus:ring-4 focus:ring-primary/5 outline-none transition-all placeholder:text-slate-400 dark:text-slate-200 font-medium"
              placeholder="Quick search... (Press '/')"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={handleSearchFocus}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-1.5 font-mono text-[10px] font-medium text-slate-400 opacity-100">
                /
              </kbd>
            </div>
          </div>

          {/* Search Dropdown */}
          {showSearchResults && (searchQuery.trim().length > 0) && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-2 max-h-[480px] overflow-y-auto no-scrollbar">
                {/* Pages Group */}
                {searchResults.pages.length > 0 && (
                  <div className="mb-2">
                    <div className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Navigation</div>
                    {searchResults.pages.map((page, idx) => {
                      const isSelected = idx === selectedIndex;
                      return (
                        <button
                          key={page.path}
                          onClick={() => {
                            navigate(page.path);
                            setShowSearchResults(false);
                            setSearchQuery('');
                          }}
                          onMouseEnter={() => setSelectedIndex(idx)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left group transition-all ${isSelected ? 'bg-primary/10 dark:bg-primary/20' : 'hover:bg-slate-50 dark:hover:bg-white/5'}`}
                        >
                          <span className={`material-symbols-outlined text-[20px] transition-colors ${isSelected ? 'text-primary' : 'text-slate-400 group-hover:text-primary'}`}>explore</span>
                          <span className={`text-sm font-bold transition-colors ${isSelected ? 'text-primary' : 'text-slate-700 dark:text-slate-200'}`}>{page.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Applications Group */}
                {searchResults.apps.length > 0 && (
                  <div>
                    <div className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Applications</div>
                    {searchResults.apps.map((app, idx) => {
                      const globalIdx = idx + searchResults.pages.length;
                      const isSelected = globalIdx === selectedIndex;
                      return (
                        <button
                          key={app.id}
                          onClick={() => {
                            navigate(`/applications/${app.id}`);
                            setShowSearchResults(false);
                            setSearchQuery('');
                          }}
                          onMouseEnter={() => setSelectedIndex(globalIdx)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left group transition-all ${isSelected ? 'bg-primary/10 dark:bg-primary/20' : 'hover:bg-slate-50 dark:hover:bg-white/5'}`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs shrink-0 transition-colors ${isSelected ? 'bg-primary text-white' : 'bg-primary/10 text-primary'}`}>
                            {app.company[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className={`text-sm font-bold truncate transition-colors ${isSelected ? 'text-primary' : 'text-slate-900 dark:text-slate-50'}`}>{app.role}</div>
                            <div className={`text-[11px] font-medium truncate transition-colors ${isSelected ? 'text-primary/70' : 'text-slate-500 dark:text-slate-400'}`}>{app.company}</div>
                          </div>
                          <span className={`material-symbols-outlined text-[18px] transition-all ${isSelected ? 'text-primary translate-x-0.5 opacity-100' : 'text-slate-300 opacity-0 group-hover:opacity-100'}`}>arrow_forward</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {searchResults.pages.length === 0 && searchResults.apps.length === 0 && (
                  <div className="p-8 text-center">
                    <p className="text-sm font-medium text-slate-400">No results for "{searchQuery}"</p>
                  </div>
                )}
              </div>
            </div>
          )}
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

        <div className="flex items-center gap-1 border-l border-slate-200 dark:border-white/10 ml-2 pl-4 relative" ref={dropdownRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className={`p-2 rounded-xl transition-all relative ${showNotifications ? 'bg-primary/10 text-primary' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'}`}
          >
            <span className="material-symbols-outlined text-[22px]">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-primary text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-slate-950">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute top-full right-0 mt-3 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-white/2">
                <h4 className="text-sm font-black text-slate-900 dark:text-slate-50">Notifications</h4>
                {unreadCount > 0 && (
                  <button 
                    onClick={handleMarkAllRead}
                    className="text-[10px] font-black text-primary uppercase tracking-wider hover:underline"
                  >
                    Mark all as read
                  </button>
                )}
              </div>
              <div className="max-h-[400px] overflow-y-auto no-scrollbar">
                {notifications.length > 0 ? (
                  notifications.map((n) => (
                    <div 
                      key={n.id}
                      onClick={() => !n.is_read && handleMarkRead(n.id)}
                      className={`p-4 border-b border-slate-100 dark:border-white/5 transition-all cursor-pointer hover:bg-slate-50 dark:hover:bg-white/2 ${!n.is_read ? 'bg-primary/[0.02]' : ''}`}
                    >
                      <div className="flex gap-3">
                        <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${!n.is_read ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-[13px] leading-relaxed mb-1 ${!n.is_read ? 'font-bold text-slate-900 dark:text-slate-50' : 'font-medium text-slate-500 dark:text-slate-400'}`}>
                            {n.message}
                          </p>
                          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-tight">
                            {formatRelativeTime(n.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-10 text-center">
                    <span className="material-symbols-outlined text-slate-300 text-4xl mb-2">notifications_off</span>
                    <p className="text-sm font-medium text-slate-400">No notifications yet</p>
                  </div>
                )}
              </div>
              <div className="p-3 bg-slate-50/50 dark:bg-white/2 border-t border-slate-100 dark:border-white/5 text-center">
                <NavLink 
                  to="/notifications" 
                  onClick={() => setShowNotifications(false)}
                  className="text-[11px] font-black text-slate-500 hover:text-primary transition-colors uppercase tracking-widest"
                >
                  View All Notifications
                </NavLink>
              </div>
            </div>
          )}
          
          <NavLink 
            to="/profile"
            className="ml-2 flex items-center gap-3 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-all group"
          >
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-white/10 group-hover:border-primary/30 transition-all">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <span className="text-xs font-black text-primary">
                  {profile?.full_name ? profile.full_name[0].toUpperCase() : user?.email[0].toUpperCase()}
                </span>
              )}
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

