import { useState, useEffect } from 'react';
import { resumeAPI, userAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import CreditBadge from '../components/CreditBadge';
import PricingModal from '../components/PricingModal';

export default function ResumeTailor() {
  const { user, loading: authLoading } = useAuth();
  const [file, setFile] = useState(null);
  const [jd, setJd] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [credits, setCredits] = useState(null);
  const [showPricing, setShowPricing] = useState(false);

  useEffect(() => {
    if (user) fetchCredits();
  }, [user]);

  const fetchCredits = async () => {
    try {
      const data = await userAPI.getProfile();
      setCredits(data.credits);
    } catch (err) {
      console.error('Error fetching credits:', err);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="material-symbols-outlined text-primary animate-spin text-4xl">progress_activity</span>
      </div>
    );
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError('File size must be under 5MB');
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleGenerate = async () => {
    if (!file) {
      setError('Please upload a resume (PDF or DOCX).');
      return;
    }
    if (!jd.trim()) {
      setError('Please provide a job description.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await resumeAPI.tailorResume(file, jd.trim());
      setResult(data);
      // Update credits locally after success
      setCredits(prev => prev - 1);
    } catch (err) {
      setError(err.message || 'Failed to generate tailored resume points.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setJd('');
    setResult(null);
    setError(null);
  };

  return (
    <div className="p-4 md:p-8 max-w-max_width mx-auto">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-h1 text-h1 text-on-surface">Resume Tailoring</h1>
          <p className="text-on-surface-variant text-body-sm mt-2">AI-powered resume optimization to match specific job requirements.</p>
        </div>
        <CreditBadge key={credits} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input Section */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-6 shadow-sm">
            <span className="font-label-caps text-label-caps text-on-surface-variant uppercase block mb-4">1. Upload Resume</span>
            <div className="relative border-2 border-dashed border-outline-variant rounded-lg p-8 text-center hover:bg-surface transition-colors cursor-pointer group">
              <input
                type="file"
                className="absolute inset-0 opacity-0 cursor-pointer"
                accept=".pdf,.docx"
                onChange={handleFileChange}
              />
              <div className="flex flex-col items-center">
                <span className="material-symbols-outlined text-primary mb-3 text-4xl">upload_file</span>
                <p className="font-body-main text-on-surface font-semibold">
                  {file ? file.name : 'Choose PDF or DOCX'}
                </p>
                <p className="text-[11px] text-outline mt-1 italic">Maximum file size: 5MB</p>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-6 shadow-sm">
            <span className="font-label-caps text-label-caps text-on-surface-variant uppercase block mb-4">2. Job Description</span>
            <textarea
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              placeholder="Paste the job description here..."
              className="w-full h-64 bg-surface border border-outline-variant rounded-lg p-4 text-body-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
            />
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleReset}
              disabled={loading}
              className="flex-1 py-4 border border-outline-variant rounded-xl font-h3 text-on-surface-variant hover:bg-surface-container transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">refresh</span>
              Reset
            </button>
            <button
              onClick={handleGenerate}
              disabled={loading || credits === 0}
              className={`flex-[2] py-4 rounded-xl font-h3 flex items-center justify-center gap-2 transition-all shadow-md ${
                loading || credits === 0
                  ? 'bg-primary/50 text-on-primary cursor-not-allowed' 
                  : 'bg-primary text-on-primary hover:opacity-90 active:scale-[0.98]'
              }`}
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                  Tailoring...
                </>
              ) : credits === 0 ? (
                <>
                  <span className="material-symbols-outlined text-[20px]">lock_open</span>
                  No Credits Left
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
                  Tailor Resume
                </>
              )}
            </button>
          </div>

          {credits === 0 && (
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 animate-in fade-in slide-in-from-top-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-primary">payments</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-h3 text-on-surface text-[15px] mb-1">Out of Credits</h4>
                  <p className="text-[13px] text-on-surface-variant leading-relaxed mb-4">
                    You've used all your free tailoring credits. Upgrade now to continue optimizing your resume for every job application.
                  </p>
                  <button 
                    onClick={() => setShowPricing(true)}
                    className="w-full py-2.5 bg-primary text-on-primary rounded-xl font-bold text-xs hover:opacity-90 transition-all shadow-sm flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">rocket_launch</span>
                    Upgrade Plan
                  </button>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <span className="material-symbols-outlined text-red-500">error</span>
              <span className="text-red-700 text-body-sm font-medium">{error}</span>
            </div>
          )}
        </div>

        {/* Output Section */}
        <div className="lg:col-span-7">
          {!result && !loading && (
            <div className="h-full min-h-[400px] bg-surface-container-lowest border border-outline-variant/30 border-dashed rounded-xl flex flex-col items-center justify-center text-on-surface-variant p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-4xl opacity-40">smart_toy</span>
              </div>
              <p className="font-h3 text-on-surface mb-2">Ready to optimize</p>
              <p className="text-body-sm opacity-60 max-w-xs">Upload your resume and the target job description to get AI-powered bullet point improvements.</p>
            </div>
          )}

          {loading && (
            <div className="h-full min-h-[400px] bg-surface-container-lowest border border-outline-variant/30 rounded-xl flex flex-col items-center justify-center p-12 text-center">
              <div className="relative w-20 h-20 mb-8">
                <div className="absolute inset-0 rounded-full border-4 border-primary/10"></div>
                <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary animate-pulse text-3xl">auto_awesome</span>
                </div>
              </div>
              <p className="font-h2 text-on-surface mb-2">Analyzing Requirements</p>
              <p className="text-body-sm text-on-surface-variant max-w-xs">Our AI is rewriting your experience to highlight your most relevant achievements for this specific role.</p>
            </div>
          )}

          {result && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary">edit_note</span>
                  </div>
                  <div>
                    <h3 className="font-h3 text-on-surface">Tailored Bullet Points</h3>
                    <p className="text-[11px] text-on-surface-variant uppercase tracking-wider font-bold">Optimized for keywords & impact</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {result.improvedPoints?.map((point, i) => (
                    <div key={i} className="flex gap-4 p-4 bg-surface border border-outline-variant/30 rounded-xl hover:border-primary/40 transition-all group relative">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/10 group-hover:bg-primary transition-colors rounded-l-xl"></div>
                      <span className="text-primary font-bold mt-0.5">•</span>
                      <p className="text-body-main text-on-surface leading-relaxed text-[14px]">{point}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-secondary">tips_and_updates</span>
                  </div>
                  <div>
                    <h3 className="font-h3 text-on-surface">Strategic Suggestions</h3>
                    <p className="text-[11px] text-on-surface-variant uppercase tracking-wider font-bold">Role-specific advice</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.suggestions?.map((suggestion, i) => (
                    <div key={i} className="flex gap-3 p-4 bg-secondary/5 border border-secondary/10 rounded-xl items-start">
                      <span className="material-symbols-outlined text-[20px] text-secondary mt-0.5">check_circle</span>
                      <span className="text-body-sm text-on-surface-variant leading-tight font-medium">{suggestion}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-primary/5 rounded-2xl p-6 border border-primary/10 flex items-start gap-5">
                <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-primary text-2xl">lightbulb</span>
                </div>
                <div>
                  <h4 className="font-h3 text-primary text-[15px] mb-1">How to use these results?</h4>
                  <p className="text-[13px] text-on-surface-variant leading-relaxed">
                    These points are generated by mapping your current experience to the specific keywords and values found in the job description. Copy and integrate them into your resume to increase your chances of passing ATS filters and catching the recruiter's eye.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <PricingModal 
        isOpen={showPricing} 
        onClose={() => setShowPricing(false)} 
      />
    </div>
  );
}
