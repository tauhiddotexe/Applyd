import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { applicationsAPI } from '../services/api';

const MOCK = {
  role: 'Senior Product Designer',
  status: 'INTERVIEWING',
  company: 'Stripe, Inc.',
  source: 'Referral',
  desc: 'Financial services and software as a service (SaaS) company. Stripe offers payment processing software and application programming interfaces for e-commerce websites and mobile applications.',
  location: 'San Francisco, CA',
  salary: '$180k – $240k',
  recruiter: 'Sarah Jenkins',
  logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuClozwmxzH6Z8YGbvy91UhKEfloheiEYc8iuuAOMiS-BH6QsvzvS_4S6tu_mX7AynRhE-b5BFq1VTcVZ4Y4gT2JOWGj_etpfK1DX8zLwY9ktYUkhO9N17tX9_2opJl1cGssTc3Zd3APd-UjXAtY5BH2jTFeCYmOPY47CZ8pNqccXCpXD9VfpHMvCfoXmQ8Gy0F-SurXg_dnpWGs3BmmXFYb-7EF01JP2SBCFHTIZjzWPXbwUSxjJgbQ8d-7GvEbzP0V1zy5EHgCV-g',
  notes: [
    { date: 'OCT 24, 2023 • SCREENING CALL', text: 'Discussed product vision and designer-engineer collaboration. Focus on their new checkout suite and global expansion. Recruiter was impressed with my case study on fintech flows.', tags: [] },
    { date: 'OCT 28, 2023 • PORTFOLIO REVIEW', text: 'Focus on the \'Merchant Dashboard\' project. Questions about accessibility standards and design systems at scale. Follow-up: Send the Figma prototype link for the mobile app.', tags: ['Design Systems', 'Case Study'] },
  ],
  timeline: [
    { label: 'Applied', date: 'October 12, 2023', done: true },
    { label: 'Phone Screen', date: 'October 24, 2023', done: true },
    { label: 'Technical Interview', date: 'Scheduled: Oct 28, 2023', active: true, meet: true },
    { label: 'On-site Round', date: 'Estimated early Nov', future: true },
    { label: 'Offer', date: 'Dream goal 🎯', future: true },
  ],
  docs: [
    { name: 'Resume_Stripe.pdf', icon: 'description', color: 'text-red-500' },
    { name: 'Cover_Letter_V2.pdf', icon: 'article', color: 'text-blue-500' },
  ],
};

const STATUS_LABELS = { applied: 'APPLIED', interviewing: 'INTERVIEWING', offer: 'OFFER', rejected: 'REJECTED', wishlist: 'WISHLIST' };

