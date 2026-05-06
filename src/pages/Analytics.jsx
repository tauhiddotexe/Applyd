import { useState } from 'react';

const barH = ['h-12','h-24','h-32','h-48','h-40','h-56'];
const innerH = ['h-8','h-16','h-24','h-40','h-32','h-48'];
const months = ['Jan','Feb','Mar','Apr','May','Jun'];

const platforms = [
  { name:'LinkedIn', n:24, pct:80, color:'bg-primary', img:'https://lh3.googleusercontent.com/aida-public/AB6AXuCqQ88OK4dEEgxilMmJITSk1OGZ53YQFfVpDWaaSP2H5r1DbWZCIPkP6OTHEGB3gGX5Aaj5VWYK1F0o4SdS-pgtTCKPl8et8IyhZ19o5OlWaG6fWSGiTrAecUBsL0AWAqPtDzLlCzuYbwR6Hle11cE7pZD2e5cpf6tqEb4xVr5KhQOXIisdqkbR_UwC4txap09a9n3UVdQ6MRbeMXUGMtkD_ZxTgEsINOwmHCOGHqNAdFIie0LuMeU6koD6Ky4W5qKI7UCNHVtzqCo' },
  { name:'Indeed', n:12, pct:45, color:'bg-secondary', img:'https://lh3.googleusercontent.com/aida-public/AB6AXuBmi8fiVa-KPOP-vbjx4v70dKCR45YoZ26xoctXM-pEQja3V-YeICB2vVWaQMcS_eI93VzcK99OcAp1ZboQKLuntViIcvTFSTOXFZCZxBWTvwwcJEDH7Jj9-gdqhPUlJPOcypYtPvQennJ9ZeHXrxUTm160-shUTt7iJd5PnDKP6TmAejKHY8g0u0PEtCwmQgKKUfkT2fuR-efrzyp84TBxDbHXV5nnHpbj21BogZfCAh3fOYvYyiBbWaEEdPjFCdBuIedBne_AT00' },
  { name:'Referrals', n:38, pct:95, color:'bg-tertiary-container', img:'https://lh3.googleusercontent.com/aida-public/AB6AXuDzz5AvWaqNRDbs6dvpmW9c7lKd_5q2N-jlql2TfJLwUJMPbz0DQtuZGSCOza-7gmQSRh5TkNDS1VqxwZ2kJ7_dqfDs3JIsoJJUWXGHsh9-ERKUKgKUgJenbtddxquC-MBwWHvuttsQHql2qgdWhoiDWe6ZNN20nOfvEezFrgpnDkvwsEr2de5UJhrfMQfKuHfH7jmESeFE5GlpxQjGvXZu_-OwM1KK3lK2pKQQdWCkSV2v-2ylxF8fOM5pEpVuPLDhAyr_xbF09kk' },
  { name:'Direct Sites', n:19, pct:60, color:'bg-on-surface-variant', img:'https://lh3.googleusercontent.com/aida-public/AB6AXuCUDaXlgP51lVnd2pe1uROUT4FVDPnuZP_7k_O2t8wme3bokDvpzq1sG6WIVXXuGO1N2ykgxtNIQzw6RkGw2SggB-bQyUdZL6xgS35u3tcoMdpU2S1hX2ZKHw8gli_z2C40KDQ1UsV91zv2hXpyFo8apXuztXMIIBIh9m5eBWIX7K8ivBqE1J1B_V0CGmq0Oy8IoxzCrKZWbLbnHjCcdxt92gOve6j63ua2t7hFQOGFdTend-eLXoIFv6RXKMuB_PUzYUydajMX4oQ' },
];

const insights = [
  { icon:'auto_awesome', bg:'bg-primary-container/10', cl:'text-primary', t:'Peak Activity Detected', d:'You are most productive on Tuesdays. Your application volume peaks between 10 AM and 2 PM.' },
  { icon:'trending_up', bg:'bg-tertiary-container/10', cl:'text-tertiary-container', t:'Conversion Rate Improvement', d:'Interview calls from LinkedIn apps have increased by 22% after your recent resume update.' },
  { icon:'lightbulb', bg:'bg-secondary-container/10', cl:'text-secondary', t:'Skill Gap Analysis', d:'3 of your last 5 rejections mentioned "Cloud Infrastructure" as a missing core skill.' },
];

const statuses = [
  { label:'Interviewing', pct:'45%', color:'bg-primary', da:'45, 100', off:'0' },
  { label:'Applied', pct:'25%', color:'bg-secondary', da:'25, 100', off:'-45' },
  { label:'Offers', pct:'15%', color:'bg-tertiary-container', da:'15, 100', off:'-70' },
  { label:'Rejected', pct:'15%', color:'bg-error', da:'15, 100', off:'-85' },
];

