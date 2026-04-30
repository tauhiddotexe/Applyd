import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { analyticsAPI } from '../services/api';

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
    };

    loadData();
    return () => { cancelled = true; };
  }, [authLoading, userId]);

  const statCards = [
    { label: 'TOTAL APPS', value: dashboard.total_applications, icon: 'work', color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'INTERVIEWING', value: dashboard.status_counts.interviewing, icon: 'record_voice_over', color: 'text-secondary', bg: 'bg-secondary/10' },
    { label: 'OFFERS', value: dashboard.status_counts.offer, icon: 'emoji_events', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'WISHLIST', value: dashboard.status_counts.wishlist, icon: 'bookmark', color: 'text-tertiary-container', bg: 'bg-tertiary-fixed' },
  ];

  const reminderCards = useMemo(() => reminders.map((item) => ({ ...item, tone: reminderTone(item.followUp) })), [reminders]);

  return (
    <div className="p-xl max-w-max_width mx-auto">
      <div className="flex items-end justify-between mb-xl">
        <div>
          <h2 className="font-h1 text-h1 text-on-surface mb-xs">Dashboard</h2>
          <p className="font-body-sm text-on-surface-variant">Track your application pipeline and stay ahead.</p>
        </div>
        <button onClick={() => nav('/applications/new')} className="bg-primary text-on-primary px-lg py-2.5 rounded-lg font-semibold text-[13px] flex items-center gap-2 hover:opacity-90 transition-opacity shadow-sm">
          <span className="material-symbols-outlined text-[18px]">add</span>New Application
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-lg mb-xl">
        {statCards.map(({ label, value, icon, color, bg }) => (
          <div key={label} className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-lg shadow-sm">
            <div className="flex items-center justify-between mb-md">
              <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">{label}</span>
              <div className={`w-10 h-10 rounded-full ${bg} flex items-center justify-center`}>
                <span className={`material-symbols-outlined ${color}`}>{icon}</span>
              </div>
            </div>
            <p className="font-h1 text-h1">{value}</p>
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-lg mb-lg flex items-center gap-3">
          <span className="material-symbols-outlined text-red-500">error</span>
          <span className="text-red-700 text-body-sm">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-12 gap-lg">
        <div className="col-span-12 lg:col-span-8 bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-lg shadow-sm">
          <div className="flex items-center justify-between mb-xl">
            <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">Recent Applications</span>
            <button onClick={() => nav('/applications')} className="text-primary text-[12px] font-bold hover:underline">View All</button>
          </div>
          <div className="space-y-md">
            {loading && (
              <div className="flex items-center justify-center py-12">
                <span className="material-symbols-outlined text-primary animate-spin text-4xl">progress_activity</span>
              </div>
            )}
            {!loading && dashboard.recent_applications.length === 0 && (
              <div className="text-center text-on-surface-variant py-8">No recent applications.</div>
            )}
            {!loading && dashboard.recent_applications.map((app) => (
              <div key={app.id} onClick={() => nav(`/applications/${app.id}`)} className="flex items-center justify-between p-md rounded-lg hover:bg-surface transition-colors cursor-pointer border border-transparent hover:border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-surface-container flex items-center justify-center rounded-lg">
                    <span className="material-symbols-outlined text-outline">apartment</span>
                  </div>
                  <div>
                    <h4 className="font-h3 text-body-main text-on-surface leading-tight">{app.company}</h4>
                    <p className="text-body-sm text-outline">{app.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-body-sm text-on-surface-variant">{formatDate(app.created_at)}</span>
                  <span className={`px-2 py-1 rounded text-[11px] font-bold uppercase tracking-wider ${STATUS_META[app.status]?.sc || 'bg-slate-100 text-slate-700'}`}>{STATUS_META[app.status]?.label || app.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-lg shadow-sm">
          <span className="font-label-caps text-label-caps text-on-surface-variant uppercase block mb-xl">Follow-ups</span>
          {remindersError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-sm mb-md text-red-700 text-body-sm">{remindersError}</div>
          )}
          <div className="space-y-lg">
            {remindersLoading && (
              <div className="flex items-center justify-center py-10">
                <span className="material-symbols-outlined text-primary animate-spin text-4xl">progress_activity</span>
              </div>
            )}
            {!remindersLoading && reminderCards.length === 0 && (
              <div className="text-on-surface-variant text-body-sm p-md bg-surface/50 rounded-lg border border-slate-100">
                No follow-ups due.
              </div>
            )}
            {!remindersLoading && reminderCards.map((item) => (
              <div
                key={item.id}
                onClick={() => nav(`/applications/${item.id}`)}
                className={`flex gap-3 p-md rounded-lg border cursor-pointer transition-colors ${
                  item.tone === 'overdue'
                    ? 'bg-red-50 border-red-200'
                    : item.tone === 'upcoming'
                      ? 'bg-amber-50 border-amber-200'
                      : 'bg-surface/50 border-slate-100'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  item.tone === 'overdue'
                    ? 'bg-red-100'
                    : item.tone === 'upcoming'
                      ? 'bg-amber-100'
                      : 'bg-primary/10'
                }`}>
                  <span className={`material-symbols-outlined ${
                    item.tone === 'overdue'
                      ? 'text-red-600'
                      : item.tone === 'upcoming'
                        ? 'text-amber-700'
                        : 'text-primary'
                  }`}>event</span>
                </div>
                <div>
                  <p className="font-h3 text-[14px] leading-tight text-on-surface">{item.company}</p>
                  <p className="text-body-sm text-on-surface-variant">{item.role}</p>
                  <p className={`text-body-sm mt-1 ${
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
  );
}
