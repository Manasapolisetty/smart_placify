import { apiClient, mockDelay } from './api.js';
import { MOCK_USERS } from '../data/users.js';

export const normalizeRole = (role) => {
  if (!role) return 'student';
  const r = role.toString().trim().toLowerCase();
  if (r === 'placement_officer' || r === 'placement') return 'placement';
  return r;
};

export const authService = {
  login: async (credentials) => {
    try {
      // Endpoint: POST /api/auth/login
      const response = await apiClient.post('/auth/login', {
        email: credentials.email,
        password: credentials.password,
      });

      const token = response.token || response.data?.token;
      let user = response.user || response.data?.user;

      if (token && user) {
        user = {
          ...user,
          role: normalizeRole(user.role),
          rawRole: user.role,
          avatar:
            user.avatar ||
            user.profileImage ||
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        };
        localStorage.setItem('smartplacify_token', token);
        localStorage.setItem('smartplacify_user', JSON.stringify(user));
        return { token, user };
      }
      throw new Error(response.message || 'Login failed');
    } catch (error) {
      // Re-throw genuine backend errors
      throw error;
    }
  },

  register: async (userData) => {
    try {
      // Endpoint: POST /api/auth/register
      const payload = {
        name: userData.fullName || userData.name,
        email: userData.email,
        password: userData.password,
        role:
          userData.role === 'placement'
            ? 'PLACEMENT_OFFICER'
            : (userData.role || 'student').toUpperCase(),
        phone: userData.phone || undefined,
      };
      const response = await apiClient.post('/auth/register', payload);
      const token = response.token || response.data?.token;
      let user = response.user || response.data?.user;

      if (user) {
        user = {
          ...user,
          role: normalizeRole(user.role),
          rawRole: user.role,
          avatar:
            user.avatar ||
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        };
      }
      if (token) localStorage.setItem('smartplacify_token', token);
      if (user) localStorage.setItem('smartplacify_user', JSON.stringify(user));
      return { token, user };
    } catch (error) {
      throw error;
    }
  },

  logout: async () => {
    try {
      // Endpoint: POST /api/auth/logout
      await apiClient.post('/auth/logout');
    } catch {
      await mockDelay(50);
    } finally {
      localStorage.removeItem('smartplacify_user');
      localStorage.removeItem('smartplacify_token');
    }
  },

  getCurrentUser: () => {
    const saved = localStorage.getItem('smartplacify_user');
    return saved ? JSON.parse(saved) : null;
  },
};

