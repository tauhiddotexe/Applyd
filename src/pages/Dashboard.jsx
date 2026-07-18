import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { analyticsAPI } from '../services/api';
import { STATUS_COLORS, STATUS_LABELS } from '../constants/status';
import { StaggerContainer, StaggerItem, CardMotion, FadeIn } from '../components/ui/MotionDiv';
import { StatCardSkeleton, ListSkeleton } from '../components/ui/Skeleton';

const EMPTY_DASHBOARD = {
  total_applications: 0,
  status_counts: { applied: 0, interviewing: 0, offer: 0, rejected: 0, wishlist: 0 },
  recent_applications: [],
};

function formatDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function relativeTime(value) {
  if (!value) return '';
  const now = new Date();
  const d = new Date(value);
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(value);
}

function reminderTone(dateValue) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateValue);
  target.setHours(0, 0, 0, 0);
  const diffDays = Math.round((target - today) / 86400000);
  if (diffDays < 0) return 'overdue';
  if (diffDays <= 3) return 'upcoming';
  return 'normal';
}

export default function Dashboard() {
  const nav = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [dashboard, setDashboard] = useState(EMPTY_DASHBOARD);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [remindersLoading, setRemindersLoading] = useState(true);
  const [error, setError] = useState(null);
  const reduce = useReducedMotion();

  const userId = user?.id;

  useEffect(() => {
    if (authLoading || !userId) return;
    let cancelled = false;
    const loadData = async () => {
      setLoading(true);
      try {
        const [dashData, remData] = await Promise.all([
          analyticsAPI.dashboard(),
          analyticsAPI.reminders()
        ]);
        if (!cancelled) {
          setDashboard(dashData || EMPTY_DASHBOARD);
          setReminders(Array.isArray(remData) ? remData : []);
        }
      } catch (err) {
        if (!cancelled) setError('Failed to load dashboard data');
      } finally {
        if (!cancelled) { setLoading(false); setRemindersLoading(false); }
      }
    };
    loadData();
    return () => { cancelled = true; };
  }, [authLoading, userId]);

  const total = dashboard.total_applications;
  const interviewing = dashboard.status_counts.interviewing || 0;
  const offers = dashboard.status_counts.offer || 0;
  const rejected = dashboard.status_counts.rejected || 0;

  const stats = [
    { label: 'Applications', value: total, icon: 'layers', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-500/10', gradient: 'from-blue-500/10 to-transparent' },
    { label: 'Interviews', value: interviewing, icon: 'forum', color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-500/10', gradient: 'from-purple-500/10 to-transparent' },
    { label: 'Offers', value: offers, icon: 'verified', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-500/10', gradient: 'from-emerald-500/10 to-transparent' },
    { label: 'Rejections', value: rejected, icon: 'cancel', color: 'text-slate-600', bg: 'bg-slate-50 dark:bg-slate-500/10', gradient: 'from-slate-500/10 to-transparent' },
  ];

  return (
    <div className="p-4 md:p-8 lg:p-10 max-w-7xl mx-auto space-y-8 md:space-y-10">
      <FadeIn>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <motion.h1
              className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight text-balance"
              initial={reduce ? undefined : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              Welcome back, {user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'User'}
            </motion.h1>
            <motion.p
              className="text-slate-500 dark:text-slate-400 mt-1.5 font-medium"
              initial={reduce ? undefined : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
            >
              Here's what's happening with your job search today.
            </motion.p>
          </div>
          <motion.button
            onClick={() => nav('/applications/new')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 bg-primary text-white px-5 py-3 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">add_circle</span>
            Add Application
          </motion.button>
        </div>
      </FadeIn>

      {/* Stats Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {[1, 2, 3, 4].map(i => <StatCardSkeleton key={i} />)}
        </div>
      ) : (
        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {stats.map((stat) => (
            <StaggerItem key={stat.label}>
              <CardMotion>
                <div className="group relative bg-white dark:bg-white/[0.04] p-5 md:p-6 rounded-3xl border border-slate-200 dark:border-white/[0.06] card-shadow hover:shadow-lg hover:shadow-primary/5 transition-all overflow-hidden">
                  <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <motion.div
                        className={`w-12 h-12 ${stat.bg} rounded-2xl flex items-center justify-center`}
                        whileHover={{ rotate: [0, -10, 10, 0], transition: { duration: 0.3 } }}
                      >
                        <span className={`material-symbols-outlined ${stat.color} text-[24px]`}>{stat.icon}</span>
                      </motion.div>
                      <span className="text-slate-400 dark:text-slate-500 font-bold text-[10px] uppercase tracking-[0.12em]">{stat.label}</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <motion.h3
                        className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15 }}
                      >
                        {stat.value}
                      </motion.h3>
                      {stat.label === 'Applications' && <span className="text-slate-400 dark:text-slate-500 text-xs font-bold">Total</span>}
                    </div>
                  </div>
                </div>
              </CardMotion>
            </StaggerItem>
          ))}
        </StaggerContainer>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-10">
        {/* Recent Activity */}
        <FadeIn className="lg:col-span-2 space-y-5">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Recent Activity</h2>
            <motion.button
              onClick={() => nav('/applications')}
              whileHover={{ x: 2 }}
              className="text-sm font-bold text-primary hover:underline"
            >
              View All
            </motion.button>
          </div>

          <div className="bg-white dark:bg-white/[0.04] rounded-[32px] border border-slate-200 dark:border-white/[0.06] overflow-hidden card-shadow">
            {loading ? (
              <ListSkeleton count={4} />
            ) : dashboard.recent_applications.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-16 md:p-20 text-center space-y-4"
              >
                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 text-3xl">inbox</span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 font-medium">No applications yet. Time to apply!</p>
                <motion.button
                  onClick={() => nav('/applications/new')}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-2xl font-bold text-sm shadow-lg shadow-primary/20"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  Add Your First Application
                </motion.button>
              </motion.div>
            ) : (
              <div className="divide-y divide-slate-50 dark:divide-slate-800">
                {dashboard.recent_applications.map((app, idx) => (
                  <motion.div
                    key={app.id}
                    onClick={() => nav(`/applications/${app.id}`)}
                    initial={reduce ? undefined : { opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.04, duration: 0.3 }}
                    className="p-4 md:p-5 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-white/[0.02] cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <motion.div
                        className="w-10 h-10 md:w-12 md:h-12 bg-slate-100 dark:bg-white/[0.06] rounded-2xl flex items-center justify-center font-black text-slate-400 dark:text-slate-500 group-hover:bg-primary/10 group-hover:text-primary transition-colors uppercase shrink-0"
                        whileHover={{ scale: 1.1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 15 }}
                      >
                        {app.company.charAt(0)}
                      </motion.div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-900 dark:text-white leading-tight truncate">{app.company}</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium truncate">{app.role}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 md:gap-6 shrink-0">
                      <div className="hidden md:block text-right">
                        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">{relativeTime(app.created_at)}</p>
                      </div>
                      <span className={`px-3 md:px-4 py-1.5 rounded-xl text-[10px] md:text-[11px] font-black uppercase tracking-wider whitespace-nowrap ${STATUS_COLORS[app.status] || 'bg-slate-100 text-slate-700'}`}>
                        {STATUS_LABELS[app.status] || app.status}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </FadeIn>

        {/* Sidebar: Follow-ups & Quick Links */}
        <div className="space-y-6 md:space-y-10">
          {/* Follow-ups */}
          <FadeIn delay={0.1}>
            <div className="space-y-5">
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight px-1">Follow-ups</h2>
              <div className="space-y-3">
                {remindersLoading ? (
                  <div className="p-8 flex justify-center bg-white dark:bg-white/[0.04] rounded-[32px] border border-slate-200 dark:border-white/[0.06]">
                    <span className="material-symbols-outlined text-primary animate-spin text-2xl">progress_activity</span>
                  </div>
                ) : reminders.length === 0 ? (
                  <div className="p-8 text-center bg-white dark:bg-white/[0.04] rounded-[32px] border border-slate-200 dark:border-white/[0.06]">
                    <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 text-3xl mb-2 block">event_available</span>
                    <p className="text-slate-400 dark:text-slate-500 text-sm font-medium">All caught up!</p>
                  </div>
                ) : (
                  reminders.map((item, idx) => (
                    <motion.div
                      key={item.id}
                      onClick={() => nav(`/applications/${item.id}`)}
                      initial={reduce ? undefined : { opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05, duration: 0.3 }}
                      className="p-4 bg-white dark:bg-white/[0.04] rounded-3xl border border-slate-200 dark:border-white/[0.06] flex items-center gap-4 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 cursor-pointer transition-all group"
                    >
                      <motion.div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${reminderTone(item.followUp) === 'overdue' ? 'bg-red-50 dark:bg-red-500/10 text-red-600' : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600'}`}
                        whileHover={{ rotate: [0, -10, 10, 0], transition: { duration: 0.3 } }}
                      >
                        <span className="material-symbols-outlined text-[20px]">{reminderTone(item.followUp) === 'overdue' ? 'priority_high' : 'event'}</span>
                      </motion.div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-slate-900 dark:text-white truncate text-sm">{item.company}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-tighter">{formatDate(item.followUp)}</p>
                      </div>
                      <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 group-hover:text-primary transition-colors shrink-0">chevron_right</span>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </FadeIn>

          {/* AI Tools */}
          <FadeIn delay={0.2}>
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-6 md:p-8 rounded-[40px] text-white shadow-2xl shadow-slate-900/30 space-y-6 relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-[80px]" />
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-500/10 rounded-full blur-[80px]" />
              <div className="relative z-10">
                <h3 className="text-lg font-black tracking-tight">AI Power Tools</h3>
                <p className="text-slate-400 text-sm font-medium mt-1">Supercharge your applications.</p>
              </div>

              <div className="space-y-3 relative z-10">
                {[
                  { label: 'Resume Matcher', icon: 'psychology', to: '/resume', desc: 'Check ATS score' },
                  { label: 'Resume Tailor', icon: 'auto_awesome', to: '/resume-tailor', desc: 'AI-powered editing' },
                ].map((tool) => (
                  <motion.button
                    key={tool.label}
                    onClick={() => nav(tool.to)}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full p-4 bg-white/[0.06] hover:bg-white/[0.1] rounded-2xl flex items-center gap-4 transition-all text-left group"
                  >
                    <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-primary text-[20px]">{tool.icon}</span>
                    </div>
                    <div>
                      <p className="font-bold text-sm">{tool.label}</p>
                      <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.1em]">{tool.desc}</p>
                    </div>
                    <span className="material-symbols-outlined ml-auto text-slate-600 group-hover:text-white transition-colors text-[18px]">chevron_right</span>
                  </motion.button>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </div>
  );
}