export default function Details() {
  const nav = useNavigate();
  const { id } = useParams();
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    applicationsAPI.get(id)
      .then(d => setApp(d))
      .catch(err => setError(err.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!confirm('Delete this application permanently?')) return;
    try {
      await applicationsAPI.delete(id);
      nav('/applications');
    } catch (err) {
      alert(err.message || 'Delete failed');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <span className="material-symbols-outlined text-primary animate-spin text-4xl">progress_activity</span>
    </div>
  );

  if (error || !app) return (
    <div className="max-w-[1200px] mx-auto p-xl">
      <div className="bg-red-50 border border-red-200 rounded-xl p-lg flex items-center gap-3">
        <span className="material-symbols-outlined text-red-500">error</span>
        <span className="text-red-700">{error || 'Application not found'}</span>
        <button onClick={() => nav('/applications')} className="ml-auto text-red-600 font-semibold hover:underline">Back to list</button>
      </div>
    </div>
  );

  return (
    <div className="max-w-[1200px] mx-auto p-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-xl">
        <div className="flex items-center gap-4">
          <button onClick={() => nav(-1)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors text-slate-600">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="font-h1 text-h1 text-on-surface">{app.role}</h2>
              <span className="px-3 py-1 bg-surface-container-high text-on-surface-variant text-label-caps rounded-full">{STATUS_LABELS[app.status] || app.status}</span>
            </div>
            <p className="font-body-main text-body-main text-on-surface-variant">at <span className="font-semibold text-primary">{app.company}</span></p>
          </div>
        </div>
        <div className="flex gap-3">
          {app.link && (
          <a href={app.link} target="_blank" rel="noreferrer" className="px-lg py-2 border border-slate-200 bg-white text-on-surface font-h3 text-body-sm rounded-lg shadow-sm hover:bg-slate-50 transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">open_in_new</span>Job Link
          </a>
          )}
          <button onClick={() => nav(`/applications/${id}/edit`)} className="px-lg py-2 bg-primary text-on-primary font-h3 text-body-sm rounded-lg shadow-sm hover:opacity-90 transition-all flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">edit</span>Edit
          </button>
          <button onClick={handleDelete} className="px-lg py-2 border border-red-200 text-red-600 font-h3 text-body-sm rounded-lg shadow-sm hover:bg-red-50 transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">delete</span>Delete
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-12 gap-lg">
        {/* Main */}
        <div className="col-span-12 lg:col-span-8 space-y-lg">
          {/* Company */}
          <section className="bg-surface-container-lowest p-xl rounded-xl border border-outline-variant shadow-[0px_4px_12px_rgba(0,0,0,0.03)]">
            <div className="flex gap-xl">
              <div className="w-24 h-24 rounded-xl bg-surface flex items-center justify-center border border-slate-100 shrink-0">
                <img alt="Stripe Logo" className="w-16 h-16 object-contain" src={MOCK.logo} />
              </div>
              <div className="flex-1">
                <h3 className="font-h2 text-h2 mb-2">{app.company}</h3>
                <p className="font-body-main text-on-surface-variant mb-4">{app.notes || 'No notes yet.'}</p>
                <div className="grid grid-cols-3 gap-md">
                  {[['LOCATION', MOCK.location], ['SALARY RANGE', MOCK.salary], ['RECRUITER', MOCK.recruiter]].map(([l, v]) => (
                    <div key={l} className="p-md rounded-lg bg-surface">
                      <span className="text-label-caps text-on-surface-variant block mb-1">{l}</span>
                      <span className="font-h3 text-body-main">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
          {/* Notes */}
          <section className="bg-surface-container-lowest p-xl rounded-xl border border-outline-variant shadow-[0px_4px_12px_rgba(0,0,0,0.03)]">
            <div className="flex items-center justify-between mb-lg">
              <h3 className="font-h3 text-h3 flex items-center gap-2"><span className="material-symbols-outlined text-primary">notes</span>Interview Notes</h3>
              <button className="text-primary font-h3 text-body-sm hover:underline">Add New</button>
            </div>
            <div className="space-y-md">
              {MOCK.notes.map((n, i) => (
                <div key={i} className={`p-md border border-slate-100 rounded-lg ${i === 0 ? 'bg-surface/50' : 'bg-white'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-label-caps text-on-surface-variant">{n.date}</span>
                    <span className="material-symbols-outlined text-slate-300 text-[18px]">more_horiz</span>
                  </div>
                  <p className="font-body-main text-body-main text-on-surface">{n.text}</p>
                  {n.tags.length > 0 && (
                    <div className="mt-3 flex gap-2">
                      {n.tags.map(t => (
                        <span key={t} className={`px-2 py-1 ${t === 'Design Systems' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'} text-xs font-semibold rounded`}>{t}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="col-span-12 lg:col-span-4 space-y-lg">
          {/* Timeline */}
          <section className="bg-surface-container-lowest p-xl rounded-xl border border-outline-variant shadow-[0px_4px_12px_rgba(0,0,0,0.03)]">
            <h3 className="font-h3 text-h3 mb-xl">Journey Timeline</h3>
            <div className="relative">
              <div className="absolute left-[11px] top-2 bottom-2 w-[2px] bg-slate-100" />
              <div className="space-y-xl relative">
                {MOCK.timeline.map((t, i) => (
                  <div key={i} className="flex gap-4">
                    <div className={`w-6 h-6 rounded-full shrink-0 z-10 flex items-center justify-center ${t.done ? 'bg-emerald-500 border-4 border-emerald-100' : t.active ? 'bg-primary border-4 border-primary-fixed' : 'bg-slate-100 border-4 border-white'}`}>
                      {t.done && <span className="material-symbols-outlined text-white text-[12px] font-bold">check</span>}
                    </div>
                    <div>
                      <h4 className={`font-h3 text-body-main leading-none mb-1 ${t.active ? 'text-primary' : t.future ? 'text-on-surface-variant/50' : ''}`}>{t.label}</h4>
                      <p className={`text-body-sm ${t.future ? 'text-on-surface-variant/50' : 'text-on-surface-variant'}`}>{t.date}</p>
                      {t.meet && (
                        <div className="mt-sm p-sm bg-surface rounded border border-slate-100 text-body-sm flex items-center gap-2">
                          <span className="material-symbols-outlined text-[16px] text-primary">videocam</span>Google Meet Link
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
          {/* Documents */}
          <section className="bg-surface-container-lowest p-xl rounded-xl border border-outline-variant shadow-[0px_4px_12px_rgba(0,0,0,0.03)]">
            <h3 className="font-h3 text-h3 mb-lg">Documents</h3>
            <div className="space-y-sm">
              {MOCK.docs.map(d => (
                <div key={d.name} className="flex items-center justify-between p-sm hover:bg-surface rounded-lg cursor-pointer transition-colors border border-transparent hover:border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className={`material-symbols-outlined ${d.color}`}>{d.icon}</span>
                    <span className="text-body-sm font-medium">{d.name}</span>
                  </div>
                  <span className="material-symbols-outlined text-slate-300 text-[20px]">download</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
