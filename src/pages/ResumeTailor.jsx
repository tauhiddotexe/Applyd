import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { resumeAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { FadeIn, StaggerContainer, StaggerItem } from '../components/ui/MotionDiv';
import ResumeBuilder from '../components/ResumeBuilder';

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
  const [editedResume, setEditedResume] = useState(null);
  const [hasEdits, setHasEdits] = useState(false);
  const reduce = useReducedMotion();

  const currentResume = editedResume || result?.structuredTailorResume || null;

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
    setEditedResume(null);
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
      if (data.structuredTailorResume) {
        setEditedResume(JSON.parse(JSON.stringify(data.structuredTailorResume)));
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
        if (data.structuredTailorResume) {
          setEditedResume(JSON.parse(JSON.stringify(data.structuredTailorResume)));
        }
      })
      .catch(err => setError(err.message || 'Tailoring failed'))
      .finally(() => setLoading(false));
  }, [resumeFile, jobDesc]);

  const handleDownload = async () => {
    if (!currentResume) return;
    setDownloading(true);
    try {
      const blob = await resumeAPI.downloadTailored(
        JSON.stringify({ structured_tailor_resume: currentResume }),
        resumeFile,
        null,
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
    setEditedResume(null);
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
          {currentResume ? (
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
                        <p className="text-3xl font-black opacity-40 line-through mb-1">{result?.before_score || 0}%</p>
                        <p className="text-[10px] uppercase font-black tracking-tighter opacity-70">Before</p>
                      </div>
                      <div className="w-12 h-1 bg-white/20 rounded-full hidden sm:block"></div>
                      <div className="text-center">
                        <motion.p initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 150, damping: 12, delay: 0.3 }} className="text-6xl font-black mb-1">{result?.after_score || 0}%</motion.p>
                        <p className="text-[10px] uppercase font-black tracking-tighter opacity-70">After Optimization</p>
                      </div>
                      <div className="ml-auto bg-white/20 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/20">
                        <span className="text-2xl font-black">+{result?.improvement || 0}%</span>
                      </div>
                    </div>
                    <div className="mt-8 w-full bg-white/10 rounded-full h-3 overflow-hidden border border-white/5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${result?.after_score || 0}%` }}
                        transition={{ duration: 1.2, ease: 'easeOut', delay: 0.5 }}
                        className="bg-white h-full rounded-full shadow-[0_0_15px_rgba(255,255,255,0.5)]"
                      />
                    </div>
                  </div>
                </motion.div>
              </StaggerItem>

              {result?.structuredTailorResume?.tailoring_strategy && (
                <StaggerItem>
                  <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Tailoring Strategy</h3>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 italic">"{result.structuredTailorResume.tailoring_strategy}"</p>
                  </div>
                </StaggerItem>
              )}

              <StaggerItem>
                <div className="flex items-center justify-between mb-3 px-1">
                  <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-500 text-[18px]">description</span>
                    Tailored Resume Preview
                  </h3>
                  <div className="flex items-center gap-2">
                    {hasEdits && (
                      <span className="text-[10px] bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-bold">Edited</span>
                    )}
                    <span className="text-[10px] text-slate-400 font-medium">Click any text to edit</span>
                  </div>
                </div>
                <ResumeBuilder
                  resume={currentResume}
                  onResumeChange={(updated) => {
                    setEditedResume(updated);
                    setHasEdits(true);
                  }}
                />
              </StaggerItem>

              {result?.suggestions?.length > 0 && (
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
                  Upload your resume and paste the job description. The AI will rewrite each section to match the role. Click any text to edit before downloading.
                </p>
              </div>
            </FadeIn>
          )}
        </div>
      </div>
    </div>
  );
}
