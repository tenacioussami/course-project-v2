import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
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
    if (status === 403) {
      console.warn('Forbidden:', message);
    }
    if (status === 404) {
      console.warn('Not found:', message);
    }
    if (status === 500) {
      console.error('Server error:', message);
    }
    return Promise.reject(err);
  }
);

export default api;
