import { useState, useCallback } from 'react';

function EditableField({ value, onSave, multiline, className, displayClassName, placeholder, style }) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || '');

  const startEditing = () => {
    setEditValue(value || '');
    setEditing(true);
  };

  const save = () => {
    onSave(editValue);
    setEditing(false);
  };

  const cancel = () => {
    setEditValue(value || '');
    setEditing(false);
  };

  const keyDown = (e) => {
    if (e.key === 'Escape') { cancel(); }
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); save(); }
  };

  if (editing) {
    if (multiline) {
      return (
        <textarea
          autoFocus
          value={editValue}
          onChange={e => setEditValue(e.target.value)}
          onBlur={save}
          onKeyDown={keyDown}
          className="w-full bg-white dark:bg-white/5 border-2 border-primary/40 rounded-lg p-2 text-sm outline-none resize-none min-h-[60px] font-inherit"
          style={style}
        />
      );
    }
    return (
      <input
        autoFocus
        value={editValue}
        onChange={e => setEditValue(e.target.value)}
        onBlur={save}
        onKeyDown={keyDown}
        className="w-full bg-white dark:bg-white/5 border-2 border-primary/40 rounded-lg px-2 py-1 text-sm outline-none font-inherit"
        style={style}
      />
    );
  }

  return (
    <div
      onClick={startEditing}
      className={`group relative cursor-pointer transition-colors rounded ${displayClassName || ''}`}
      title="Click to edit"
      style={style}
    >
      <span className={value ? '' : 'text-slate-300 dark:text-slate-600 italic'}>{value || placeholder || '(empty)'}</span>
      <span className="material-symbols-outlined absolute -right-5 top-1/2 -translate-y-1/2 text-[14px] text-primary/40 opacity-0 group-hover:opacity-100 transition-opacity">edit</span>
    </div>
  );
}

function SectionHeader({ title }) {
  return (
    <div className="flex items-center gap-3 mt-6 mb-3">
      <span className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">{title}</span>
      <div className="flex-1 h-px bg-slate-200 dark:bg-white/10" />
    </div>
  );
}

