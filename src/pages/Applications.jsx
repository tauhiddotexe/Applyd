import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { applicationsAPI } from '../services/api';
import { STATUS_COLORS, STATUS_LABELS } from '../constants/status';
import { toast } from 'react-hot-toast';
import { FadeIn, StaggerContainer, StaggerItem } from '../components/ui/MotionDiv';
import { ListSkeleton } from '../components/ui/Skeleton';
import CompanyLogo from '../components/ui/CompanyLogo';

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
  const reduce = useReducedMotion();

  const fetchApps = useCallback(async () => {
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
  }, [authLoading, userId, search, statusFilter, sort]);

  useEffect(() => {
    const timeoutId = setTimeout(fetchApps, 300);
    return () => clearTimeout(timeoutId);
  }, [fetchApps]);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Delete this application?')) return;
    try {
      await applicationsAPI.delete(id);
      toast.success('Application deleted');
      setApps(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      toast.error(err.message || 'Delete failed');
    }
  };

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <span className="material-symbols-outlined text-primary animate-spin text-4xl">progress_activity</span>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 lg:p-10 max-w-7xl mx-auto space-y-6 md:space-y-8">
      <FadeIn>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">Applications</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Keep track of your journey and manage your pipeline.</p>
          </div>
          <motion.button
            onClick={() => nav('/applications/new')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 bg-primary text-white px-5 py-3 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all shrink-0"
          >
            <span className="material-symbols-outlined text-[20px]">add_circle</span>
            Add Application
          </motion.button>
        </div>
      </FadeIn>

      {/* Search & Filters */}
      <FadeIn delay={0.05}>
        <div className="flex flex-col lg:flex-row gap-3 md:gap-4">
          <div className="relative flex-1 group">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 material-symbols-outlined text-[20px] group-focus-within:text-primary transition-colors">search</span>
            <input
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] rounded-2xl text-sm focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 font-medium dark:text-white"
              placeholder="Search by company, role, or location..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-4 focus:ring-primary/5 transition-all min-w-[150px]"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.label} value={option.value}>{option.label}</option>
              ))}
            </select>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="px-4 py-3 bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-4 focus:ring-primary/5 transition-all min-w-[130px]"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
            </select>
          </div>
        </div>
      </FadeIn>

      {/* List */}
      <div className="bg-white dark:bg-white/[0.04] rounded-[32px] border border-slate-200 dark:border-white/[0.06] overflow-hidden card-shadow">
        {loading ? (
          <ListSkeleton count={6} />
        ) : error ? (
          <div className="p-16 md:p-20 text-center space-y-4">
            <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto text-red-500">
              <span className="material-symbols-outlined text-3xl">error</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-medium">{error}</p>
            <motion.button
              onClick={fetchApps}
              whileHover={{ scale: 1.02 }}
              className="text-primary font-bold hover:underline"
            >
              Try Again
            </motion.button>
          </div>
        ) : apps.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-16 md:p-20 text-center space-y-6 bg-slate-50/30 dark:bg-white/[0.02]"
          >
            <div className="w-24 h-24 bg-white dark:bg-white/[0.04] border border-slate-100 dark:border-white/[0.06] rounded-[32px] flex items-center justify-center mx-auto shadow-xl shadow-slate-200/50 dark:shadow-none">
              <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 text-5xl">inventory_2</span>
            </div>
            <div>
              <p className="text-slate-900 dark:text-white font-black text-2xl tracking-tight">No applications found</p>
              <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Try adjusting your filters or add a new application.</p>
            </div>
            <motion.button
              onClick={() => nav('/applications/new')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-2 px-5 py-3 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Add Application
            </motion.button>
          </motion.div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-white/[0.06]">
            {apps.map((app, idx) => (
              <motion.div
                key={app.id}
                onClick={() => nav(`/applications/${app.id}`)}
                initial={reduce ? undefined : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between hover:bg-slate-50/50 dark:hover:bg-white/[0.02] cursor-pointer transition-all group"
              >
                <div className="flex items-center gap-4 md:gap-5 flex-1 min-w-0">
                  <CompanyLogo company={app.company} link={app.link} className="h-12 w-12 md:h-14 md:w-14" size="sm" />
                  <div className="min-w-0">
                    <h3 className="text-base md:text-lg font-black text-slate-900 dark:text-white leading-tight group-hover:text-primary transition-colors truncate tracking-tight">{app.company}</h3>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <p className="text-slate-500 dark:text-slate-300 font-bold text-sm truncate">{app.role}</p>
                      <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700 hidden sm:block" />
                      <p className="text-slate-400 dark:text-slate-500 font-medium text-xs sm:text-sm hidden sm:block truncate">{app.location || 'Remote'}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 md:gap-6 mt-3 md:mt-0 pl-0 md:pl-0">
                  <div className="hidden lg:block text-right">
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-tighter">Applied on</p>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{fmtDate(app.created_at)}</p>
                  </div>

                  <span className={`px-4 md:px-5 py-1.5 md:py-2 rounded-2xl text-[10px] md:text-[11px] font-black uppercase tracking-widest text-center min-w-[100px] md:min-w-[120px] whitespace-nowrap ${STATUS_COLORS[app.status] || 'bg-slate-100 text-slate-700'}`}>
                    {STATUS_LABELS[app.status] || app.status}
                  </span>

                  <div className="flex items-center gap-1 md:opacity-0 group-hover:opacity-100 transition-all duration-200">
                    <motion.button
                      onClick={(e) => handleDelete(e, app.id)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                    >
                      <span className="material-symbols-outlined text-[18px] md:text-[20px]">delete</span>
                    </motion.button>
                    <span className="material-symbols-outlined text-slate-300 dark:text-slate-600">chevron_right</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
