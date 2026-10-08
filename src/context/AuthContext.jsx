import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';
import { normalizeRole } from '../services/authService';

const AuthContext = createContext(null);

const DEMO_CREDENTIALS = {
  student: { email: 'rahul.kumar@university.edu.in', password: 'password123' },
  recruiter: { email: 'priya.sharma@techcorp.com', password: 'password123' },
  placement: { email: 'placement.head@university.edu.in', password: 'password123' },
  admin: { email: 'admin@smartplacify.edu.in', password: 'password123' },
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('smartplacify_user');
    const savedToken = localStorage.getItem('smartplacify_token');
    if (savedUser && savedToken) {
      try {
        const parsed = JSON.parse(savedUser);
        return {
          ...parsed,
          role: normalizeRole(parsed.role),
        };
      } catch {
        return null;
      }
    }
    // Default initial seed user for immediate preview if not yet logged in
    return {
      id: 'a0000000-0000-0000-0000-000000000002',
      name: 'Rahul Kumar',
      email: 'rahul.kumar@university.edu.in',
      role: 'student',
      status: 'ACTIVE',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    };
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('smartplacify_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('smartplacify_user');
      localStorage.removeItem('smartplacify_token');
    }
  }, [user]);

  // Listen for global 401 unauthorized events from apiClient
  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  // If initial user has no token in localStorage, perform an automatic background login
  useEffect(() => {
    const token = localStorage.getItem('smartplacify_token');
    if (!token && user?.role) {
      const creds = DEMO_CREDENTIALS[user.role] || DEMO_CREDENTIALS.student;
      authApi.login(creds).then((res) => {
        if (res?.user) setUser(res.user);
      }).catch(() => {});
    }
  }, []);

  const login = async (credentials) => {
    setLoading(true);
    try {
      const response = await authApi.login(credentials);
      setUser(response.user);
      return response.user;
    } finally {
      setLoading(false);
    }
  };

  const switchRole = async (roleName) => {
    setLoading(true);
    try {
      const creds = DEMO_CREDENTIALS[roleName];
      if (creds) {
        const response = await authApi.login(creds);
        setUser(response.user);
        return response.user;
      }
    } catch (err) {
      console.warn('Switch role background login failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      const response = await authApi.register(userData);
      setUser(response.user);
      return response.user;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authApi.logout();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user ? normalizeRole(user.role) : null,
        login,
        register,
        logout,
        switchRole,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

