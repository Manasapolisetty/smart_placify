import { apiClient, mockDelay } from './api.js';
import { MOCK_APPLICATIONS } from '../data/applications.js';
import { MOCK_JOBS } from '../data/jobs.js';

export const normalizeApplication = (a) => {
  const rawStatus = a.status || 'APPLIED';
  const statusStr =
    rawStatus.toUpperCase() === 'SHORTLISTED'
      ? 'Shortlisted'
      : rawStatus.toUpperCase() === 'INTERVIEW'
      ? 'Interview'
      : rawStatus.toUpperCase() === 'SELECTED'
      ? 'Selected'
      : rawStatus.toUpperCase() === 'REJECTED'
      ? 'Rejected'
      : rawStatus.toUpperCase() === 'WITHDRAWN'
      ? 'Withdrawn'
      : 'Applied';

  return {
    ...a,
    id: a.id,
    jobId: a.jobId || a.job_id,
    jobTitle: a.jobTitle || a.job_title || a.title || 'Software Engineer',
    companyName: a.companyName || a.company_name || 'TechCorp Solutions',
    companyLogo:
      a.companyLogo ||
      a.logo_url ||
      'https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=100',
    studentId: a.studentId || a.student_id,
    studentName: a.candidate?.name || a.studentName || a.student_name || 'Rahul Kumar',
    studentEmail:
      a.candidate?.email || a.studentEmail || a.student_email || 'student@university.edu.in',
    studentDepartment:
      a.candidate?.department ||
      a.studentDepartment ||
      a.department ||
      'Computer Science & Engineering',
    studentCgpa: a.candidate?.cgpa || a.studentCgpa || a.cgpa || 8.5,
    appliedDate: a.appliedAt
      ? new Date(a.appliedAt).toLocaleDateString('en-GB')
      : a.appliedDate || 'Today',
    matchScore: a.matchScore || a.matchPercentage || 90,
    status: statusStr,
    rawStatus: a.status,
    currentRound:
      a.currentRound ||
      (statusStr === 'Shortlisted'
        ? 'Technical Round 1'
        : statusStr === 'Interview'
        ? 'Interview Scheduled'
        : 'Application Under Review'),
    timeline: a.timeline || [
      {
        stage: 'Applied',
        date: a.appliedDate || 'Today',
        completed: true,
        status: 'Completed',
      },
      {
        stage: 'Screening',
        date: 'TBD',
        completed: statusStr !== 'Applied',
        status: statusStr === 'Applied' ? 'Current' : 'Completed',
      },
      {
        stage: 'Shortlisted',
        date: 'TBD',
        completed: ['Shortlisted', 'Interview', 'Selected'].includes(statusStr),
        status: statusStr === 'Shortlisted' ? 'Current' : 'Pending',
      },
      {
        stage: 'Interview',
        date: 'TBD',
        completed: ['Interview', 'Selected'].includes(statusStr),
        status: statusStr === 'Interview' ? 'Current' : 'Pending',
      },
      {
        stage: 'Selected',
        date: 'TBD',
        completed: statusStr === 'Selected',
        status: statusStr === 'Selected' ? 'Completed' : 'Pending',
      },
    ],
  };
};

export const applicationService = {
  getApplications: async (params = {}) => {
    try {
      // Endpoint: GET /api/applications
      const res = await apiClient.get('/applications', { params });
      const list = Array.isArray(res) ? res : res?.data || [];
      return list.map(normalizeApplication);
    } catch {
      await mockDelay();
      return MOCK_APPLICATIONS.map(normalizeApplication);
    }
  },

  getApplicationById: async (id) => {
    try {
      const res = await apiClient.get(`/applications/${id}`);
      return normalizeApplication(res?.data || res);
    } catch {
      await mockDelay();
      const app = MOCK_APPLICATIONS.find((a) => a.id === id);
      return app ? normalizeApplication(app) : null;
    }
  },

  applyForJob: async (jobId, resumeId) => {
    const isUUID = (str) => typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
    const payload = {};
    if (resumeId && isUUID(resumeId)) {
      payload.resumeId = resumeId;
    }
    // Endpoint: POST /api/jobs/:jobId/apply
    const res = await apiClient.post(`/jobs/${jobId}/apply`, payload);
    const data = res?.data || res;
    return normalizeApplication(data);
  },

  updateApplicationStatus: async (applicationId, status, notes = '') => {
    const upperStatus = (status || '').toUpperCase();
    const res = await apiClient.put(`/applications/${applicationId}/status`, {
      status: upperStatus,
      notes,
      remarks: notes,
    });
    return normalizeApplication(res?.data || res);
  },

  // Alias for Recruiter pages invoking updateStatus
  updateStatus: async (applicationId, status, notes = '') => {
    return applicationService.updateApplicationStatus(applicationId, status, notes);
  },

  withdrawApplication: async (applicationId) => {
    const res = await apiClient.post(`/applications/${applicationId}/withdraw`);
    return res?.data || res;
  },
};

