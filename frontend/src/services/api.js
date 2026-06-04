import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

// Empty base => same-origin "/api" (Vite proxy in dev, nginx in prod).
const BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({ baseURL: BASE, timeout: 15000 });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!window.location.pathname.startsWith('/login')) window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

/* ---------- auth helpers ---------- */
export const auth = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  getUser: () => {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    try {
      const token = localStorage.getItem('token');
      if (token && jwtDecode(token).exp * 1000 < Date.now()) {
        auth.logout();
        return null;
      }
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },
  save: (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  },
};

export const products = {
  list: (params) => api.get('/products', { params }),
  get: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.patch(`/products/${id}`, data),
  remove: (id) => api.delete(`/products/${id}`),
};

export const orders = {
  create: (data) => api.post('/orders', data),
  my: () => api.get('/orders/my'),
  setStatus: (id, status) => api.patch(`/orders/${id}/status`, { status }),
  setPayment: (id, paymentStatus) => api.patch(`/orders/${id}/payment`, { paymentStatus }),
};

export const admin = {
  stats: () => api.get('/admin/stats'),
  analytics: () => api.get('/admin/analytics'),
  orders: () => api.get('/admin/orders'),
  customers: () => api.get('/admin/customers'),
};

export const staff = {
  list: () => api.get('/users'),
  create: (data) => api.post('/users', data),
  setRole: (id, role) => api.patch(`/users/${id}/role`, { role }),
  remove: (id) => api.delete(`/users/${id}`),
};

export default api;
