export const MOCK_NOTIFICATIONS = [
  {
    id: 'notif_1',
    category: 'Interviews', // 'Jobs', 'Applications', 'Interviews', 'Placements', 'System'
    title: 'Interview Scheduled with TechCorp Solutions',
    message: 'Your Technical Round 2 for Software Engineer role is scheduled for 08 Oct 2025 at 10:30 AM.',
    time: '2 hours ago',
    read: false,
    link: '/student/interviews'
  },
  {
    id: 'notif_2',
    category: 'Applications',
    title: 'Application Shortlisted - TechCorp Solutions',
    message: 'Congratulations! You have been shortlisted for the Software Engineer role.',
    time: '1 day ago',
    read: false,
    link: '/student/applications'
  },
  {
    id: 'notif_3',
    category: 'Jobs',
    title: 'Campus Placement Alert: Accenture Interactive',
    message: 'Accenture Interactive announced a new placement drive for Frontend Engineers (₹14.0 LPA max package). Deadline: 10 Dec 2025.',
    time: '2 days ago',
    read: true,
    link: '/student/jobs/job_105'
  },
  {
    id: 'notif_4',
    category: 'Placements',
    title: 'Placement Drive Announcement: Google India',
    message: 'Google India on-campus registration opened for 2026 graduating batch with CGPA >= 8.5.',
    time: '3 days ago',
    read: true,
    link: '/student/jobs'
  },
  {
    id: 'notif_5',
    category: 'System',
    title: 'Profile Readiness Update',
    message: 'Your placement readiness score increased to 81/100 after adding AWS certification.',
    time: '4 days ago',
    read: true,
    link: '/student/profile'
  }
];
