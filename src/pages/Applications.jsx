import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { applicationsAPI } from '../services/api';
import { STATUS_COLORS, STATUS_LABELS } from '../constants/status';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  ...Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label }))
];

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function Applications() {
  const nav = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id;
  const [apps, setApps] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [sort, setSort] = useState('newest');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="material-symbols-outlined text-primary animate-spin text-4xl">progress_activity</span>
      </div>
    );
  }

  const fetchApps = async () => {
    if (authLoading || !userId) return;

    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (statusFilter) params.set('status', statusFilter);
    if (sort) params.set('sort', sort);

    setLoading(true);
    setError(null);
    try {
      const data = await applicationsAPI.list(params.toString());
      setApps(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchApps();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [authLoading, search, userId, sort, statusFilter]);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!confirm('Delete this application?')) return;
    try {
      await applicationsAPI.delete(id);
      setApps(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      alert(err.message || 'Delete failed');
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Applications</h1>
          <p className="text-slate-500 mt-1 font-medium">Keep track of your journey and manage your pipeline.</p>
        </div>
        <button 
          onClick={() => nav('/applications/new')} 
          className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-2xl font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <span className="material-symbols-outlined">add_circle</span>
          Add Application
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1 group">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined text-[20px] group-focus-within:text-primary transition-colors">search</span>
          <input 
            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all placeholder:text-slate-400 font-medium" 
            placeholder="Search by company, role, or location..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>
        <div className="flex gap-4">
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)} 
            className="px-4 py-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-300 outline-none focus:ring-4 focus:ring-primary/5 transition-all min-w-[160px]"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.label} value={option.value}>{option.label}</option>
            ))}
          </select>
          <select 
            value={sort} 
            onChange={(e) => setSort(e.target.value)} 
            className="px-4 py-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-300 outline-none focus:ring-4 focus:ring-primary/5 transition-all min-w-[140px]"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
          </select>
        </div>
      </div>

      {/* List UI */}
      <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-32 flex justify-center">
            <span className="material-symbols-outlined text-primary animate-spin text-4xl">progress_activity</span>
          </div>
        ) : error ? (
          <div className="p-20 text-center space-y-4">
            <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto text-red-500">
              <span className="material-symbols-outlined text-3xl">error</span>
            </div>
            <p className="text-slate-500 font-medium">{error}</p>
            <button onClick={fetchApps} className="text-primary font-bold hover:underline">Try Again</button>
          </div>
        ) : apps.length === 0 ? (
          <div className="p-32 text-center space-y-6">
            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-slate-300 text-4xl">inventory_2</span>
            </div>
            <div>
              <p className="text-slate-900 dark:text-white font-black text-xl">No applications found</p>
              <p className="text-slate-500 font-medium mt-1">Try adjusting your filters or add a new application.</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-50 dark:divide-slate-800">
            {apps.map(app => {
              const domain = app.company.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com';
              const initials = app.company.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

              return (
                <div 
                  key={app.id} 
                  onClick={() => nav(`/applications/${app.id}`)} 
                  className="p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/50 cursor-pointer transition-all group"
                >
                  <div className="flex items-center gap-5 flex-1 min-w-0">
                    <div className="relative h-14 w-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-100 dark:border-slate-700 shrink-0 group-hover:scale-105 transition-transform">
                      <img 
                        src={`https://logo.clearbit.com/${domain}`} 
                        alt={app.company}
                        className="h-full w-full object-contain p-2.5 transition-opacity duration-300"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                      <div className="hidden absolute inset-0 flex items-center justify-center bg-primary/10 text-primary font-black text-lg">
                        {initials}
                      </div>
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight group-hover:text-primary transition-colors truncate">{app.company}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <p className="text-slate-600 dark:text-slate-400 font-bold text-sm truncate">{app.role}</p>
                        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700 hidden sm:block" />
                        <p className="text-slate-400 font-medium text-sm hidden sm:block truncate">{app.location || 'Remote'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 mt-4 md:mt-0 ml-16 md:ml-0">
                    <div className="hidden lg:block text-right">
                      <p className="text-xs font-black text-slate-400 uppercase tracking-tighter">Applied on</p>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{fmtDate(app.created_at)}</p>
                    </div>
                    
                    <span className={`px-5 py-2 rounded-2xl text-[11px] font-black uppercase tracking-widest text-center min-w-[120px] ${STATUS_COLORS[app.status] || 'bg-slate-100 text-slate-700'}`}>
                      {STATUS_LABELS[app.status] || app.status}
                    </span>

                    <div className="flex items-center gap-2 md:opacity-0 group-hover:opacity-100 transition-all">
                      <button 
                        onClick={(e) => handleDelete(e, app.id)} 
                        className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                      >
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                      <span className="material-symbols-outlined text-slate-300">chevron_right</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

