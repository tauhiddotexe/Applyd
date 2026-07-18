import { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { notificationsAPI } from '../services/api';
import { FadeIn, StaggerContainer, StaggerItem } from '../components/ui/MotionDiv';
import { ListSkeleton } from '../components/ui/Skeleton';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inAppEnabled, setInAppEnabled] = useState(true);
  const reduce = useReducedMotion();

  useEffect(() => { fetchNotifications(); }, []);

  const fetchNotifications = async () => {
    try {
      const data = await notificationsAPI.list();
      setNotifications(Array.isArray(data) ? data : []);
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
      case 'interview': return 'text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10';
      case 'follow_up': return 'text-blue-600 bg-blue-50 dark:bg-blue-500/10';
      case 'task': return 'text-amber-600 bg-amber-50 dark:bg-amber-500/10';
      default: return 'text-slate-600 bg-slate-50 dark:bg-slate-500/10';
    }
  };

  if (loading) return (
    <div className="p-4 md:p-8 lg:p-10 max-w-[800px] mx-auto">
      <div className="mb-8">
        <div className="h-10 w-48 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse mb-2" />
        <div className="h-5 w-64 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
      </div>
      <ListSkeleton count={4} />
    </div>
  );

  return (
    <div className="max-w-[800px] mx-auto p-4 md:p-8 lg:p-10">
      <FadeIn>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Notifications</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Stay updated on your job application journey.</p>
          </div>
          <motion.div
            className="flex items-center gap-4 px-4 md:px-5 py-2.5 bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] rounded-2xl card-shadow shrink-0"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
          >
            <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.12em]">In-App Alerts</span>
            <motion.button
              onClick={() => setInAppEnabled(!inAppEnabled)}
              whileTap={{ scale: 0.95 }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${inAppEnabled ? 'bg-primary' : 'bg-slate-200 dark:bg-white/[0.08]'}`}
            >
              <motion.span
                layout
                className="block h-4 w-4 rounded-full bg-white shadow-md"
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                style={{ marginLeft: inAppEnabled ? '1.5rem' : '0.25rem' }}
              />
            </motion.button>
          </motion.div>
        </div>
      </FadeIn>

      <div className="space-y-3 md:space-y-4">
        {notifications.length > 0 ? (
          <StaggerContainer>
            {notifications.map((n) => (
              <StaggerItem key={n.id}>
                <motion.div
                  className="group bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] p-5 md:p-6 rounded-[24px] card-shadow hover:shadow-lg transition-all flex gap-4 md:gap-5 cursor-pointer"
                  whileHover={reduce ? undefined : { y: -2, x: 2 }}
                >
                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${getColor(n.type)}`}>
                    <span className="material-symbols-outlined">{getIcon(n.type)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors capitalize">{n.type?.replace('_', ' ')}</h3>
                      <span className="text-[10px] md:text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap shrink-0">
                        {new Date(n.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed">{n.message}</p>
                  </div>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16 md:py-24 px-8 border-2 border-dashed border-slate-200 dark:border-white/[0.06] rounded-[40px] bg-slate-50/50 dark:bg-white/[0.02]"
          >
            <div className="h-20 w-20 md:h-24 md:w-24 bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-[32px] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-slate-200/50 dark:shadow-none">
              <span className="material-symbols-outlined text-slate-400 dark:text-slate-500 text-4xl md:text-5xl">notifications_off</span>
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">All caught up!</h3>
            <p className="text-slate-500 dark:text-slate-400 font-medium max-w-[280px] mx-auto leading-relaxed">You don't have any new notifications or reminders at the moment.</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
