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
      <div className="mb-8">
        <h1 className="font-h1 text-h1 text-on-surface">AI Resume Analyzer</h1>
        <p className="text-on-surface-variant text-body-sm mt-2">Get deep AI insights on how well your resume aligns with any job posting.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-lg mb-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <span className="material-symbols-outlined text-red-500">error</span>
          <span className="text-red-700 text-body-sm font-medium">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-6 space-y-6">
          <div className="bg-surface-container-lowest border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <label className="font-label-caps text-label-caps text-on-surface uppercase">1. Upload Resume</label>
              <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">{resumeFile ? resumeFile.name : 'PDF/DOCX'}</span>
            </div>
            <label className="border-2 border-dashed border-slate-200 rounded-lg p-8 flex flex-col items-center justify-center gap-3 bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-pointer group">
              <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-2xl">upload_file</span>
              </div>
              <div className="text-center">
                <p className="text-body-sm font-semibold text-on-surface">Drop file here</p>
                <p className="text-[11px] text-slate-500">or click to browse</p>
              </div>
              <input type="file" accept=".pdf,.docx" className="hidden" onChange={handleFileUpload} disabled={loading} />
            </label>
          </div>

          <div className="bg-surface-container-lowest border border-slate-200 rounded-xl p-6 shadow-sm">
            <label className="font-label-caps text-label-caps text-on-surface uppercase block mb-4">2. Job Description</label>
            <textarea 
              className="w-full h-80 bg-surface-container-low border border-outline-variant rounded-lg p-4 text-body-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none outline-none" 
              placeholder="Paste the job requirements here..." 
              value={jobDesc} 
              onChange={e => setJobDesc(e.target.value)} 
            />
          </div>

          <div className="flex gap-4">
            <button onClick={handleReset} disabled={loading} className="flex-1 py-4 bg-surface border border-outline-variant text-on-surface-variant rounded-xl font-h3 flex items-center justify-center gap-2 hover:bg-surface-container transition-all">
              <span className="material-symbols-outlined text-[20px]">refresh</span> Reset
            </button>
            <button 
              onClick={handleAnalyze} 
              disabled={loading} 
              className="flex-[2] py-4 bg-primary text-on-primary rounded-xl font-h3 flex items-center justify-center gap-3 shadow-lg hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60"
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
              <div className="bg-surface-container-lowest border border-slate-200 rounded-xl p-6 shadow-sm flex items-center justify-between overflow-hidden relative">
                <div>
                  <h3 className="font-label-caps text-label-caps text-slate-500 mb-1 uppercase tracking-widest text-[10px]">Match Score</h3>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-5xl font-black ${scoreTone}`}>{score}</span>
                    <span className="text-xl font-bold text-slate-400">/100</span>
                  </div>
                </div>
                <div className="relative w-24 h-24">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle className="text-slate-100" cx="48" cy="48" fill="transparent" r="40" stroke="currentColor" strokeWidth="8" />
                    <circle className={scoreRing} cx="48" cy="48" fill="transparent" r="40" stroke="currentColor" strokeDasharray="251.32" strokeDashoffset={251.32 - (score / 100) * 251.32} strokeWidth="8" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`material-symbols-outlined text-2xl ${scoreTone}`}>psychology</span>
                  </div>
                </div>
              </div>

              {result.summary && (
                <div className="bg-surface-container-lowest border border-slate-200 rounded-xl p-6 shadow-sm">
                  <h3 className="font-label-caps text-label-caps text-on-surface mb-3 uppercase tracking-widest text-[10px]">AI Evaluation</h3>
                  <p className="text-body-sm text-on-surface-variant leading-relaxed italic border-l-4 border-primary/20 pl-4">"{result.summary}"</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-surface-container-lowest border border-slate-200 rounded-xl p-6 shadow-sm">
                  <h3 className="font-label-caps text-label-caps text-on-surface mb-4 uppercase text-[10px] tracking-wider">Top Strengths</h3>
                  <div className="space-y-3">
                    {result.strengths?.slice(0, 4).map((item, i) => (
                      <div key={i} className="flex gap-2 text-[12px] text-green-700 font-medium">
                        <span className="material-symbols-outlined text-[16px] text-green-500">check_circle</span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-surface-container-lowest border border-slate-200 rounded-xl p-6 shadow-sm">
                  <h3 className="font-label-caps text-label-caps text-on-surface mb-4 uppercase text-[10px] tracking-wider">Missing Keywords</h3>
                  <div className="flex flex-wrap gap-2">
                    {result.missing_keywords?.slice(0, 10).map((keyword) => (
                      <span key={keyword} className="px-2 py-1 bg-red-50 text-red-700 border border-red-100 rounded text-[10px] font-bold uppercase tracking-tighter">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-surface-container-lowest border border-slate-200 rounded-xl p-6 shadow-sm">
                <h3 className="font-label-caps text-label-caps text-on-surface mb-4 uppercase text-[10px] tracking-wider">Critical Improvements</h3>
                <div className="space-y-4">
                  {result.improvements?.map((item, index) => (
                    <div key={index} className="flex gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="shrink-0 w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center font-bold text-sm shadow-sm">{index + 1}</div>
                      <p className="text-body-sm text-on-surface-variant leading-snug font-medium">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[500px] flex flex-col items-center justify-center p-12 text-center bg-surface-container-lowest border border-dashed border-slate-200 rounded-3xl">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-slate-300 text-5xl">analytics</span>
              </div>
              <h3 className="text-xl font-bold text-on-surface mb-2">Analysis Pending</h3>
              <p className="text-on-surface-variant text-sm max-w-xs leading-relaxed">
                Upload your resume and the job description to see how you stack up and get AI-driven optimization tips.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
