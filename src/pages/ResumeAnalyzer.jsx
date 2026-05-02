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

  const score = result?.score ?? 0;
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
    
    // Check file size (5MB limit)
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
      const data = await resumeAPI.score(resumeFile, jobDesc.trim());
      setResult(data);
    } catch (err) {
      setError(err.message || 'Analysis failed');
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
        <h1 className="font-h1 text-h1 text-on-surface">AI Resume Optimizer</h1>
        <p className="text-on-surface-variant text-body-sm mt-2">Compare your resume against specific job descriptions to maximize ATS compatibility.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-lg mb-lg flex items-center gap-3">
          <span className="material-symbols-outlined text-red-500">error</span>
          <span className="text-red-700 text-body-sm">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <div className="xl:col-span-7 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-surface-container-lowest border border-slate-200 rounded-xl p-md shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <label className="font-label-caps text-label-caps text-on-surface uppercase">Upload Resume</label>
                <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">{resumeFile ? resumeFile.name : 'PDF'}</span>
              </div>
              <label className="border-2 border-dashed border-slate-200 rounded-lg p-8 flex flex-col items-center justify-center gap-3 bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-pointer group">
                <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-primary-container group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined">upload_file</span>
                </div>
                <div className="text-center">
                  <p className="text-body-sm font-semibold text-on-surface">Drop PDF or DOCX here</p>
                  <p className="text-[11px] text-slate-500">or click to browse</p>
                </div>
                <input type="file" accept="application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword" className="hidden" onChange={handleFileUpload} disabled={loading} />
              </label>
            </div>

            <div className="bg-surface-container-lowest border border-slate-200 rounded-xl p-md shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <label className="font-label-caps text-label-caps text-on-surface uppercase">Job Description</label>
              </div>
              <textarea className="w-full h-[332px] bg-surface-container-low border border-outline-variant rounded-lg p-3 text-body-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none outline-none" placeholder="Paste the job posting requirements and description here..." value={jobDesc} onChange={e => setJobDesc(e.target.value)} />
            </div>
          </div>

          <div className="flex justify-center gap-4">
            <button onClick={handleReset} disabled={loading} className="bg-surface border border-outline-variant text-on-surface-variant px-6 py-4 rounded-xl font-h3 flex items-center gap-2 hover:bg-surface-container transition-all disabled:opacity-60">
              <span className="material-symbols-outlined text-[20px]">refresh</span> Reset
            </button>
            <button onClick={handleAnalyze} disabled={loading} className="bg-primary-container text-on-primary px-10 py-4 rounded-xl font-h3 flex items-center gap-3 shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-60">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>{loading ? 'Analyzing...' : 'Analyze Match Score'}
            </button>
          </div>
        </div>

        <div className="xl:col-span-5 space-y-5">
          <div className="bg-surface-container-lowest border border-slate-200 rounded-xl p-6 shadow-sm flex items-center justify-between overflow-hidden relative">
            <div>
              <h3 className="font-label-caps text-label-caps text-slate-500 mb-1 uppercase tracking-widest">Match Score</h3>
              <div className="flex items-baseline gap-1">
                <span className={`text-5xl font-black ${scoreTone}`}>{score}</span>
                <span className="text-xl font-bold text-slate-400">/100</span>
              </div>
            </div>
            <div className="relative w-28 h-28">
              <svg className="w-full h-full transform -rotate-90">
                <circle className="text-slate-100" cx="56" cy="56" fill="transparent" r="48" stroke="currentColor" strokeWidth="8" />
                <circle className={scoreRing} cx="56" cy="56" fill="transparent" r="48" stroke="currentColor" strokeDasharray="301.59" strokeDashoffset={301.59 - (score / 100) * 301.59} strokeWidth="8" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`material-symbols-outlined text-3xl ${scoreTone}`}>psychology</span>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-lowest border border-slate-200 rounded-xl p-md shadow-sm">
            <h3 className="font-label-caps text-label-caps text-on-surface mb-4 uppercase">Matched Keywords</h3>
            <div className="flex flex-wrap gap-2">
              {result?.matched_keywords?.length ? result.matched_keywords.map((keyword) => (
                <span key={keyword} className="px-3 py-1.5 bg-green-50 text-green-700 border border-green-100 rounded-lg font-label-caps text-label-caps flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>{keyword}
                </span>
              )) : (
                <span className="text-body-sm text-on-surface-variant">No matched keywords yet.</span>
              )}
            </div>
          </div>

          <div className="bg-surface-container-lowest border border-slate-200 rounded-xl p-md shadow-sm">
            <h3 className="font-label-caps text-label-caps text-on-surface mb-4 uppercase">Missing Keywords</h3>
            <div className="flex flex-wrap gap-2">
              {result?.missing_keywords?.length ? result.missing_keywords.map((keyword) => (
                <span key={keyword} className="px-3 py-1.5 bg-red-50 text-red-700 border border-red-100 rounded-lg font-label-caps text-label-caps flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">add_circle</span>{keyword}
                </span>
              )) : (
                <span className="text-body-sm text-on-surface-variant">No missing keywords found.</span>
              )}
            </div>
          </div>

          <div className="bg-surface-container-lowest border border-slate-200 rounded-xl p-md shadow-sm">
            <h3 className="font-label-caps text-label-caps text-on-surface mb-4 uppercase">Suggestions</h3>
            <ul className="space-y-3">
              {result?.suggestions?.length ? result.suggestions.map((item, index) => (
                <li key={`${item}-${index}`} className="flex gap-3">
                  <div className="shrink-0 w-8 h-8 rounded-lg bg-primary-fixed flex items-center justify-center text-primary font-bold text-sm">{index + 1}</div>
                  <p className="text-[12px] text-on-surface-variant leading-snug">{item}</p>
                </li>
              )) : (
                <li className="text-body-sm text-on-surface-variant">No suggestions yet.</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
