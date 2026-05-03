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
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Notifications</h1>
          <p className="text-slate-500 dark:text-slate-400">Stay updated on your job application journey.</p>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">In-App</span>
          <button 
            onClick={() => setInAppEnabled(!inAppEnabled)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${inAppEnabled ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}`}
          >
            <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${inAppEnabled ? 'translate-x-5' : 'translate-x-1'}`} />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {notifications.length > 0 ? (
          notifications.map((n) => (
            <div 
              key={n.id} 
              className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all flex gap-4 cursor-pointer"
            >
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${getColor(n.type)}`}>
                <span className="material-symbols-outlined">{getIcon(n.type)}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between mb-1">
                  <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">{n.title}</h3>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{new Date(n.date).toLocaleDateString()}</span>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{n.message}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20 px-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-slate-50/50 dark:bg-slate-900/30">
            <div className="h-20 w-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-slate-400 text-4xl">notifications_off</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">All caught up!</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto">You don't have any new notifications or reminders at the moment.</p>
          </div>
        )}
      </div>
    </div>
  );
}
