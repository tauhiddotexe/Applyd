import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { applicationsAPI, API_ROOT } from '../services/api';

const STATUS_LABELS = { applied: 'APPLIED', interviewing: 'INTERVIEWING', offer: 'OFFER', rejected: 'REJECTED', wishlist: 'WISHLIST' };

function formatSalary(app) {
  const { salaryMin, salaryMax, currency } = app;
  if ((!salaryMin && !salaryMax) || !currency) return 'Not specified';
  const formatter = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  });
  if (salaryMin && salaryMax) return `${formatter.format(salaryMin)} - ${formatter.format(salaryMax)}`;
  if (salaryMin) return formatter.format(salaryMin);
  return formatter.format(salaryMax);
}

function formatEventDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatEventType(value) {
  if (!value) return 'Event';
  return value.replace(/[_-]+/g, ' ').replace(/\b\w/g, (match) => match.toUpperCase());
}

function fileUrl(path) {
  if (!path) return '#';
  if (path.startsWith('http')) return path;
  return `${API_ROOT}${path}`;
}

export default function Details() {
  const nav = useNavigate();
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id;
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [eventForm, setEventForm] = useState({ type: '', date: '', notes: '' });
  const [eventLoading, setEventLoading] = useState(false);
  const [eventError, setEventError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  useEffect(() => {
    if (authLoading || !userId) return;
    setLoading(true);
    setError(null);
    applicationsAPI.get(id)
      .then((data) => setApp(data))
      .catch((err) => setError(err.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, [authLoading, id, userId]);

  const timeline = useMemo(() => {
    if (!app?.events) return [];
    return [...app.events].sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [app]);

  const handleDelete = async () => {
    if (!confirm('Delete this application permanently?')) return;
    try {
      await applicationsAPI.delete(id);
      nav('/applications');
    } catch (err) {
      alert(err.message || 'Delete failed');
    }
  };

  const handleAddEvent = async (e) => {
    e.preventDefault();
    setEventLoading(true);
    setEventError(null);
    try {
      const event = await applicationsAPI.createEvent(id, {
        type: eventForm.type,
        date: new Date(eventForm.date).toISOString(),
        notes: eventForm.notes || null,
      });
      setApp((prev) => ({ ...prev, events: [...(prev?.events || []), event] }));
      setEventForm({ type: '', date: '', notes: '' });
      setEventModalOpen(false);
    } catch (err) {
      setEventError(err.message || 'Failed to add event');
    } finally {
      setEventLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      await applicationsAPI.deleteEvent(eventId);
      setApp((prev) => ({ ...prev, events: (prev?.events || []).filter((event) => event.id !== eventId) }));
    } catch (err) {
      alert(err.message || 'Failed to delete event');
    }
  };

  const handleUploadDocument = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const document = await applicationsAPI.uploadDocument(id, file);
      setApp((prev) => ({ ...prev, documents: [document, ...(prev?.documents || [])] }));
      e.target.value = '';
    } catch (err) {
      setUploadError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <span className="material-symbols-outlined text-primary animate-spin text-4xl">progress_activity</span>
    </div>
  );

  if (error || !app) return (
    <div className="max-w-[1200px] mx-auto p-xl">
      <div className="bg-red-50 border border-red-200 rounded-xl p-lg flex items-center gap-3">
        <span className="material-symbols-outlined text-red-500">error</span>
        <span className="text-red-700">{error || 'Application not found'}</span>
        <button onClick={() => nav('/applications')} className="ml-auto text-red-600 font-semibold hover:underline">Back to list</button>
      </div>
    </div>
  );

  const eventStyles = {
    applied: { color: 'bg-blue-500', icon: 'send', border: 'border-blue-100' },
    interview: { color: 'bg-indigo-500', icon: 'forum', border: 'border-indigo-100' },
    technical_interview: { color: 'bg-violet-500', icon: 'terminal', border: 'border-violet-100' },
    behavioral_interview: { color: 'bg-purple-500', icon: 'groups', border: 'border-purple-100' },
    offer: { color: 'bg-emerald-500', icon: 'celebration', border: 'border-emerald-100' },
    rejected: { color: 'bg-red-500', icon: 'cancel', border: 'border-red-100' },
    withdrawn: { color: 'bg-amber-500', icon: 'backspace', border: 'border-amber-100' },
    follow_up: { color: 'bg-cyan-500', icon: 'rebase_edit', border: 'border-cyan-100' },
    default: { color: 'bg-slate-500', icon: 'event', border: 'border-slate-100' }
  };

  const getEventStyle = (type) => {
    const t = type.toLowerCase();
    if (t.includes('offer')) return eventStyles.offer;
    if (t.includes('reject')) return eventStyles.rejected;
    if (t.includes('technical')) return eventStyles.technical_interview;
    if (t.includes('behavioral')) return eventStyles.behavioral_interview;
    if (t.includes('interview')) return eventStyles.interview;
    if (t.includes('applied')) return eventStyles.applied;
    if (t.includes('follow')) return eventStyles.follow_up;
    if (t.includes('withdrawn')) return eventStyles.withdrawn;
    return eventStyles.default;
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <span className="material-symbols-outlined text-primary animate-spin text-4xl">progress_activity</span>
    </div>
  );

  if (error || !app) return (
    <div className="max-w-[1200px] mx-auto p-xl">
      <div className="bg-red-50 border border-red-200 rounded-xl p-lg flex items-center gap-3">
        <span className="material-symbols-outlined text-red-500">error</span>
        <span className="text-red-700">{error || 'Application not found'}</span>
        <button onClick={() => nav('/applications')} className="ml-auto text-red-600 font-semibold hover:underline">Back to list</button>
      </div>
    </div>
  );

  const domain = app.company.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com';
  const initials = app.company.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="max-w-[1200px] mx-auto p-xl">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pb-8 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-start gap-6">
          <div className="relative h-20 w-20 rounded-3xl bg-white dark:bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-700 shadow-xl shrink-0 group">
            <img 
              src={`https://logo.clearbit.com/${domain}`} 
              alt={app.company}
              className="h-full w-full object-contain p-3 group-hover:scale-110 transition-transform duration-500"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div className="hidden absolute inset-0 flex items-center justify-center bg-blue-600 text-white font-bold text-2xl">
              {initials}
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none">{app.role}</h2>
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${app.status === 'offer' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                {app.status}
              </span>
            </div>
            <p className="text-xl text-slate-500 dark:text-slate-400 font-medium">
              at <span className="text-slate-900 dark:text-white font-bold">{app.company}</span>
              <span className="mx-3 text-slate-300">•</span>
              <span className="text-sm">{app.location || 'Remote'}</span>
            </p>
            
            <div className="flex items-center gap-4 text-sm font-bold text-slate-400 uppercase tracking-wider">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px]">payments</span>
                {formatSalary(app)}
              </div>
              {app.recruiter && (
                <div className="flex items-center gap-1.5 border-l border-slate-200 dark:border-slate-700 pl-4">
                  <span className="material-symbols-outlined text-[18px]">person</span>
                  {app.recruiter}
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex gap-3 h-12">
          {app.link && (
            <a href={app.link} target="_blank" rel="noreferrer" className="px-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm rounded-2xl shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">open_in_new</span>Visit
            </a>
          )}
          <button onClick={() => nav(`/applications/${id}/edit`)} className="px-6 bg-blue-600 text-white font-bold text-sm rounded-2xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">edit</span>Edit
          </button>
          <button onClick={handleDelete} className="w-12 flex items-center justify-center border border-red-100 dark:border-red-900/30 text-red-500 rounded-2xl hover:bg-red-50 dark:hover:bg-red-900/10 transition-all">
            <span className="material-symbols-outlined text-[20px]">delete</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-lg items-start">
        {/* LEFT COLUMN: Main Info */}
        <div className="col-span-12 lg:col-span-8 space-y-lg">
          {/* Main Description */}
          <section className="bg-white dark:bg-slate-900 p-xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
                <span className="material-symbols-outlined">description</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Job Description & Notes</h3>
            </div>
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <p className="text-slate-600 dark:text-slate-400 whitespace-pre-wrap leading-relaxed text-lg">
                {app.notes || 'No specific notes or description provided for this application.'}
              </p>
            </div>
          </section>

          {/* Expanded Journey Timeline */}
          <section className="bg-white dark:bg-slate-900 p-xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600">
                  <span className="material-symbols-outlined">timeline</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Journey Timeline</h3>
              </div>
              <button onClick={() => setEventModalOpen(true)} className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-600/10 hover:bg-blue-700 transition-all flex items-center gap-2 text-sm">
                <span className="material-symbols-outlined text-[18px]">add</span>Add Event
              </button>
            </div>
            {timeline.length ? (
              <div className="relative pl-4">
                <div className="absolute left-[31px] top-6 bottom-6 w-[2px] bg-slate-100 dark:bg-slate-800" />
                <div className="space-y-12 relative">
                  {timeline.map((event) => {
                    const style = getEventStyle(event.type);
                    return (
                      <div key={event.id} className="flex gap-8 group">
                        <div className={`w-10 h-10 rounded-2xl shrink-0 z-10 flex items-center justify-center ${style.color} text-white shadow-xl ring-4 ring-white dark:ring-slate-900 transition-transform group-hover:scale-110`}>
                          <span className="material-symbols-outlined text-[18px] font-bold">{style.icon}</span>
                        </div>
                        <div className="flex-1 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 group-hover:border-blue-200 dark:group-hover:border-blue-900/50 transition-all">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div>
                              <h4 className="text-lg font-bold text-slate-900 dark:text-white">{formatEventType(event.type)}</h4>
                              <p className="text-sm font-medium text-slate-500 flex items-center gap-2 mt-1">
                                <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                                {formatEventDate(event.date)}
                              </p>
                            </div>
                            <button onClick={() => handleDeleteEvent(event.id)} className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100">
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          </div>
                          {event.notes && (
                            <div className="mt-4 text-slate-600 dark:text-slate-400 leading-relaxed italic border-l-4 border-slate-200 dark:border-slate-700 pl-4 py-1">
                              {event.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-20 px-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-slate-50/30">
                <span className="material-symbols-outlined text-slate-300 text-6xl mb-4">route</span>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No events recorded</h4>
                <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto">Track your interviews, offers, and feedback by adding events to your journey.</p>
              </div>
            )}
          </section>
        </div>

        {/* RIGHT COLUMN: Sidebar Stats & Docs */}
        <div className="col-span-12 lg:col-span-4 space-y-lg sticky top-24">
          {/* Application Insights */}
          <section className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-2xl text-white shadow-xl shadow-blue-600/20">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined">insights</span>
              Application Insights
            </h3>
            <div className="space-y-4">
              <div className="p-4 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10">
                <p className="text-xs font-bold uppercase tracking-widest opacity-70 mb-1">Response Chance</p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black">74%</span>
                  <span className="text-xs bg-emerald-400 text-emerald-950 px-2 py-0.5 rounded font-bold">HIGH</span>
                </div>
              </div>
              <div className="p-4 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10">
                <p className="text-xs font-bold uppercase tracking-widest opacity-70 mb-1">Market Match</p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black">92/100</span>
                  <span className="material-symbols-outlined text-emerald-400">check_circle</span>
                </div>
              </div>
            </div>
          </section>

          {/* Compact Timeline Summary */}
          <section className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">Quick Summary</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-slate-800">
                <span className="text-sm text-slate-500">Status</span>
                <span className="text-sm font-bold text-blue-600">{app.status.toUpperCase()}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-slate-800">
                <span className="text-sm text-slate-500">Applied</span>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{new Date(app.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-slate-500">Events</span>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{timeline.length} Total</span>
              </div>
            </div>
          </section>

          {/* Documents */}
          <section className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Documents</h3>
              <label className="text-blue-600 font-bold text-xs hover:underline cursor-pointer flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">upload</span>
                {uploading ? '...' : 'Upload'}
                <input type="file" className="hidden" onChange={handleUploadDocument} disabled={uploading} />
              </label>
            </div>
            {uploadError && (
              <div className="bg-red-50 text-red-600 text-[11px] p-2 rounded mb-3 font-medium">{uploadError}</div>
            )}
            {app.documents?.length ? (
              <div className="space-y-2">
                {app.documents.map((document) => (
                  <a key={document.id} href={fileUrl(document.fileUrl)} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-blue-50 dark:hover:bg-blue-900/10 rounded-xl transition-all border border-transparent hover:border-blue-100">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <span className="material-symbols-outlined text-slate-400">description</span>
                      <div className="overflow-hidden">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block truncate">{document.name}</span>
                        <span className="text-[10px] text-slate-400">{new Date(document.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-slate-300 text-[18px]">download</span>
                  </a>
                ))}
              </div>
            ) : (
              <div className="text-[12px] text-slate-400 text-center py-6 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">No documents yet.</div>
            )}
          </section>
        </div>
      </div>

      {eventModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-lg bg-surface-container-lowest rounded-xl border border-outline-variant shadow-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-h3 text-h3">Add Event</h3>
              <button onClick={() => setEventModalOpen(false)} className="text-slate-500 hover:text-slate-700">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            {eventError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-sm mb-md text-red-700 text-body-sm">{eventError}</div>
            )}
            <form className="space-y-4" onSubmit={handleAddEvent}>
              <div className="space-y-2">
                <label className="font-label-caps text-label-caps text-outline uppercase tracking-wider block">Type</label>
                <input className="w-full px-4 py-3 bg-surface-bright border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" value={eventForm.type} onChange={(e) => setEventForm((prev) => ({ ...prev, type: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <label className="font-label-caps text-label-caps text-outline uppercase tracking-wider block">Date</label>
                <input className="w-full px-4 py-3 bg-surface-bright border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" type="datetime-local" value={eventForm.date} onChange={(e) => setEventForm((prev) => ({ ...prev, date: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <label className="font-label-caps text-label-caps text-outline uppercase tracking-wider block">Notes</label>
                <textarea className="w-full px-4 py-3 bg-surface-bright border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none" rows="4" value={eventForm.notes} onChange={(e) => setEventForm((prev) => ({ ...prev, notes: e.target.value }))} />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setEventModalOpen(false)} className="px-5 py-2.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors">Cancel</button>
                <button type="submit" disabled={eventLoading} className="px-6 py-2.5 rounded-lg bg-primary text-on-primary hover:opacity-90 transition-all">{eventLoading ? 'Saving...' : 'Save Event'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
