import { useState } from 'react';

const MISSING = ['AWS Lambda','GraphQL','CI/CD Pipelines','Unit Testing','Kubernetes'];
const STEPS = [
  { n:1, t:'Quantify Accomplishments', d:'Instead of "Managed cloud server", try "Optimized AWS server usage, reducing monthly costs by 15% ($2.4k/mo)."' },
  { n:2, t:'Strengthen Summary', d:'Your summary lacks "Distributed Systems" and "Agile Methodology" which are listed as core requirements.' },
  { n:3, t:'Modernize Layout', d:'The current multi-column format might confuse older ATS parsers. Recommend a single-column structure.' },
];

export default function ResumeAnalyzer() {
  const [resumeText, setResumeText] = useState('');
  const [jobDesc, setJobDesc] = useState('');

  return (
    <div className="p-4 md:p-8 max-w-max_width mx-auto">
      <div className="mb-8">
        <h1 className="font-h1 text-h1 text-on-surface">AI Resume Optimizer</h1>
        <p className="text-on-surface-variant text-body-sm mt-2">Compare your resume against specific job descriptions to maximize ATS compatibility.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* Left */}
        <div className="xl:col-span-7 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Resume Upload */}
            <div className="bg-surface-container-lowest border border-slate-200 rounded-xl p-md shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <label className="font-label-caps text-label-caps text-on-surface uppercase">Upload Resume</label>
                <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">PDF, DOCX</span>
              </div>
              <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 flex flex-col items-center justify-center gap-3 bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-pointer group">
                <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-primary-container group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined">upload_file</span>
                </div>
                <div className="text-center">
                  <p className="text-body-sm font-semibold text-on-surface">Drop file here</p>
                  <p className="text-[11px] text-slate-500">or click to browse</p>
                </div>
              </div>
              <div className="mt-4">
                <textarea className="w-full h-32 bg-surface-container-low border border-outline-variant rounded-lg p-3 text-body-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none outline-none" placeholder="Or paste resume text here..." value={resumeText} onChange={e => setResumeText(e.target.value)} />
              </div>
            </div>
            {/* Job Description */}
            <div className="bg-surface-container-lowest border border-slate-200 rounded-xl p-md shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <label className="font-label-caps text-label-caps text-on-surface uppercase">Job Description</label>
                <button className="text-[10px] text-primary font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">link</span>IMPORT FROM URL
                </button>
              </div>
              <textarea className="w-full h-[252px] bg-surface-container-low border border-outline-variant rounded-lg p-3 text-body-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none outline-none" placeholder="Paste the job posting requirements and description here..." value={jobDesc} onChange={e => setJobDesc(e.target.value)} />
            </div>
          </div>
          {/* Analyze */}
          <div className="flex justify-center">
            <button className="bg-primary-container text-on-primary px-10 py-4 rounded-xl font-h3 flex items-center gap-3 shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>Analyze with AI
            </button>
          </div>
          {/* Insights */}
          <div className="bg-surface-container-lowest border border-slate-200 rounded-xl p-md shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-h3 text-on-surface">Resume Insights</h3>
              <div className="flex gap-2">
                <span className="flex items-center gap-1 text-[11px] font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full"><span className="w-2 h-2 rounded-full bg-green-500" />Found</span>
                <span className="flex items-center gap-1 text-[11px] font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full"><span className="w-2 h-2 rounded-full bg-red-500" />Missing</span>
              </div>
            </div>
            <div className="text-body-sm text-on-surface-variant leading-relaxed p-4 bg-slate-50 rounded-lg border border-slate-100">
              <p>Experienced <span className="bg-green-100 text-green-800 px-1 rounded border border-green-200">Software Engineer</span> with a proven track record in <span className="bg-green-100 text-green-800 px-1 rounded border border-green-200">React.js</span> and <span className="bg-green-100 text-green-800 px-1 rounded border border-green-200">Node.js</span> development. Seeking to leverage expertise in <span className="bg-red-100 text-red-800 px-1 rounded border border-red-200 border-dashed">Cloud Infrastructure</span> and <span className="bg-red-100 text-red-800 px-1 rounded border border-red-200 border-dashed">AWS Lambda</span> for large-scale distributed systems.</p>
              <p className="mt-4">Developed high-performance web applications using <span className="bg-green-100 text-green-800 px-1 rounded border border-green-200">TypeScript</span> and <span className="bg-green-100 text-green-800 px-1 rounded border border-green-200">Tailwind CSS</span>. Focused on <span className="bg-red-100 text-red-800 px-1 rounded border border-red-200 border-dashed">System Architecture</span> and performance optimization.</p>
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="xl:col-span-5 space-y-5">
          {/* Score */}
          <div className="bg-surface-container-lowest border border-slate-200 rounded-xl p-6 shadow-sm flex items-center justify-between overflow-hidden relative">
            <div>
              <h3 className="font-label-caps text-label-caps text-slate-500 mb-1 uppercase tracking-widest">ATS Match Score</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-black text-primary-container">74</span>
                <span className="text-xl font-bold text-slate-400">/100</span>
              </div>
              <p className="text-green-600 text-[11px] font-medium mt-3 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">trending_up</span>+12% since last edit
              </p>
            </div>
            <div className="relative w-28 h-28">
              <svg className="w-full h-full transform -rotate-90">
                <circle className="text-slate-100" cx="56" cy="56" fill="transparent" r="48" stroke="currentColor" strokeWidth="8" />
                <circle className="text-primary-container" cx="56" cy="56" fill="transparent" r="48" stroke="currentColor" strokeDasharray="301.59" strokeDashoffset="78" strokeWidth="8" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl text-primary-container">psychology</span>
              </div>
            </div>
          </div>
          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-surface-container-lowest border border-slate-200 rounded-xl p-4 shadow-sm">
              <p className="text-[10px] font-bold text-slate-500 uppercase">Keywords</p>
              <p className="font-h2 text-h2 mt-1">18/25</p>
              <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden"><div className="bg-amber-400 h-full w-[72%]" /></div>
            </div>
            <div className="bg-surface-container-lowest border border-slate-200 rounded-xl p-4 shadow-sm">
              <p className="text-[10px] font-bold text-slate-500 uppercase">Readability</p>
              <p className="font-h2 text-h2 mt-1">Good</p>
              <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden"><div className="bg-green-500 h-full w-[88%]" /></div>
            </div>
          </div>
          {/* Missing Keywords */}
          <div className="bg-surface-container-lowest border border-slate-200 rounded-xl p-md shadow-sm">
            <h3 className="font-label-caps text-label-caps text-on-surface mb-4 uppercase">Critical Missing Keywords</h3>
            <div className="flex flex-wrap gap-2">
              {MISSING.map(k => (
                <span key={k} className="px-3 py-1.5 bg-red-50 text-red-700 border border-red-100 rounded-lg font-label-caps text-label-caps flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">add_circle</span>{k}
                </span>
              ))}
              <span className="px-3 py-1.5 bg-slate-100 text-slate-500 border border-slate-200 rounded-lg font-label-caps text-label-caps">+3 more</span>
            </div>
          </div>
          {/* AI Plan */}
          <div className="bg-surface-container-lowest border border-slate-200 rounded-xl p-md shadow-sm">
            <h3 className="font-label-caps text-label-caps text-on-surface mb-4 uppercase">AI Improvement Plan</h3>
            <ul className="space-y-4">
              {STEPS.map(s => (
                <li key={s.n} className="flex gap-3">
                  <div className="shrink-0 w-8 h-8 rounded-lg bg-primary-fixed flex items-center justify-center text-primary font-bold text-sm">{s.n}</div>
                  <div>
                    <p className="text-body-sm font-semibold text-on-surface">{s.t}</p>
                    <p className="text-[12px] text-on-surface-variant mt-1 leading-snug">{s.d}</p>
                  </div>
                </li>
              ))}
            </ul>
            <button className="w-full mt-6 py-2 border border-primary-container text-primary-container rounded-lg font-label-caps text-label-caps hover:bg-slate-50 transition-colors uppercase">Download Optimized Draft</button>
          </div>
        </div>
      </div>
    </div>
  );
}
