import { apiClient, mockDelay } from './api.js';
import { MOCK_ANALYTICS_DATA } from '../data/analytics.js';
import { MOCK_PLACEMENT_DRIVES } from '../data/placementDrives.js';
import { MOCK_STUDENTS_LIST } from '../data/students.js';
import { MOCK_COMPANIES } from '../data/companies.js';
import { normalizeCompany } from './recruiterService.js';

export const normalizeDrive = (d) => ({
  ...d,
  id: d.id,
  title: d.driveName || d.drive_name || d.title || 'Campus Placement Drive',
  companyName: d.companyName || d.company_name || 'TechCorp Solutions',
  logo:
    d.companyLogo ||
    d.logo_url ||
    d.logo ||
    'https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=100',
  driveDate: d.driveDate
    ? new Date(d.driveDate).toLocaleDateString('en-GB')
    : d.drive_date || 'Upcoming',
  venue: d.venue || d.drive_location || 'Campus Auditorium',
  packageOffered:
    d.packageOffered || (d.package ? `₹${d.package} LPA` : '₹12.0 LPA'),
  registeredStudents: parseInt(
    d.registeredStudents || d.registered_students || 0,
    10
  ),
  shortlistedStudents: parseInt(
    d.shortlistedStudents || d.shortlisted_students || 0,
    10
  ),
  placedCount: parseInt(d.placedCount || d.placed_students || 0, 10),
  status: d.status || 'Upcoming',
  eligibleBranches: d.eligibleBranches || [
    'Computer Science & Engineering',
    'Information Technology',
  ],
  rounds: d.rounds || ['Online Assessment', 'Technical Round', 'HR Discussion'],
});

export const placementService = {
  getDashboard: async () => {
    try {
      // Endpoint: GET /api/placement-officers/dashboard
      const res = await apiClient.get('/placement-officers/dashboard');
      return res?.data || res;
    } catch {
      await mockDelay();
      return {
        totalStudents: 520,
        eligibleStudents: 480,
        placedStudents: 405,
        placementPercentage: 84.5,
      };
    }
  },

  getAnalytics: async (range = 'current') => {
    try {
      // Endpoint: GET /api/placement/analytics
      const res = await apiClient.get('/placement/analytics', { params: { range } });
      const data = res?.data || res;
      return {
        ...MOCK_ANALYTICS_DATA,
        ...data,
        totalStudents: data.totalStudents ?? MOCK_ANALYTICS_DATA.totalStudents,
        placedStudents: data.totalPlaced ?? data.placedStudents ?? MOCK_ANALYTICS_DATA.placedStudents,
        overallPlacementRate: data.placementRate ? parseFloat(data.placementRate) : MOCK_ANALYTICS_DATA.overallPlacementRate,
        averagePackage: data.avgPackage ?? data.averagePackage ?? MOCK_ANALYTICS_DATA.averagePackage,
        highestPackage: data.highestPackage ?? MOCK_ANALYTICS_DATA.highestPackage,
      };
    } catch {
      await mockDelay();
      return MOCK_ANALYTICS_DATA;
    }
  },

  getDrives: async (params = {}) => {
    try {
      // Endpoint: GET /api/placement-officers/placement-drives or /placement/drives
      const res = await apiClient.get('/placement-officers/placement-drives', { params });
      const list = Array.isArray(res) ? res : res?.data || [];
      return list.map(normalizeDrive);
    } catch {
      await mockDelay();
      return MOCK_PLACEMENT_DRIVES.map(normalizeDrive);
    }
  },

  getDriveById: async (id) => {
    try {
      const res = await apiClient.get(`/placement-officers/placement-drives/${id}`);
      return normalizeDrive(res?.data || res);
    } catch {
      await mockDelay();
      const drive = MOCK_PLACEMENT_DRIVES.find((d) => d.id === id);
      return drive ? normalizeDrive(drive) : null;
    }
  },

  createDrive: async (driveData) => {
    const startDate = driveData.startDate
      ? new Date(driveData.startDate).toISOString().slice(0, 10)
      : driveData.driveDate
      ? new Date(driveData.driveDate).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10);
    const payload = {
      companyId: driveData.companyId || '11111111-1111-1111-1111-111111111111',
      driveTitle: driveData.title || driveData.driveTitle || driveData.driveName || 'Campus Recruitment Drive',
      startDate,
      endDate: driveData.endDate ? new Date(driveData.endDate).toISOString().slice(0, 10) : undefined,
      status: (driveData.status || 'UPCOMING').toUpperCase(),
      description: driveData.description || 'Annual placement drive',
      eligibilityCriteria: driveData.eligibilityCriteria || 'Minimum CGPA >= 7.00',
    };
    const res = await apiClient.post('/placement-officers/placement-drives', payload);
    return normalizeDrive(res?.data || res);
  },

  getStudentsList: async (params = {}) => {
    try {
      // Endpoint: GET /api/placement-officers/students
      const res = await apiClient.get('/placement-officers/students', { params });
      const list = Array.isArray(res) ? res : res?.data || [];
      return list.map((s) => ({
        ...s,
        avatar:
          s.avatar ||
          s.profileImage ||
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        enrollmentNo: s.enrollmentNo || s.rollNumber || s.roll_number || 'STU-100',
        academics: {
          overallCgpa: s.cgpa ? parseFloat(s.cgpa) : s.academics?.overallCgpa || 8.2,
        },
        placementStatus:
          s.placementStatus === 'NOT_PLACED'
            ? 'Not Placed'
            : s.placementStatus === 'PLACED'
            ? 'Placed'
            : s.placementStatus || 'In Process',
      }));
    } catch {
      await mockDelay();
      return MOCK_STUDENTS_LIST;
    }
  },

  getCompaniesList: async (params = {}) => {
    try {
      // Endpoint: GET /api/placement-officers/companies
      const res = await apiClient.get('/placement-officers/companies', { params });
      const list = Array.isArray(res) ? res : res?.data || [];
      return list.map(normalizeCompany);
    } catch {
      await mockDelay();
      return MOCK_COMPANIES.map(normalizeCompany);
    }
  },

  getPlacementsList: async (params = {}) => {
    try {
      // Endpoint: GET /api/placements
      const res = await apiClient.get('/placements', { params });
      return Array.isArray(res) ? res : res?.data || [];
    } catch {
      await mockDelay();
      return [];
    }
  },

  createPlacement: async (placementData) => {
    return await apiClient.post('/placements', placementData);
  },

  updatePlacement: async (id, placementData) => {
    return await apiClient.put(`/placements/${id}`, placementData);
  },

  exportReport: async (reportType = 'summary') => {
    try {
      // Endpoint: GET /api/placement/reports/export
      return await apiClient.get('/placement/reports/export', {
        params: { type: reportType },
      });
    } catch {
      await mockDelay();
      return { success: true, message: 'Report generated successfully' };
    }
  },
};

