import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { resumeAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { FadeIn, StaggerContainer, StaggerItem } from '../components/ui/MotionDiv';

export default function ResumeAnalyzer() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [resumeFile, setResumeFile] = useState(null);
  const [jobDesc, setJobDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const reduce = useReducedMotion();

  const score = result?.matchScore ?? 0;
  const scoreTone = score >= 80 ? 'text-green-600' : score >= 60 ? 'text-yellow-500' : 'text-red-500';
  const scoreRing = score >= 80 ? 'text-green-500' : score >= 60 ? 'text-yellow-500' : 'text-red-500';

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
    setError(null);
  };

  const handleAnalyze = async () => {
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
      const data = await resumeAPI.analyzeResume(resumeFile, jobDesc.trim());
      setResult(data);
    } catch (err) {
      const msg = err.message;
      if (msg.includes('AI Cooldown')) {
        setError(msg);
      } else if (msg.includes('429') || msg.includes('limit')) {
        setError('The AI service is busy. Please wait a few seconds and try again.');
      } else {
        setError(msg || 'Analysis failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTailorRedirect = () => {
    navigate('/resume-tailor', { state: { resumeFile, jobDesc } });
  };

  const handleReset = () => {
    setResumeFile(null);
    setJobDesc('');
    setResult(null);
    setError(null);
  };

  return (
    <div className="p-4 md:p-8 max-w-max_width mx-auto">
      <FadeIn>
        <div className="mb-10">
          <h1 className="text-3xl font-black text-slate-900 dark:text-slate-50 tracking-tight mb-2">AI Resume Analyzer</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Get deep AI insights on how well your resume aligns with any job posting.</p>
        </div>
      </FadeIn>

      {error && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-2xl p-4 mb-8 flex items-center gap-3">
          <span className="material-symbols-outlined text-red-500">error</span>
          <span className="text-red-700 dark:text-red-400 font-bold text-sm">{error}</span>
        </motion.div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-6 space-y-6">
          <FadeIn>
            <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[32px] p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">1. Upload Resume</label>
                <span className="text-[10px] bg-primary/10 text-primary px-3 py-1 rounded-full font-black tracking-tight">{resumeFile ? resumeFile.name : 'PDF/DOCX'}</span>
              </div>
              <label className="border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl p-10 flex flex-col items-center justify-center gap-4 bg-slate-50/50 dark:bg-white/2 hover:bg-slate-50 dark:hover:bg-white/5 transition-all cursor-pointer group">
                <motion.div whileHover={reduce ? {} : { scale: 1.1 }} className="w-16 h-16 rounded-[20px] bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 shadow-xl shadow-slate-200/50 dark:shadow-none flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-3xl">upload_file</span>
                </motion.div>
                <div className="text-center">
                  <p className="text-sm font-black text-slate-900 dark:text-slate-50 tracking-tight">Drop file here</p>
                  <p className="text-xs font-medium text-slate-500 mt-1">or click to browse</p>
                </div>
                <input type="file" accept=".pdf,.docx" className="hidden" onChange={handleFileUpload} disabled={loading} />
              </label>
            </div>
          </FadeIn>

          <FadeIn delay={0.05}>
            <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[32px] p-8 shadow-sm">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-6">2. Job Description</label>
              <textarea
                className="w-full h-80 bg-slate-50 dark:bg-white/2 border border-transparent dark:border-white/5 rounded-2xl p-6 text-sm font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none outline-none dark:text-slate-100 placeholder:text-slate-400"
                placeholder="Paste the job requirements here..."
                value={jobDesc}
                onChange={e => setJobDesc(e.target.value)}
              />
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <div className="flex gap-4">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleReset} disabled={loading} className="flex-1 py-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-white/10 transition-all">
                <span className="material-symbols-outlined text-[20px]">refresh</span> Reset
              </motion.button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleAnalyze} disabled={loading} className="flex-[2] py-4 bg-primary text-white rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl shadow-primary/20 disabled:opacity-60">
                {loading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin">progress_activity</span>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">bolt</span>
                    Analyze Match
                  </>
                )}
              </motion.button>
            </div>
          </FadeIn>
        </div>

        <div className="xl:col-span-6">
          {result ? (
            <StaggerContainer>
              <StaggerItem>
                <motion.div initial={reduce ? {} : { opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 20 }} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[32px] p-8 shadow-sm flex items-center justify-between overflow-hidden relative">
                  <div>
                    <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Match Score</h3>
                    <div className="flex items-baseline gap-1">
                      <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, ease: 'easeOut' }} className={`text-6xl font-black ${scoreTone}`}>{score}</motion.span>
                      <span className="text-xl font-black text-slate-300 dark:text-slate-600">/100</span>
                    </div>
                  </div>
                  <div className="relative w-28 h-28">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle className="text-slate-50 dark:text-white/5" cx="56" cy="56" fill="transparent" r="48" stroke="currentColor" strokeWidth="10" />
                      <motion.circle className={scoreRing} cx="56" cy="56" fill="transparent" r="48" stroke="currentColor" strokeDasharray="301.59" strokeDashoffset="301.59" strokeWidth="10" strokeLinecap="round" initial={false} animate={{ strokeDashoffset: 301.59 - (score / 100) * 301.59 }} transition={{ duration: 1, ease: 'easeOut' }} />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className={`material-symbols-outlined text-3xl ${scoreTone}`}>psychology</span>
                    </div>
                  </div>
                </motion.div>
              </StaggerItem>

              {result.scoreBreakdown && (
                <StaggerItem>
                  <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[32px] p-8 shadow-sm">
                    <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6">Score Breakdown</h3>
                    <div className="space-y-4">
                      {[
                        { label: 'Keyword Match', value: result.scoreBreakdown.keywordMatch, color: 'bg-blue-500' },
                        { label: 'Semantic Similarity', value: result.scoreBreakdown.semanticSimilarity, color: 'bg-violet-500' },
                        { label: 'AI Analysis', value: result.scoreBreakdown.llmAnalysis, color: 'bg-amber-500' },
                        { label: 'Section Coverage', value: result.scoreBreakdown.sectionCoverage, color: 'bg-emerald-500' },
                      ].map((item) => (
                        <div key={item.label}>
                          <div className="flex justify-between text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">
                            <span>{item.label}</span>
                            <span>{item.value}%</span>
                          </div>
                          <div className="h-2 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${item.value}%` }}
                              transition={{ duration: 0.8, ease: 'easeOut' }}
                              className={`h-full rounded-full ${item.color}`}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </StaggerItem>
              )}

              {result.summary && (
                <StaggerItem>
                  <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[32px] p-8 shadow-sm">
                    <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">AI Evaluation</h3>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300 leading-relaxed italic border-l-4 border-primary/20 pl-6">"{result.summary}"</p>
                  </div>
                </StaggerItem>
              )}

              <StaggerItem>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <StaggerContainer>
                    <StaggerItem>
                      <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[32px] p-8 shadow-sm">
                        <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6">Top Strengths</h3>
                        <div className="space-y-4">
                          {result.strengths?.slice(0, 4).map((item, i) => (
                            <motion.div key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="flex gap-3 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                              <span className="material-symbols-outlined text-[20px] text-emerald-500">check_circle</span>
                              <span>{item}</span>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </StaggerItem>
                    <StaggerItem>
                      <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[32px] p-8 shadow-sm">
                        <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6">Missing Keywords</h3>
                        <div className="flex flex-wrap gap-2">
                          {result.missingKeywords?.slice(0, 10).map((keyword, i) => (
                            <motion.span key={keyword} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }} className="px-3 py-1.5 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-900/30 rounded-lg text-[10px] font-black uppercase tracking-tight">
                              {keyword}
                            </motion.span>
                          ))}
                        </div>
                      </div>
                    </StaggerItem>
                  </StaggerContainer>
                </div>
              </StaggerItem>

              <StaggerItem>
                <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[32px] p-8 shadow-sm">
                  <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6">Critical Improvements</h3>
                  <div className="space-y-4">
                    {result.improvements?.map((item, index) => (
                      <motion.div key={index} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }} className="flex gap-4 p-5 bg-slate-50 dark:bg-white/2 rounded-2xl border border-slate-100 dark:border-white/5 group hover:border-primary/30 transition-all">
                        <div className="shrink-0 w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center font-black text-sm shadow-xl shadow-primary/20">{index + 1}</div>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300 leading-snug">{item}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </StaggerItem>
              <StaggerItem>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleTailorRedirect}
                  className="w-full py-4 bg-gradient-to-r from-primary to-indigo-600 text-white rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl shadow-primary/30"
                >
                  <span className="material-symbols-outlined">auto_awesome</span>
                  Tailor Resume with AI
                </motion.button>
              </StaggerItem>
            </StaggerContainer>
          ) : (
            <FadeIn>
              <div className="h-full min-h-[600px] flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-white/5 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-[40px]">
                <div className="w-24 h-24 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-[32px] flex items-center justify-center mb-8 shadow-xl shadow-slate-200/50 dark:shadow-none">
                  <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 text-5xl">analytics</span>
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-slate-50 mb-3 tracking-tight">Analysis Pending</h3>
                <p className="text-slate-500 dark:text-slate-400 font-medium max-w-sm leading-relaxed">
                  Upload your resume and the job description to see how you stack up and get AI-driven optimization tips.
                </p>
              </div>
            </FadeIn>
          )}
        </div>
      </div>
    </div>
  );
}
