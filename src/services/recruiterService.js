import { apiClient, mockDelay } from './api.js';
import { MOCK_COMPANIES } from '../data/companies.js';
import { MOCK_APPLICATIONS } from '../data/applications.js';
import { normalizeApplication } from './applicationService.js';

export const normalizeCompany = (c) => ({
  id: c.id,
  name: c.companyName || c.company_name || c.name || 'TechCorp Solutions',
  category: c.industry || c.category || 'Software & Cloud Services',
  location: c.location || 'Bengaluru, Karnataka, India',
  website: c.website || 'https://techcorp.example.com',
  industry: c.industry || 'Software & Cloud Services',
  size: c.companySize || c.company_size || c.size || '1000-5000',
  description:
    c.description ||
    'Leading enterprise technology solutions and cloud engineering provider.',
  logo:
    c.logoUrl ||
    c.logo_url ||
    c.logo ||
    'https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=100',
  totalHired: c.totalHired || 34,
  activeJobsCount: c.activeJobsCount || 5,
});

export const recruiterService = {
  getDashboard: async () => {
    try {
      const res = await apiClient.get('/recruiters/dashboard');
      return res?.data || res;
    } catch {
      await mockDelay();
      return { totalJobs: 5, totalApplications: 12, shortlisted: 4, hired: 2 };
    }
  },

  getCompanyProfile: async () => {
    try {
      // Endpoint: GET /api/recruiters/company
      const res = await apiClient.get('/recruiters/company');
      const data = res?.data || res;
      return normalizeCompany(data);
    } catch {
      await mockDelay();
      return normalizeCompany(MOCK_COMPANIES[0]);
    }
  },

  updateCompanyProfile: async (companyIdOrData, maybeData) => {
    const updatedData = maybeData || companyIdOrData;
    const payload = {
      company_name: updatedData.name || updatedData.company_name,
      industry: updatedData.industry || updatedData.category,
      description: updatedData.description,
      location: updatedData.location,
      website: updatedData.website,
      company_size: updatedData.size || updatedData.company_size,
    };
    const res = await apiClient.put('/recruiters/company', payload);
    const data = res?.data || res;
    return normalizeCompany(data);
  },

  getCandidates: async (params = {}) => {
    try {
      // Endpoint: GET /api/recruiters/applications
      const res = await apiClient.get('/recruiters/applications', { params });
      const list = Array.isArray(res) ? res : res?.data || [];
      return list.map(normalizeApplication);
    } catch {
      await mockDelay();
      return MOCK_APPLICATIONS.map(normalizeApplication);
    }
  },

  shortlistCandidate: async (applicationId) => {
    try {
      // Endpoint: PUT /api/recruiters/applications/:id/status
      const res = await apiClient.put(`/recruiters/applications/${applicationId}/status`, {
        status: 'SHORTLISTED',
      });
      return normalizeApplication(res?.data || res);
    } catch {
      await mockDelay();
      const app = MOCK_APPLICATIONS.find((a) => a.id === applicationId);
      if (app) app.status = 'Shortlisted';
      return app ? normalizeApplication(app) : null;
    }
  },

  rejectCandidate: async (applicationId) => {
    try {
      // Endpoint: PUT /api/recruiters/applications/:id/status
      const res = await apiClient.put(`/recruiters/applications/${applicationId}/status`, {
        status: 'REJECTED',
      });
      return normalizeApplication(res?.data || res);
    } catch {
      await mockDelay();
      const app = MOCK_APPLICATIONS.find((a) => a.id === applicationId);
      if (app) app.status = 'Rejected';
      return app ? normalizeApplication(app) : null;
    }
  },
};

