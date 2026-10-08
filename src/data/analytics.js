export const MOCK_ANALYTICS_DATA = {
  overallPlacementRate: 84.5,
  totalStudents: 520,
  eligibleStudents: 480,
  placedStudents: 405,
  activeCompanies: 48,
  activeJobs: 32,
  totalOffers: 462,
  averagePackage: 10.8, // LPA
  highestPackage: 44.0, // LPA
  medianPackage: 9.5,   // LPA

  departmentWisePlacement: [
    { department: 'Computer Science (CSE)', total: 180, placed: 165, percentage: 91.6, avgSalary: 14.2 },
    { department: 'Information Tech (IT)', total: 120, placed: 108, percentage: 90.0, avgSalary: 12.8 },
    { department: 'Electronics (ECE)', total: 110, placed: 88, percentage: 80.0, avgSalary: 9.6 },
    { department: 'Electrical (EEE)', total: 60, placed: 44, percentage: 73.3, avgSalary: 8.2 },
    { department: 'Mechanical (ME)', total: 50, placed: 32, percentage: 64.0, avgSalary: 7.5 },
  ],

  placementTrendYears: [
    { year: '2021', totalStudents: 410, placed: 310, rate: 75.6, avgSalary: 7.8, maxSalary: 28.0 },
    { year: '2022', totalStudents: 440, placed: 350, rate: 79.5, avgSalary: 8.4, maxSalary: 32.5 },
    { year: '2023', totalStudents: 470, placed: 388, rate: 82.5, avgSalary: 9.2, maxSalary: 38.0 },
    { year: '2024', totalStudents: 500, placed: 420, rate: 84.0, avgSalary: 10.1, maxSalary: 42.0 },
    { year: '2025 (Cur)', totalStudents: 520, placed: 405, rate: 84.5, avgSalary: 10.8, maxSalary: 44.0 },
  ],

  salaryDistribution: [
    { range: '3-6 LPA', count: 65, fill: '#94A3B8' },
    { range: '6-9 LPA', count: 140, fill: '#60A5FA' },
    { range: '9-14 LPA', count: 125, fill: '#6366F1' },
    { range: '14-20 LPA', count: 55, fill: '#4F46E5' },
    { range: '20+ LPA', count: 20, fill: '#10B981' },
  ],

  topRecruiters: [
    { name: 'TCS Digital', hires: 68, avgLpa: 9.5 },
    { name: 'Accenture', hires: 52, avgLpa: 8.8 },
    { name: 'TechCorp Solutions', hires: 34, avgLpa: 15.5 },
    { name: 'Deloitte India', hires: 28, avgLpa: 11.2 },
    { name: 'Infosys', hires: 45, avgLpa: 7.5 }
  ],

  auditLogs: [
    { id: 'log_1', action: 'User Created', details: 'New student account created (Sneha Patel)', performedBy: 'Admin System', timestamp: '06 Oct 2025, 14:32:10', ip: '192.168.1.102' },
    { id: 'log_2', action: 'Drive Approved', details: 'Approved TechCorp Solutions Hiring Drive 2026', performedBy: 'Dr. Aris V. Nair', timestamp: '06 Oct 2025, 11:15:45', ip: '192.168.1.55' },
    { id: 'log_3', action: 'Job Published', details: 'Published job: Software Engineer - Full Stack', performedBy: 'Priya Sharma (TechCorp)', timestamp: '05 Oct 2025, 18:20:01', ip: '172.16.2.89' },
    { id: 'log_4', action: 'Role Assigned', details: 'Assigned Placement Officer role to Dr. Aris', performedBy: 'Admin System', timestamp: '04 Oct 2025, 09:00:12', ip: '192.168.1.1' },
  ]
};
