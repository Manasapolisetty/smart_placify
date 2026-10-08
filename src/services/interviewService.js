import { apiClient, mockDelay } from './api.js';
import { MOCK_INTERVIEWS } from '../data/interviews.js';

export const normalizeInterview = (i) => {
  const rawStatus = (i.status || '').toUpperCase();
  const isScheduled = ['SCHEDULED', 'UPCOMING'].includes(rawStatus) || !rawStatus;

  return {
    ...i,
    id: i.id,
    companyName: i.companyName || i.company_name || 'TechCorp Solutions',
    companyLogo:
      i.companyLogo ||
      i.logo_url ||
      'https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=100',
    position: i.jobTitle || i.job_title || i.position || 'Software Engineer',
    round: i.round || i.interviewType || 'Technical Round 1',
    date: i.interviewDate
      ? new Date(i.interviewDate).toLocaleDateString('en-GB')
      : i.date || 'Today',
    time: i.interviewTime || i.time || '11:00 AM',
    type: i.mode || i.type || 'Virtual Meeting',
    meetingLink: i.meetingLink || i.meeting_link || 'https://meet.google.com/xyz-abc',
    status: isScheduled ? 'Upcoming' : rawStatus === 'COMPLETED' ? 'Completed' : i.status,
    rawStatus: i.status,
    interviewer: i.interviewer || 'Technical Lead',
    feedback: i.feedback || '',
  };
};

export const interviewService = {
  getInterviews: async (params = {}) => {
    try {
      // Endpoint: GET /api/interviews
      const res = await apiClient.get('/interviews', { params });
      const list = Array.isArray(res) ? res : res?.data || [];
      return list.map(normalizeInterview);
    } catch {
      await mockDelay();
      return MOCK_INTERVIEWS.map(normalizeInterview);
    }
  },

  getInterviewById: async (id) => {
    try {
      const res = await apiClient.get(`/interviews/${id}`);
      return normalizeInterview(res?.data || res);
    } catch {
      await mockDelay();
      const item = MOCK_INTERVIEWS.find((i) => i.id === id);
      return item ? normalizeInterview(item) : null;
    }
  },

  scheduleInterview: async (interviewData) => {
    let parsedDate = new Date().toISOString().slice(0, 10);
    if (interviewData.date) {
      const d = new Date(interviewData.date);
      if (!isNaN(d.getTime())) parsedDate = d.toISOString().slice(0, 10);
    }

    const payload = {
      applicationId:
        interviewData.applicationId || interviewData.appId || interviewData.id,
      interviewDate: parsedDate,
      interviewTime: interviewData.time || '11:00 AM',
      interviewType: 'TECHNICAL',
      mode: 'VIRTUAL',
      meetingLink: interviewData.meetingLink || interviewData.link || 'https://meet.google.com/xyz-abc',
      interviewer: interviewData.interviewer || 'Technical Interviewer',
    };

    const res = await apiClient.post('/interviews', payload);
    const data = res?.data || res;
    return normalizeInterview(data);
  },

  updateInterviewStatus: async (id, status, feedback = '') => {
    const res = await apiClient.put(`/interviews/${id}`, {
      status: (status || 'SCHEDULED').toUpperCase(),
      feedback,
    });
    return normalizeInterview(res?.data || res);
  },
};

