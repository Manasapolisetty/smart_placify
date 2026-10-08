import axios from 'axios';
import { MOCK_NOTIFICATIONS } from '../data/notifications.js';

const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) || 'http://localhost:5000/api';

// Shared Axios Instance
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Bearer Tokens
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('smartplacify_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Global Error Handling
apiClient.interceptors.response.use(
  (response) => {
    const resData = response.data;
    if (resData && typeof resData === 'object' && 'data' in resData) {
      if (Array.isArray(resData.data)) {
        if (resData.pagination) {
          resData.data.pagination = resData.pagination;
        }
        return resData.data;
      }
      if (resData.data !== null && typeof resData.data === 'object') {
        return { ...resData, ...resData.data };
      }
      if (resData.data === null || resData.data === undefined) {
        return resData;
      }
      return resData.data;
    }
    return resData;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('smartplacify_token');
      localStorage.removeItem('smartplacify_user');
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    const errMessage =
      error.response?.data?.message ||
      (error.response?.data?.errors && error.response?.data?.errors[0]?.msg) ||
      error.response?.data ||
      (error.response?.status === 403
        ? 'Access denied: You do not have permission for this resource.'
        : error.message);
    return Promise.reject(errMessage);
  }
);

// Realistic mock network latency helper (100ms)
export const mockDelay = (ms = 100) => new Promise((resolve) => setTimeout(resolve, ms));

// Normalizes backend notification object to frontend expectations
export const normalizeNotification = (n) => ({
  id: n.id,
  title: n.title,
  message: n.message,
  category: n.notificationType
    ? n.notificationType.charAt(0) + n.notificationType.slice(1).toLowerCase()
    : n.notification_type
    ? n.notification_type.charAt(0) + n.notification_type.slice(1).toLowerCase()
    : n.category || 'System',
  type: n.notificationType || n.notification_type || n.type || 'INFO',
  timestamp: n.createdAt ? new Date(n.createdAt).toLocaleDateString('en-GB') : (n.timestamp || 'Today'),
  time: n.createdAt ? new Date(n.createdAt).toLocaleDateString('en-GB') : (n.time || n.timestamp || 'Today'),
  read: n.isRead !== undefined ? n.isRead : (n.is_read !== undefined ? n.is_read : (n.read !== undefined ? n.read : false)),
  link: n.actionUrl || n.action_url || '/student/notifications',
  actionUrl: n.actionUrl || n.action_url || '/student/notifications',
});

// Notifications API Service
export const notificationsApi = {
  getNotifications: async () => {
    try {
      const res = await apiClient.get('/notifications');
      const list = Array.isArray(res) ? res : (res?.data || []);
      return list.map(normalizeNotification);
    } catch {
      await mockDelay();
      return MOCK_NOTIFICATIONS.map(normalizeNotification);
    }
  },
  markAsRead: async (id) => {
    try {
      return await apiClient.put(`/notifications/${id}/read`);
    } catch {
      await mockDelay(50);
      const notif = MOCK_NOTIFICATIONS.find((n) => n.id === id);
      if (notif) notif.read = true;
      return notif;
    }
  },
  markAllAsRead: async () => {
    try {
      return await apiClient.put('/notifications/read-all');
    } catch {
      await mockDelay(50);
      MOCK_NOTIFICATIONS.forEach((n) => (n.read = true));
      return true;
    }
  },
};

// Mapped service alias exports
export { authService as authApi, authService } from './authService.js';
export { studentService as studentApi, studentService } from './studentService.js';
export { jobService as jobsApi, jobService } from './jobService.js';
export { applicationService as applicationsApi, applicationService } from './applicationService.js';
export { interviewService as interviewsApi, interviewService } from './interviewService.js';
export { placementService as placementApi, placementService } from './placementService.js';
export { adminService as adminApi, adminService } from './adminService.js';
export { recruiterService as recruiterApi, recruiterService } from './recruiterService.js';
