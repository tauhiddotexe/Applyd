import { useState, useEffect } from 'react';
import { userAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const AVATAR_OPTIONS = [
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Buster',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Toby',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=George',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Aneka',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Abby',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Sasha',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Luna',
];

export default function Profile() {
  const { user, refreshProfile } = useAuth();
  const [profile, setProfile] = useState({ full_name: '', email: '', role: '', avatar_url: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const data = await userAPI.getProfile();
      setProfile({
        full_name: data.full_name || '',
        email: data.email || '',
        role: data.role || '',
        avatar_url: data.avatar_url || ''
      });
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await userAPI.updateProfile(profile);
      await refreshProfile();
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to update profile' });
    } finally {
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
        <h1 className="text-3xl font-black text-slate-900 dark:text-slate-50 tracking-tight mb-2">My Profile</h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium">Manage your personal information and application preferences.</p>
      </div>

      <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[32px] shadow-2xl shadow-slate-200/50 dark:shadow-none overflow-hidden">
        <div className="p-8 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/2 flex items-center gap-6">
          <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center border border-slate-200 dark:border-white/10 overflow-hidden shadow-xl shadow-primary/10">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl font-black text-primary">
                {profile.full_name ? profile.full_name[0].toUpperCase() : user?.email[0].toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-slate-50">{profile.full_name || 'Set your name'}</h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium">{profile.email}</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="p-8 space-y-8">
          {message && (
            <div className={`p-4 rounded-2xl flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-900/30'}`}>
              <span className="material-symbols-outlined">{message.type === 'success' ? 'check_circle' : 'error'}</span>
              <p className="text-sm font-bold">{message.text}</p>
            </div>
          )}

          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 block">Choose Your Avatar</label>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-4">
              {AVATAR_OPTIONS.map((url) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => setProfile(prev => ({ ...prev, avatar_url: url }))}
                  className={`relative group h-14 w-14 rounded-xl border-2 transition-all overflow-hidden ${
                    profile.avatar_url === url 
                      ? 'border-primary bg-primary/5 scale-110 shadow-lg shadow-primary/10' 
                      : 'border-transparent bg-slate-50 dark:bg-white/5 hover:border-slate-200 dark:hover:border-white/20'
                  }`}
                >
                  <img src={url} alt="Avatar option" className="w-full h-full object-cover p-1" />
                  {profile.avatar_url === url && (
                    <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary text-[16px] font-bold">check</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 block">Full Name</label>
              <input 
                className="w-full px-5 py-4 bg-slate-50 dark:bg-white/5 border border-transparent dark:border-white/5 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-bold text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                value={profile.full_name}
                onChange={(e) => setProfile(prev => ({ ...prev, full_name: e.target.value }))}
                placeholder="e.g. John Doe"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 block">Email Address</label>
              <input 
                className="w-full px-5 py-4 bg-slate-50 dark:bg-white/5 border border-transparent dark:border-white/5 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-bold text-slate-900 dark:text-slate-100 opacity-60 cursor-not-allowed"
                value={profile.email}
                disabled
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 block">Target Role / Field</label>
              <input 
                className="w-full px-5 py-4 bg-slate-50 dark:bg-white/5 border border-transparent dark:border-white/5 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-bold text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                value={profile.role}
                onChange={(e) => setProfile(prev => ({ ...prev, role: e.target.value }))}
                placeholder="e.g. Senior Software Engineer"
              />
            </div>
          </div>

          <div className="flex justify-end pt-6">
            <button 
              type="submit" 
              disabled={saving}
              className="px-10 py-3 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
