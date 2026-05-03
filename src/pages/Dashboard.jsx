import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { analyticsAPI, userAPI, paymentsAPI } from '../services/api';

const EMPTY_DASHBOARD = {
  total_applications: 0,
  status_counts: {
    applied: 0,
    interviewing: 0,
    offer: 0,
    rejected: 0,
    wishlist: 0,
  },
  recent_applications: [],
};

const STATUS_META = {
  applied: { label: 'Applied', sc: 'bg-blue-100 text-blue-800' },
  interviewing: { label: 'Interviewing', sc: 'bg-secondary-fixed text-on-secondary-fixed-variant' },
  offer: { label: 'Offer', sc: 'bg-emerald-100 text-emerald-800' },
  rejected: { label: 'Rejected', sc: 'bg-red-100 text-red-800' },
  wishlist: { label: 'Wishlist', sc: 'bg-amber-100 text-amber-800' },
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
        if (!cancelled) {
          setLoading(false);
          setRemindersLoading(false);
        }
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
    { label: 'Applications', value: total, icon: 'layers', color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Interviews', value: interviewing, icon: 'forum', color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Offers', value: offers, icon: 'verified', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Rejections', value: rejected, icon: 'cancel', color: 'text-slate-600', bg: 'bg-slate-50' },
  ];

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Welcome back, {user?.name?.split(' ')[0] || 'User'}
          </h1>
          <p className="text-slate-500 mt-1 font-medium">Here's what's happening with your job search today.</p>
        </div>
        <button
          onClick={() => nav('/applications/new')}
          className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-2xl font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <span className="material-symbols-outlined">add_circle</span>
          Add Application
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 ${stat.bg} rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110`}>
                <span className={`material-symbols-outlined ${stat.color} text-[24px]`}>{stat.icon}</span>
              </div>
              <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">{stat.label}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-black text-slate-900 dark:text-white">{stat.value}</h3>
              {stat.label === 'Applications' && <span className="text-slate-400 text-xs font-bold">Total</span>}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Recent Activity */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Recent Activity</h2>
            <button onClick={() => nav('/applications')} className="text-sm font-bold text-primary hover:underline">View All</button>
          </div>
          
          <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
            {loading ? (
              <div className="p-20 flex justify-center">
                <span className="material-symbols-outlined text-primary animate-spin text-4xl">progress_activity</span>
              </div>
            ) : dashboard.recent_applications.length === 0 ? (
              <div className="p-20 text-center space-y-4">
                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-slate-300 text-3xl">inbox</span>
                </div>
                <p className="text-slate-500 font-medium">No applications yet. Time to apply!</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50 dark:divide-slate-800">
                {dashboard.recent_applications.map((app) => (
                  <div 
                    key={app.id} 
                    onClick={() => nav(`/applications/${app.id}`)}
                    className="p-5 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center font-black text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors uppercase">
                        {app.company.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white leading-tight">{app.company}</h4>
                        <p className="text-sm text-slate-500 font-medium">{app.role}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="hidden md:block text-right">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">{relativeTime(app.created_at)}</p>
                      </div>
                      <span className={`px-4 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider ${STATUS_META[app.status]?.sc || 'bg-slate-100 text-slate-700'}`}>
                        {STATUS_META[app.status]?.label || app.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar content: Follow-ups & Quick Links */}
        <div className="space-y-10">
          {/* Follow-ups */}
          <div className="space-y-6">
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight px-2">Follow-ups</h2>
            <div className="space-y-3">
              {remindersLoading ? (
                <div className="p-10 flex justify-center bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800">
                  <span className="material-symbols-outlined text-primary animate-spin text-2xl">progress_activity</span>
                </div>
              ) : reminders.length === 0 ? (
                <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800">
                  <span className="material-symbols-outlined text-slate-300 text-3xl mb-2">event_available</span>
                  <p className="text-slate-400 text-sm font-medium">All caught up!</p>
                </div>
              ) : (
                reminders.map((item) => (
                  <div 
                    key={item.id}
                    onClick={() => nav(`/applications/${item.id}`)}
                    className="p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 flex items-center gap-4 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 cursor-pointer transition-all group"
                  >
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${reminderTone(item.followUp) === 'overdue' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                      <span className="material-symbols-outlined text-[20px]">{reminderTone(item.followUp) === 'overdue' ? 'priority_high' : 'event'}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 dark:text-white truncate text-sm">{item.company}</p>
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-tighter">{formatDate(item.followUp)}</p>
                    </div>
                    <span className="material-symbols-outlined ml-auto text-slate-300 group-hover:text-primary transition-colors">chevron_right</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Tools / Quick Links */}
          <div className="bg-slate-900 dark:bg-slate-950 p-8 rounded-[40px] text-white shadow-2xl shadow-slate-900/20 space-y-6">
            <div>
              <h3 className="text-lg font-black tracking-tight">AI Power Tools</h3>
              <p className="text-slate-400 text-sm font-medium mt-1">Supercharge your applications.</p>
            </div>
            
            <div className="space-y-3">
              {[
                { label: 'Resume Matcher', icon: 'psychology', to: '/resume', desc: 'Check ATS score' },
                { label: 'Resume Tailor', icon: 'auto_awesome', to: '/resume-tailor', desc: 'AI-powered editing' },
              ].map((tool) => (
                <button
                  key={tool.label}
                  onClick={() => nav(tool.to)}
                  className="w-full p-4 bg-white/5 hover:bg-white/10 rounded-2xl flex items-center gap-4 transition-all group text-left"
                >
                  <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-[20px]">{tool.icon}</span>
                  </div>
                  <div>
                    <p className="font-bold text-sm">{tool.label}</p>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{tool.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

