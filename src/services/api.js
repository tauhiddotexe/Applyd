import { supabase } from './supabase';

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1';
export const API_ROOT = API_BASE.replace('/api/v1', ''); // For static file access


let sessionPromise = null;
let refreshPromise = null;

export async function getSafeSession() {
  if (!sessionPromise) {
    sessionPromise = supabase.auth.getSession().finally(() => {
      sessionPromise = null;
    });
  }
  return sessionPromise;
}

function decodeJwt(token) {
  try { return JSON.parse(atob(token.split('.')[1])); }
  catch { return {}; }
}

function isExpired(token, buffer = 30) {
  const { exp } = decodeJwt(token);
  if (!exp) return true;
  return Date.now() >= (exp - buffer) * 1000;
}

async function doRefresh() {
  if (!refreshPromise) {
    refreshPromise = supabase.auth.refreshSession().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

// 1. Single helper to get a valid token (waits for refresh, reads once, refreshes if needed)
async function getValidToken() {
  if (refreshPromise) {
    try { await refreshPromise; } catch {}
  }

  const { data } = await getSafeSession();
  let token = data?.session?.access_token;

  if (!token) return null;

  if (isExpired(token)) {
    const { data: rd, error: re } = await doRefresh();
    if (re || !rd?.session?.access_token) return null;
    
    // IMPORTANT: use refreshed token DIRECTLY
    token = rd.session.access_token;
  }

  return token;
}

function buildHeaders(token) {
  const h = { 'Content-Type': 'application/json' };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

function rawFetch(endpoint, opts, token) {
  const headers = buildHeaders(token);
  if (opts?.body instanceof FormData) delete headers['Content-Type'];
  
  const url = `${API_BASE}${endpoint}`;
  return fetch(url, {
    ...opts,
    headers: { ...headers, ...(opts?.headers || {}) },
  });
}

// 3. Stop using hard sign-out for recoverable failures
async function request(endpoint, opts = {}) {
  let token = await getValidToken();

  if (!token) {
    throw new Error('No valid session'); // Let UI/ProtectedRoute handle redirect, no hard signOut
  }

  let res;
  try {
    res = await rawFetch(endpoint, opts, token);
  } catch (err) {
    if (err.message.includes('Failed to fetch') || err.message.includes('ERR_CONNECTION_REFUSED')) {
      throw new Error(`Backend unreachable: Ensure the FastAPI server is running at ${API_BASE}. (${err.message})`);
    }
    throw new Error(`Connection failed: ${err.message}`);
  }

  if (res.status === 401) {
    const { data: rd, error: re } = await doRefresh();
    if (re || !rd?.session?.access_token) {
      await supabase.auth.signOut(); // Hard signout ONLY on confirmed unrecoverable failure
      throw new Error('Session expired');
    }
    
    token = rd.session.access_token;
    try {
      res = await rawFetch(endpoint, opts, token);
    } catch (err) {
      throw new Error(`Connection failed during retry: ${err.message}`);
    }
    
    if (res.status === 401) {
      await supabase.auth.signOut(); // Hard signout ONLY on second failed try
      throw new Error('Session expired');
    }
  }

  if (!res.ok) {
    const errData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errData.detail || `Request failed: ${res.status}`);
  }
  
  if (res.status === 204) return null;
  return res.json();
}

export const applicationsAPI = {
  list: (params = '') => request(`/applications${params ? `?${params}` : ''}`),
  get: (id) => request(`/applications/${id}`),
  create: (d) => request('/applications', { method: 'POST', body: JSON.stringify(d) }),
  update: (id, d) => request(`/applications/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  delete: (id) => request(`/applications/${id}`, { method: 'DELETE' }),
  listEvents: (id) => request(`/applications/${id}/events`),
  createEvent: (id, d) => request(`/applications/${id}/events`, { method: 'POST', body: JSON.stringify(d) }),
  deleteEvent: (eid) => request(`/events/${eid}`, { method: 'DELETE' }),
  uploadDocument: (id, file) => {
    const fd = new FormData(); fd.append('file', file);
    return request(`/applications/${id}/documents`, { method: 'POST', body: fd });
  },
};

export const jobsAPI = {
  extract: (url) => request('/jobs/extract', { method: 'POST', body: JSON.stringify({ url }) }),
};

let lastAIRequestTime = 0;
const AI_COOLDOWN_MS = 6000; // 6s frontend cooldown to be safe

export const resumeAPI = {
  extractResume: (file) => {
    const fd = new FormData(); fd.append('file', file);
    return request('/ai/extract-resume', { method: 'POST', body: fd });
  },
  analyzeResume: async (file, jd) => {
    const now = Date.now();
    if (now - lastAIRequestTime < AI_COOLDOWN_MS) {
      const wait = Math.ceil((AI_COOLDOWN_MS - (now - lastAIRequestTime)) / 1000);
      throw new Error(`AI Cooldown: Please wait ${wait}s before another request.`);
    }
    lastAIRequestTime = now;
    const fd = new FormData();
    fd.append('resume_file', file);
    fd.append('job_description', jd);
    return request('/ai/analyze', { method: 'POST', body: fd });
  },
  tailorResume: async (file, jd) => {
    const now = Date.now();
    if (now - lastAIRequestTime < AI_COOLDOWN_MS) {
      const wait = Math.ceil((AI_COOLDOWN_MS - (now - lastAIRequestTime)) / 1000);
      throw new Error(`AI Cooldown: Please wait ${wait}s before another request.`);
    }
    lastAIRequestTime = now;
    const fd = new FormData();
    fd.append('resume_file', file);
    fd.append('job_description', jd);
    return request('/ai/resume-tailor', { method: 'POST', body: fd });
  },
  optimize: async (file, jd) => {
    const now = Date.now();
    if (now - lastAIRequestTime < AI_COOLDOWN_MS) {
      const wait = Math.ceil((AI_COOLDOWN_MS - (now - lastAIRequestTime)) / 1000);
      throw new Error(`AI Cooldown: Please wait ${wait}s before another request.`);
    }
    lastAIRequestTime = now;
    const fd = new FormData();
    fd.append('resume_file', file);
    fd.append('job_description', jd);
    return request('/ai/optimize', { method: 'POST', body: fd });
  },
  score: (file, jd) => {
    // Note: score uses local model, no Gemini, so no cooldown needed
    const fd = new FormData(); fd.append('resume_file', file); fd.append('job_description', jd);
    return request('/ai/resume-score', { method: 'POST', body: fd });
  },
};

export const analyticsAPI = {
  dashboard: () => request('/dashboard'),
  analytics: () => request('/analytics'),
  reminders: () => request('/reminders'),
};

export const userAPI = {
  getProfile: () => request('/users/profile'),
  updateProfile: (d) => request('/users/profile', { method: 'PUT', body: JSON.stringify(d) }),
  deleteAccount: () => request('/users/account', { method: 'DELETE' }),
  getNotifications: () => request('/reminders'), // Reusing reminders as notifications
};

export const paymentsAPI = {
  createCheckoutSession: (planType) => request(`/payments/create-checkout-session?plan_type=${planType}`, { method: 'POST' }),
};
