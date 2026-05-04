import { useState, useEffect } from 'react';
import { userAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getTheme, setTheme } from '../utils/theme';

export default function Settings() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [settings, setSettings] = useState({ notifications: true });
  const [theme, setAppTheme] = useState(getTheme());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

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
    } catch (err) {
      console.error('Failed to update settings:', err);
    }
  };

  const handleDeleteAccount = async () => {
    setSaving(true);
    try {
      await userAPI.deleteAccount();
      await logout();
      navigate('/login');
    } catch (err) {
      alert(err.message || 'Failed to delete account');
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <span className="material-symbols-outlined text-primary animate-spin text-4xl">progress_activity</span>
    </div>
  );

  return (
    <div className="max-w-[800px] mx-auto p-xl">
      <div className="mb-10">
        <h1 className="text-3xl font-black text-slate-900 dark:text-slate-50 tracking-tight mb-2">Account Settings</h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium">Manage your account preferences and security options.</p>
      </div>

      <div className="space-y-6">
        {/* Appearance / Theme Settings */}
        <section className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[32px] shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">palette</span>
            <h2 className="text-lg font-black text-slate-900 dark:text-slate-50 tracking-tight">Appearance</h2>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-black text-slate-900 dark:text-slate-50">Dark Mode</p>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Toggle between light and dark themes.</p>
              </div>
              <button 
                onClick={handleToggleTheme}
                className={`relative inline-flex h-7 w-14 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/20 ${theme === 'dark' ? 'bg-primary' : 'bg-slate-200 dark:bg-white/10'}`}
              >
                <div className={`absolute left-1 flex items-center justify-center h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${theme === 'dark' ? 'translate-x-7' : 'translate-x-0'}`}>
                  <span className={`material-symbols-outlined text-[14px] ${theme === 'dark' ? 'text-primary' : 'text-slate-400'}`}>
                    {theme === 'dark' ? 'dark_mode' : 'light_mode'}
                  </span>
                </div>
              </button>
            </div>
          </div>
        </section>
        {/* Notification Preferences */}
        <section className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[32px] shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">notifications</span>
            <h2 className="text-lg font-black text-slate-900 dark:text-slate-50 tracking-tight">Notification Preferences</h2>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-black text-slate-900 dark:text-slate-50">Email Notifications</p>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Receive updates about your applications and reminders.</p>
              </div>
              <button 
                onClick={handleToggleNotifications}
                className={`relative inline-flex h-7 w-14 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/20 ${settings.notifications ? 'bg-primary' : 'bg-slate-200 dark:bg-white/10'}`}
              >
                <div className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${settings.notifications ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
        </section>

        {/* Account Security */}
        <section className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[32px] shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">shield</span>
            <h2 className="text-lg font-black text-slate-900 dark:text-slate-50 tracking-tight">Account & Security</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between p-5 bg-slate-50 dark:bg-white/2 rounded-2xl border border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-slate-400">password</span>
                <div>
                  <p className="text-sm font-black text-slate-900 dark:text-slate-100">Change Password</p>
                  <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Update your account password</p>
                </div>
              </div>
              <button className="text-sm font-black text-primary hover:underline px-4">Update</button>
            </div>
          </div>
        </section>

        {/* Danger Zone */}
        <section className="bg-white dark:bg-white/5 border border-red-100 dark:border-red-900/30 rounded-[32px] shadow-sm overflow-hidden">
          <div className="p-6 border-b border-red-50 dark:border-red-900/20 bg-red-50/30 dark:bg-red-900/10 flex items-center gap-3">
            <span className="material-symbols-outlined text-red-600">warning</span>
            <h2 className="text-lg font-black text-red-700 dark:text-red-500 tracking-tight">Danger Zone</h2>
          </div>
          <div className="p-6">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-6">Once you delete your account, there is no going back. Please be certain.</p>
            {!showDeleteConfirm ? (
              <button 
                onClick={() => setShowDeleteConfirm(true)}
                className="px-8 py-3 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 font-black rounded-2xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all text-sm"
              >
                Delete Account
              </button>
            ) : (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                <p className="text-sm font-black text-red-600">Are you absolutely sure?</p>
                <div className="flex gap-4">
                  <button 
                    onClick={handleDeleteAccount}
                    disabled={saving}
                    className="px-8 py-3 bg-red-600 text-white font-black rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all text-sm shadow-xl shadow-red-600/20"
                  >
                    {saving ? 'Deleting...' : 'Yes, Delete Permanently'}
                  </button>
                  <button 
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-8 py-3 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 font-black rounded-2xl hover:bg-slate-200 dark:hover:bg-white/10 transition-all text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
