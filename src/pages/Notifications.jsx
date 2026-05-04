import { useState, useEffect } from 'react';
import { userAPI, analyticsAPI } from '../services/api';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inAppEnabled, setInAppEnabled] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const data = await analyticsAPI.reminders();
      // Transforming reminders into a notification-like structure
      const transformed = data.map(n => ({
        id: n.id,
        title: n.title,
        message: n.message,
        type: n.type, // 'follow_up', 'interview', 'task'
        date: n.date,
        isRead: false
      }));
      setNotifications(transformed);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'interview': return 'event';
      case 'follow_up': return 'rebase_edit';
      case 'task': return 'assignment';
      default: return 'notifications';
    }
  };

  const getColor = (type) => {
    switch (type) {
      case 'interview': return 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20';
      case 'follow_up': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
      case 'task': return 'text-amber-600 bg-amber-50 dark:bg-amber-900/20';
      default: return 'text-slate-600 bg-slate-50 dark:bg-slate-900/20';
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <span className="material-symbols-outlined text-primary animate-spin text-4xl">progress_activity</span>
    </div>
  );

  return (
    <div className="max-w-[800px] mx-auto p-xl">
      <div className="flex items-center justify-between mb-xl">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-slate-50 tracking-tight mb-2">Notifications</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Stay updated on your job application journey.</p>
        </div>
        <div className="flex items-center gap-4 px-5 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm">
          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">In-App Alerts</span>
          <button 
            onClick={() => setInAppEnabled(!inAppEnabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${inAppEnabled ? 'bg-primary' : 'bg-slate-200 dark:bg-white/10'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${inAppEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {notifications.length > 0 ? (
          notifications.map((n) => (
            <div 
              key={n.id} 
              className="group bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-6 rounded-[24px] shadow-sm hover:shadow-xl hover:scale-[1.01] transition-all flex gap-5 cursor-pointer"
            >
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${getColor(n.type)}`}>
                <span className="material-symbols-outlined">{getIcon(n.type)}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-slate-900 dark:text-slate-50 group-hover:text-primary transition-colors">{n.title}</h3>
                  <span className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{new Date(n.date).toLocaleDateString()}</span>
                </div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed">{n.message}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-24 px-8 border-2 border-dashed border-slate-200 dark:border-white/5 rounded-[40px] bg-slate-50/50 dark:bg-white/2">
            <div className="h-24 w-24 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[32px] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-slate-200/50 dark:shadow-none">
              <span className="material-symbols-outlined text-slate-400 dark:text-slate-500 text-5xl">notifications_off</span>
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-slate-50 mb-3 tracking-tight">All caught up!</h3>
            <p className="text-slate-500 dark:text-slate-400 font-medium max-w-[280px] mx-auto leading-relaxed">You don't have any new notifications or reminders at the moment.</p>
          </div>
        )}
      </div>
    </div>
  );
}
