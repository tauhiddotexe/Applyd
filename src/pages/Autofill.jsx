import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { jobsAPI, applicationsAPI } from '../services/api';
import { FadeIn, StaggerContainer, StaggerItem } from '../components/ui/MotionDiv';

export default function Autofill() {
  const nav = useNavigate();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ company:'Anthropic', role:'Product Designer', link:'https://anthropic.com/careers/product-designer', status:'applied', followUp:'2023-11-24', notes:'Exciting opportunity in the core product team. Focused on AI safety and intuitive LLM interfaces. Referral from Jane Smith.' });
  const set = (k,v) => setForm(p=>({...p,[k]:v}));
  const reduce = useReducedMotion();

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
      <FadeIn>
        <div className="flex items-center gap-6 mb-10">
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => nav(-1)} className="p-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/10 transition-all group">
            <span className="material-symbols-outlined text-slate-600 dark:text-slate-400 group-hover:-translate-x-1 transition-transform">arrow_back</span>
          </motion.button>
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-slate-50 tracking-tight">Add Application</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Track your career journey with AI assistance.</p>
          </div>
        </div>
      </FadeIn>

      <FadeIn delay={0.05}>
        <section className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-8 shadow-sm mb-10">
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-2 text-primary">
              <span className="material-symbols-outlined font-black" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
              <span className="text-[10px] font-black uppercase tracking-widest">Auto-fill with AI</span>
            </div>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1 group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">link</span>
                <input
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-white/5 border border-transparent dark:border-white/5 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none dark:text-slate-100 placeholder:text-slate-400"
                  placeholder="Paste Job Link (LinkedIn, Indeed, etc.)"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                />
              </div>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={autoFill} disabled={loading} className="bg-primary text-white px-8 py-4 rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl shadow-primary/20 disabled:opacity-60 whitespace-nowrap">
                {loading ? (
                  <span className="material-symbols-outlined animate-spin">progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined">magic_button</span>
                )}
                Extract
              </motion.button>
            </div>
          </div>
        </section>
      </FadeIn>

      <StaggerContainer>
        <StaggerItem>
          <form className="space-y-8" onSubmit={submit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Company Name</label>
                <input className="w-full px-5 py-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none dark:text-slate-100" value={form.company} onChange={e => set('company', e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Job Role</label>
                <input className="w-full px-5 py-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none dark:text-slate-100" value={form.role} onChange={e => set('role', e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Job Link</label>
              <input className="w-full px-5 py-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none dark:text-slate-100" type="url" value={form.link} onChange={e => set('link', e.target.value)} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Status</label>
                <div className="relative">
                  <select className="w-full appearance-none px-5 py-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none dark:text-slate-100" value={form.status} onChange={e => set('status', e.target.value)}>
                    <option value="interested">Interested</option>
                    <option value="applied">Applied</option>
                    <option value="interviewing">Interviewing</option>
                    <option value="offer">Offer</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">expand_more</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Follow-up Date</label>
                <input className="w-full px-5 py-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none dark:text-slate-100" type="date" value={form.followUp} onChange={e => set('followUp', e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Notes</label>
              <textarea className="w-full px-5 py-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none dark:text-slate-100" rows="4" placeholder="Key requirements, culture notes, or referral info..." value={form.notes} onChange={e => set('notes', e.target.value)} />
            </div>
            <div className="flex items-center justify-end gap-4 pt-10">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="button" onClick={() => nav(-1)} className="px-8 py-3 rounded-2xl font-bold text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 transition-all">Cancel</motion.button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" className="bg-primary text-white px-10 py-3 rounded-2xl font-bold shadow-xl shadow-primary/20">Save Application</motion.button>
            </div>
          </form>
        </StaggerItem>
      </StaggerContainer>
    </div>
  );
}
