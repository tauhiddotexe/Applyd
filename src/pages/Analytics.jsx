import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { analyticsAPI } from '../services/api';

const EMPTY_ANALYTICS = {
  total: 0,
  by_status: {
    applied: 0,
    interviewing: 0,
    offer: 0,
    rejected: 0,
    wishlist: 0,
  },
  by_month: [],
  recent: [],
};

const STATUS_META = [
  { key: 'interviewing', label: 'Interviewing', color: 'bg-primary', text: 'text-primary' },
  { key: 'applied', label: 'Applied', color: 'bg-secondary', text: 'text-secondary' },
  { key: 'offer', label: 'Offers', color: 'bg-tertiary-container', text: 'text-tertiary-container' },
  { key: 'rejected', label: 'Rejected', color: 'bg-error', text: 'text-error' },
  { key: 'wishlist', label: 'Wishlist', color: 'bg-on-surface-variant', text: 'text-on-surface-variant' },
];

const RECENT_STATUS = {
  applied: 'bg-blue-100 text-blue-800',
  interviewing: 'bg-secondary-fixed text-on-secondary-fixed-variant',
  offer: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-800',
  wishlist: 'bg-amber-100 text-amber-800',
};

function formatDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatMonth(value) {
  if (!value) return '';
  const [year, month] = value.split('-');
  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString('en-US', { month: 'short' });
}

