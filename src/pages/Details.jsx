import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { applicationsAPI } from '../services/api';

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
  return `http://localhost:8000${path}`;
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

  return (
    <div className="max-w-[1200px] mx-auto p-xl">
      <div className="flex items-center justify-between mb-xl">
        <div className="flex items-center gap-4">
          <button onClick={() => nav(-1)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors text-slate-600">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="font-h1 text-h1 text-on-surface">{app.role}</h2>
              <span className="px-3 py-1 bg-surface-container-high text-on-surface-variant text-label-caps rounded-full">{STATUS_LABELS[app.status] || app.status}</span>
            </div>
            <p className="font-body-main text-body-main text-on-surface-variant">at <span className="font-semibold text-primary">{app.company}</span></p>
          </div>
        </div>
        <div className="flex gap-3">
          {app.link && (
            <a href={app.link} target="_blank" rel="noreferrer" className="px-lg py-2 border border-slate-200 bg-white text-on-surface font-h3 text-body-sm rounded-lg shadow-sm hover:bg-slate-50 transition-colors flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">open_in_new</span>Job Link
            </a>
          )}
          <button onClick={() => nav(`/applications/${id}/edit`)} className="px-lg py-2 bg-primary text-on-primary font-h3 text-body-sm rounded-lg shadow-sm hover:opacity-90 transition-all flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">edit</span>Edit
          </button>
          <button onClick={handleDelete} className="px-lg py-2 border border-red-200 text-red-600 font-h3 text-body-sm rounded-lg shadow-sm hover:bg-red-50 transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">delete</span>Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-lg">
        <div className="col-span-12 lg:col-span-8 space-y-lg">
          <section className="bg-surface-container-lowest p-xl rounded-xl border border-outline-variant shadow-[0px_4px_12px_rgba(0,0,0,0.03)]">
            <div className="flex gap-xl">
              <div className="w-24 h-24 rounded-xl bg-surface flex items-center justify-center border border-slate-100 shrink-0">
                <span className="material-symbols-outlined text-outline text-4xl">apartment</span>
              </div>
              <div className="flex-1">
                <h3 className="font-h2 text-h2 mb-2">{app.company}</h3>
                <p className="font-body-main text-on-surface-variant mb-4">{app.notes || 'No notes yet.'}</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
                  {[['LOCATION', app.location || 'Not specified'], ['SALARY RANGE', formatSalary(app)], ['RECRUITER', app.recruiter || 'Not specified']].map(([label, value]) => (
                    <div key={label} className="p-md rounded-lg bg-surface">
                      <span className="text-label-caps text-on-surface-variant block mb-1">{label}</span>
                      <span className="font-h3 text-body-main">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="bg-surface-container-lowest p-xl rounded-xl border border-outline-variant shadow-[0px_4px_12px_rgba(0,0,0,0.03)]">
            <div className="flex items-center justify-between mb-lg">
              <h3 className="font-h3 text-h3 flex items-center gap-2"><span className="material-symbols-outlined text-primary">notes</span>Application Notes</h3>
            </div>
            <div className="p-md border border-slate-100 rounded-lg bg-surface/50">
              <p className="font-body-main text-body-main text-on-surface whitespace-pre-wrap">{app.notes || 'No notes yet.'}</p>
            </div>
          </section>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-lg">
          <section className="bg-surface-container-lowest p-xl rounded-xl border border-outline-variant shadow-[0px_4px_12px_rgba(0,0,0,0.03)]">
            <div className="flex items-center justify-between mb-xl">
              <h3 className="font-h3 text-h3">Journey Timeline</h3>
              <button onClick={() => setEventModalOpen(true)} className="text-primary font-h3 text-body-sm hover:underline">Add Event</button>
            </div>
            {timeline.length ? (
              <div className="relative">
                <div className="absolute left-[11px] top-2 bottom-2 w-[2px] bg-slate-100" />
                <div className="space-y-xl relative">
                  {timeline.map((event, index) => {
                    const isLast = index === timeline.length - 1;
                    return (
                      <div key={event.id} className="flex gap-4">
                        <div className={`w-6 h-6 rounded-full shrink-0 z-10 flex items-center justify-center ${isLast ? 'bg-primary border-4 border-primary-fixed' : 'bg-emerald-500 border-4 border-emerald-100'}`}>
                          <span className="material-symbols-outlined text-white text-[12px] font-bold">{isLast ? 'schedule' : 'check'}</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h4 className={`font-h3 text-body-main leading-none mb-1 ${isLast ? 'text-primary' : ''}`}>{formatEventType(event.type)}</h4>
                              <p className="text-body-sm text-on-surface-variant">{formatEventDate(event.date)}</p>
                            </div>
                            <button onClick={() => handleDeleteEvent(event.id)} className="text-slate-400 hover:text-red-500 transition-colors">
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          </div>
                          <p className="text-body-sm text-on-surface mt-2">{event.notes || 'No details provided.'}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-body-sm text-on-surface-variant p-md bg-surface rounded border border-slate-100">No timeline events yet.</div>
            )}
          </section>

          <section className="bg-surface-container-lowest p-xl rounded-xl border border-outline-variant shadow-[0px_4px_12px_rgba(0,0,0,0.03)]">
            <div className="flex items-center justify-between mb-lg">
              <h3 className="font-h3 text-h3">Documents</h3>
              <label className="text-primary font-h3 text-body-sm hover:underline cursor-pointer">
                {uploading ? 'Uploading...' : 'Upload'}
                <input type="file" className="hidden" onChange={handleUploadDocument} disabled={uploading} />
              </label>
            </div>
            {uploadError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-sm mb-md text-red-700 text-body-sm">{uploadError}</div>
            )}
            {app.documents?.length ? (
              <div className="space-y-sm">
                {app.documents.map((document) => (
                  <a key={document.id} href={fileUrl(document.fileUrl)} target="_blank" rel="noreferrer" className="flex items-center justify-between p-sm hover:bg-surface rounded-lg transition-colors border border-transparent hover:border-slate-100">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-outline">description</span>
                      <div>
                        <span className="text-body-sm font-medium block">{document.name}</span>
                        <span className="text-[11px] text-on-surface-variant">{formatEventDate(document.createdAt)}</span>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-slate-300 text-[20px]">download</span>
                  </a>
                ))}
              </div>
            ) : (
              <div className="text-body-sm text-on-surface-variant p-md bg-surface rounded border border-slate-100">No documents yet.</div>
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
