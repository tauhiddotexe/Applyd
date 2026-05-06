const API_BASE = 'http://localhost:8000/api/v1';

function getHeaders() {
  const token = localStorage.getItem('applyd_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function request(endpoint, options = {}) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: { ...getHeaders(), ...options.headers },
    });
    if (res.status === 401) {
      localStorage.removeItem('applyd_token');
      window.location.href = '/login';
      return null;
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || `Request failed: ${res.status}`);
    }
    if (res.status === 204) return null;
    return res.json();
  } catch (error) {
    console.error(`[API] ${options.method || 'GET'} ${endpoint} failed:`, error);
    throw error;
  }
}

// Auth
export const authAPI = {
  login: (email, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  signup: (data) =>
    request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  me: () => request('/auth/me'),
};

// Applications
export const applicationsAPI = {
  list: (params = '') => request(`/applications${params ? '?' + params : ''}`),
  get: (id) => request(`/applications/${id}`),
  create: (data) =>
    request('/applications', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id, data) =>
    request(`/applications/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id) =>
    request(`/applications/${id}`, { method: 'DELETE' }),
};

// Job extraction
export const jobsAPI = {
  extract: (url) =>
    request('/jobs/extract', {
      method: 'POST',
      body: JSON.stringify({ url }),
    }),
};

// Resume analysis
export const resumeAPI = {
  analyze: (data) =>
    request('/analyze', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// Dashboard/Analytics
export const analyticsAPI = {
  dashboard: () => request('/dashboard'),
  analytics: () => request('/analytics'),
};
