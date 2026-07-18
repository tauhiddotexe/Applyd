import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { applicationsAPI, API_ROOT } from '../services/api';
import { STATUS_COLORS, STATUS_LABELS, EVENT_STYLES } from '../constants/status';
import { FadeIn, StaggerContainer, StaggerItem } from '../components/ui/MotionDiv';
import CompanyLogo from '../components/ui/CompanyLogo';

const getEventStyle = (type) => {
  const t = type?.toLowerCase() || '';
  if (t.includes('interview')) return EVENT_STYLES.interview;
  if (t.includes('tech')) return EVENT_STYLES.technical;
  if (t.includes('hr')) return EVENT_STYLES.hr;
  if (t.includes('offer')) return EVENT_STYLES.offer;
  if (t.includes('reject')) return EVENT_STYLES.rejection;
  return EVENT_STYLES.default;
};

function formatSalary(app) {
  const { salaryMin, salaryMax, currency } = app;
  if ((!salaryMin && !salaryMax) || !currency) return 'Not specified';
  const formatter = new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 0 });
  if (salaryMin && salaryMax) return `${formatter.format(salaryMin)} - ${formatter.format(salaryMax)}`;
  if (salaryMin) return formatter.format(salaryMin);
  return formatter.format(salaryMax);
}

function formatEventDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
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
  const reduce = useReducedMotion();

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
    try { await applicationsAPI.delete(id); nav('/applications'); } catch (err) { alert(err.message || 'Delete failed'); }
  };

  const handleAddEvent = async (e) => {
    e.preventDefault();
    setEventLoading(true);
    setEventError(null);
    try {
      const event = await applicationsAPI.createEvent(id, { type: eventForm.type, date: new Date(eventForm.date).toISOString(), notes: eventForm.notes || null });
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
    <div className="max-w-4xl mx-auto p-4 md:p-10">
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-3xl p-10 text-center space-y-6">
        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center mx-auto text-red-600 dark:text-red-400">
          <span className="material-symbols-outlined text-4xl">error</span>
        </div>
        <div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white">{error || 'Application not found'}</h3>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-2">The application you're looking for doesn't exist or you don't have access.</p>
        </div>
        <button onClick={() => nav('/applications')} className="text-primary font-bold hover:underline">Back to applications</button>
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-8 lg:p-10 max-w-7xl mx-auto space-y-8 md:space-y-10">
      {/* Top Header */}
      <FadeIn>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-8 border-b border-slate-200 dark:border-white/[0.06]">
          <div className="flex items-center gap-4 md:gap-6 min-w-0">
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
              className="shrink-0"
            >
              <CompanyLogo company={app.company} link={app.link} className="h-16 w-16 md:h-20 md:w-20 rounded-3xl" size="lg" />
            </motion.div>
            <div className="min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight truncate">{app.role}</h1>
                <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${STATUS_COLORS[app.status] || 'bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300'}`}>
                  {STATUS_LABELS[app.status] || app.status}
                </span>
              </div>
              <p className="text-base md:text-xl text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                at <span className="text-slate-900 dark:text-white font-black">{app.company}</span>
                <span className="mx-2 md:mx-3 text-slate-200 dark:text-white/10 hidden sm:inline">&bull;</span>
                <span className="text-xs md:text-sm font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block sm:inline mt-1 sm:mt-0">{app.location || 'Remote'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            {app.link && (
              <a href={app.link} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 md:px-6 py-3 bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/[0.08] transition-all shrink-0">
                <span className="material-symbols-outlined text-[20px]">link</span>
                <span className="hidden sm:inline">Apply Link</span>
              </a>
            )}
            <motion.button
              onClick={() => nav(`/applications/${id}/edit`)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-4 md:px-6 py-3 bg-primary text-white rounded-2xl text-sm font-bold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">edit</span>
              <span className="hidden sm:inline">Edit</span>
            </motion.button>
            <motion.button
              onClick={handleDelete}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-3 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-2xl hover:bg-red-100 dark:hover:bg-red-500/20 transition-all"
            >
              <span className="material-symbols-outlined">delete</span>
            </motion.button>
          </div>
        </div>
      </FadeIn>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-10">
        {/* Main Content */}
        <div className="lg:col-span-8 space-y-8 md:space-y-10">
          {/* Notes */}
          <FadeIn delay={0.05}>
            <section className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <span className="material-symbols-outlined text-primary">description</span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Description & Notes</h3>
              </div>
              <div className="bg-white dark:bg-white/[0.04] p-6 md:p-8 rounded-[32px] border border-slate-200 dark:border-white/[0.06] card-shadow">
                <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed font-medium">
                  {app.notes || 'No notes provided for this application.'}
                </p>
              </div>
            </section>
          </FadeIn>

          {/* Timeline */}
          <FadeIn delay={0.1}>
            <section className="space-y-5">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-purple-600 dark:text-purple-400">route</span>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Interview Journey</h3>
                </div>
                <motion.button
                  onClick={() => setEventModalOpen(true)}
                  whileHover={{ x: 2 }}
                  className="text-sm font-bold text-primary hover:underline flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  Add Event
                </motion.button>
              </div>

              <div className="bg-white dark:bg-white/[0.04] p-6 md:p-8 rounded-[40px] border border-slate-200 dark:border-white/[0.06] card-shadow overflow-hidden">
                {timeline.length ? (
                  <div className="relative pl-8 border-l-2 border-slate-100 dark:border-white/[0.06] space-y-10">
                    {timeline.map((event, idx) => {
                      const style = getEventStyle(event.type);
                      return (
                        <motion.div
                          key={event.id}
                          initial={reduce ? undefined : { opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05, duration: 0.3 }}
                          className="relative group"
                        >
                          <motion.div
                            className={`absolute -left-[45px] top-0 w-8 h-8 rounded-xl ${style.color} text-white flex items-center justify-center shadow-lg`}
                            whileHover={{ scale: 1.15 }}
                            transition={{ type: "spring", stiffness: 300, damping: 15 }}
                          >
                            <span className="material-symbols-outlined text-[16px]">{style.icon}</span>
                          </motion.div>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-black text-slate-900 dark:text-white">{formatEventType(event.type)}</h4>
                                <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-tighter mt-1">{formatEventDate(event.date)}</p>
                              </div>
                              <button
                                onClick={() => handleDeleteEvent(event.id)}
                                className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all opacity-0 group-hover:opacity-100"
                              >
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                              </button>
                            </div>
                            {event.notes && (
                              <div className="p-4 bg-slate-50 dark:bg-white/[0.02] rounded-2xl text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed italic border-l-4 border-slate-200 dark:border-white/[0.08]">
                                {event.notes}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-16 md:py-20 text-center space-y-4">
                    <div className="w-16 h-16 bg-slate-50 dark:bg-white/[0.06] rounded-full flex items-center justify-center mx-auto">
                      <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 text-3xl">event_busy</span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">No events recorded yet.</p>
                  </div>
                )}
              </div>
            </section>
          </FadeIn>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-6 md:space-y-8">
          <FadeIn delay={0.1}>
            <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 md:p-8 rounded-[40px] text-white shadow-2xl shadow-slate-900/40 space-y-6 relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-[80px]" />
              <h3 className="text-lg font-black tracking-tight relative z-10">Quick Info</h3>
              <div className="space-y-3 relative z-10">
                {[
                  { label: 'Salary Package', value: formatSalary(app) },
                  { label: 'Recruiter / Contact', value: app.recruiter || 'Not specified' },
                  { label: 'Added On', value: new Date(app.created_at).toLocaleDateString() },
                ].map((item, idx) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + idx * 0.05 }}
                    className="p-4 bg-white/[0.06] rounded-2xl hover:bg-white/[0.08] transition-colors"
                  >
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.12em]">{item.label}</p>
                    <p className="font-black text-base md:text-lg text-white mt-0.5">{item.value}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </FadeIn>

          {/* Documents */}
          <FadeIn delay={0.15}>
            <section className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Documents</h3>
                <label className="text-sm font-bold text-primary hover:underline cursor-pointer">
                  {uploading ? 'Uploading...' : 'Upload'}
                  <input type="file" className="hidden" onChange={handleUploadDocument} disabled={uploading} />
                </label>
              </div>

              <div className="bg-white dark:bg-white/[0.04] p-5 md:p-6 rounded-[32px] border border-slate-200 dark:border-white/[0.06] card-shadow space-y-2">
                {app.documents?.length ? (
                  app.documents.map((doc, idx) => (
                    <motion.a
                      key={doc.id}
                      href={fileUrl(doc.fileUrl)}
                      target="_blank"
                      rel="noreferrer"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/[0.02] hover:bg-primary/5 dark:hover:bg-primary/10 rounded-2xl transition-all group"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <span className="material-symbols-outlined text-slate-400 dark:text-slate-500 group-hover:text-primary transition-colors">description</span>
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-slate-700 dark:text-slate-200 truncate">{doc.name}</p>
                          <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-tighter">{new Date(doc.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 group-hover:text-primary transition-colors">download</span>
                    </motion.a>
                  ))
                ) : (
                  <div className="py-8 text-center">
                    <p className="text-slate-400 dark:text-slate-500 text-sm font-medium">No documents yet.</p>
                  </div>
                )}
              </div>
            </section>
          </FadeIn>
        </div>
      </div>

      {/* Event Modal */}
      <AnimatePresence>
        {eventModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={reduce ? undefined : { opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-lg bg-white dark:bg-dark-surface rounded-[32px] shadow-2xl p-6 md:p-10 space-y-6 md:space-y-8 border border-slate-200 dark:border-white/[0.08]"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">Add Event</h3>
                <motion.button
                  onClick={() => setEventModalOpen(false)}
                  whileHover={{ rotate: 90 }}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-white/[0.06] rounded-full transition-colors"
                >
                  <span className="material-symbols-outlined dark:text-slate-400">close</span>
                </motion.button>
              </div>

              <form className="space-y-5" onSubmit={handleAddEvent}>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.12em] px-1">Event Type</label>
                  <input
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-white/[0.04] border border-transparent focus:border-primary dark:border-white/[0.06] rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold dark:text-white text-sm"
                    placeholder="e.g. Technical Interview"
                    value={eventForm.type}
                    onChange={(e) => setEventForm((prev) => ({ ...prev, type: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.12em] px-1">Date & Time</label>
                  <input
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-white/[0.04] border border-transparent focus:border-primary dark:border-white/[0.06] rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold dark:text-white text-sm"
                    type="datetime-local"
                    value={eventForm.date}
                    onChange={(e) => setEventForm((prev) => ({ ...prev, date: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.12em] px-1">Notes</label>
                  <textarea
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-white/[0.04] border border-transparent focus:border-primary dark:border-white/[0.06] rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold min-h-[100px] resize-none dark:text-white text-sm"
                    placeholder="Add any specific notes..."
                    value={eventForm.notes}
                    onChange={(e) => setEventForm((prev) => ({ ...prev, notes: e.target.value }))}
                  />
                </div>

                {eventError && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl flex items-center gap-2 text-sm font-bold">
                    <span className="material-symbols-outlined text-[18px]">error</span>
                    {eventError}
                  </div>
                )}

                <div className="flex gap-4 pt-2">
                  <button type="button" onClick={() => setEventModalOpen(false)} className="flex-1 px-6 py-4 rounded-2xl font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-all text-sm">
                    Cancel
                  </button>
                  <motion.button
                    type="submit"
                    disabled={eventLoading}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="flex-1 px-6 py-4 bg-primary text-white rounded-2xl font-black shadow-lg shadow-primary/20 disabled:opacity-50 transition-all text-sm"
                  >
                    {eventLoading ? 'Saving...' : 'Save Event'}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
