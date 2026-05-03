import { useState, useEffect } from 'react';
import { userAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Settings() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [settings, setSettings] = useState({ notifications: true });
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
      <div className="mb-xl">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Account Settings</h1>
        <p className="text-slate-500 dark:text-slate-400">Manage your account preferences and security options.</p>
      </div>

      <div className="space-y-6">
        {/* Notification Preferences */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
            <span className="material-symbols-outlined text-blue-600">notifications</span>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Notification Preferences</h2>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">Email Notifications</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Receive updates about your applications and reminders.</p>
              </div>
              <button 
                onClick={handleToggleNotifications}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${settings.notifications ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.notifications ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
        </section>

        {/* Account Security */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
            <span className="material-symbols-outlined text-blue-600">shield</span>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Account & Security</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-slate-400">password</span>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Change Password</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Update your account password</p>
                </div>
              </div>
              <button className="text-xs font-bold text-blue-600 hover:underline">Update</button>
            </div>
          </div>
        </section>

        {/* Danger Zone */}
        <section className="bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/30 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-red-50 dark:border-red-900/20 bg-red-50/30 dark:bg-red-900/10 flex items-center gap-3">
            <span className="material-symbols-outlined text-red-600">warning</span>
            <h2 className="text-lg font-bold text-red-700 dark:text-red-500">Danger Zone</h2>
          </div>
          <div className="p-6">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Once you delete your account, there is no going back. Please be certain.</p>
            {!showDeleteConfirm ? (
              <button 
                onClick={() => setShowDeleteConfirm(true)}
                className="px-6 py-2.5 border border-red-200 text-red-600 font-bold rounded-xl hover:bg-red-50 transition-all text-sm"
              >
                Delete Account
              </button>
            ) : (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                <p className="text-sm font-bold text-red-600">Are you absolutely sure?</p>
                <div className="flex gap-3">
                  <button 
                    onClick={handleDeleteAccount}
                    disabled={saving}
                    className="px-6 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all text-sm shadow-lg shadow-red-600/20"
                  >
                    {saving ? 'Deleting...' : 'Yes, Delete Permanently'}
                  </button>
                  <button 
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-6 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 transition-all text-sm"
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