export default function Analytics() {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id;
  const [analytics, setAnalytics] = useState(EMPTY_ANALYTICS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (authLoading || !userId) return;

    setLoading(true);
    setError(null);
    analyticsAPI.analytics()
      .then((data) => {
        setAnalytics(data || EMPTY_ANALYTICS);
      })
      .catch((err) => {
        setAnalytics(EMPTY_ANALYTICS);
        setError(err.message || 'Failed to load analytics');
      })
      .finally(() => setLoading(false));
  }, [authLoading, userId]);

  const total = analytics.total;
  const interviewing = analytics.by_status.interviewing || 0;
  const offers = analytics.by_status.offer || 0;
  const interviewRate = total > 0 ? Math.round(((interviewing + offers) / total) * 100) : 0;
  const maxMonthCount = Math.max(...analytics.by_month.map((item) => item.count), 1);

  return (
    <div className="p-xl max-w-max_width mx-auto">
      <div className="mb-xl flex items-end justify-between">
        <div>
          <h2 className="font-h1 text-h1 text-on-surface mb-xs">Performance Analytics</h2>
          <p className="font-body-sm text-on-surface-variant">Measure your job search velocity and application success rates.</p>
        </div>
        <div className="bg-surface-container-highest/50 px-md py-sm rounded-lg flex items-center gap-2 border border-outline-variant/30">
          <span className="material-symbols-outlined text-on-surface-variant">calendar_today</span>
          <span className="text-data-tabular font-data-tabular">Real User Data</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-lg mb-lg flex items-center gap-3">
          <span className="material-symbols-outlined text-red-500">error</span>
          <span className="text-red-700 text-body-sm">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-12 gap-lg">
        <div className="col-span-12 lg:col-span-4 bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-lg shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-md">
              <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">Summary</span>
              <span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded text-[10px] font-bold">{interviewRate}% rate</span>
            </div>
            <div className="relative flex items-center justify-center py-xl">
              <svg className="w-40 h-40 transform -rotate-90">
                <circle className="text-surface-container" cx="80" cy="80" fill="transparent" r="70" stroke="currentColor" strokeWidth="8"/>
                <circle className="text-primary" cx="80" cy="80" fill="transparent" r="70" stroke="currentColor" strokeDasharray="440" strokeDashoffset={440 - (440 * interviewRate) / 100} strokeWidth="8"/>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-h1 text-h1">{interviewRate}%</span>
                <span className="font-label-caps text-label-caps text-on-surface-variant">Interview Rate</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-md pt-lg border-t border-outline-variant/10">
            <div className="text-center"><p className="font-label-caps text-label-caps text-on-surface-variant">Total</p><p className="font-h3 text-h3">{total}</p></div>
            <div className="text-center border-l border-outline-variant/10"><p className="font-label-caps text-label-caps text-on-surface-variant">Offers</p><p className="font-h3 text-h3">{offers}</p></div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-8 bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-lg shadow-sm">
          <div className="flex items-center justify-between mb-xl">
            <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">Applications Per Month</span>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary"/>
              <span className="text-[11px] font-semibold text-on-surface-variant">Monthly Count</span>
            </div>
          </div>
          <div className="h-64 flex items-end justify-between gap-4 px-2 relative">
            <div className="absolute inset-0 flex flex-col justify-between py-2 pointer-events-none">
              {[0, 1, 2, 3].map((i) => <div key={i} className="border-b border-outline-variant/10 w-full"/>)}
            </div>
            {!loading && analytics.by_month.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-on-surface-variant">No data yet</div>
            )}
            {analytics.by_month.map((item) => (
              <div key={item.month} className="flex-1 flex flex-col items-center group">
                <div className="w-full bg-surface-container-low rounded-t-sm h-56 group-hover:bg-primary/20 transition-colors relative">
                  <div
                    className="absolute bottom-0 w-full bg-primary rounded-t-sm"
                    style={{ height: `${Math.max((item.count / maxMonthCount) * 100, item.count > 0 ? 10 : 0)}%` }}
                  />
                </div>
                <span className="mt-4 font-label-caps text-label-caps text-on-surface-variant">{formatMonth(item.month)}</span>
                <span className="text-[11px] text-on-surface-variant">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-6 bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-lg shadow-sm">
          <span className="font-label-caps text-label-caps text-on-surface-variant uppercase block mb-xl">Status Distribution</span>
          <div className="flex items-center gap-xl">
            <div className="relative w-48 h-48 flex-shrink-0">
              <svg className="w-full h-full" viewBox="0 0 36 36">
                <path className="text-surface-container" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray="100, 100" strokeWidth="3"/>
                {(() => {
                  let offset = 0;
                  return STATUS_META.map((item) => {
                    const value = analytics.by_status[item.key] || 0;
                    const pct = total > 0 ? (value / total) * 100 : 0;
                    const path = (
                      <path
                        key={item.key}
                        className={item.text}
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeDasharray={`${pct}, 100`}
                        strokeDashoffset={-offset}
                        strokeWidth="3.5"
                      />
                    );
                    offset += pct;
                    return path;
                  });
                })()}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-h3 text-h3">{total}</span>
                <span className="text-[10px] text-on-surface-variant font-medium">Total Apps</span>
              </div>
            </div>
            <div className="flex-1 grid grid-cols-1 gap-md">
              {STATUS_META.map((item) => {
                const value = analytics.by_status[item.key] || 0;
                const pct = total > 0 ? Math.round((value / total) * 100) : 0;
                return (
                  <div key={item.key} className="flex items-center justify-between">
                    <div className="flex items-center gap-2"><div className={`w-3 h-3 rounded-full ${item.color}`}/><span className="font-body-sm text-body-sm text-on-surface-variant">{item.label}</span></div>
                    <span className="font-data-tabular text-data-tabular">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-6 bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-lg shadow-sm">
          <span className="font-label-caps text-label-caps text-on-surface-variant uppercase block mb-xl">Status Counts</span>
          <div className="space-y-md">
            {STATUS_META.map((item) => (
              <div key={item.key} className="flex items-center gap-md p-md bg-surface-container-low/50 rounded-lg border border-outline-variant/10">
                <div className={`w-10 h-10 rounded-full ${item.color} flex items-center justify-center flex-shrink-0`}>
                  <span className="material-symbols-outlined text-white">bar_chart</span>
                </div>
                <div className="flex-1">
                  <p className="font-h3 text-[14px] leading-tight mb-1 text-on-surface">{item.label}</p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">{analytics.by_status[item.key] || 0} application(s)</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-12 bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-lg shadow-sm">
          <div className="flex items-center justify-between mb-xl">
            <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">Recent Applications</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-lg">
            {loading && (
              <div className="col-span-12 flex items-center justify-center py-12">
                <span className="material-symbols-outlined text-primary animate-spin text-4xl">progress_activity</span>
              </div>
            )}
            {!loading && analytics.recent.length === 0 && (
              <div className="col-span-12 text-center text-on-surface-variant py-8">No data yet</div>
            )}
            {!loading && analytics.recent.map((item) => (
              <div key={item.id} className="bg-surface rounded-lg p-md border border-outline-variant/10">
                <div className="flex items-center gap-md mb-md">
                  <div className="w-8 h-8 rounded bg-surface-container flex items-center justify-center">
                    <span className="material-symbols-outlined text-outline text-[18px]">apartment</span>
                  </div>
                  <div>
                    <p className="font-h3 text-[14px]">{item.company}</p>
                    <p className="text-body-sm text-on-surface-variant">{item.role}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-1 rounded text-[11px] font-bold uppercase tracking-wider ${RECENT_STATUS[item.status] || 'bg-slate-100 text-slate-700'}`}>{item.status}</span>
                  <span className="text-body-sm text-on-surface-variant">{formatDate(item.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
