import { apiClient, mockDelay } from './api.js';
import { MOCK_USERS } from '../data/users.js';
import { MOCK_ANALYTICS_DATA } from '../data/analytics.js';

export const adminService = {
  getUsers: async (params = {}) => {
    try {
      // Endpoint: GET /api/admin/users
      return await apiClient.get('/admin/users', { params });
    } catch (error) {
      await mockDelay();
      return MOCK_USERS;
    }
  },

  updateUserRole: async (userId, role) => {
    return await apiClient.patch(`/admin/users/${userId}/role`, { role });
  },

  toggleUserStatus: async (userId) => {
    return await apiClient.patch(`/admin/users/${userId}/status`);
  },

  deleteUser: async (userId) => {
    return await apiClient.delete(`/admin/users/${userId}`);
  },

  getAuditLogs: async (params = {}) => {
    try {
      // Endpoint: GET /api/admin/audit-logs
      return await apiClient.get('/admin/audit-logs', { params });
    } catch (error) {
      await mockDelay();
      return MOCK_ANALYTICS_DATA.auditLogs;
    }
  },

  getDepartments: async () => {
    try {
      // Endpoint: GET /api/admin/departments
      return await apiClient.get('/admin/departments');
    } catch (error) {
      await mockDelay();
      return [
        { code: 'CSE', name: 'Computer Science & Engineering', head: 'Dr. R. K. Sharma', studentsCount: 180, coursesCount: 12, status: 'Active' },
        { code: 'IT', name: 'Information Technology', head: 'Dr. Ananya Ray', studentsCount: 120, coursesCount: 10, status: 'Active' },
        { code: 'ECE', name: 'Electronics & Communication Engg', head: 'Prof. V. K. Gupta', studentsCount: 110, coursesCount: 10, status: 'Active' },
      ];
    }
  },
};
