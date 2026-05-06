import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobsAPI, applicationsAPI } from '../services/api';

export default function Autofill() {
  const nav = useNavigate();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ company:'Anthropic', role:'Product Designer', link:'https://anthropic.com/careers/product-designer', status:'applied', followUp:'2023-11-24', notes:'Exciting opportunity in the core product team. Focused on AI safety and intuitive LLM interfaces. Referral from Jane Smith.' });
  const set = (k,v) => setForm(p=>({...p,[k]:v}));

  const autoFill = async () => {
    if (!url) return;
    setLoading(true);
    try {
      const data = await jobsAPI.extract(url);
      if (data) setForm(p => ({ ...p, ...data, link: url }));
    } catch {}
    setLoading(false);
  };

  const submit = async (e) => {
    e.preventDefault();
    try { await applicationsAPI.create(form); nav('/applications'); } catch {}
  };

  return (
    <div className="max-w-[800px] mx-auto p-4 md:p-8">
      <div className="flex items-center gap-md mb-xl">
        <button onClick={() => nav(-1)} className="p-2 hover:bg-surface-container-low rounded-full transition-colors">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div>
          <h1 className="font-h1 text-h1 text-on-surface">Add Application</h1>
          <p className="text-body-sm text-outline">Track your career journey with AI assistance.</p>
        </div>
      </div>

      {/* Auto-fill */}
      <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg shadow-sm mb-lg">
        <div className="flex flex-col gap-md">
          <div className="flex items-center gap-sm text-primary-container">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
            <span className="font-label-caps text-label-caps uppercase">Auto-fill with AI</span>
          </div>
          <div className="flex flex-col md:flex-row gap-md">
            <div className="relative flex-1 group">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary-container">link</span>
              <input className="w-full pl-10 pr-4 py-3 bg-surface border border-outline-variant rounded-lg text-body-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none" placeholder="Paste Job Link (LinkedIn, Indeed, etc.)" value={url} onChange={e => setUrl(e.target.value)} />
            </div>
            <button onClick={autoFill} disabled={loading} className="bg-primary-container text-on-primary px-xl py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all">
              {loading ? 'Extracting...' : 'Magic Auto-fill'}
            </button>
          </div>
        </div>
      </section>

      {/* Form */}
      <form className="space-y-lg" onSubmit={submit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
          <div className="space-y-1">
            <label className="font-label-caps text-label-caps text-on-surface-variant block ml-1">Company Name</label>
            <input className="w-full px-4 py-2.5 bg-white border border-outline-variant rounded-lg text-body-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" value={form.company} onChange={e => set('company', e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="font-label-caps text-label-caps text-on-surface-variant block ml-1">Job Role</label>
            <input className="w-full px-4 py-2.5 bg-white border border-outline-variant rounded-lg text-body-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" value={form.role} onChange={e => set('role', e.target.value)} />
          </div>
        </div>
        <div className="space-y-1">
          <label className="font-label-caps text-label-caps text-on-surface-variant block ml-1">Job Link</label>
          <input className="w-full px-4 py-2.5 bg-white border border-outline-variant rounded-lg text-body-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" type="url" value={form.link} onChange={e => set('link', e.target.value)} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
          <div className="space-y-1">
            <label className="font-label-caps text-label-caps text-on-surface-variant block ml-1">Status</label>
            <div className="relative">
              <select className="w-full appearance-none px-4 py-2.5 bg-white border border-outline-variant rounded-lg text-body-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="interested">Interested</option>
                <option value="applied">Applied</option>
                <option value="interviewing">Interviewing</option>
                <option value="offer">Offer</option>
                <option value="rejected">Rejected</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-outline">expand_more</span>
            </div>
          </div>
          <div className="space-y-1">
            <label className="font-label-caps text-label-caps text-on-surface-variant block ml-1">Follow-up Date</label>
            <input className="w-full px-4 py-2.5 bg-white border border-outline-variant rounded-lg text-body-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" type="date" value={form.followUp} onChange={e => set('followUp', e.target.value)} />
          </div>
        </div>
        <div className="space-y-1">
          <label className="font-label-caps text-label-caps text-on-surface-variant block ml-1">Notes</label>
          <textarea className="w-full px-4 py-2.5 bg-white border border-outline-variant rounded-lg text-body-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none" rows="4" placeholder="Key requirements, culture notes, or referral info..." value={form.notes} onChange={e => set('notes', e.target.value)} />
        </div>
        <div className="flex items-center justify-end gap-md pt-lg">
          <button type="button" onClick={() => nav(-1)} className="px-lg py-2.5 rounded-lg font-semibold text-outline hover:bg-surface-container-high transition-colors text-body-sm">Cancel</button>
          <button type="submit" className="bg-primary-container text-on-primary px-xl py-2.5 rounded-lg font-semibold shadow-sm hover:opacity-90 active:scale-[0.98] transition-all text-body-sm">Save Application</button>
        </div>
      </form>
    </div>
  );
}
