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
  const [remindersError, setRemindersError] = useState(null);
  const [credits, setCredits] = useState(null);
  const [creditsLoading, setCreditsLoading] = useState(true);

  const userId = user?.id;

  useEffect(() => {
    if (authLoading || !userId) return;
    let cancelled = false;

    const loadData = async () => {
      await new Promise(r => setTimeout(r, 300)); // allow auth settle

      // Dashboard first
      setLoading(true);
      setError(null);
      try {
        const data = await analyticsAPI.dashboard();
        if (!cancelled) setDashboard(data || EMPTY_DASHBOARD);
      } catch (err) {
        if (!cancelled) { setDashboard(EMPTY_DASHBOARD); setError(err.message || 'Failed to load dashboard'); }
      } finally {
        if (!cancelled) setLoading(false);
      }

      if (cancelled) return;

      // Then reminders
      setRemindersLoading(true);
      setRemindersError(null);
      try {
        const data = await analyticsAPI.reminders();
        if (cancelled) return;
        const list = Array.isArray(data) ? data : [];
        setReminders(list);
        if (typeof window !== 'undefined' && 'Notification' in window && list.some((item) => reminderTone(item.followUp) === 'overdue')) {
          if (Notification.permission === 'default') Notification.requestPermission();
          else if (Notification.permission === 'granted') {
            new Notification('Applyd follow-ups due', {
              body: `${list.filter((item) => reminderTone(item.followUp) === 'overdue').length} overdue follow-up(s)`,
            });
          }
        }
      } catch (err) {
        if (!cancelled) { setReminders([]); setRemindersError(err.message || 'Failed to load reminders'); }
      } finally {
        if (!cancelled) setRemindersLoading(false);
      }

      // Credits
      setCreditsLoading(true);
      try {
        const profile = await userAPI.getProfile();
        if (!cancelled) setCredits(profile?.credits ?? null);
      } catch {
        if (!cancelled) setCredits(null);
      } finally {
        if (!cancelled) setCreditsLoading(false);
      }
    };

    loadData();
    return () => { cancelled = true; };
  }, [authLoading, userId]);

  // KPI calculations
  const total = dashboard.total_applications;
  const interviews = dashboard.status_counts.interviewing || 0;
  const offers = dashboard.status_counts.offer || 0;
  const conversionPct = total > 0 ? Math.round(((interviews + offers) / total) * 100) : 0;

  const statCards = [
    { label: 'Total Applications', value: total, icon: 'work', color: 'text-primary', bg: 'bg-primary/10', sub: null },
    { label: 'Interviews', value: interviews, icon: 'record_voice_over', color: 'text-secondary', bg: 'bg-secondary/10', sub: null },
    { label: 'Offers', value: offers, icon: 'emoji_events', color: 'text-emerald-600', bg: 'bg-emerald-50', sub: null },
    { label: 'Conversion', value: `${conversionPct}%`, icon: 'trending_up', color: conversionPct >= 20 ? 'text-emerald-600' : 'text-amber-600', bg: conversionPct >= 20 ? 'bg-emerald-50' : 'bg-amber-50', sub: 'Interview + Offer rate' },
  ];

  const reminderCards = useMemo(() => reminders.map((item) => ({ ...item, tone: reminderTone(item.followUp) })), [reminders]);
  const overdueCount = reminderCards.filter(r => r.tone === 'overdue').length;
  const upcomingCount = reminderCards.filter(r => r.tone === 'upcoming').length;

  const handleUpgrade = async (planType) => {
    try {
      const { url } = await paymentsAPI.createCheckoutSession(planType);
      window.location.href = url;
    } catch (err) {
      console.error('Checkout error:', err);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-max_width mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-5 gap-3">
        <div>
          <h2 className="font-h1 text-h1 text-on-surface mb-1">Dashboard</h2>
          <p className="font-body-sm text-on-surface-variant">Track your application pipeline and stay ahead.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {statCards.map(({ label, value, icon, color, bg, sub }) => (
          <div key={label} className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider">{label}</span>
              <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>
                <span className={`material-symbols-outlined text-[18px] ${color}`}>{icon}</span>
              </div>
            </div>
            <p className="font-h1 text-[26px] text-on-surface leading-none">{value}</p>
            {sub && <p className="text-[10px] text-on-surface-variant mt-1">{sub}</p>}
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 flex items-center gap-3">
          <span className="material-symbols-outlined text-red-500">error</span>
          <span className="text-red-700 text-body-sm">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-12 gap-4">
        {/* Left Column: Quick Actions + Activity */}
        <div className="col-span-12 lg:col-span-8 space-y-4">
          {/* Quick Actions Card */}
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-secondary text-[20px]">bolt</span>
              <span className="font-h3 text-on-surface text-[14px]">Quick Actions</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { label: 'Add Application', icon: 'add_circle', to: '/applications/new', accent: 'bg-primary text-on-primary' },
                { label: 'Resume Analyzer', icon: 'analytics', to: '/resume-analyzer', accent: 'bg-secondary/10 text-secondary' },
                { label: 'Resume Tailor', icon: 'auto_awesome', to: '/resume-tailor', accent: 'bg-tertiary-fixed text-on-tertiary-fixed-variant' },
                { label: 'View All Apps', icon: 'list_alt', to: '/applications', accent: 'bg-surface-container text-on-surface' },
              ].map((action) => (
                <button
                  key={action.label}
                  onClick={() => nav(action.to)}
                  className={`flex items-center gap-2.5 p-3 rounded-lg border border-outline-variant/20 hover:shadow-md transition-all cursor-pointer group ${action.label === 'Add Application' ? action.accent : 'bg-surface-container-lowest'}`}
                >
                  <span className={`material-symbols-outlined text-[20px] ${action.label === 'Add Application' ? '' : action.accent.split(' ').slice(1).join(' ')}`}>{action.icon}</span>
                  <span className={`font-h3 text-[12px] ${action.label === 'Add Application' ? 'text-on-primary' : 'text-on-surface'}`}>{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">history</span>
                <span className="font-h3 text-on-surface text-[14px]">Recent Activity</span>
              </div>
              <button onClick={() => nav('/applications')} className="text-primary text-[12px] font-bold hover:underline cursor-pointer">View All</button>
            </div>
            <div className="space-y-1">
              {loading && (
                <div className="flex items-center justify-center py-10">
                  <span className="material-symbols-outlined text-primary animate-spin text-4xl">progress_activity</span>
                </div>
              )}
              {!loading && dashboard.recent_applications.length === 0 && (
                <div className="text-center py-10">
                  <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center mx-auto mb-3">
                    <span className="material-symbols-outlined text-outline text-2xl">inbox</span>
                  </div>
                  <p className="font-h3 text-on-surface mb-1">No applications yet</p>
                  <p className="text-body-sm text-on-surface-variant mb-3">Start tracking your job search journey.</p>
                  <button
                    onClick={() => nav('/applications/new')}
                    className="px-4 py-2 bg-primary text-on-primary rounded-lg text-[13px] font-semibold hover:opacity-90 transition-opacity"
                  >
                    Add your first application
                  </button>
                </div>
              )}
              {!loading && dashboard.recent_applications.map((app) => (
                <div key={app.id} onClick={() => nav(`/applications/${app.id}`)} className="flex items-center justify-between p-3 rounded-lg hover:bg-surface transition-colors cursor-pointer border border-transparent hover:border-outline-variant/20 group">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 bg-surface-container flex items-center justify-center rounded-lg group-hover:bg-primary/10 transition-colors">
                      <span className="material-symbols-outlined text-outline text-[18px]">apartment</span>
                    </div>
                    <div>
                      <h4 className="font-h3 text-[13px] text-on-surface leading-tight">{app.company}</h4>
                      <p className="text-[11px] text-outline">{app.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-on-surface-variant hidden md:block">{relativeTime(app.created_at)}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${STATUS_META[app.status]?.sc || 'bg-slate-100 text-slate-700'}`}>{STATUS_META[app.status]?.label || app.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar: Credits + Follow-ups */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
          {/* Credits Widget — Moved to top for visibility */}
          <div className="bg-gradient-to-br from-primary/5 to-secondary/5 border border-primary/15 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-primary text-[20px]">token</span>
              <span className="font-h3 text-on-surface text-[14px]">AI Credits</span>
            </div>
            {creditsLoading ? (
              <div className="h-8 w-20 bg-surface-container animate-pulse rounded-lg"></div>
            ) : credits !== null ? (
              <>
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="font-h1 text-[32px] text-primary leading-none">{credits}</span>
                  <span className="text-[11px] text-on-surface-variant">remaining</span>
                </div>
                <div className="w-full bg-surface-container rounded-full h-1.5 mb-3">
                  <div
                    className="bg-primary rounded-full h-1.5 transition-all"
                    style={{ width: `${Math.min((credits / 10) * 100, 100)}%` }}
                  ></div>
                </div>
                {credits <= 2 && (
                  <button
                    onClick={() => handleUpgrade('pro')}
                    className="w-full py-2.5 bg-primary text-on-primary rounded-lg text-[12px] font-bold hover:opacity-90 transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">rocket_launch</span>
                    Upgrade Plan
                  </button>
                )}
              </>
            ) : (
              <p className="text-[12px] text-on-surface-variant">Unable to load credits.</p>
            )}
          </div>

          {/* Follow-ups */}
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-amber-600">notifications_active</span>
                <span className="font-h3 text-on-surface text-[14px]">Follow-ups</span>
              </div>
              {(overdueCount > 0 || upcomingCount > 0) && (
                <div className="flex gap-1.5">
                  {overdueCount > 0 && (
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-[10px] font-bold">{overdueCount} overdue</span>
                  )}
                  {upcomingCount > 0 && (
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[10px] font-bold">{upcomingCount} soon</span>
                  )}
                </div>
              )}
            </div>

            {remindersError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-2 mb-3 text-red-700 text-body-sm">{remindersError}</div>
            )}
            <div className="space-y-2">
              {remindersLoading && (
                <div className="flex items-center justify-center py-8">
                  <span className="material-symbols-outlined text-primary animate-spin text-3xl">progress_activity</span>
                </div>
              )}
              {!remindersLoading && reminderCards.length === 0 && (
                <div className="text-center py-5">
                  <span className="material-symbols-outlined text-outline text-2xl mb-2 block">event_available</span>
                  <p className="text-on-surface-variant text-[12px]">No follow-ups scheduled. You're all caught up!</p>
                </div>
              )}
              {!remindersLoading && reminderCards.map((item) => (
                <div
                  key={item.id}
                  onClick={() => nav(`/applications/${item.id}`)}
                  className={`flex gap-3 p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm ${
                    item.tone === 'overdue'
                      ? 'bg-red-50 border-red-200 hover:border-red-300'
                      : item.tone === 'upcoming'
                        ? 'bg-amber-50 border-amber-200 hover:border-amber-300'
                        : 'bg-surface/50 border-outline-variant/20 hover:border-outline-variant/40'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    item.tone === 'overdue'
                      ? 'bg-red-100'
                      : item.tone === 'upcoming'
                        ? 'bg-amber-100'
                        : 'bg-primary/10'
                  }`}>
                    <span className={`material-symbols-outlined text-[18px] ${
                      item.tone === 'overdue'
                        ? 'text-red-600'
                        : item.tone === 'upcoming'
                          ? 'text-amber-700'
                          : 'text-primary'
                    }`}>{item.tone === 'overdue' ? 'warning' : 'event'}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-h3 text-[13px] leading-tight text-on-surface truncate">{item.company}</p>
                    <p className="text-[11px] text-on-surface-variant truncate">{item.role}</p>
                    <p className={`text-[11px] mt-0.5 font-medium ${
                      item.tone === 'overdue'
                        ? 'text-red-700'
                        : item.tone === 'upcoming'
                          ? 'text-amber-700'
                          : 'text-on-surface-variant'
                    }`}>{formatDate(item.followUp)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