export default function Analytics() {
  return (
    <div className="p-xl max-w-max_width mx-auto">
      <div className="mb-xl flex items-end justify-between">
        <div>
          <h2 className="font-h1 text-h1 text-on-surface mb-xs">Performance Analytics</h2>
          <p className="font-body-sm text-on-surface-variant">Measure your job search velocity and application success rates.</p>
        </div>
        <div className="bg-surface-container-highest/50 px-md py-sm rounded-lg flex items-center gap-2 border border-outline-variant/30">
          <span className="material-symbols-outlined text-on-surface-variant">calendar_today</span>
          <span className="text-data-tabular font-data-tabular">Last 30 Days</span>
          <span className="material-symbols-outlined text-on-surface-variant text-sm">expand_more</span>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-lg">
        {/* Gauge */}
        <div className="col-span-12 lg:col-span-4 bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-lg shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-md">
              <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">Success Rate</span>
              <span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded text-[10px] font-bold">+12% vs last month</span>
            </div>
            <div className="relative flex items-center justify-center py-xl">
              <svg className="w-40 h-40 transform -rotate-90">
                <circle className="text-surface-container" cx="80" cy="80" fill="transparent" r="70" stroke="currentColor" strokeWidth="8"/>
                <circle className="text-primary" cx="80" cy="80" fill="transparent" r="70" stroke="currentColor" strokeDasharray="440" strokeDashoffset="110" strokeWidth="8"/>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-h1 text-h1">75%</span>
                <span className="font-label-caps text-label-caps text-on-surface-variant">Interview Rate</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-md pt-lg border-t border-outline-variant/10">
            <div className="text-center"><p className="font-label-caps text-label-caps text-on-surface-variant">Applied</p><p className="font-h3 text-h3">124</p></div>
            <div className="text-center border-l border-outline-variant/10"><p className="font-label-caps text-label-caps text-on-surface-variant">Interviews</p><p className="font-h3 text-h3">93</p></div>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="col-span-12 lg:col-span-8 bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-lg shadow-sm">
          <div className="flex items-center justify-between mb-xl">
            <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">Applications Per Month</span>
            <div className="flex gap-md">
              <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-primary"/><span className="text-[11px] font-semibold text-on-surface-variant">Current</span></div>
              <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-surface-container-highest"/><span className="text-[11px] font-semibold text-on-surface-variant">Average</span></div>
            </div>
          </div>
          <div className="h-64 flex items-end justify-between gap-4 px-2 relative">
            <div className="absolute inset-0 flex flex-col justify-between py-2 pointer-events-none">
              {[0,1,2,3].map(i=><div key={i} className="border-b border-outline-variant/10 w-full"/>)}
            </div>
            {months.map((m,i)=>(
              <div key={m} className="flex-1 flex flex-col items-center group">
                <div className={`w-full bg-surface-container-low rounded-t-sm ${barH[i]} group-hover:bg-primary/20 transition-colors relative`}>
                  <div className={`absolute bottom-0 w-full ${i>=3?'bg-primary':'bg-primary/40'} ${innerH[i]} rounded-t-sm`}/>
                </div>
                <span className="mt-4 font-label-caps text-label-caps text-on-surface-variant">{m}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Donut */}
        <div className="col-span-12 lg:col-span-6 bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-lg shadow-sm">
          <span className="font-label-caps text-label-caps text-on-surface-variant uppercase block mb-xl">Status Distribution</span>
          <div className="flex items-center gap-xl">
            <div className="relative w-48 h-48 flex-shrink-0">
              <svg className="w-full h-full" viewBox="0 0 36 36">
                <path className="text-surface-container" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray="100, 100" strokeWidth="3"/>
                <path className="text-primary" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray="45, 100" strokeWidth="3.5"/>
                <path className="text-secondary" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray="25, 100" strokeDashoffset="-45" strokeWidth="3.5"/>
                <path className="text-tertiary-container" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray="15, 100" strokeDashoffset="-70" strokeWidth="3.5"/>
                <path className="text-error" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray="15, 100" strokeDashoffset="-85" strokeWidth="3.5"/>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-h3 text-h3">432</span>
                <span className="text-[10px] text-on-surface-variant font-medium">Total Apps</span>
              </div>
            </div>
            <div className="flex-1 grid grid-cols-1 gap-md">
              {statuses.map(s=>(
                <div key={s.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><div className={`w-3 h-3 rounded-full ${s.color}`}/><span className="font-body-sm text-body-sm text-on-surface-variant">{s.label}</span></div>
                  <span className="font-data-tabular text-data-tabular">{s.pct}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Insights */}
        <div className="col-span-12 lg:col-span-6 bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-lg shadow-sm">
          <span className="font-label-caps text-label-caps text-on-surface-variant uppercase block mb-xl">Insights &amp; Trends</span>
          <div className="space-y-md">
            {insights.map((ins,i)=>(
              <div key={i} className="flex items-start gap-md p-md bg-surface-container-low/50 rounded-lg border border-outline-variant/10">
                <div className={`w-10 h-10 rounded-full ${ins.bg} flex items-center justify-center flex-shrink-0`}>
                  <span className={`material-symbols-outlined ${ins.cl}`}>{ins.icon}</span>
                </div>
                <div>
                  <p className="font-h3 text-[14px] leading-tight mb-1 text-on-surface">{ins.t}</p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">{ins.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Platforms */}
        <div className="col-span-12 bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-lg shadow-sm">
          <div className="flex items-center justify-between mb-xl">
            <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">Platform Performance</span>
            <button className="text-primary text-[12px] font-bold hover:underline">View All Sources</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-lg">
            {platforms.map(p=>(
              <div key={p.name} className="bg-surface rounded-lg p-md border border-outline-variant/10">
                <div className="flex items-center gap-md mb-md">
                  <img alt="Platform logo" className="w-8 h-8 rounded" src={p.img}/>
                  <p className="font-h3 text-[14px]">{p.name}</p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-body-sm text-on-surface-variant">Interviews</span>
                  <span className="font-data-tabular text-data-tabular">{p.n}</span>
                </div>
                <div className="w-full h-1 bg-surface-container-highest mt-sm rounded-full overflow-hidden">
                  <div className={`${p.color} h-full`} style={{width:`${p.pct}%`}}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
