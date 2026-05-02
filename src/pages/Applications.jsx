import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { applicationsAPI } from '../services/api';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'applied', label: 'Applied' },
  { value: 'interviewing', label: 'Interviewing' },
  { value: 'offer', label: 'Offer' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'wishlist', label: 'Wishlist' },
];
const STATUS_LABELS = { applied: 'Applied', interviewing: 'Interviewing', offer: 'Offer', rejected: 'Rejected', wishlist: 'Wishlist' };
const STATUS_COLORS = {
  applied: 'bg-blue-100 text-blue-800',
  interviewing: 'bg-secondary-fixed text-on-secondary-fixed-variant',
  offer: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-800',
  wishlist: 'bg-amber-100 text-amber-800',
};

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function Applications() {
  const nav = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id;
  const [apps, setApps] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [sort, setSort] = useState('newest');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="material-symbols-outlined text-primary animate-spin text-4xl">progress_activity</span>
      </div>
    );
  }

  const fetchApps = async () => {
    if (authLoading || !userId) return;

    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (statusFilter) params.set('status', statusFilter);
    if (sort) params.set('sort', sort);

    setLoading(true);
    setError(null);
    try {
      const data = await applicationsAPI.list(params.toString());
      setApps(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchApps();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [authLoading, search, userId, sort, statusFilter]);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!confirm('Delete this application?')) return;
    try {
      await applicationsAPI.delete(id);
      setApps(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      alert(err.message || 'Delete failed');
    }
  };

  return (
    <div className="p-xl max-w-max_width mx-auto">
      <div className="flex items-end justify-between mb-xl">
        <div>
          <h2 className="font-h1 text-h1 text-on-surface mb-xs">Applications</h2>
          <p className="font-body-sm text-on-surface-variant">Manage and track all your job applications in one place.</p>
        </div>
        <button onClick={() => nav('/applications/new')} className="bg-primary text-on-primary px-lg py-2.5 rounded-lg font-semibold text-[13px] flex items-center gap-2 hover:opacity-90 transition-opacity shadow-sm">
          <span className="material-symbols-outlined text-[18px]">add</span>Add Application
        </button>
      </div>

      {/* Filters */}
      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-lg shadow-sm mb-lg">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2 border border-outline-variant rounded-lg text-sm bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all min-w-44">
              {STATUS_OPTIONS.map((option) => (
                <option key={option.label} value={option.value}>{option.label}</option>
              ))}
            </select>
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="px-4 py-2 border border-outline-variant rounded-lg text-sm bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all min-w-36">
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
          <div className="relative w-full md:w-64">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined text-[18px]">search</span>
            <input className="pl-9 pr-4 py-1.5 border border-outline-variant rounded-lg text-sm w-full bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Loading / Error */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <span className="material-symbols-outlined text-primary animate-spin text-4xl">progress_activity</span>
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-lg mb-lg flex items-center gap-3">
          <span className="material-symbols-outlined text-red-500">error</span>
          <span className="text-red-700 text-body-sm">{error}</span>
          <button onClick={fetchApps} className="ml-auto text-red-600 font-semibold text-body-sm hover:underline">Retry</button>
        </div>
      )}

      {/* Table */}
      {!loading && (
      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-outline-variant/20">
              <th className="text-left px-lg py-md font-label-caps text-label-caps text-on-surface-variant uppercase">Company</th>
              <th className="text-left px-lg py-md font-label-caps text-label-caps text-on-surface-variant uppercase hidden md:table-cell">Role</th>
              <th className="text-left px-lg py-md font-label-caps text-label-caps text-on-surface-variant uppercase">Status</th>
              <th className="text-left px-lg py-md font-label-caps text-label-caps text-on-surface-variant uppercase hidden lg:table-cell">Date</th>
              <th className="px-lg py-md"></th>
            </tr>
          </thead>
          <tbody>
            {apps.map(app => (
              <tr key={app.id} onClick={() => nav(`/applications/${app.id}`)} className="border-b border-outline-variant/10 hover:bg-surface transition-colors cursor-pointer">
                <td className="px-lg py-md">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 bg-surface-container flex items-center justify-center rounded-lg shrink-0">
                      <span className="material-symbols-outlined text-outline text-[18px]">apartment</span>
                    </div>
                    <span className="font-h3 text-[14px] text-on-surface">{app.company}</span>
                  </div>
                </td>
                <td className="px-lg py-md text-body-sm text-on-surface-variant hidden md:table-cell">{app.role}</td>
                <td className="px-lg py-md"><span className={`px-2 py-1 rounded text-[11px] font-bold uppercase tracking-wider ${STATUS_COLORS[app.status] || 'bg-slate-100 text-slate-700'}`}>{STATUS_LABELS[app.status] || app.status}</span></td>
                <td className="px-lg py-md text-body-sm text-on-surface-variant hidden lg:table-cell">{fmtDate(app.created_at)}</td>
                <td className="px-lg py-md">
                  <button onClick={(e) => handleDelete(e, app.id)} className="text-slate-400 hover:text-red-500 transition-colors" title="Delete">
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {apps.length === 0 && (
          <div className="p-xl text-center text-on-surface-variant">No applications found.</div>
        )}
      </div>
      )}
    </div>
  );
}
