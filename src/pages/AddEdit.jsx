import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { applicationsAPI } from '../services/api';

export default function AddEdit() {
  const nav = useNavigate();
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id;
  const isEdit = !!id;
  const [form, setForm] = useState({
    company: '',
    role: '',
    link: '',
    status: 'applied',
    salaryMin: '',
    salaryMax: '',
    currency: '',
    location: '',
    recruiter: '',
    followUp: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (authLoading || !userId) return;
    if (isEdit) {
      setFetching(true);
      applicationsAPI.get(id).then((d) => {
        if (d) setForm({
          company: d.company || '',
          role: d.role || '',
          link: d.link || '',
          status: d.status || 'applied',
          salaryMin: d.salaryMin ?? '',
          salaryMax: d.salaryMax ?? '',
          currency: d.currency || '',
          location: d.location || '',
          recruiter: d.recruiter || '',
          followUp: d.followUp || d.follow_up || '',
          notes: d.notes || '',
        });
      }).catch(() => setError('Failed to load application')).finally(() => setFetching(false));
    }
  }, [authLoading, id, isEdit, userId]);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (authLoading || !userId) {
      setError('Authentication session not ready');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const payload = {
        ...form,
        salaryMin: form.salaryMin === '' ? null : Number(form.salaryMin),
        salaryMax: form.salaryMax === '' ? null : Number(form.salaryMax),
        currency: form.currency || null,
        location: form.location || null,
        recruiter: form.recruiter || null,
      };
      if (isEdit) await applicationsAPI.update(id, payload);
      else await applicationsAPI.create(payload);
      nav('/applications');
    } catch (err) {
      setError(err.message || 'Save failed');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[1280px] mx-auto p-gutter lg:p-xl">
      <div className="flex flex-col lg:flex-row gap-10">
        <div className="lg:w-1/3">
          <header className="mb-8">
            <h1 className="font-h1 text-h1 text-on-surface mb-2">{isEdit ? 'Edit Application' : 'Track New Opportunity'}</h1>
            <p className="font-body-main text-body-main text-on-surface-variant">Keep your job search organized. Every detail counts toward your next career milestone.</p>
          </header>
          <div className="hidden lg:block relative rounded-xl overflow-hidden shadow-sm border border-outline-variant">
            <img className="w-full h-64 object-cover" alt="Office" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBB-Vrf_Xfvh1AbKwdqt0YAeVzoEzABff4rkBq9FK5TBu_gjyn7wcNe5aTkCBKnLawMnEgbxx_NsCQwJc9LUtIFEKyFgWW1-n870IBIyHhMwFAF-bJTBxl-goweNMuDgT4JQgf61rX9hLeALVSCa-TjmLcS7yDwkGldNxi-SwL8YMDnauYIQwlu1tmb9VcF4jCISUkn7JUlScBB42qsNde3dxDGmxVOFHK-mvwztl0ZezMI9MFdu-uxvlKd4jHmBb889FkQWA8TPF4"/>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-6">
              <span className="text-white font-medium text-body-sm opacity-80">Pro Tip</span>
              <p className="text-white font-h3 text-h3 leading-snug">Adding richer application data makes your tracker more useful later.</p>
            </div>
          </div>
        </div>
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
                  <input className="w-full px-4 py-3 bg-surface-bright border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-body-main text-on-surface" value={form.company} onChange={(e) => set('company', e.target.value)}/>
                </div>
                <div className="space-y-2">
                  <label className="font-label-caps text-label-caps text-outline uppercase tracking-wider block">Job Role</label>
                  <input className="w-full px-4 py-3 bg-surface-bright border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-body-main text-on-surface" value={form.role} onChange={(e) => set('role', e.target.value)}/>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="font-label-caps text-label-caps text-outline uppercase tracking-wider block">Job Link</label>
                  <input className="w-full px-4 py-3 bg-surface-bright border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-body-main text-on-surface" type="url" value={form.link} onChange={(e) => set('link', e.target.value)}/>
                </div>
                <div className="space-y-2">
                  <label className="font-label-caps text-label-caps text-outline uppercase tracking-wider block">Status</label>
                  <select className="w-full px-4 py-3 bg-surface-bright border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-body-main text-on-surface appearance-none" value={form.status} onChange={(e) => set('status', e.target.value)}>
                    <option value="wishlist">Wishlist</option>
                    <option value="applied">Applied</option>
                    <option value="interviewing">Interviewing</option>
                    <option value="offer">Offer</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="font-label-caps text-label-caps text-outline uppercase tracking-wider block">Salary Min</label>
                  <input className="w-full px-4 py-3 bg-surface-bright border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-body-main text-on-surface" type="number" value={form.salaryMin} onChange={(e) => set('salaryMin', e.target.value)}/>
                </div>
                <div className="space-y-2">
                  <label className="font-label-caps text-label-caps text-outline uppercase tracking-wider block">Salary Max</label>
                  <input className="w-full px-4 py-3 bg-surface-bright border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-body-main text-on-surface" type="number" value={form.salaryMax} onChange={(e) => set('salaryMax', e.target.value)}/>
                </div>
                <div className="space-y-2">
                  <label className="font-label-caps text-label-caps text-outline uppercase tracking-wider block">Currency</label>
                  <input className="w-full px-4 py-3 bg-surface-bright border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-body-main text-on-surface" placeholder="USD" value={form.currency} onChange={(e) => set('currency', e.target.value.toUpperCase())}/>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="font-label-caps text-label-caps text-outline uppercase tracking-wider block">Location</label>
                  <input className="w-full px-4 py-3 bg-surface-bright border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-body-main text-on-surface" value={form.location} onChange={(e) => set('location', e.target.value)}/>
                </div>
                <div className="space-y-2">
                  <label className="font-label-caps text-label-caps text-outline uppercase tracking-wider block">Recruiter</label>
                  <input className="w-full px-4 py-3 bg-surface-bright border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-body-main text-on-surface" value={form.recruiter} onChange={(e) => set('recruiter', e.target.value)}/>
                </div>
                <div className="space-y-2">
                  <label className="font-label-caps text-label-caps text-outline uppercase tracking-wider block">Follow-up Date</label>
                  <input className="w-full px-4 py-3 bg-surface-bright border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-body-main text-on-surface" type="date" value={form.followUp} onChange={(e) => set('followUp', e.target.value)}/>
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-label-caps text-label-caps text-outline uppercase tracking-wider block">Notes</label>
                <textarea className="w-full px-4 py-3 bg-surface-bright border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-body-main text-on-surface resize-none" rows="4" value={form.notes} onChange={(e) => set('notes', e.target.value)}/>
              </div>

              <div className="pt-6 border-t border-outline-variant flex items-center justify-end gap-4">
                <button type="button" onClick={() => nav(-1)} className="px-6 py-2.5 rounded-lg font-h3 text-body-main text-on-surface-variant hover:bg-surface-container-high transition-colors duration-200">Cancel</button>
                <button type="submit" disabled={loading} className="px-8 py-2.5 rounded-lg bg-primary text-on-primary font-h3 text-body-main shadow-sm hover:opacity-90 active:scale-[0.99] transition-all">{loading ? 'Saving...' : 'Save Application'}</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
