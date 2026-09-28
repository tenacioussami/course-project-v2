import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 60_000, // Render free tier can take ~30-50s to wake from sleep
});

// ── Global activity tracker (drives the thin progress bar at the top) ──
let active = 0;
const listeners = new Set();
const emit = () => listeners.forEach((fn) => fn(active));
export const onActivity = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
const done = () => {
  active = Math.max(0, active - 1);
  emit();
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  active += 1;
  emit();
  return config;
});

api.interceptors.response.use(
  (res) => {
    done();
    return res;
  },
  (err) => {
    done();
    const status = err.response?.status;
    const message = err.response?.data?.message || err.message;

    if (status === 401) {
      // token invalid/expired
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    if (status >= 500) console.error('Server error:', message);
    return Promise.reject(err);
  }
);

/**
 * Render's free tier puts the backend to sleep after inactivity.
 * Poke it the moment the site opens so it's awake by the time the user clicks.
 */
export const warmUp = () => {
  api.get('/health', { timeout: 60_000 }).catch(() => {});
};

export const errMsg = (err, fallback = 'Something went wrong') =>
  err?.response?.data?.message || err?.message || fallback;

export default api;
