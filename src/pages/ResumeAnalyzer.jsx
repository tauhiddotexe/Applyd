import { useState } from 'react';
import { resumeAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export default function ResumeAnalyzer() {
  const { user, loading: authLoading } = useAuth();
  const [resumeFile, setResumeFile] = useState(null);
  const [jobDesc, setJobDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const score = result?.match_score ?? 0;
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

  const handleReset = () => {
    setResumeFile(null);
    setJobDesc('');
    setResult(null);
    setError(null);
  };

  return (
    <div className="p-4 md:p-8 max-w-max_width mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl font-black text-slate-900 dark:text-slate-50 tracking-tight mb-2">AI Resume Analyzer</h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium">Get deep AI insights on how well your resume aligns with any job posting.</p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-2xl p-4 mb-8 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <span className="material-symbols-outlined text-red-500">error</span>
          <span className="text-red-700 dark:text-red-400 font-bold text-sm">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-6 space-y-6">
          <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[32px] p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">1. Upload Resume</label>
              <span className="text-[10px] bg-primary/10 text-primary px-3 py-1 rounded-full font-black tracking-tight">{resumeFile ? resumeFile.name : 'PDF/DOCX'}</span>
            </div>
            <label className="border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl p-10 flex flex-col items-center justify-center gap-4 bg-slate-50/50 dark:bg-white/2 hover:bg-slate-50 dark:hover:bg-white/5 transition-all cursor-pointer group">
              <div className="w-16 h-16 rounded-[20px] bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 shadow-xl shadow-slate-200/50 dark:shadow-none flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-3xl">upload_file</span>
              </div>
              <div className="text-center">
                <p className="text-sm font-black text-slate-900 dark:text-slate-50 tracking-tight">Drop file here</p>
                <p className="text-xs font-medium text-slate-500 mt-1">or click to browse</p>
              </div>
              <input type="file" accept=".pdf,.docx" className="hidden" onChange={handleFileUpload} disabled={loading} />
            </label>
          </div>

          <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[32px] p-8 shadow-sm">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-6">2. Job Description</label>
            <textarea 
              className="w-full h-80 bg-slate-50 dark:bg-white/2 border border-transparent dark:border-white/5 rounded-2xl p-6 text-sm font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none outline-none dark:text-slate-100 placeholder:text-slate-400" 
              placeholder="Paste the job requirements here..." 
              value={jobDesc} 
              onChange={e => setJobDesc(e.target.value)} 
            />
          </div>

          <div className="flex gap-4">
            <button onClick={handleReset} disabled={loading} className="flex-1 py-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-white/10 transition-all">
              <span className="material-symbols-outlined text-[20px]">refresh</span> Reset
            </button>
            <button 
              onClick={handleAnalyze} 
              disabled={loading} 
              className="flex-[2] py-4 bg-primary text-white rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-60"
            >
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
            </button>
          </div>
        </div>

        <div className="xl:col-span-6">
          {result ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[32px] p-8 shadow-sm flex items-center justify-between overflow-hidden relative">
                <div>
                  <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Match Score</h3>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-6xl font-black ${scoreTone}`}>{score}</span>
                    <span className="text-xl font-black text-slate-300 dark:text-slate-600">/100</span>
                  </div>
                </div>
                <div className="relative w-28 h-28">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle className="text-slate-50 dark:text-white/5" cx="56" cy="56" fill="transparent" r="48" stroke="currentColor" strokeWidth="10" />
                    <circle className={scoreRing} cx="56" cy="56" fill="transparent" r="48" stroke="currentColor" strokeDasharray="301.59" strokeDashoffset={301.59 - (score / 100) * 301.59} strokeWidth="10" strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`material-symbols-outlined text-3xl ${scoreTone}`}>psychology</span>
                  </div>
                </div>
              </div>

              {result.summary && (
                <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[32px] p-8 shadow-sm">
                  <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">AI Evaluation</h3>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300 leading-relaxed italic border-l-4 border-primary/20 pl-6">"{result.summary}"</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[32px] p-8 shadow-sm">
                  <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6">Top Strengths</h3>
                  <div className="space-y-4">
                    {result.strengths?.slice(0, 4).map((item, i) => (
                      <div key={i} className="flex gap-3 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        <span className="material-symbols-outlined text-[20px] text-emerald-500">check_circle</span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[32px] p-8 shadow-sm">
                  <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6">Missing Keywords</h3>
                  <div className="flex flex-wrap gap-2">
                    {result.missing_keywords?.slice(0, 10).map((keyword) => (
                      <span key={keyword} className="px-3 py-1.5 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-900/30 rounded-lg text-[10px] font-black uppercase tracking-tight">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[32px] p-8 shadow-sm">
                <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6">Critical Improvements</h3>
                <div className="space-y-4">
                  {result.improvements?.map((item, index) => (
                    <div key={index} className="flex gap-4 p-5 bg-slate-50 dark:bg-white/2 rounded-2xl border border-slate-100 dark:border-white/5 group hover:border-primary/30 transition-all">
                      <div className="shrink-0 w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center font-black text-sm shadow-xl shadow-primary/20">{index + 1}</div>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300 leading-snug">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[600px] flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-white/5 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-[40px]">
              <div className="w-24 h-24 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-[32px] flex items-center justify-center mb-8 shadow-xl shadow-slate-200/50 dark:shadow-none">
                <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 text-5xl">analytics</span>
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-slate-50 mb-3 tracking-tight">Analysis Pending</h3>
              <p className="text-slate-500 dark:text-slate-400 font-medium max-w-sm leading-relaxed">
                Upload your resume and the job description to see how you stack up and get AI-driven optimization tips.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
