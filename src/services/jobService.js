import { apiClient, mockDelay } from './api.js';
import { MOCK_JOBS } from '../data/jobs.js';

export const normalizeJob = (j) => ({
  ...j,
  id: j.id,
  title: j.title || j.jobTitle || j.job_title,
  jobTitle: j.title || j.jobTitle || j.job_title,
  companyName: j.companyName || j.company_name || 'TechCorp Solutions',
  companyLogo:
    j.companyLogo ||
    j.logo_url ||
    'https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=100',
  location: j.location || 'Bengaluru, India',
  workMode: j.workMode || j.work_mode || 'Hybrid',
  jobType: j.jobType || j.job_type || 'Full-time',
  employmentType: j.jobType || j.job_type || 'Full-time',
  salary:
    j.salary ||
    (j.minSalary && j.maxSalary
      ? `₹${j.minSalary} - ₹${j.maxSalary} LPA`
      : j.salaryMin
      ? `₹${j.salaryMin} LPA`
      : '₹12.0 - ₹16.0 LPA'),
  minSalary: parseFloat(j.minSalary || j.salaryMin || 12.0),
  maxSalary: parseFloat(j.maxSalary || j.salaryMax || 16.0),
  minCgpa: parseFloat(j.minCgpa || j.minimumCgpa || 7.0),
  minimumCgpa: parseFloat(j.minCgpa || j.minimumCgpa || 7.0),
  matchPercentage: j.matchPercentage || 88,
  appliedCount: parseInt(j.appliedCount || 0, 10),
  applicationDeadline: j.applicationDeadline || j.deadlineFormatted || '30 Nov 2026',
  postedDate: j.postedDate || 'Recent',
  overview:
    j.overview ||
    j.description ||
    j.jobDescription ||
    'Exciting software engineering role at TechCorp Solutions.',
  skillsRequired:
    Array.isArray(j.skillsRequired) && j.skillsRequired.length > 0
      ? j.skillsRequired
      : ['React.js', 'Node.js', 'PostgreSQL'],
  eligibleDepartments: j.eligibleDepartments || [
    'Computer Science & Engineering',
    'Information Technology',
    'Electronics & Communication Engineering',
  ],
  openings: j.openings || 10,
  responsibilities: j.responsibilities || [
    'Design, develop, and maintain responsive web components and backend APIs.',
    'Collaborate with product and engineering teams to define scalable architecture.',
    'Write clean, well-tested code following agile engineering practices.',
  ],
  status: j.status || 'OPEN',
});

export const jobService = {
  getJobs: async (filters = {}) => {
    try {
      // Endpoint: GET /api/jobs
      const res = await apiClient.get('/jobs', { params: filters });
      const list = Array.isArray(res) ? res : res?.data || [];
      return list.map(normalizeJob);
    } catch {
      await mockDelay();
      let result = [...MOCK_JOBS];
      if (filters.search) {
        const q = filters.search.toLowerCase();
        result = result.filter(
          (j) =>
            j.title.toLowerCase().includes(q) ||
            j.companyName.toLowerCase().includes(q) ||
            j.skillsRequired.some((s) => s.toLowerCase().includes(q))
        );
      }
      return result.map(normalizeJob);
    }
  },

  getJobById: async (id) => {
    try {
      // Endpoint: GET /api/jobs/:id
      const res = await apiClient.get(`/jobs/${id}`);
      const job = res?.data || res;
      return normalizeJob(job);
    } catch {
      await mockDelay();
      const job = MOCK_JOBS.find((j) => j.id === id);
      if (!job) throw new Error('Job listing not found');
      return normalizeJob(job);
    }
  },

  createJob: async (jobData) => {
    const rawType = (
      jobData.jobType ||
      jobData.employmentType ||
      'FULL_TIME'
    )
      .toUpperCase()
      .replace('-', '_');
    const validJobType = ['FULL_TIME', 'PART_TIME', 'INTERNSHIP', 'CONTRACT'].includes(
      rawType
    )
      ? rawType
      : 'FULL_TIME';

    let deadlineStr = undefined;
    if (jobData.applicationDeadline) {
      const parsed = new Date(jobData.applicationDeadline);
      if (!isNaN(parsed.getTime())) {
        deadlineStr = parsed.toISOString().slice(0, 10);
      }
    } else {
      deadlineStr = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    }

    const payload = {
      title: jobData.title,
      description:
        jobData.overview || jobData.description || 'Full stack developer position.',
      jobType: validJobType,
      workMode: (jobData.workMode || 'HYBRID').toUpperCase(),
      location: jobData.location || 'Bengaluru, India',
      salaryMin: parseFloat(jobData.minSalary) || undefined,
      salaryMax: parseFloat(jobData.maxSalary) || undefined,
      minimumCgpa: parseFloat(jobData.minCgpa) || undefined,
      applicationDeadline: deadlineStr,
      skills: Array.isArray(jobData.skillsRequired)
        ? jobData.skillsRequired
        : typeof jobData.skillsRequired === 'string'
        ? jobData.skillsRequired.split(',').map((s) => s.trim()).filter(Boolean)
        : undefined,
    };

    const res = await apiClient.post('/jobs', payload);
    const data = res?.data || res;
    return normalizeJob(data);
  },

  updateJob: async (id, updatedData) => {
    const res = await apiClient.put(`/jobs/${id}`, updatedData);
    return normalizeJob(res?.data || res);
  },

  deleteJob: async (id) => {
    return await apiClient.delete(`/jobs/${id}`);
  },
};

