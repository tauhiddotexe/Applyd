import { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { userAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getTheme, setTheme } from '../utils/theme';
import { toast } from 'react-hot-toast';
import { FadeIn, StaggerContainer, StaggerItem } from '../components/ui/MotionDiv';

export default function Settings() {
  const { logout, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [settings, setSettings] = useState({ notifications: true });
  const [theme, setAppTheme] = useState(getTheme());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    try {
      const data = await userAPI.getProfile();
      setSettings(data.settings || { notifications: true });
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setAppTheme(newTheme);
    setTheme(newTheme);
  };

  const handleToggleNotifications = async () => {
    const newSettings = { ...settings, notifications: !settings.notifications };
    setSettings(newSettings);
    try {
      await userAPI.updateProfile({ settings: newSettings });
      await refreshProfile();
    } catch (err) { console.error('Failed to update settings:', err); }
  };

  const handleDeleteAccount = async () => {
    setSaving(true);
    try {
      await userAPI.deleteAccount();
      await logout();
      navigate('/login');
    } catch (err) {
      toast.error(err.message || 'Failed to delete account');
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <span className="material-symbols-outlined text-primary animate-spin text-4xl">progress_activity</span>
    </div>
  );

  return (
    <div className="max-w-[800px] mx-auto p-4 md:p-8 lg:p-10">
      <FadeIn>
        <div className="mb-8 md:mb-10">
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Account Settings</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Manage your account preferences and security options.</p>
        </div>
      </FadeIn>

      <StaggerContainer className="space-y-5 md:space-y-6">
        <StaggerItem>
          <motion.div
            className="group bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] rounded-[32px] card-shadow hover:shadow-lg transition-all overflow-hidden"
            whileHover={{ y: -1 }}
          >
            <div className="p-5 md:p-6 border-b border-slate-100 dark:border-white/[0.04] flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">palette</span>
              <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Appearance</h2>
            </div>
            <div className="p-5 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-black text-slate-900 dark:text-white">Dark Mode</p>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Toggle between light and dark themes.</p>
                </div>
                <motion.button
                  onClick={handleToggleTheme}
                  whileTap={{ scale: 0.95 }}
                  className={`relative inline-flex h-7 w-14 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/20 ${theme === 'dark' ? 'bg-primary' : 'bg-slate-200 dark:bg-white/[0.08]'}`}
                >
                  <motion.div
                    layout
                    className="flex items-center justify-center h-5 w-5 transform rounded-full bg-white shadow-md"
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    style={{ marginLeft: theme === 'dark' ? '2rem' : '0.25rem' }}
                  >
                    <span className={`material-symbols-outlined text-[14px] ${theme === 'dark' ? 'text-primary' : 'text-slate-400'}`}>
                      {theme === 'dark' ? 'dark_mode' : 'light_mode'}
                    </span>
                  </motion.div>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </StaggerItem>

        <StaggerItem>
          <motion.div
            className="bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] rounded-[32px] card-shadow hover:shadow-lg transition-all overflow-hidden"
            whileHover={{ y: -1 }}
          >
            <div className="p-5 md:p-6 border-b border-slate-100 dark:border-white/[0.04] flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">notifications</span>
              <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Notification Preferences</h2>
            </div>
            <div className="p-5 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-black text-slate-900 dark:text-white">Email Notifications</p>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Receive updates about your applications and reminders.</p>
                </div>
                <motion.button
                  onClick={handleToggleNotifications}
                  whileTap={{ scale: 0.95 }}
                  className={`relative inline-flex h-7 w-14 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/20 ${settings.notifications ? 'bg-primary' : 'bg-slate-200 dark:bg-white/[0.08]'}`}
                >
                  <motion.div
                    layout
                    className="h-5 w-5 transform rounded-full bg-white shadow-md"
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    style={{ marginLeft: settings.notifications ? '2rem' : '0.25rem' }}
                  />
                </motion.button>
              </div>
            </div>
          </motion.div>
        </StaggerItem>

        <StaggerItem>
          <motion.div
            className="bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] rounded-[32px] card-shadow hover:shadow-lg transition-all overflow-hidden"
            whileHover={{ y: -1 }}
          >
            <div className="p-5 md:p-6 border-b border-slate-100 dark:border-white/[0.04] flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">shield</span>
              <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Account & Security</h2>
            </div>
            <div className="p-5 md:p-6 space-y-4">
              <div className="flex items-center justify-between p-4 md:p-5 bg-slate-50 dark:bg-white/[0.02] rounded-2xl border border-slate-100 dark:border-white/[0.05]">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-slate-400">password</span>
                  <div>
                    <p className="text-sm font-black text-slate-900 dark:text-white">Change Password</p>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.1em]">Update your account password</p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="text-sm font-black text-primary hover:underline px-4 shrink-0"
                >
                  Update
                </motion.button>
              </div>
            </div>
          </motion.div>
        </StaggerItem>

        <StaggerItem>
          <motion.div
            className="bg-white dark:bg-white/[0.04] border border-red-100 dark:border-red-900/30 rounded-[32px] card-shadow overflow-hidden"
            whileHover={{ y: -1 }}
          >
            <div className="p-5 md:p-6 border-b border-red-50 dark:border-red-900/20 bg-red-50/30 dark:bg-red-900/10 flex items-center gap-3">
              <span className="material-symbols-outlined text-red-600 dark:text-red-400">warning</span>
              <h2 className="text-lg font-black text-red-700 dark:text-red-400 tracking-tight">Danger Zone</h2>
            </div>
            <div className="p-5 md:p-6">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-6">Once you delete your account, there is no going back. Please be certain.</p>
              {!showDeleteConfirm ? (
                <motion.button
                  onClick={() => setShowDeleteConfirm(true)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-6 md:px-8 py-3 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 font-black rounded-2xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all text-sm"
                >
                  Delete Account
                </motion.button>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <p className="text-sm font-black text-red-600 dark:text-red-400">Are you absolutely sure?</p>
                  <div className="flex gap-3 md:gap-4">
                    <motion.button
                      onClick={handleDeleteAccount}
                      disabled={saving}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="px-6 md:px-8 py-3 bg-red-600 text-white font-black rounded-2xl transition-all text-sm shadow-xl shadow-red-600/20 disabled:opacity-50"
                    >
                      {saving ? 'Deleting...' : 'Yes, Delete Permanently'}
                    </motion.button>
                    <motion.button
                      onClick={() => setShowDeleteConfirm(false)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="px-6 md:px-8 py-3 bg-slate-100 dark:bg-white/[0.05] text-slate-600 dark:text-slate-300 font-black rounded-2xl hover:bg-slate-200 dark:hover:bg-white/[0.08] transition-all text-sm"
                    >
                      Cancel
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </StaggerItem>
      </StaggerContainer>
    </div>
  );
}
