import axios from 'axios';

// En producción (Netlify) usar VITE_API_URL; en desarrollo local usar VITE_API_LOCAL.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? import.meta.env.VITE_API_LOCAL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;