function BulletEditor({ bullets, onUpdate }) {
  return (
    <div className="space-y-1">
      {bullets.map((b, i) => (
        <div key={i} className="flex gap-2 items-start group">
          <span className="text-primary/50 mt-[3px] text-xs shrink-0">•</span>
          <div className="flex-1">
            <EditableField
              value={b}
              onSave={(v) => {
                const next = [...bullets];
                next[i] = v;
                onUpdate(next);
              }}
              multiline
              displayClassName="py-0.5 px-1 -mx-1 hover:bg-slate-50 dark:hover:bg-white/[0.03] rounded"
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function ContactHeader({ contact, onUpdate }) {
  return (
    <div className="text-center mb-2">
      <EditableField
        value={contact?.name}
        onSave={(v) => onUpdate({ ...contact, name: v })}
        displayClassName="mb-1"
        style={{ fontSize: '1.5rem', fontWeight: 900, textAlign: 'center', lineHeight: 1.2 }}
        placeholder="Your Name"
      />
      <div className="flex items-center justify-center gap-x-3 gap-y-0.5 flex-wrap text-xs text-slate-500 dark:text-slate-400 font-medium">
        {['email', 'phone', 'location'].map(field => {
          const val = contact?.[field] || '';
          return (
            <EditableField
              key={field}
              value={val}
              onSave={(v) => onUpdate({ ...contact, [field]: v })}
              displayClassName="px-1 rounded hover:bg-slate-100 dark:hover:bg-white/[0.05]"
              placeholder={field}
            />
          );
        })}
      </div>
      {(contact?.linkedin || contact?.website) && (
        <div className="flex items-center justify-center gap-x-3 flex-wrap text-xs text-slate-400 dark:text-slate-500 mt-0.5">
          {['linkedin', 'website'].map(field => {
            const val = contact?.[field] || '';
            return (
              <EditableField
                key={field}
                value={val}
                onSave={(v) => onUpdate({ ...contact, [field]: v })}
                displayClassName="px-1 rounded hover:bg-slate-100 dark:hover:bg-white/[0.05]"
                placeholder={field}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function SummarySection({ summary, onUpdate }) {
  if (!summary) return null;
  return (
    <>
      <SectionHeader title="Professional Summary" />
      <EditableField
        value={summary}
        onSave={onUpdate}
        multiline
        displayClassName="text-sm text-slate-700 dark:text-slate-300 leading-relaxed px-2 -mx-2 py-1 rounded hover:bg-slate-50 dark:hover:bg-white/[0.03]"
      />
    </>
  );
}

function ExperienceSection({ experiences, onUpdate }) {
  if (!experiences || experiences.length === 0) return null;

  const updateExp = (idx, field, value) => {
    const next = experiences.map((e, i) => i === idx ? { ...e, [field]: value } : e);
    onUpdate(next);
  };

  const updateBullets = (idx, bullets) => {
    const next = experiences.map((e, i) => i === idx ? { ...e, bullets } : e);
    onUpdate(next);
  };

  return (
    <>
      <SectionHeader title="Experience" />
      <div className="space-y-5">
        {experiences.map((exp, i) => (
          <div key={i} className="border-l-2 border-slate-100 dark:border-white/5 pl-4">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                <EditableField
                  value={exp.job_title}
                  onSave={(v) => updateExp(i, 'job_title', v)}
                  displayClassName="px-1 -mx-1 rounded hover:bg-slate-100 dark:hover:bg-white/[0.05]"
                  placeholder="Job Title"
                />
              </div>
              <div className="text-xs text-slate-400 dark:text-slate-500 shrink-0">
                <EditableField
                  value={`${exp.start_date || ''}${exp.start_date && exp.end_date ? ' - ' : ''}${exp.end_date || ''}`}
                  onSave={(v) => {
                    const parts = v.split(' - ').map(s => s.trim());
                    updateExp(i, 'start_date', parts[0] || '');
                    updateExp(i, 'end_date', parts[1] || '');
                  }}
                  displayClassName="px-1 -mx-1 rounded hover:bg-slate-100 dark:hover:bg-white/[0.05] text-right"
                  placeholder="Dates"
                />
              </div>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 mb-2">
              <EditableField
                value={`${exp.company || ''}${exp.company && exp.location ? ' | ' : ''}${exp.location || ''}`}
                onSave={(v) => {
                  const parts = v.split(' | ').map(s => s.trim());
                  if (parts.length >= 2) {
                    updateExp(i, 'company', parts[0]);
                    updateExp(i, 'location', parts.slice(1).join(' | '));
                  } else {
                    updateExp(i, 'company', v);
                  }
                }}
                displayClassName="px-1 -mx-1 rounded hover:bg-slate-100 dark:hover:bg-white/[0.05]"
                placeholder="Company | Location"
              />
            </div>
            <BulletEditor
              bullets={exp.bullets || []}
              onUpdate={(bullets) => updateBullets(i, bullets)}
            />
          </div>
        ))}
      </div>
    </>
  );
}

function EducationSection({ education, onUpdate }) {
  if (!education || education.length === 0) return null;

  const updateEdu = (idx, field, value) => {
    const next = education.map((e, i) => i === idx ? { ...e, [field]: value } : e);
    onUpdate(next);
  };

  return (
    <>
      <SectionHeader title="Education" />
      <div className="space-y-3">
        {education.map((edu, i) => (
          <div key={i}>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                <EditableField
                  value={edu.degree}
                  onSave={(v) => updateEdu(i, 'degree', v)}
                  displayClassName="px-1 -mx-1 rounded hover:bg-slate-100 dark:hover:bg-white/[0.05]"
                  placeholder="Degree"
                />
              </div>
              <div className="text-xs text-slate-400 dark:text-slate-500 shrink-0">
                <EditableField
                  value={`${edu.start_date || ''}${edu.start_date && edu.end_date ? ' - ' : ''}${edu.end_date || ''}`}
                  onSave={(v) => {
                    const parts = v.split(' - ').map(s => s.trim());
                    updateEdu(i, 'start_date', parts[0] || '');
                    updateEdu(i, 'end_date', parts[1] || '');
                  }}
                  displayClassName="px-1 -mx-1 rounded hover:bg-slate-100 dark:hover:bg-white/[0.05] text-right"
                  placeholder="Dates"
                />
              </div>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              <EditableField
                value={`${edu.school || ''}${edu.school && edu.location ? ', ' : ''}${edu.location || ''}`}
                onSave={(v) => {
                  const parts = v.split(', ').map(s => s.trim());
                  updateEdu(i, 'school', parts[0] || '');
                  if (parts.length > 1) updateEdu(i, 'location', parts.slice(1).join(', '));
                }}
                displayClassName="px-1 -mx-1 rounded hover:bg-slate-100 dark:hover:bg-white/[0.05]"
                placeholder="School, Location"
              />
            </div>
            {edu.gpa && (
              <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                GPA: <EditableField
                  value={edu.gpa}
                  onSave={(v) => updateEdu(i, 'gpa', v)}
                  displayClassName="inline px-1 -mx-1 rounded hover:bg-slate-100 dark:hover:bg-white/[0.05]"
                  placeholder="GPA"
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

function SkillsSection({ skills, onUpdate }) {
  if (!skills || skills.length === 0) return null;

  const [editingIdx, setEditingIdx] = useState(null);
  const [editValue, setEditValue] = useState('');

  const saveSkill = (idx, val) => {
    const next = [...skills];
    next[idx] = val;
    onUpdate(next);
    setEditingIdx(null);
  };

  const removeSkill = (idx) => {
    const next = skills.filter((_, i) => i !== idx);
    onUpdate(next);
  };

  const addSkill = () => {
    onUpdate([...skills, '']);
  };

  return (
    <>
      <SectionHeader title="Skills" />
      <div className="flex flex-wrap gap-1.5">
        {skills.map((skill, i) => (
          <div key={i} className="group relative">
            {editingIdx === i ? (
              <input
                autoFocus
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                onBlur={() => saveSkill(i, editValue)}
                onKeyDown={e => {
                  if (e.key === 'Enter') { e.preventDefault(); saveSkill(i, editValue); }
                  if (e.key === 'Escape') { setEditingIdx(null); }
                }}
                className="bg-white dark:bg-white/5 border-2 border-primary/40 rounded-lg px-2 py-0.5 text-xs outline-none w-28"
              />
            ) : (
              <span
                onClick={() => { setEditValue(skill); setEditingIdx(i); }}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 dark:bg-white/[0.06] text-xs font-medium text-slate-700 dark:text-slate-300 rounded-full cursor-pointer hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors group"
              >
                {skill}
                <button
                  onClick={(e) => { e.stopPropagation(); removeSkill(i); }}
                  className="text-slate-300 dark:text-slate-600 hover:text-red-500 transition-colors"
                >
                  <span className="material-symbols-outlined text-[12px]">close</span>
                </button>
              </span>
            )}
          </div>
        ))}
        <button
          onClick={addSkill}
          className="inline-flex items-center gap-1 px-2.5 py-1 border border-dashed border-slate-300 dark:border-white/20 text-xs text-slate-400 rounded-full hover:border-primary/40 hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined text-[12px]">add</span>
          Add
        </button>
      </div>
    </>
  );
}

function ProjectsSection({ projects, onUpdate }) {
  if (!projects || projects.length === 0) return null;

  const updateProj = (idx, field, value) => {
    const next = projects.map((p, i) => i === idx ? { ...p, [field]: value } : p);
    onUpdate(next);
  };

  const updateProjBullets = (idx, bullets) => {
    const next = projects.map((p, i) => i === idx ? { ...p, bullets } : p);
    onUpdate(next);
  };

  return (
    <>
      <SectionHeader title="Projects" />
      <div className="space-y-4">
        {projects.map((proj, i) => (
          <div key={i} className="border-l-2 border-slate-100 dark:border-white/5 pl-4">
            <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
              <EditableField
                value={proj.name}
                onSave={(v) => updateProj(i, 'name', v)}
                displayClassName="px-1 -mx-1 rounded hover:bg-slate-100 dark:hover:bg-white/[0.05]"
                placeholder="Project Name"
              />
            </div>
            {proj.description && (
              <EditableField
                value={proj.description}
                onSave={(v) => updateProj(i, 'description', v)}
                multiline
                displayClassName="text-xs text-slate-500 dark:text-slate-400 mb-2 px-1 -mx-1 rounded hover:bg-slate-100 dark:hover:bg-white/[0.05]"
              />
            )}
            <BulletEditor
              bullets={proj.bullets || []}
              onUpdate={(bullets) => updateProjBullets(i, bullets)}
            />
          </div>
        ))}
      </div>
    </>
  );
}

function CertificationsSection({ certifications, onUpdate }) {
  if (!certifications || certifications.length === 0) return null;

  const [editingIdx, setEditingIdx] = useState(null);
  const [editValue, setEditValue] = useState('');

  const saveCert = (idx, val) => {
    const next = [...certifications];
    next[idx] = val;
    onUpdate(next);
    setEditingIdx(null);
  };

  const removeCert = (idx) => {
    onUpdate(certifications.filter((_, i) => i !== idx));
  };

  const addCert = () => {
    onUpdate([...certifications, '']);
  };

  return (
    <>
      <SectionHeader title="Certifications" />
      <div className="flex flex-wrap gap-1.5">
        {certifications.map((cert, i) => (
          <div key={i}>
            {editingIdx === i ? (
              <input
                autoFocus
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                onBlur={() => saveCert(i, editValue)}
                onKeyDown={e => {
                  if (e.key === 'Enter') { e.preventDefault(); saveCert(i, editValue); }
                  if (e.key === 'Escape') { setEditingIdx(null); }
                }}
                className="bg-white dark:bg-white/5 border-2 border-primary/40 rounded-lg px-2 py-0.5 text-xs outline-none w-40"
              />
            ) : (
              <span
                onClick={() => { setEditValue(cert); setEditingIdx(i); }}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 dark:bg-white/[0.06] text-xs font-medium text-slate-700 dark:text-slate-300 rounded-full cursor-pointer hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors group"
              >
                {cert}
                <button
                  onClick={(e) => { e.stopPropagation(); removeCert(i); }}
                  className="text-slate-300 dark:text-slate-600 hover:text-red-500 transition-colors"
                >
                  <span className="material-symbols-outlined text-[12px]">close</span>
                </button>
              </span>
            )}
          </div>
        ))}
        <button
          onClick={addCert}
          className="inline-flex items-center gap-1 px-2.5 py-1 border border-dashed border-slate-300 dark:border-white/20 text-xs text-slate-400 rounded-full hover:border-primary/40 hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined text-[12px]">add</span>
          Add
        </button>
      </div>
    </>
  );
}

export default function ResumeBuilder({ resume, onResumeChange }) {
  const contact = resume?.contact || {};
  const summary = resume?.summary || '';
  const experiences = resume?.experiences || [];
  const education = resume?.education || [];
  const skills = resume?.skills || [];
  const projects = resume?.projects || [];
  const certifications = resume?.certifications || [];

  const updateResume = useCallback((path, value) => {
    if (!onResumeChange) return;
    const next = { ...resume };
    const keys = path.split('.');
    let obj = next;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!obj[keys[i]]) obj[keys[i]] = {};
      obj = obj[keys[i]];
    }
    obj[keys[keys.length - 1]] = value;
    onResumeChange(next);
  }, [resume, onResumeChange]);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
      <div className="p-6 sm:p-8 max-w-[800px] mx-auto">
        <ContactHeader
          contact={contact}
          onUpdate={(c) => updateResume('contact', c)}
        />

        <SummarySection
          summary={summary}
          onUpdate={(v) => updateResume('summary', v)}
        />

        <ExperienceSection
          experiences={experiences}
          onUpdate={(v) => updateResume('experiences', v)}
        />

        <EducationSection
          education={education}
          onUpdate={(v) => updateResume('education', v)}
        />

        <SkillsSection
          skills={skills}
          onUpdate={(v) => updateResume('skills', v)}
        />

        <ProjectsSection
          projects={projects}
          onUpdate={(v) => updateResume('projects', v)}
        />

        <CertificationsSection
          certifications={certifications}
          onUpdate={(v) => updateResume('certifications', v)}
        />
      </div>
    </div>
  );
}
