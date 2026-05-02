import { useEffect, useState, useMemo } from 'react';
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
  { key: 'interviewing', label: 'Interviewing', color: 'bg-primary', text: 'text-primary', light: 'bg-primary/10' },
  { key: 'applied', label: 'Applied', color: 'bg-secondary', text: 'text-secondary', light: 'bg-secondary/10' },
  { key: 'offer', label: 'Offers', color: 'bg-emerald-500', text: 'text-emerald-600', light: 'bg-emerald-50' },
  { key: 'rejected', label: 'Rejected', color: 'bg-red-400', text: 'text-red-500', light: 'bg-red-50' },
  { key: 'wishlist', label: 'Wishlist', color: 'bg-amber-400', text: 'text-amber-600', light: 'bg-amber-50' },
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
  const applied = analytics.by_status.applied || 0;
  const interviewing = analytics.by_status.interviewing || 0;
  const offers = analytics.by_status.offer || 0;
  const rejected = analytics.by_status.rejected || 0;
  const interviewRate = total > 0 ? Math.round(((interviewing + offers) / total) * 100) : 0;
  const offerRate = total > 0 ? Math.round((offers / total) * 100) : 0;
  const maxMonthCount = Math.max(...analytics.by_month.map((item) => item.count), 1);

  // Funnel data
  const funnelSteps = [
    { label: 'Applied', count: total, icon: 'send', color: 'bg-blue-500', pct: 100 },
    { label: 'Interviewing', count: interviewing, icon: 'record_voice_over', color: 'bg-primary', pct: total > 0 ? Math.round((interviewing / total) * 100) : 0 },
    { label: 'Offers', count: offers, icon: 'emoji_events', color: 'bg-emerald-500', pct: total > 0 ? Math.round((offers / total) * 100) : 0 },
  ];

  // Auto-generated insights
  const insights = useMemo(() => {
    const result = [];
    if (total === 0) return ['Start adding applications to see your analytics insights here.'];

    if (interviewRate >= 30) {
      result.push(`Strong interview conversion at ${interviewRate}% — your resume is hitting the right notes.`);
    } else if (interviewRate > 0) {
      result.push(`Your interview rate is ${interviewRate}%. Consider tailoring your resume for each role to improve callbacks.`);
    } else {
      result.push('No interviews yet. Try using the Resume Tailor to better align with job descriptions.');
    }

    if (rejected > interviewing && total > 3) {
      result.push(`${rejected} rejections vs ${interviewing} interviews — refining your application strategy could help.`);
    }

    if (offers > 0) {
      result.push(`${offers} offer${offers > 1 ? 's' : ''} received — ${offerRate}% conversion from total applications.`);
    }

    if (analytics.by_month.length >= 2) {
      const last = analytics.by_month[analytics.by_month.length - 1]?.count || 0;
      const prev = analytics.by_month[analytics.by_month.length - 2]?.count || 0;
      if (last > prev) {
        result.push(`Application volume is trending up (${prev} → ${last}) — keep the momentum going.`);
      } else if (last < prev && prev > 0) {
        result.push(`Application volume dipped from ${prev} to ${last}. Staying consistent helps build pipeline.`);
      }
    }

    return result.slice(0, 4);
  }, [analytics, total, interviewRate, offerRate, rejected, interviewing, offers]);

  return (
    <div className="p-4 md:p-8 max-w-max_width mx-auto">
      <div className="mb-5 flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <h2 className="font-h1 text-h1 text-on-surface mb-1">Performance Analytics</h2>
          <p className="font-body-sm text-on-surface-variant">Measure your job search velocity and application success rates.</p>
        </div>
        <div className="bg-surface-container-highest/50 px-3 py-1.5 rounded-lg flex items-center gap-2 border border-outline-variant/30">
          <span className="material-symbols-outlined text-on-surface-variant text-[18px]">calendar_today</span>
          <span className="text-[12px] font-medium text-on-surface-variant">Live Data</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 flex items-center gap-3">
          <span className="material-symbols-outlined text-red-500">error</span>
          <span className="text-red-700 text-body-sm">{error}</span>
        </div>
      )}

      {/* 2x2 Grid: Funnel + Trend | Status + Insights */}
      <div className="grid grid-cols-12 gap-4">
        {/* Funnel View */}
        <div className="col-span-12 lg:col-span-6 bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-5 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-primary text-[20px]">filter_alt</span>
            <span className="font-h3 text-on-surface text-[14px]">Application Funnel</span>
          </div>

          {total === 0 && !loading ? (
            <div className="text-center py-8 flex-1 flex flex-col items-center justify-center">
              <span className="material-symbols-outlined text-outline text-3xl mb-2 block">filter_alt</span>
              <p className="text-on-surface-variant text-[12px]">No data yet. Add applications to see your funnel.</p>
            </div>
          ) : (
            <div className="space-y-4 flex-1">
              {funnelSteps.map((step, i) => (
                <div key={step.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-on-surface-variant">{step.icon}</span>
                      <span className="text-[13px] font-semibold text-on-surface">{step.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-bold text-on-surface">{step.count}</span>
                      {i > 0 && <span className="text-[10px] text-on-surface-variant bg-surface-container px-1.5 py-0.5 rounded">{step.pct}%</span>}
                    </div>
                  </div>
                  <div className="w-full bg-surface-container rounded-full h-2.5">
                    <div
                      className={`${step.color} rounded-full h-2.5 transition-all duration-700`}
                      style={{ width: `${Math.max(step.pct, step.count > 0 ? 5 : 0)}%` }}
                    ></div>
                  </div>
                  {i < funnelSteps.length - 1 && (
                    <div className="flex justify-center py-1">
                      <span className="material-symbols-outlined text-outline/30 text-[16px]">arrow_downward</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-3 pt-4 mt-4 border-t border-outline-variant/10">
            <div className="text-center p-3 bg-surface-container-low/50 rounded-lg">
              <p className="text-[10px] text-on-surface-variant uppercase tracking-wider mb-1">Interview Rate</p>
              <p className="font-h3 text-[20px] text-primary">{interviewRate}%</p>
            </div>
            <div className="text-center p-3 bg-surface-container-low/50 rounded-lg">
              <p className="text-[10px] text-on-surface-variant uppercase tracking-wider mb-1">Offer Rate</p>
              <p className="font-h3 text-[20px] text-emerald-600">{offerRate}%</p>
            </div>
          </div>
        </div>

        {/* Trend Chart */}
        <div className="col-span-12 lg:col-span-6 bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-secondary">show_chart</span>
              <span className="font-h3 text-on-surface text-[14px]">Applications Over Time</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary"/>
              <span className="text-[11px] text-on-surface-variant">Monthly Count</span>
            </div>
          </div>
          <div className="h-72 flex items-end justify-between gap-2 px-1 relative flex-1">
            <div className="absolute inset-0 flex flex-col justify-between py-2 pointer-events-none">
              {[0, 1, 2, 3].map((i) => <div key={i} className="border-b border-outline-variant/10 w-full"/>)}
            </div>
            {!loading && analytics.by_month.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="material-symbols-outlined text-outline text-3xl mb-2">bar_chart</span>
                <p className="text-on-surface-variant text-[12px]">No monthly data yet</p>
              </div>
            )}
            {analytics.by_month.map((item) => (
              <div key={item.month} className="flex-1 flex flex-col items-center group relative">
                {/* Tooltip */}
                <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-on-surface text-surface text-[11px] px-2 py-1 rounded pointer-events-none whitespace-nowrap z-10">
                  {item.count} apps
                </div>
                <div className="w-full bg-surface-container-low rounded-t-sm h-60 group-hover:bg-primary/10 transition-colors relative">
                  <div
                    className="absolute bottom-0 w-full bg-primary group-hover:bg-primary/90 rounded-t-sm transition-all duration-500"
                    style={{ height: `${Math.max((item.count / maxMonthCount) * 100, item.count > 0 ? 10 : 0)}%` }}
                  />
                </div>
                <span className="mt-2 text-[10px] font-semibold text-on-surface-variant uppercase">{formatMonth(item.month)}</span>
                <span className="text-[11px] text-on-surface-variant">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Status Distribution */}
        <div className="col-span-12 lg:col-span-6 bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-[20px] text-primary">donut_large</span>
            <span className="font-h3 text-on-surface text-[14px]">Status Distribution</span>
          </div>
          <div className="flex items-center gap-6">
            <div className="relative w-36 h-36 flex-shrink-0">
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
                <span className="font-h2 text-[22px] text-on-surface">{total}</span>
                <span className="text-[9px] text-on-surface-variant font-medium uppercase tracking-wider">Total</span>
              </div>
            </div>
            <div className="flex-1 space-y-2.5">
              {STATUS_META.map((item) => {
                const value = analytics.by_status[item.key] || 0;
                const pct = total > 0 ? Math.round((value / total) * 100) : 0;
                return (
                  <div key={item.key} className="flex items-center justify-between group">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-2.5 h-2.5 rounded-full ${item.color}`}/>
                      <span className="text-[12px] text-on-surface-variant group-hover:text-on-surface transition-colors">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-semibold text-on-surface">{value}</span>
                      <span className="text-[10px] text-on-surface-variant w-8 text-right">{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Insights — More prominent */}
        <div className="col-span-12 lg:col-span-6 bg-gradient-to-br from-primary/8 via-secondary/5 to-primary/3 border border-primary/20 rounded-xl p-5 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px] text-primary">lightbulb</span>
            </div>
            <div>
              <span className="font-h3 text-on-surface text-[14px] block leading-tight">AI Insights</span>
              <span className="text-[10px] text-on-surface-variant">Based on your data</span>
            </div>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-8 flex-1">
              <span className="material-symbols-outlined text-primary animate-spin text-3xl">progress_activity</span>
            </div>
          ) : (
            <div className="space-y-2.5 flex-1">
              {insights.map((insight, i) => (
                <div key={i} className="flex gap-3 items-start p-3 bg-surface-container-lowest/80 rounded-lg border border-outline-variant/10 hover:border-primary/20 transition-colors">
                  <span className="material-symbols-outlined text-primary text-[18px] mt-0.5 shrink-0">auto_awesome</span>
                  <p className="text-[13px] text-on-surface leading-relaxed">{insight}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Applications — Compact row */}
        <div className="col-span-12 bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-[20px] text-on-surface-variant">history</span>
            <span className="font-h3 text-on-surface text-[14px]">Recent Applications</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
            {loading && (
              <div className="col-span-12 flex items-center justify-center py-10">
                <span className="material-symbols-outlined text-primary animate-spin text-4xl">progress_activity</span>
              </div>
            )}
            {!loading && analytics.recent.length === 0 && (
              <div className="col-span-12 text-center py-8">
                <span className="material-symbols-outlined text-outline text-2xl mb-2 block">inbox</span>
                <p className="text-on-surface-variant text-[12px]">No applications to show</p>
              </div>
            )}
            {!loading && analytics.recent.map((item) => (
              <div key={item.id} className="bg-surface rounded-lg p-3.5 border border-outline-variant/10 hover:border-outline-variant/30 hover:shadow-sm transition-all cursor-pointer">
                <div className="flex items-center gap-2.5 mb-2.5">
                  <div className="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center">
                    <span className="material-symbols-outlined text-outline text-[14px]">apartment</span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-h3 text-[12px] truncate leading-tight">{item.company}</p>
                    <p className="text-[10px] text-on-surface-variant truncate">{item.role}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${RECENT_STATUS[item.status] || 'bg-slate-100 text-slate-700'}`}>{item.status}</span>
                  <span className="text-[10px] text-on-surface-variant">{formatDate(item.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
