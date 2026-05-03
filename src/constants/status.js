export const STATUS_COLORS = {
  applied: 'bg-blue-100 text-blue-800',
  interviewing: 'bg-purple-100 text-purple-800',
  offer: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-800',
  wishlist: 'bg-amber-100 text-amber-800',
  default: 'bg-slate-100 text-slate-600',
};

export const STATUS_LABELS = {
  applied: 'Applied',
  interviewing: 'Interviewing',
  offer: 'Offer',
  rejected: 'Rejected',
  wishlist: 'Wishlist',
};

export const EVENT_STYLES = {
  interview: { icon: 'video_call', color: 'bg-purple-600' },
  technical: { icon: 'code', color: 'bg-blue-600' },
  hr: { icon: 'person', color: 'bg-emerald-600' },
  offer: { icon: 'emoji_events', color: 'bg-amber-500' },
  rejection: { icon: 'cancel', color: 'bg-red-500' },
  default: { icon: 'event', color: 'bg-slate-500' },
};
