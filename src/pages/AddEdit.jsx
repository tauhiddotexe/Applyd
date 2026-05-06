import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { applicationsAPI, jobsAPI } from '../services/api';

const RECENT = [
  { id:1, company:'Google', role:'UX Engineer', status:'Applied', sc:'bg-blue-100 text-blue-800', icon:'corporate_fare', note:'Follow up in 2 days', noteIcon:'event' },
  { id:2, company:'Stripe', role:'Product Designer', status:'Offer', sc:'bg-emerald-100 text-emerald-800', icon:'apartment', note:'Negotiation phase', noteIcon:'check_circle' },
  { id:3, company:'Shopify', role:'Lead Developer', status:'Interviewing', sc:'bg-secondary-fixed text-on-secondary-fixed-variant', icon:'storefront', note:'On-site next Monday', noteIcon:'record_voice_over' },
];

export default function AddEdit() {
  const nav = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const [form, setForm] = useState({ company:'', role:'', link:'', status:'applied', followUp:'', notes:'' });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isEdit) {
      setFetching(true);
      applicationsAPI.get(id).then(d => {
        if (d) setForm({
          company: d.company || '',
          role: d.role || '',
          link: d.link || '',
          status: d.status || 'applied',
          followUp: d.followUp || d.follow_up || '',
          notes: d.notes || '',
        });
      }).catch(() => setError('Failed to load application')).finally(() => setFetching(false));
    }
  }, [id, isEdit]);

  const set = (k,v) => setForm(p=>({...p,[k]:v}));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isEdit) await applicationsAPI.update(id, form);
      else await applicationsAPI.create(form);
      nav('/applications');
    } catch (err) {
      setError(err.message || 'Save failed');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[1280px] mx-auto p-gutter lg:p-xl">
      <div className="flex flex-col lg:flex-row gap-10">
        {/* Left */}
        <div className="lg:w-1/3">
          <header className="mb-8">
            <h1 className="font-h1 text-h1 text-on-surface mb-2">{isEdit ? 'Edit Application' : 'Track New Opportunity'}</h1>
            <p className="font-body-main text-body-main text-on-surface-variant">Keep your job search organized. Every detail counts toward your next career milestone.</p>
          </header>
          <div className="hidden lg:block relative rounded-xl overflow-hidden shadow-sm border border-outline-variant">
            <img className="w-full h-64 object-cover" alt="Office" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBB-Vrf_Xfvh1AbKwdqt0YAeVzoEzABff4rkBq9FK5TBu_gjyn7wcNe5aTkCBKnLawMnEgbxx_NsCQwJc9LUtIFEKyFgWW1-n870IBIyHhMwFAF-bJTBxl-goweNMuDgT4JQgf61rX9hLeALVSCa-TjmLcS7yDwkGldNxi-SwL8YMDnauYIQwlu1tmb9VcF4jCISUkn7JUlScBB42qsNde3dxDGmxVOFHK-mvwztl0ZezMI9MFdu-uxvlKd4jHmBb889FkQWA8TPF4"/>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-6">
              <span className="text-white font-medium text-body-sm opacity-80">Pro Tip</span>
              <p className="text-white font-h3 text-h3 leading-snug">Adding job links helps CareerFlow automatically pull company insights later.</p>
            </div>
          </div>
        </div>
        {/* Right: Form */}
        <div className="lg:w-2/3 bg-surface-container-lowest rounded-xl border border-outline-variant shadow-[0px_4px_12px_rgba(0,0,0,0.03)] p-8 lg:p-10">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-md mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-red-500 text-[18px]">error</span>
              <span className="text-red-700 text-body-sm">{error}</span>
            </div>
          )}
          {fetching ? (
            <div className="flex items-center justify-center py-20">
              <span className="material-symbols-outlined text-primary animate-spin text-4xl">progress_activity</span>
            </div>
          ) : (
          <form className="space-y-8" onSubmit={submit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="font-label-caps text-label-caps text-outline uppercase tracking-wider block">Company Name</label>
                <input className="w-full px-4 py-3 bg-surface-bright border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-body-main text-on-surface" placeholder="e.g. Acme Corp" value={form.company} onChange={e=>set('company',e.target.value)}/>
              </div>
              <div className="space-y-2">
                <label className="font-label-caps text-label-caps text-outline uppercase tracking-wider block">Job Role</label>
                <input className="w-full px-4 py-3 bg-surface-bright border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-body-main text-on-surface" placeholder="e.g. Senior Product Designer" value={form.role} onChange={e=>set('role',e.target.value)}/>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="font-label-caps text-label-caps text-outline uppercase tracking-wider block">Job Link</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">link</span>
                  <input className="w-full pl-10 pr-4 py-3 bg-surface-bright border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-body-main text-on-surface" placeholder="https://linkedin.com/jobs/..." type="url" value={form.link} onChange={e=>set('link',e.target.value)}/>
                </div>
              </div>
              <div className="space-y-2">
                <label className="font-label-caps text-label-caps text-outline uppercase tracking-wider block">Status</label>
                <select className="w-full px-4 py-3 bg-surface-bright border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-body-main text-on-surface appearance-none" value={form.status} onChange={e=>set('status',e.target.value)}>
                  <option value="wishlist">Wishlist</option>
                  <option value="applied">Applied</option>
                  <option value="interviewing">Interviewing</option>
                  <option value="offer">Offer</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="font-label-caps text-label-caps text-outline uppercase tracking-wider block">Follow-up Date</label>
                <div className="relative max-w-xs">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">calendar_today</span>
                  <input className="w-full pl-10 pr-4 py-3 bg-surface-bright border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-body-main text-on-surface" type="date" value={form.followUp} onChange={e=>set('followUp',e.target.value)}/>
                </div>
              </div>
              <div className="space-y-2">
                <label className="font-label-caps text-label-caps text-outline uppercase tracking-wider block">Notes</label>
                <textarea className="w-full px-4 py-3 bg-surface-bright border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-body-main text-on-surface resize-none" placeholder="Mention key interviewers, specific requirements, or referral names..." rows="4" value={form.notes} onChange={e=>set('notes',e.target.value)}/>
              </div>
            </div>
            <div className="pt-6 border-t border-outline-variant flex items-center justify-end gap-4">
              <button type="button" onClick={()=>nav(-1)} className="px-6 py-2.5 rounded-lg font-h3 text-body-main text-on-surface-variant hover:bg-surface-container-high transition-colors duration-200">Cancel</button>
              <button type="submit" disabled={loading} className="px-8 py-2.5 rounded-lg bg-primary text-on-primary font-h3 text-body-main shadow-sm hover:opacity-90 active:scale-[0.99] transition-all">{loading ? 'Saving...' : 'Save Application'}</button>
            </div>
          </form>
          )}
        </div>
      </div>
      {/* Recent Apps */}
      <section className="mt-xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-h2 text-h2 text-on-surface">Recent Applications</h3>
          <button onClick={()=>nav('/applications')} className="text-primary font-semibold text-body-sm flex items-center gap-1">View Pipeline <span className="material-symbols-outlined text-[16px]">arrow_forward</span></button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {RECENT.map(a=>(
            <div key={a.id} className="bg-surface-container-lowest p-md border border-outline-variant rounded-xl shadow-[0px_4px_12px_rgba(0,0,0,0.03)] hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-surface-container flex items-center justify-center rounded-lg"><span className="material-symbols-outlined text-outline">{a.icon}</span></div>
                  <div><h4 className="font-h3 text-body-main text-on-surface leading-tight">{a.company}</h4><p className="text-body-sm text-outline">{a.role}</p></div>
                </div>
                <span className={`px-2 py-1 rounded text-[11px] font-bold uppercase tracking-wider ${a.sc}`}>{a.status}</span>
              </div>
              <div className="flex items-center gap-2 text-body-sm text-on-surface-variant mb-4">
                <span className="material-symbols-outlined text-[16px]">{a.noteIcon}</span><span>{a.note}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
