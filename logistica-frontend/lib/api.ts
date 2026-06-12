import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Inject token without importing the Zustand store module-level
// (avoids circular dep and SSR issues — reads from localStorage directly)
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem('logistica-auth');
    if (raw) {
      const parsed = JSON.parse(raw);
      const token = parsed?.state?.accessToken;
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      // Only attempt refresh if the user was authenticated (has a refresh token).
      // Without this guard, failed login requests (no refresh token) would trigger
      // a redirect loop instead of letting the caller show the error.
      const raw = typeof window !== 'undefined' ? localStorage.getItem('logistica-auth') : null;
      const refresh = raw ? JSON.parse(raw)?.state?.refreshToken : null;
      if (!refresh) return Promise.reject(error);

      original._retry = true;
      try {
        const { data } = await axios.post(`${BASE_URL}/auth/token/refresh/`, {
          refresh,
        });

        // Patch the persisted store directly
        const stored = JSON.parse(localStorage.getItem('logistica-auth') || '{}');
        stored.state.accessToken = data.access;
        localStorage.setItem('logistica-auth', JSON.stringify(stored));

        original.headers.Authorization = `Bearer ${data.access}`;
        return api(original);
      } catch {
        localStorage.removeItem('logistica-auth');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export default api;
