import { useEffect, useState, useMemo } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { analyticsAPI } from '../services/api';
import { FadeIn, StaggerContainer, StaggerItem } from '../components/ui/MotionDiv';

const EMPTY_ANALYTICS = {
  total: 0,
  by_status: { applied: 0, interviewing: 0, offer: 0, rejected: 0, wishlist: 0 },
  by_month: [],
  recent: [],
};

const STATUS_META = [
  { key: 'interviewing', label: 'Interviewing', color: '#4648d4', bg: 'bg-secondary', text: 'text-secondary', light: 'bg-secondary/10' },
  { key: 'applied', label: 'Applied', color: '#004ac6', bg: 'bg-primary', text: 'text-primary', light: 'bg-primary/10' },
  { key: 'offer', label: 'Offers', color: '#10b981', bg: 'bg-emerald-500', text: 'text-emerald-600', light: 'bg-emerald-50' },
  { key: 'rejected', label: 'Rejected', color: '#f87171', bg: 'bg-red-400', text: 'text-red-500', light: 'bg-red-50' },
  { key: 'wishlist', label: 'Wishlist', color: '#f59e0b', bg: 'bg-amber-400', text: 'text-amber-600', light: 'bg-amber-50' },
];

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
  const reduce = useReducedMotion();

  useEffect(() => {
    if (authLoading || !userId) return;
    setLoading(true);
    setError(null);
    analyticsAPI.analytics()
      .then((data) => setAnalytics(data || EMPTY_ANALYTICS))
      .catch((err) => { setAnalytics(EMPTY_ANALYTICS); setError(err.message || 'Failed to load analytics'); })
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

  const chartStats = useMemo(() => {
    if (analytics.by_month.length === 0) return null;
    const counts = analytics.by_month.map(m => m.count);
    const total = counts.reduce((a, b) => a + b, 0);
    const avg = Math.round(total / counts.length);
    const best = Math.max(...counts);
    const last = counts[counts.length - 1];
    const prev = counts.length >= 2 ? counts[counts.length - 2] : last;
    const direction = last > prev ? 'up' : last < prev ? 'down' : 'flat';
    const pctChange = prev > 0 ? Math.round(((last - prev) / prev) * 100) : 0;
    return { total, avg, best, direction, pctChange, last, prev };
  }, [analytics.by_month]);

  const funnelSteps = [
    { label: 'Applied', count: total, icon: 'send', color: 'bg-blue-500', pct: 100 },
    { label: 'Interviewing', count: interviewing, icon: 'record_voice_over', color: 'bg-primary', pct: total > 0 ? Math.round((interviewing / total) * 100) : 0 },
    { label: 'Offers', count: offers, icon: 'emoji_events', color: 'bg-emerald-500', pct: total > 0 ? Math.round((offers / total) * 100) : 0 },
  ];

  const insights = useMemo(() => {
    const result = [];
    if (total === 0) return ['Start adding applications to see your analytics insights here.'];
    if (interviewRate >= 30) result.push(`Strong interview conversion at ${interviewRate}% — your resume is hitting the right notes.`);
    else if (interviewRate > 0) result.push(`Your interview rate is ${interviewRate}%. Consider tailoring your resume for each role to improve callbacks.`);
    else result.push('No interviews yet. Try using the Resume Tailor to better align with job descriptions.');
    if (rejected > interviewing && total > 3) result.push(`${rejected} rejections vs ${interviewing} interviews — refining your application strategy could help.`);
    if (offers > 0) result.push(`${offers} offer${offers > 1 ? 's' : ''} received — ${offerRate}% conversion from total applications.`);
    if (analytics.by_month.length >= 2) {
      const last = analytics.by_month[analytics.by_month.length - 1]?.count || 0;
      const prev = analytics.by_month[analytics.by_month.length - 2]?.count || 0;
      if (last > prev) result.push(`Application volume is trending up (${prev} → ${last}) — keep the momentum going.`);
      else if (last < prev && prev > 0) result.push(`Application volume dipped from ${prev} to ${last}. Staying consistent helps build pipeline.`);
    }
    return result.slice(0, 4);
  }, [analytics, total, interviewRate, offerRate, rejected, interviewing, offers]);

  return (
    <div className="p-4 md:p-8 lg:p-10 max-w-7xl mx-auto space-y-6 md:space-y-8">
      <FadeIn>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-1">Performance Analytics</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Measure your job search velocity and application success rates.</p>
          </div>
          <motion.div
            className="bg-slate-100 dark:bg-white/[0.06] px-3 py-1.5 rounded-xl flex items-center gap-2 border border-slate-200 dark:border-white/[0.06]"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <span className="material-symbols-outlined text-slate-500 dark:text-slate-400 text-[18px]">calendar_today</span>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">Live Data</span>
          </motion.div>
        </div>
      </FadeIn>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-2xl p-4 flex items-center gap-3">
          <span className="material-symbols-outlined text-red-500">error</span>
          <span className="text-red-700 dark:text-red-400 font-bold text-sm">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-12 gap-4 md:gap-6">
        {/* Funnel */}
        <FadeIn className="col-span-12 lg:col-span-6 bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] rounded-3xl p-5 md:p-6 card-shadow flex flex-col" delay={0.05}>
          <div className="flex items-center gap-2 mb-5">
            <span className="material-symbols-outlined text-primary text-[20px]">filter_alt</span>
            <span className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-widest">Application Funnel</span>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center py-12">
              <span className="material-symbols-outlined text-primary animate-spin text-3xl">progress_activity</span>
            </div>
          ) : total === 0 ? (
            <div className="text-center py-10 flex-1 flex flex-col items-center justify-center">
              <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 text-3xl mb-2 block">filter_alt</span>
              <p className="text-slate-500 dark:text-slate-400 text-[12px] font-medium">No data yet. Add applications to see your funnel.</p>
            </div>
          ) : (
            <div className="space-y-4 flex-1">
              {funnelSteps.map((step, i) => (
                <div key={step.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-slate-400 dark:text-slate-500">{step.icon}</span>
                      <span className="text-[13px] font-black text-slate-900 dark:text-white">{step.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-black text-slate-900 dark:text-white">{step.count}</span>
                      {i > 0 && <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/[0.06] px-1.5 py-0.5 rounded">{step.pct}%</span>}
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-white/[0.06] rounded-full h-2.5 overflow-hidden">
                    <motion.div
                      className={`${step.color} rounded-full h-2.5 shadow-sm`}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(step.pct, step.count > 0 ? 5 : 0)}%` }}
                      transition={{ duration: 0.8, delay: 0.2 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </div>
                  {i < funnelSteps.length - 1 && (
                    <div className="flex justify-center py-0.5">
                      <span className="material-symbols-outlined text-slate-200 dark:text-white/[0.04] text-[16px]">arrow_downward</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 pt-5 mt-5 border-t border-slate-100 dark:border-white/[0.04]">
            <motion.div
              className="text-center p-4 bg-slate-50 dark:bg-white/[0.02] rounded-2xl border border-slate-200 dark:border-white/[0.06]"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.12em] mb-1">Interview Rate</p>
              <p className="font-black text-2xl md:text-3xl text-primary">{interviewRate}%</p>
            </motion.div>
            <motion.div
              className="text-center p-4 bg-slate-50 dark:bg-white/[0.02] rounded-2xl border border-slate-200 dark:border-white/[0.06]"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
            >
              <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.12em] mb-1">Offer Rate</p>
              <p className="font-black text-2xl md:text-3xl text-emerald-600 dark:text-emerald-500">{offerRate}%</p>
            </motion.div>
          </div>
        </FadeIn>

        {/* Trend Chart */}
        <FadeIn className="col-span-12 lg:col-span-6 bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] rounded-3xl p-5 md:p-6 card-shadow flex flex-col" delay={0.1}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-secondary">show_chart</span>
              <span className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-widest">Growth Trend</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">Monthly</span>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16 flex-1">
              <span className="material-symbols-outlined text-primary animate-spin text-3xl">progress_activity</span>
            </div>
          ) : analytics.by_month.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-6 select-none">
              <svg className="w-full max-w-[280px] h-36 mb-5" viewBox="0 0 280 120" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="ghostGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#004ac6" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#004ac6" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <path d="M20,100 L70,85 L120,90 L170,60 L220,70 L260,40" fill="none" stroke="#004ac6" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.3" />
                <path d="M20,100 L70,85 L120,90 L170,60 L220,70 L260,40 L260,100 L20,100 Z" fill="url(#ghostGrad)" />
                <circle cx="20" cy="100" r="3" fill="#004ac6" opacity="0.3" />
                <circle cx="70" cy="85" r="3" fill="#004ac6" opacity="0.3" />
                <circle cx="120" cy="90" r="3" fill="#004ac6" opacity="0.3" />
                <circle cx="170" cy="60" r="3" fill="#004ac6" opacity="0.3" />
                <circle cx="220" cy="70" r="3" fill="#004ac6" opacity="0.3" />
                <circle cx="260" cy="40" r="3" fill="#004ac6" opacity="0.3" />
                <line x1="20" y1="110" x2="260" y2="110" stroke="currentColor" className="text-slate-100 dark:text-white/[0.06]" strokeWidth="1" />
              </svg>
              <p className="text-slate-500 dark:text-slate-400 font-bold text-sm text-center leading-relaxed max-w-[220px]">Start tracking jobs to reveal your growth trend</p>
              <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 mt-1 text-center">Your monthly journey will appear here</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col">
              <div className="flex-1 relative min-h-[240px]">
                <svg className="w-full h-full" viewBox="0 0 340 190" preserveAspectRatio="none">
                  {(() => {
                    const data = analytics.by_month;
                    const n = data.length;
                    const max = Math.max(...data.map(d => d.count), 1);
                    const steps = Math.min(max, 5);
                    const tickStep = Math.max(1, Math.round(max / steps));
                    const padL = 28;
                    const padR = 4;
                    const padT = 4;
                    const padB = 22;
                    const chartW = 340 - padL - padR;
                    const chartH = 190 - padT - padB;

                    const ticks = [];
                    for (let v = 0; v <= max; v += tickStep) {
                      ticks.push(v);
                    }
                    if (ticks[ticks.length - 1] !== max && max > 0) ticks.push(max);

                    return (
                      <g>
                        {ticks.map((tick) => {
                          const y = padT + chartH - (tick / max) * chartH;
                          return (
                            <g key={`tick-${tick}`}>
                              <line x1={padL} y1={y} x2={padL + chartW} y2={y} stroke="currentColor" className="text-slate-100 dark:text-white/[0.05]" strokeWidth="1" strokeDasharray="3 3" />
                              <text x={padL - 6} y={y + 3} textAnchor="end" fill="#94a3b8" fontSize="8" fontWeight="700">{tick}</text>
                            </g>
                          );
                        })}

                        <line x1={padL} y1={padT + chartH} x2={padL + chartW} y2={padT + chartH} stroke="currentColor" className="text-slate-200 dark:text-white/[0.08]" strokeWidth="1" />
                        <line x1={padL} y1={padT} x2={padL} y2={padT + chartH} stroke="currentColor" className="text-slate-200 dark:text-white/[0.06]" strokeWidth="1" />

                        {(() => {
                          const points = data.map((d, i) => ({
                            x: padL + (i / Math.max(n - 1, 1)) * chartW,
                            y: padT + chartH - (d.count / max) * chartH,
                            count: d.count,
                            month: d.month,
                          }));

                          const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
                          const isUp = points.length >= 2 && points[points.length - 1].y < points[0].y;

                          const strokeColor = isUp ? '#10b981' : '#004ac6';

                          return (
                            <g>
                              <motion.path
                                d={pathD}
                                fill="none"
                                stroke={strokeColor}
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                              />
                              <motion.path
                                d={pathD}
                                fill="none"
                                stroke={strokeColor}
                                strokeWidth="7"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                opacity="0.15"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                              />

                              {points.map((p, i) => (
                                <g key={data[i].month}>
                                  <motion.circle
                                    cx={p.x} cy={p.y} r="4.5"
                                    fill={strokeColor}
                                    stroke="#fff" strokeWidth="2"
                                    initial={{ r: 0 }}
                                    animate={{ r: 4.5 }}
                                    transition={{ delay: 0.5 + i * 0.04, type: 'spring', stiffness: 200, damping: 15 }}
                                  />
                                  <text
                                    x={p.x} y={p.y - 12}
                                    textAnchor="middle"
                                    fill="#64748b" fontSize="8" fontWeight="800"
                                  >
                                    {p.count}
                                  </text>
                                </g>
                              ))}

                              {points.map((p, i) => (
                                <text
                                  key={`lbl-${i}`}
                                  x={p.x} y={padT + chartH + 14}
                                  textAnchor="middle"
                                  fill="#94a3b8" fontSize="8" fontWeight="700"
                                  className="uppercase tracking-tight"
                                >
                                  {formatMonth(data[i].month)}
                                </text>
                              ))}
                            </g>
                          );
                        })()}
                      </g>
                    );
                  })()}
                </svg>
              </div>

              {chartStats && (
                <motion.div
                  className="grid grid-cols-4 gap-2 pt-3 mt-2 border-t border-slate-100 dark:border-white/[0.04]"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="text-center p-2.5 bg-slate-50 dark:bg-white/[0.02] rounded-2xl border border-slate-200/50 dark:border-white/[0.05]">
                    <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.12em]">Total</p>
                    <p className="font-black text-lg text-slate-900 dark:text-white">{chartStats.total}</p>
                  </div>
                  <div className="text-center p-2.5 bg-slate-50 dark:bg-white/[0.02] rounded-2xl border border-slate-200/50 dark:border-white/[0.05]">
                    <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.12em]">Avg / Mo</p>
                    <p className="font-black text-lg text-slate-900 dark:text-white">{chartStats.avg}</p>
                  </div>
                  <div className="text-center p-2.5 bg-slate-50 dark:bg-white/[0.02] rounded-2xl border border-slate-200/50 dark:border-white/[0.05]">
                    <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.12em]">Best</p>
                    <p className="font-black text-lg text-slate-900 dark:text-white">{chartStats.best}</p>
                  </div>
                  <div className="text-center p-2.5 bg-slate-50 dark:bg-white/[0.02] rounded-2xl border border-slate-200/50 dark:border-white/[0.05] flex flex-col items-center justify-center">
                    <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.12em] mb-0.5">Trend</p>
                    <div className="flex items-center gap-1">
                      <span className={`material-symbols-outlined text-lg ${chartStats.direction === 'up' ? 'text-emerald-500' : chartStats.direction === 'down' ? 'text-red-400' : 'text-slate-400'}`}>
                        {chartStats.direction === 'up' ? 'trending_up' : chartStats.direction === 'down' ? 'trending_down' : 'remove'}
                      </span>
                      <span className={`font-black text-sm ${chartStats.direction === 'up' ? 'text-emerald-600' : chartStats.direction === 'down' ? 'text-red-500' : 'text-slate-500'}`}>
                        {chartStats.direction === 'up' ? '+' : ''}{chartStats.pctChange}%
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </FadeIn>

        {/* Status Distribution */}
        <FadeIn className="col-span-12 lg:col-span-6 bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] rounded-3xl p-5 md:p-6 card-shadow" delay={0.15}>
          <div className="flex items-center gap-2 mb-5">
            <span className="material-symbols-outlined text-[20px] text-primary">donut_large</span>
            <span className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-widest">Status Breakdown</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <span className="material-symbols-outlined text-primary animate-spin text-3xl">progress_activity</span>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row items-center gap-6">
              <motion.div
                className="relative w-40 h-40 flex-shrink-0"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <circle className="text-slate-100 dark:text-white/[0.04]" cx="18" cy="18" r="15.9155" fill="none" stroke="currentColor" strokeWidth="3"/>
                  {(() => {
                    let offset = 0;
                    return STATUS_META.map((item) => {
                      const value = analytics.by_status[item.key] || 0;
                      const pct = total > 0 ? (value / total) * 100 : 0;
                      const circumference = 100;
                      const strokeDashoffset = -offset;
                      offset += pct;
                      return (
                        <circle
                          key={item.key}
                          cx="18" cy="18" r="15.9155"
                          fill="none"
                          stroke={item.color}
                          strokeWidth="3"
                          strokeDasharray={`${pct} ${100 - pct}`}
                          strokeDashoffset={strokeDashoffset}
                          strokeLinecap="round"
                          className="transition-all duration-700"
                        />
                      );
                    });
                  })()}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <motion.span
                    className="font-black text-3xl text-slate-900 dark:text-white"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.3 }}
                  >
                    {total}
                  </motion.span>
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-[0.12em]">Total</span>
                </div>
              </motion.div>

              <div className="flex-1 space-y-2.5 w-full">
                {STATUS_META.map((item, idx) => {
                  const value = analytics.by_status[item.key] || 0;
                  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
                  return (
                    <motion.div
                      key={item.key}
                      className="flex items-center justify-between group"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + idx * 0.05 }}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-2.5 h-2.5 rounded-full ${item.bg} shadow-sm`} />
                        <span className="text-[12px] font-bold text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{item.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-black text-slate-900 dark:text-white">{value}</span>
                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 w-8 text-right">{pct}%</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </FadeIn>

        {/* Insights */}
        <FadeIn className="col-span-12 lg:col-span-6 bg-gradient-to-br from-primary/[0.04] via-secondary/[0.03] to-transparent border border-primary/20 dark:border-primary/30 rounded-3xl p-5 md:p-6 card-shadow flex flex-col" delay={0.2}>
          <div className="flex items-center gap-2 mb-5">
            <motion.div
              className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              <span className="material-symbols-outlined text-[20px] text-primary">lightbulb</span>
            </motion.div>
            <div>
              <span className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-widest block leading-tight">AI Insights</span>
              <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-tighter">Smart Analysis</span>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8 flex-1">
              <span className="material-symbols-outlined text-primary animate-spin text-3xl">progress_activity</span>
            </div>
          ) : (
            <div className="space-y-3 flex-1">
              {insights.map((insight, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.05 }}
                  className="flex gap-3 items-start p-4 bg-white/40 dark:bg-white/[0.02] rounded-2xl border border-slate-200/50 dark:border-white/[0.05] hover:border-primary/20 transition-colors"
                >
                  <span className="material-symbols-outlined text-primary text-[18px] mt-0.5 shrink-0">auto_awesome</span>
                  <p className="text-[13px] text-slate-700 dark:text-slate-200 font-medium leading-relaxed">{insight}</p>
                </motion.div>
              ))}
            </div>
          )}
        </FadeIn>

        {/* Recent Activity */}
        <FadeIn className="col-span-12 bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] rounded-3xl p-5 md:p-6 card-shadow" delay={0.25}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-slate-400 dark:text-slate-500">history</span>
              <span className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-widest">Recent Activity</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {loading ? (
              <div className="col-span-full flex items-center justify-center py-10">
                <span className="material-symbols-outlined text-primary animate-spin text-3xl">progress_activity</span>
              </div>
            ) : analytics.recent.length === 0 ? (
              <div className="col-span-full text-center py-10">
                <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 text-3xl mb-2 block">inbox</span>
                <p className="text-slate-500 dark:text-slate-400 text-[12px] font-medium">No applications to show</p>
              </div>
            ) : (
              analytics.recent.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="bg-slate-50 dark:bg-white/[0.02] rounded-2xl p-4 border border-slate-200 dark:border-white/[0.05] hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-xl bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-slate-400 dark:text-slate-500 text-[16px]">apartment</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-black text-[13px] text-slate-900 dark:text-white truncate leading-tight">{item.company}</p>
                      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 truncate mt-0.5">{item.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${item.status === 'applied' ? 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300' : item.status === 'interviewing' ? 'bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-300' : item.status === 'offer' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300' : item.status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300'}`}>
                      {item.status}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">{formatDate(item.created_at)}</span>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </FadeIn>
      </div>
    </div>
  );
}
