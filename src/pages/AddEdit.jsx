import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { applicationsAPI } from '../services/api';
import { getSkills } from '../data/skills';
import { FadeIn } from '../components/ui/MotionDiv';

export default function AddEdit() {
  const nav = useNavigate();
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id;
  const isEdit = !!id;
  const [form, setForm] = useState({
    company: '', role: '', link: '', status: 'applied',
    salaryMin: '', salaryMax: '', currency: '', location: '',
    recruiter: '', followUp: '', notes: '', skills: [],
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState(null);
  const [skillInput, setSkillInput] = useState('');
  const [skillSuggestions, setSkillSuggestions] = useState([]);
  const [allSkills, setAllSkills] = useState([]);
  const reduce = useReducedMotion();

  useEffect(() => { setAllSkills(getSkills()); }, []);

  const handleSkillInputChange = (e) => {
    const val = e.target.value;
    setSkillInput(val);
    if (val.trim() === '') { setSkillSuggestions([]); }
    else {
      const match = val.toLowerCase();
      setSkillSuggestions(allSkills.filter(s => s.name.toLowerCase().includes(match) || s.description.toLowerCase().includes(match)).slice(0, 5));
    }
  };

  const addSkill = (skill) => {
    if (!form.skills.find(s => s.id === skill.id)) setForm(p => ({ ...p, skills: [...p.skills, skill] }));
    setSkillInput(''); setSkillSuggestions([]);
  };

  const removeSkill = (id) => setForm(p => ({ ...p, skills: p.skills.filter(s => s.id !== id) }));

  useEffect(() => {
    if (authLoading || !userId) return;
    if (isEdit) {
      setFetching(true);
      applicationsAPI.get(id).then((d) => {
        if (d) setForm({
          company: d.company || '', role: d.role || '', link: d.link || '',
          status: d.status || 'applied', salaryMin: d.salaryMin ?? '', salaryMax: d.salaryMax ?? '',
          currency: d.currency || '', location: d.location || '', recruiter: d.recruiter || '',
          followUp: d.followUp || d.follow_up || '', notes: d.notes || '', skills: d.skills || [],
        });
      }).catch(() => setError('Failed to load application')).finally(() => setFetching(false));
    }
  }, [authLoading, id, isEdit, userId]);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (authLoading || !userId) { setError('Authentication session not ready'); return; }
    setLoading(true);
    setError(null);
    try {
      const payload = { ...form, salaryMin: form.salaryMin === '' ? null : Number(form.salaryMin), salaryMax: form.salaryMax === '' ? null : Number(form.salaryMax), currency: form.currency || null, location: form.location || null, recruiter: form.recruiter || null };
      if (isEdit) await applicationsAPI.update(id, payload);
      else await applicationsAPI.create(payload);
      nav('/applications');
    } catch (err) {
      setError(err.message || 'Save failed');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[1280px] mx-auto p-4 md:p-8 lg:p-10">
      <div className="flex flex-col lg:flex-row gap-8 md:gap-10">
        <div className="lg:w-1/3">
          <FadeIn>
            <header className="mb-6 md:mb-8">
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-2">{isEdit ? 'Edit Application' : 'Track Opportunity'}</h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium">Keep your job search organized. Every detail counts toward your next career milestone.</p>
            </header>
          </FadeIn>
          <div className="hidden lg:block relative rounded-[32px] overflow-hidden shadow-xl border border-slate-200 dark:border-white/[0.08] group">
            <img className="w-full h-64 object-cover" alt="Office" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBB-Vrf_Xfvh1AbKwdqt0YAeVzoEzABff4rkBq9FK5TBu_gjyn7wcNe5aTkCBKnLawMnEgbxx_NsCQwJc9LUtIFEKyFgWW1-n870IBIyHhMwFAF-bJTBxl-goweNMuDgT4JQgf61rX9hLeALVSCa-TjmLcS7yDwkGldNxi-SwL8YMDnauYIQwlu1tmb9VcF4jCISUkn7JUlScBB42qsNde3dxDGmxVOFHK-mvwztl0ZezMI9MFdu-uxvlKd4jHmBb889FkQWA8TPF4"/>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-6">
              <span className="text-white font-medium text-sm opacity-80">Pro Tip</span>
              <p className="text-white font-bold text-lg leading-snug">Adding richer application data makes your tracker more useful later.</p>
            </div>
          </div>
        </div>

        <FadeIn className="lg:w-2/3" delay={0.05}>
          <div className="bg-white dark:bg-white/[0.04] rounded-[32px] border border-slate-200 dark:border-white/[0.06] card-shadow p-6 md:p-8 lg:p-12 transition-all">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-2xl p-4 mb-6 flex items-center gap-3"
              >
                <span className="material-symbols-outlined text-red-500">error</span>
                <span className="text-red-700 dark:text-red-400 font-bold text-sm">{error}</span>
              </motion.div>
            )}

            {fetching ? (
              <div className="flex items-center justify-center py-20">
                <span className="material-symbols-outlined text-primary animate-spin text-4xl">progress_activity</span>
              </div>
            ) : (
              <form className="space-y-6 md:space-y-8" onSubmit={submit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { label: 'Company Name', placeholder: 'e.g. Google', key: 'company' },
                    { label: 'Job Role', placeholder: 'e.g. Senior Frontend', key: 'role' },
                  ].map((field) => (
                    <div key={field.key} className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.12em] px-1">{field.label}</label>
                      <input className="w-full px-5 py-4 bg-slate-50 dark:bg-white/[0.04] border border-transparent dark:border-white/[0.06] rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-bold text-slate-900 dark:text-white placeholder:text-slate-400 text-sm" placeholder={field.placeholder} value={form[field.key]} onChange={(e) => set(field.key, e.target.value)} />
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.12em] px-1">Job Link</label>
                    <input className="w-full px-5 py-4 bg-slate-50 dark:bg-white/[0.04] border border-transparent dark:border-white/[0.06] rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-bold text-slate-900 dark:text-white placeholder:text-slate-400 text-sm" type="url" placeholder="https://..." value={form.link} onChange={(e) => set('link', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.12em] px-1">Status</label>
                    <div className="relative">
                      <select className="w-full px-5 py-4 bg-slate-50 dark:bg-white/[0.04] border border-transparent dark:border-white/[0.06] rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-bold text-slate-900 dark:text-white appearance-none cursor-pointer text-sm" value={form.status} onChange={(e) => set('status', e.target.value)}>
                        <option value="wishlist">Wishlist</option>
                        <option value="applied">Applied</option>
                        <option value="interviewing">Interviewing</option>
                        <option value="offer">Offer</option>
                        <option value="rejected">Rejected</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">expand_more</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { label: 'Salary Min', key: 'salaryMin', type: 'number' },
                    { label: 'Salary Max', key: 'salaryMax', type: 'number' },
                    { label: 'Currency', key: 'currency', type: 'text' },
                  ].map((field) => (
                    <div key={field.key} className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.12em] px-1">{field.label}</label>
                      <input className="w-full px-5 py-4 bg-slate-50 dark:bg-white/[0.04] border border-transparent dark:border-white/[0.06] rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-bold text-slate-900 dark:text-white placeholder:text-slate-400 text-sm" type={field.type} placeholder={field.key === 'currency' ? 'USD' : '0'} value={form[field.key]} onChange={(e) => set(field.key, field.key === 'currency' ? e.target.value.toUpperCase() : e.target.value)} />
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { label: 'Location', key: 'location', placeholder: 'Remote / City' },
                    { label: 'Recruiter', key: 'recruiter', placeholder: 'Contact Name' },
                    { label: 'Follow-up Date', key: 'followUp', type: 'date' },
                  ].map((field) => (
                    <div key={field.key} className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.12em] px-1">{field.label}</label>
                      <input className="w-full px-5 py-4 bg-slate-50 dark:bg-white/[0.04] border border-transparent dark:border-white/[0.06] rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-bold text-slate-900 dark:text-white placeholder:text-slate-400 text-sm" type={field.type || 'text'} placeholder={field.placeholder} value={form[field.key]} onChange={(e) => set(field.key, e.target.value)} />
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.12em] px-1 block">Notes</label>
                  <textarea className="w-full px-5 py-4 bg-slate-50 dark:bg-white/[0.04] border border-transparent dark:border-white/[0.06] rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-bold text-slate-900 dark:text-white placeholder:text-slate-400 resize-none text-sm" rows="4" placeholder="Additional details..." value={form.notes} onChange={(e) => set('notes', e.target.value)} />
                </div>

                <div className="space-y-3 relative">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.12em] px-1 block">Skills (Tags)</label>
                  <div className="flex flex-wrap gap-2">
                    {form.skills.map(s => (
                      <motion.span
                        key={s.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-primary/10 text-primary px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 border border-primary/10"
                      >
                        {s.name}
                        <button type="button" onClick={() => removeSkill(s.id)} className="hover:text-red-500 transition-colors font-bold">&times;</button>
                      </motion.span>
                    ))}
                  </div>
                  <input
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-white/[0.04] border border-transparent dark:border-white/[0.06] rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-bold text-slate-900 dark:text-white placeholder:text-slate-400 text-sm"
                    placeholder="Type to search skills..."
                    value={skillInput}
                    onChange={handleSkillInputChange}
                    onKeyDown={e => { if (e.key === 'Enter' && skillInput.trim()) { e.preventDefault(); if (skillSuggestions.length > 0) addSkill(skillSuggestions[0]); } }}
                  />
                  {skillSuggestions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute z-50 w-full bg-white dark:bg-dark-surface border border-slate-200 dark:border-white/[0.08] rounded-2xl mt-2 shadow-2xl overflow-hidden max-h-64 overflow-y-auto"
                    >
                      {skillSuggestions.map(s => (
                        <button key={s.id} type="button" className="w-full px-6 py-4 hover:bg-slate-50 dark:hover:bg-white/[0.04] cursor-pointer border-b border-slate-100 dark:border-white/[0.04] last:border-0 transition-colors text-left" onClick={() => addSkill(s)}>
                          <div className="font-bold text-slate-900 dark:text-white text-sm">{s.name}</div>
                          <div className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate mt-0.5">{s.description}</div>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </div>

                <div className="pt-6 md:pt-8 border-t border-slate-100 dark:border-white/[0.04] flex items-center justify-end gap-4">
                  <motion.button type="button" onClick={() => nav(-1)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="px-6 md:px-8 py-3 rounded-2xl font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-all text-sm">Cancel</motion.button>
                  <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="px-8 md:px-10 py-3 rounded-2xl bg-primary text-white font-bold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all disabled:opacity-60 text-sm">
                    {loading ? 'Saving...' : 'Save Application'}
                  </motion.button>
                </div>
              </form>
            )}
          </div>
        </FadeIn>
      </div>
    </div>
  );
}
