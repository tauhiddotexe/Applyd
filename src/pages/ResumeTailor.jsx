import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { resumeAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { FadeIn, StaggerContainer, StaggerItem } from '../components/ui/MotionDiv';

function SectionEditor({ section, index, onUpdate }) {
  const [editingIdx, setEditingIdx] = useState(null);
  const [editValue, setEditValue] = useState('');

  const name = section.name || '';
  const isBulletSec = !!section.improved_bullets;
  const items = isBulletSec ? section.improved_bullets : (section.improved ? [section.improved] : []);

  const startEdit = (idx, val) => {
    setEditingIdx(idx);
    setEditValue(val);
  };

  const saveEdit = (idx) => {
    if (isBulletSec) {
      const updated = [...section.improved_bullets];
      updated[idx] = editValue;
      onUpdate(index, { ...section, improved_bullets: updated });
    } else {
      onUpdate(index, { ...section, improved: editValue });
    }
    setEditingIdx(null);
  };

  const cancelEdit = () => {
    setEditingIdx(null);
  };

  const keyHandler = (e, idx) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      saveEdit(idx);
    }
    if (e.key === 'Escape') cancelEdit();
  };

  return (
    <div className="border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden">
      <div className="px-5 py-3 bg-slate-50 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
        <h4 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{name}</h4>
        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-white dark:bg-white/5 px-2 py-0.5 rounded-full border border-slate-200 dark:border-white/10">
          {isBulletSec ? 'Bullets' : 'Text'}
        </span>
      </div>
      <div className="p-4 space-y-2">
        {items.length === 0 && (
          <p className="text-sm text-slate-400 italic">No content</p>
        )}
        {items.map((item, idx) => (
          <div key={idx} className="group relative">
            {editingIdx === idx ? (
              <div className="flex gap-2">
                {isBulletSec ? (
                  <textarea
                    className="flex-1 bg-white dark:bg-white/5 border-2 border-primary/40 rounded-xl p-3 text-sm font-medium text-slate-800 dark:text-slate-200 outline-none resize-none min-h-[60px]"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => keyHandler(e, idx)}
                    autoFocus
                  />
                ) : (
                  <textarea
                    className="flex-1 bg-white dark:bg-white/5 border-2 border-primary/40 rounded-xl p-3 text-sm font-medium text-slate-800 dark:text-slate-200 outline-none resize-none min-h-[80px]"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => keyHandler(e, idx)}
                    autoFocus
                  />
                )}
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => saveEdit(idx)}
                    className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                    title="Save"
                  >
                    <span className="material-symbols-outlined text-[16px]">check</span>
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="p-2 bg-slate-200 dark:bg-white/10 text-slate-500 rounded-lg hover:bg-slate-300 dark:hover:bg-white/20 transition-colors"
                    title="Cancel"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => startEdit(idx, item)}
                className="flex items-start gap-2 p-2.5 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.03] border border-transparent hover:border-slate-200 dark:hover:border-white/10 transition-all group"
              >
                {isBulletSec && (
                  <span className="text-primary/60 mt-0.5 shrink-0 text-sm font-bold">•</span>
                )}
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed flex-1">
                  {item}
                </p>
                <span className="material-symbols-outlined text-[14px] text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5">edit</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ResumeTailor() {
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [resumeFile, setResumeFile] = useState(location.state?.resumeFile || null);
  const [jobDesc, setJobDesc] = useState(location.state?.jobDesc || '');
  const [loading, setLoading] = useState(false);
  const [hasAutoTailored, setHasAutoTailored] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [editedSections, setEditedSections] = useState(null);
  const [hasEdits, setHasEdits] = useState(false);
  const reduce = useReducedMotion();

  const sections = editedSections || result?.structuredTailor?.sections || null;

  const handleSectionUpdate = useCallback((secIndex, updatedSec) => {
    setEditedSections(prev => {
      const next = prev ? [...prev] : [...(result?.structuredTailor?.sections || [])];
      next[secIndex] = updatedSec;
      return next;
    });
    setHasEdits(true);
  }, [result]);

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="material-symbols-outlined text-primary animate-spin text-4xl">progress_activity</span>
      </div>
    );
  }

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be under 5MB');
      return;
    }
    setResumeFile(file);
    setResult(null);
    setEditedSections(null);
    setHasEdits(false);
    setError(null);
  };

  const handleTailor = async () => {
    if (!resumeFile) {
      setError('Resume PDF required');
      return;
    }
    if (!jobDesc.trim()) {
      setError('Job description required');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await resumeAPI.tailorResume(resumeFile, jobDesc.trim());
      setResult(data);
      if (data.structuredTailor?.sections) {
        setEditedSections(JSON.parse(JSON.stringify(data.structuredTailor.sections)));
      }
    } catch (err) {
      setError(err.message || 'Tailoring failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!resumeFile || !jobDesc || hasAutoTailored) return;
    setLoading(true);
    setError(null);
    setHasAutoTailored(true);
    resumeAPI.tailorResume(resumeFile, jobDesc)
      .then(data => {
        setResult(data);
        if (data.structuredTailor?.sections) {
          setEditedSections(JSON.parse(JSON.stringify(data.structuredTailor.sections)));
        }
      })
      .catch(err => setError(err.message || 'Tailoring failed'))
      .finally(() => setLoading(false));
  }, [resumeFile, jobDesc]);

  const buildFullText = () => {
    if (!editedSections) return '';
    return editedSections.map(sec => {
      const name = sec.name || '';
      const header = name.toUpperCase();
      if (sec.improved_bullets) {
        return `${header}\n${sec.improved_bullets.map(b => `  - ${b}`).join('\n')}`;
      }
      if (sec.improved) {
        return `${header}\n  ${sec.improved}`;
      }
      return '';
    }).join('\n\n');
  };

  const handleDownload = async () => {
    if (!result) return;
    setDownloading(true);
    try {
      const fullText = buildFullText();
      const structuredTailor = result.structuredTailor;
      const payload = editedSections ? { sections: editedSections } : structuredTailor;

      const blob = await resumeAPI.downloadTailored(
        JSON.stringify(payload),
        resumeFile,
        fullText || null,
      );
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'tailored_resume.pdf';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      setError('Failed to download PDF');
    } finally {
      setDownloading(false);
    }
  };

  const handleReset = () => {
    setResumeFile(null);
    setJobDesc('');
    setResult(null);
    setEditedSections(null);
    setHasEdits(false);
    setHasAutoTailored(false);
    setError(null);
  };

  return (
    <div className="p-4 md:p-8 max-w-max_width mx-auto">
      <FadeIn>
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-900 dark:text-slate-50 tracking-tight flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-4xl">auto_awesome</span>
            AI Resume Tailor
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-2">Review, edit, and download a tailored resume matched to the job description.</p>
        </div>
      </FadeIn>

      {error && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-xl p-4 mb-8 flex items-center gap-3">
          <span className="material-symbols-outlined text-red-500">error</span>
          <span className="text-red-700 dark:text-red-400 font-bold text-sm">{error}</span>
        </motion.div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-5 space-y-6">
          <FadeIn>
            <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">1. Upload Resume</label>
                {resumeFile && <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">{resumeFile.name}</span>}
              </div>
              <label className="border-2 border-dashed border-slate-200 dark:border-white/10 rounded-xl p-8 flex flex-col items-center justify-center gap-3 bg-slate-50/50 dark:bg-white/[0.02] hover:bg-slate-50 dark:hover:bg-white/[0.05] transition-colors cursor-pointer group">
                <motion.div whileHover={reduce ? {} : { scale: 1.15 }} className="w-12 h-12 rounded-full bg-white dark:bg-white/10 shadow-sm flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-2xl">upload_file</span>
                </motion.div>
                <div className="text-center">
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-200">Drop file here</p>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">or click to browse</p>
                </div>
                <input type="file" accept=".pdf,.docx" className="hidden" onChange={handleFileUpload} disabled={loading} />
              </label>
            </div>
          </FadeIn>

          <FadeIn delay={0.05}>
            <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 block mb-4">2. Job Description</label>
              <textarea
                className="w-full h-80 bg-slate-50 dark:bg-white/[0.02] border border-transparent dark:border-white/5 rounded-xl p-6 text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none outline-none dark:text-slate-100"
                placeholder="Paste the job requirements here..."
                value={jobDesc}
                onChange={e => setJobDesc(e.target.value)}
              />
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <div className="flex gap-4">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleReset} disabled={loading} className="flex-1 py-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-white/10 transition-all">
                <span className="material-symbols-outlined text-[20px]">refresh</span> Reset
              </motion.button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleTailor} disabled={loading} className="flex-[2] py-4 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-3 shadow-xl shadow-primary/20 disabled:opacity-60">
                {loading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                    Tailoring...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[20px]">bolt</span>
                    Tailor Resume
                  </>
                )}
              </motion.button>
            </div>
          </FadeIn>
        </div>

        <div className="xl:col-span-7">
          {result ? (
            <StaggerContainer>
              <StaggerItem>
                <motion.div initial={reduce ? {} : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-r from-primary to-indigo-600 rounded-3xl p-8 shadow-xl text-white overflow-hidden relative">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <span className="material-symbols-outlined text-[120px]">trending_up</span>
                  </div>
                  <div className="relative z-10">
                    <h3 className="text-white/80 text-[10px] font-black uppercase tracking-widest mb-4">ATS Match Transformation</h3>
                    <div className="flex items-center gap-8 flex-wrap">
                      <div className="text-center">
                        <p className="text-3xl font-black opacity-40 line-through mb-1">{result.before_score}%</p>
                        <p className="text-[10px] uppercase font-black tracking-tighter opacity-70">Before</p>
                      </div>
                      <div className="w-12 h-1 bg-white/20 rounded-full hidden sm:block"></div>
                      <div className="text-center">
                        <motion.p initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 150, damping: 12, delay: 0.3 }} className="text-6xl font-black mb-1">{result.after_score}%</motion.p>
                        <p className="text-[10px] uppercase font-black tracking-tighter opacity-70">After Optimization</p>
                      </div>
                      <div className="ml-auto bg-white/20 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/20">
                        <span className="text-2xl font-black">+{result.improvement}%</span>
                      </div>
                    </div>
                    <div className="mt-8 w-full bg-white/10 rounded-full h-3 overflow-hidden border border-white/5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${result.after_score}%` }}
                        transition={{ duration: 1.2, ease: 'easeOut', delay: 0.5 }}
                        className="bg-white h-full rounded-full shadow-[0_0_15px_rgba(255,255,255,0.5)]"
                      />
                    </div>
                  </div>
                </motion.div>
              </StaggerItem>

              {result.structured_tailor?.summary && (
                <StaggerItem>
                  <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Tailoring Strategy</h3>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 italic">"{result.structured_tailor.summary}"</p>
                  </div>
                </StaggerItem>
              )}

              {sections && sections.length > 0 && (
                <StaggerItem>
                  <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <span className="material-symbols-outlined text-emerald-500 text-[18px]">description</span>
                        Tailored Resume
                      </h3>
                      <div className="flex items-center gap-2">
                        {hasEdits && (
                          <span className="text-[10px] bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-bold">Edited</span>
                        )}
                        <span className="text-[10px] text-slate-400 font-medium">Click any text to edit</span>
                      </div>
                    </div>
                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                      {sections.map((sec, i) => (
                        <SectionEditor
                          key={i}
                          section={sec}
                          index={i}
                          onUpdate={handleSectionUpdate}
                        />
                      ))}
                    </div>
                  </div>
                </StaggerItem>
              )}

              {result.suggestions?.length > 0 && (
                <StaggerItem>
                  <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 mb-4 uppercase tracking-widest flex items-center gap-2">
                      <span className="material-symbols-outlined text-amber-500 text-[18px]">tips_and_updates</span>
                      AI Strategy Tips
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {result.suggestions.map((tip, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.06 }}
                          className="flex gap-3 p-4 bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100/50 dark:border-amber-900/20 rounded-2xl"
                        >
                          <span className="material-symbols-outlined text-[18px] text-amber-600 dark:text-amber-400 shrink-0">check_circle</span>
                          <p className="text-[12px] text-amber-900 dark:text-amber-100 font-bold leading-snug">{tip}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </StaggerItem>
              )}

              <StaggerItem>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDownload}
                  disabled={downloading}
                  className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl shadow-emerald-500/20 disabled:opacity-60"
                >
                  <span className="material-symbols-outlined">download</span>
                  {downloading ? 'Generating PDF...' : 'Download Tailored Resume (PDF)'}
                </motion.button>
              </StaggerItem>
            </StaggerContainer>
          ) : (
            <FadeIn>
              <div className="h-full min-h-[600px] flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-white/5 border border-dashed border-slate-200 dark:border-white/10 rounded-[32px]">
                <div className="w-24 h-24 bg-primary/5 dark:bg-primary/10 rounded-full flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-primary/30 dark:text-primary/40 text-6xl">magic_button</span>
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-slate-50 mb-2">Ready to Optimize?</h3>
                <p className="text-slate-500 dark:text-slate-400 font-medium max-w-sm leading-relaxed">
                  Upload your resume and paste the job description. The AI will rewrite each section to match the role. Click any section to edit before downloading.
                </p>
              </div>
            </FadeIn>
          )}
        </div>
      </div>
    </div>
  );
}
