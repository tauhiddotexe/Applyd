import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { analyticsAPI } from '../services/api';

const MOCK = {
  stats: { total: 47, interviewing: 12, offers: 3, responseRate: 68 },
  recent: [
    { id: 1, company: 'Google', role: 'UX Engineer', status: 'Applied', sc: 'bg-blue-100 text-blue-800', date: '2 days ago', icon: 'corporate_fare' },
    { id: 2, company: 'Stripe', role: 'Product Designer', status: 'Offer', sc: 'bg-emerald-100 text-emerald-800', date: '1 week ago', icon: 'apartment' },
    { id: 3, company: 'Shopify', role: 'Lead Developer', status: 'Interviewing', sc: 'bg-secondary-fixed text-on-secondary-fixed-variant', date: '3 days ago', icon: 'storefront' },
  ],
  upcoming: [
    { id: 1, type: 'TECHNICAL', company: 'Stripe', time: 'Oct 28, 2023 • 2:00 PM', icon: 'videocam' },
    { id: 2, type: 'FOLLOW-UP', company: 'Google', time: 'Oct 30, 2023', icon: 'event' },
  ]
};

export default function Dashboard() {
  const nav = useNavigate();
  const [stats, setStats] = useState(MOCK.stats);

  useEffect(() => {
    analyticsAPI.dashboard().then(d => { if (d) setStats(d); }).catch(() => {});
  }, []);

  const statCards = [
    { label: 'TOTAL APPS', value: stats.total, icon: 'work', color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'INTERVIEWING', value: stats.interviewing, icon: 'record_voice_over', color: 'text-secondary', bg: 'bg-secondary/10' },
    { label: 'OFFERS', value: stats.offers, icon: 'emoji_events', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'RESPONSE RATE', value: `${stats.responseRate}%`, icon: 'trending_up', color: 'text-tertiary-container', bg: 'bg-tertiary-fixed' },
  ];

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

      <div className="grid grid-cols-12 gap-lg">
        <div className="col-span-12 lg:col-span-8 bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-lg shadow-sm">
          <div className="flex items-center justify-between mb-xl">
            <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">Recent Applications</span>
            <button onClick={() => nav('/applications')} className="text-primary text-[12px] font-bold hover:underline">View All</button>
          </div>
          <div className="space-y-md">
            {MOCK.recent.map(app => (
              <div key={app.id} onClick={() => nav(`/applications/${app.id}`)} className="flex items-center justify-between p-md rounded-lg hover:bg-surface transition-colors cursor-pointer border border-transparent hover:border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-surface-container flex items-center justify-center rounded-lg">
                    <span className="material-symbols-outlined text-outline">{app.icon}</span>
                  </div>
                  <div>
                    <h4 className="font-h3 text-body-main text-on-surface leading-tight">{app.company}</h4>
                    <p className="text-body-sm text-outline">{app.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-body-sm text-on-surface-variant">{app.date}</span>
                  <span className={`px-2 py-1 rounded text-[11px] font-bold uppercase tracking-wider ${app.sc}`}>{app.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-lg shadow-sm">
          <span className="font-label-caps text-label-caps text-on-surface-variant uppercase block mb-xl">Upcoming Events</span>
          <div className="space-y-lg">
            {MOCK.upcoming.map(ev => (
              <div key={ev.id} className="flex gap-3 p-md bg-surface/50 rounded-lg border border-slate-100">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-primary">{ev.icon}</span>
                </div>
                <div>
                  <span className="text-label-caps text-on-surface-variant block mb-1">{ev.type}</span>
                  <p className="font-h3 text-[14px] leading-tight text-on-surface">{ev.company}</p>
                  <p className="text-body-sm text-on-surface-variant mt-1">{ev.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
