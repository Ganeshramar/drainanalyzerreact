import axios from 'axios';

const VITE_API_URL='https://drain-analyzer-be.onrender.com/api';
const API_URL = VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,  // Send HTTP-only cookies
  headers: { 'Content-Type': 'application/json' },
});

// Attach token from localStorage as fallback (for cross-domain on Render/Vercel)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('drain_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('drain_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
