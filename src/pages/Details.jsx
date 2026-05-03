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
    <div className="flex items-center justify-center min-h-screen">
      <span className="material-symbols-outlined text-primary animate-spin text-4xl">progress_activity</span>
    </div>
  );

  if (error || !app) return (
    <div className="max-w-4xl mx-auto p-10">
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-3xl p-10 text-center space-y-6">
        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center mx-auto text-red-600">
          <span className="material-symbols-outlined text-4xl">error</span>
        </div>
        <div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white">{error || 'Application not found'}</h3>
          <p className="text-slate-500 font-medium mt-2">The application you're looking for doesn't exist or you don't have access.</p>
        </div>
        <button onClick={() => nav('/applications')} className="text-primary font-bold hover:underline">Back to applications</button>
      </div>
    </div>
  );

  const domain = app.company.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com';
  const initials = app.company.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 pb-10 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-6">
          <div className="relative h-20 w-20 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none flex items-center justify-center overflow-hidden shrink-0">
            <img 
              src={`https://logo.clearbit.com/${domain}`} 
              alt={app.company}
              className="h-full w-full object-contain p-4 transition-transform duration-500 hover:scale-110"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div className="hidden absolute inset-0 flex items-center justify-center bg-primary/10 text-primary font-black text-2xl">
              {initials}
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{app.role}</h1>
              <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${STATUS_COLORS[app.status] || 'bg-slate-100 text-slate-700'}`}>
                {STATUS_LABELS[app.status] || app.status}
              </span>
            </div>
            <p className="text-xl text-slate-500 font-medium">
              at <span className="text-slate-900 dark:text-white font-black">{app.company}</span>
              <span className="mx-3 text-slate-200 hidden sm:inline">•</span>
              <span className="text-sm font-bold uppercase tracking-tighter text-slate-400 block sm:inline">{app.location || 'Remote'}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {app.link && (
            <a href={app.link} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-all">
              <span className="material-symbols-outlined text-[20px]">link</span>
              Apply Link
            </a>
          )}
          <button 
            onClick={() => nav(`/applications/${id}/edit`)}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl text-sm font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">edit</span>
            Edit
          </button>
          <button 
            onClick={handleDelete}
            className="p-3 bg-red-50 text-red-600 rounded-2xl hover:bg-red-100 transition-all"
          >
            <span className="material-symbols-outlined">delete</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Main Content */}
        <div className="lg:col-span-8 space-y-10">
          {/* Notes & Description */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 px-2">
              <span className="material-symbols-outlined text-primary">description</span>
              <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Description & Notes</h3>
            </div>
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm">
              <p className="text-slate-600 dark:text-slate-400 whitespace-pre-wrap leading-relaxed font-medium">
                {app.notes || 'No notes provided for this application.'}
              </p>
            </div>
          </section>

          {/* Journey Timeline */}
          <section className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-purple-600">route</span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Interview Journey</h3>
              </div>
              <button 
                onClick={() => setEventModalOpen(true)}
                className="text-sm font-bold text-primary hover:underline flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                Add Event
              </button>
            </div>

            <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
              {timeline.length ? (
                <div className="relative pl-8 border-l-2 border-slate-50 dark:border-slate-800 space-y-12">
                  {timeline.map((event) => {
                    const style = getEventStyle(event.type);
                    return (
                      <div key={event.id} className="relative group">
                        <div className={`absolute -left-[45px] top-0 w-8 h-8 rounded-xl ${style.color} text-white flex items-center justify-center shadow-lg transition-transform group-hover:scale-110`}>
                          <span className="material-symbols-outlined text-[16px]">{style.icon}</span>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-black text-slate-900 dark:text-white">{formatEventType(event.type)}</h4>
                              <p className="text-xs font-black text-slate-400 uppercase tracking-tighter mt-1">{formatEventDate(event.date)}</p>
                            </div>
                            <button 
                              onClick={() => handleDeleteEvent(event.id)}
                              className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          </div>
                          {event.notes && (
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed italic border-l-4 border-slate-200 dark:border-slate-700">
                              {event.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-20 text-center space-y-4">
                  <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto">
                    <span className="material-symbols-outlined text-slate-300 text-3xl">event_busy</span>
                  </div>
                  <p className="text-slate-500 font-medium">No events recorded yet.</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-8">
          {/* Stats Card */}
          <div className="bg-slate-900 dark:bg-slate-950 p-8 rounded-[40px] text-white shadow-2xl shadow-slate-900/20 space-y-6">
            <h3 className="text-lg font-black tracking-tight">Quick Info</h3>
            <div className="space-y-4">
              <div className="p-4 bg-white/5 rounded-2xl space-y-1">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Salary Package</p>
                <p className="font-bold text-lg">{formatSalary(app)}</p>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl space-y-1">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Recruiter / Contact</p>
                <p className="font-bold text-lg">{app.recruiter || 'Not specified'}</p>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl space-y-1">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Added On</p>
                <p className="font-bold text-lg">{new Date(app.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Documents Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Documents</h3>
              <label className="text-sm font-bold text-primary hover:underline cursor-pointer">
                {uploading ? 'Uploading...' : 'Upload'}
                <input type="file" className="hidden" onChange={handleUploadDocument} disabled={uploading} />
              </label>
            </div>
            
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm space-y-2">
              {app.documents?.length ? (
                app.documents.map((doc) => (
                  <a 
                    key={doc.id} 
                    href={fileUrl(doc.fileUrl)} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-primary/5 rounded-2xl transition-all group"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors">description</span>
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-slate-700 dark:text-slate-300 truncate">{doc.name}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{new Date(doc.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-slate-300">download</span>
                  </a>
                ))
              ) : (
                <div className="py-8 text-center">
                  <p className="text-slate-400 text-sm font-medium">No documents yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Event Modal */}
      {eventModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl p-10 space-y-8 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Add Event</h3>
              <button onClick={() => setEventModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form className="space-y-6" onSubmit={handleAddEvent}>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Event Type</label>
                <input 
                  className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all font-bold" 
                  placeholder="e.g. Technical Interview"
                  value={eventForm.type} 
                  onChange={(e) => setEventForm((prev) => ({ ...prev, type: e.target.value }))} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Date & Time</label>
                <input 
                  className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all font-bold" 
                  type="datetime-local" 
                  value={eventForm.date} 
                  onChange={(e) => setEventForm((prev) => ({ ...prev, date: e.target.value }))} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Notes</label>
                <textarea 
                  className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all font-medium min-h-[120px] resize-none" 
                  placeholder="Add any specific notes about the interview..."
                  value={eventForm.notes} 
                  onChange={(e) => setEventForm((prev) => ({ ...prev, notes: e.target.value }))} 
                />
              </div>
              
              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setEventModalOpen(false)} 
                  className="flex-1 px-6 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={eventLoading} 
                  className="flex-1 px-6 py-4 bg-primary text-white rounded-2xl font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 transition-all"
                >
                  {eventLoading ? 'Saving...' : 'Save Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

