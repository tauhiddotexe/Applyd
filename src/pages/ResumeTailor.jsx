import { useState } from 'react';
import { resumeAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export default function ResumeTailor() {
  const { user, loading: authLoading } = useAuth();
  const [resumeFile, setResumeFile] = useState(null);
  const [jobDesc, setJobDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

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
    } catch (err) {
      setError(err.message || 'Tailoring failed');
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

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // Optional: show a toast or temporary "Copied!" state
  };

  return (
    <div className="p-4 md:p-8 max-w-max_width mx-auto">
      <div className="mb-8">
        <h1 className="font-h1 text-h1 text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-4xl">auto_awesome</span>
          AI Resume Tailor
        </h1>
        <p className="text-on-surface-variant text-body-sm mt-2">Optimize your resume bullets to perfectly match the job requirements.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-lg mb-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <span className="material-symbols-outlined text-red-500">error</span>
          <span className="text-red-700 text-body-sm font-medium">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-5 space-y-6">
          <div className="bg-surface-container-lowest border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <label className="font-label-caps text-label-caps text-on-surface uppercase text-[10px] tracking-widest">1. Upload Resume</label>
              {resumeFile && <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">{resumeFile.name}</span>}
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
            <label className="font-label-caps text-label-caps text-on-surface uppercase text-[10px] tracking-widest block mb-4">2. Job Description</label>
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
              onClick={handleTailor} 
              disabled={loading} 
              className="flex-[2] py-4 bg-primary text-on-primary rounded-xl font-h3 flex items-center justify-center gap-3 shadow-lg hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60"
            >
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
            </button>
          </div>
        </div>

        <div className="xl:col-span-7">
          {result ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              {/* Score Transformation Header */}
              <div className="bg-gradient-to-r from-primary to-indigo-600 rounded-2xl p-8 shadow-xl text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <span className="material-symbols-outlined text-[120px]">trending_up</span>
                </div>
                <div className="relative z-10">
                  <h3 className="text-white/80 font-label-caps uppercase tracking-widest text-[10px] mb-4">ATS Match Transformation</h3>
                  <div className="flex items-center gap-8">
                    <div className="text-center">
                      <p className="text-3xl font-black opacity-60 line-through mb-1">{result.before_score}%</p>
                      <p className="text-[10px] uppercase font-bold tracking-tighter opacity-70">Before</p>
                    </div>
                    <div className="w-12 h-0.5 bg-white/30 rounded-full"></div>
                    <div className="text-center">
                      <p className="text-6xl font-black mb-1">{result.after_score}%</p>
                      <p className="text-[10px] uppercase font-bold tracking-tighter opacity-70">After Optimization</p>
                    </div>
                    <div className="ml-auto bg-white/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
                      <span className="text-xl font-bold">+{result.improvement}%</span>
                    </div>
                  </div>
                  
                  <div className="mt-6 w-full bg-white/10 rounded-full h-3 overflow-hidden border border-white/5">
                    <div 
                      className="bg-white h-full rounded-full transition-all duration-1000 ease-out" 
                      style={{ width: `${result.after_score}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Improved Bullet Points */}
              <div className="bg-surface-container-lowest border border-slate-200 rounded-xl p-6 shadow-sm">
                <h3 className="font-label-caps text-label-caps text-on-surface mb-6 uppercase text-[10px] tracking-widest flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-500 text-[18px]">verified</span>
                  Optimized Bullet Points
                </h3>
                <div className="space-y-4">
                  {result.improvedPoints?.map((point, i) => (
                    <div key={i} className="group p-4 bg-slate-50 hover:bg-white border border-slate-100 hover:border-primary/20 rounded-xl transition-all relative">
                      <p className="text-body-sm text-on-surface leading-relaxed pr-10">{point}</p>
                      <button 
                        onClick={() => copyToClipboard(point)}
                        className="absolute top-3 right-3 p-2 bg-white border border-slate-200 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary/5 hover:border-primary/20 text-slate-400 hover:text-primary"
                        title="Copy to clipboard"
                      >
                        <span className="material-symbols-outlined text-[18px]">content_copy</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Strategic Suggestions */}
              <div className="bg-surface-container-lowest border border-slate-200 rounded-xl p-6 shadow-sm">
                <h3 className="font-label-caps text-label-caps text-on-surface mb-4 uppercase text-[10px] tracking-widest flex items-center gap-2">
                  <span className="material-symbols-outlined text-amber-500 text-[18px]">tips_and_updates</span>
                  AI Strategy Tips
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {result.suggestions?.map((tip, i) => (
                    <div key={i} className="flex gap-3 p-4 bg-amber-50/50 border border-amber-100/50 rounded-xl">
                      <span className="material-symbols-outlined text-[18px] text-amber-600 shrink-0">check_circle</span>
                      <p className="text-[12px] text-amber-900 font-medium leading-snug">{tip}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[600px] flex flex-col items-center justify-center p-12 text-center bg-surface-container-lowest border border-dashed border-slate-200 rounded-3xl">
              <div className="w-24 h-24 bg-primary/5 rounded-full flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-primary/30 text-6xl">magic_button</span>
              </div>
              <h3 className="text-xl font-bold text-on-surface mb-2">Ready to Optimize?</h3>
              <p className="text-on-surface-variant text-sm max-w-sm leading-relaxed">
                Upload your resume and paste the job description to get tailored bullet points that bypass ATS filters and impress recruiters.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}