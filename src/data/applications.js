export const MOCK_APPLICATIONS = [
  {
    id: 'app_1',
    jobId: 'job_101',
    jobTitle: 'Software Engineer - Full Stack',
    companyName: 'TechCorp Solutions',
    companyLogo: 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=100&auto=format&fit=crop&q=80',
    studentId: 'usr_student_1',
    studentName: 'Rahul Kumar',
    studentEmail: 'rahul.kumar@university.edu.in',
    studentDepartment: 'Computer Science & Engineering',
    studentCgpa: 8.74,
    appliedDate: '02 Oct 2025',
    matchScore: 92,
    status: 'Shortlisted', // 'Applied', 'Screening', 'Shortlisted', 'Interview', 'Selected', 'Rejected'
    currentRound: 'Technical Interview - Round 2',
    nextActionDate: '08 Oct 2025',
    notes: 'Cleared online coding assessment with 98% score. Recommended for Round 2 technical interview.',
    timeline: [
      { stage: 'Applied', date: '02 Oct 2025', completed: true, status: 'Completed' },
      { stage: 'Screening', date: '04 Oct 2025', completed: true, status: 'Completed' },
      { stage: 'Shortlisted', date: '05 Oct 2025', completed: true, status: 'Completed' },
      { stage: 'Interview', date: '08 Oct 2025', completed: false, status: 'Scheduled' },
      { stage: 'Selected', date: 'TBD', completed: false, status: 'Pending' }
    ]
  },
  {
    id: 'app_2',
    jobId: 'job_102',
    jobTitle: 'Associate Cloud Engineer',
    companyName: 'TechCorp Solutions',
    companyLogo: 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=100&auto=format&fit=crop&q=80',
    studentId: 'usr_student_1',
    studentName: 'Rahul Kumar',
    studentEmail: 'rahul.kumar@university.edu.in',
    studentDepartment: 'Computer Science & Engineering',
    studentCgpa: 8.74,
    appliedDate: '03 Oct 2025',
    matchScore: 86,
    status: 'Interview',
    currentRound: 'Cloud System Design Round',
    nextActionDate: '10 Oct 2025',
    notes: 'Shortlisted based on AWS Practitioner certification.',
    timeline: [
      { stage: 'Applied', date: '03 Oct 2025', completed: true, status: 'Completed' },
      { stage: 'Screening', date: '05 Oct 2025', completed: true, status: 'Completed' },
      { stage: 'Shortlisted', date: '06 Oct 2025', completed: true, status: 'Completed' },
      { stage: 'Interview', date: '10 Oct 2025', completed: false, status: 'In Progress' },
      { stage: 'Selected', date: 'TBD', completed: false, status: 'Pending' }
    ]
  },
  {
    id: 'app_3',
    jobId: 'job_103',
    jobTitle: 'Software Development Engineer 1 (SDE-1)',
    companyName: 'TCS Digital',
    companyLogo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80',
    studentId: 'usr_student_1',
    studentName: 'Rahul Kumar',
    studentEmail: 'rahul.kumar@university.edu.in',
    studentDepartment: 'Computer Science & Engineering',
    studentCgpa: 8.74,
    appliedDate: '29 Sep 2025',
    matchScore: 88,
    status: 'Screening',
    currentRound: 'Online Aptitude & Coding Assessment',
    nextActionDate: '12 Oct 2025',
    notes: 'Resume verified by placement cell. Awaiting NQT portal test credentials.',
    timeline: [
      { stage: 'Applied', date: '29 Sep 2025', completed: true, status: 'Completed' },
      { stage: 'Screening', date: '01 Oct 2025', completed: false, status: 'Under Review' },
      { stage: 'Shortlisted', date: 'TBD', completed: false, status: 'Pending' },
      { stage: 'Interview', date: 'TBD', completed: false, status: 'Pending' },
      { stage: 'Selected', date: 'TBD', completed: false, status: 'Pending' }
    ]
  },
  {
    id: 'app_4',
    jobId: 'job_105',
    jobTitle: 'Frontend Engineer (React / Next.js)',
    companyName: 'Accenture Interactive',
    companyLogo: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=100&auto=format&fit=crop&q=80',
    studentId: 'usr_student_1',
    studentName: 'Rahul Kumar',
    studentEmail: 'rahul.kumar@university.edu.in',
    studentDepartment: 'Computer Science & Engineering',
    studentCgpa: 8.74,
    appliedDate: '06 Oct 2025',
    matchScore: 94,
    status: 'Applied',
    currentRound: 'Application Submitted',
    nextActionDate: '14 Oct 2025',
    notes: 'Application successfully submitted.',
    timeline: [
      { stage: 'Applied', date: '06 Oct 2025', completed: true, status: 'Completed' },
      { stage: 'Screening', date: 'TBD', completed: false, status: 'Pending' },
      { stage: 'Shortlisted', date: 'TBD', completed: false, status: 'Pending' },
      { stage: 'Interview', date: 'TBD', completed: false, status: 'Pending' },
      { stage: 'Selected', date: 'TBD', completed: false, status: 'Pending' }
    ]
  }
];
