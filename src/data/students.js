export const MOCK_STUDENT_PROFILE = {
  id: 'usr_student_1',
  name: 'Rahul Kumar',
  role: 'student',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  enrollmentNo: 'CS2022045',
  department: 'Computer Science & Engineering',
  institution: 'Institute of Technology & Science',
  batch: '2022 - 2026',
  graduationYear: 2026,
  email: 'rahul.kumar@university.edu.in',
  phone: '+91 98765 43210',
  gender: 'Male',
  dob: '14 Oct 2003',
  address: 'B-402, Green Park Avenue, Technical Campus Rd, Bengaluru, Karnataka 560100',
  currentLocation: 'Bengaluru, Karnataka, India',
  githubUrl: 'github.com/rahulkumar-dev',
  linkedinUrl: 'linkedin.com/in/rahulkumar-tech',
  portfolioUrl: 'rahulkumar.dev',

  // Profile strength & readiness metrics
  profileCompletion: 85,
  placementReadinessScore: 81,
  placementStatus: 'Not Placed', // 'Not Placed', 'Placed', 'In Process'
  
  readinessBreakdown: [
    { category: 'Academic Performance', score: 18, maxScore: 20, color: '#4F46E5' },
    { category: 'Technical Skills', score: 17, maxScore: 20, color: '#6366F1' },
    { category: 'Projects', score: 14, maxScore: 20, color: '#10B981' },
    { category: 'Certifications', score: 8, maxScore: 10, color: '#F59E0B' },
    { category: 'Resume', score: 9, maxScore: 10, color: '#8B5CF6' },
    { category: 'Interview Preparation', score: 8, maxScore: 10, color: '#EC4899' },
    { category: 'Coding Practice', score: 7, maxScore: 10, color: '#06B6D4' },
  ],

  stats: {
    eligibleJobsCount: 12,
    totalApplications: 7,
    shortlistedCount: 3,
    interviewsCount: 2,
    offersCount: 0
  },

  // Academics
  academics: {
    overallCgpa: 8.74,
    currentSgpa: 8.90,
    activeBacklogs: 0,
    historyBacklogs: 0,
    attendancePercentage: 89,
    sgpaHistory: [
      { semester: 'Sem 1', sgpa: 8.20 },
      { semester: 'Sem 2', sgpa: 8.45 },
      { semester: 'Sem 3', sgpa: 8.60 },
      { semester: 'Sem 4', sgpa: 8.72 },
      { semester: 'Sem 5', sgpa: 8.85 },
      { semester: 'Sem 6', sgpa: 8.90 },
    ],
    semesters: [
      { sem: 6, year: '3rd Year (Even)', sgpa: 8.90, totalCredits: 24, status: 'Passed', backlogs: 0 },
      { sem: 5, year: '3rd Year (Odd)', sgpa: 8.85, totalCredits: 22, status: 'Passed', backlogs: 0 },
      { sem: 4, year: '2nd Year (Even)', sgpa: 8.72, totalCredits: 24, status: 'Passed', backlogs: 0 },
      { sem: 3, year: '2nd Year (Odd)', sgpa: 8.60, totalCredits: 23, status: 'Passed', backlogs: 0 },
      { sem: 2, year: '1st Year (Even)', sgpa: 8.45, totalCredits: 24, status: 'Passed', backlogs: 0 },
      { sem: 1, year: '1st Year (Odd)', sgpa: 8.20, totalCredits: 22, status: 'Passed', backlogs: 0 },
    ],
    subjectPerformance: [
      { code: 'CS601', name: 'Data Structures & Algorithms', credits: 4, grade: 'A+', marks: 92, status: 'Passed' },
      { code: 'CS602', name: 'Database Management Systems', credits: 4, grade: 'A', marks: 88, status: 'Passed' },
      { code: 'CS603', name: 'Operating Systems & System Prog.', credits: 4, grade: 'A', marks: 86, status: 'Passed' },
      { code: 'CS604', name: 'Computer Networks & Security', credits: 4, grade: 'A+', marks: 91, status: 'Passed' },
      { code: 'CS605', name: 'Object Oriented Software Engg.', credits: 3, grade: 'A', marks: 85, status: 'Passed' },
      { code: 'CS606', name: 'Full Stack Web Development Lab', credits: 3, grade: 'O', marks: 96, status: 'Passed' },
    ]
  },

  // Skills & Proficiency
  skills: [
    { id: 's1', name: 'React.js', level: 'Advanced', rating: 90, category: 'Frontend' },
    { id: 's2', name: 'Node.js & Express', level: 'Intermediate', rating: 82, category: 'Backend' },
    { id: 's3', name: 'Python & Data Analysis', level: 'Intermediate', rating: 78, category: 'Programming' },
    { id: 's4', name: 'Data Structures & Algo', level: 'Advanced', rating: 88, category: 'CS Fundamentals' },
    { id: 's5', name: 'SQL & PostgreSQL', level: 'Intermediate', rating: 80, category: 'Database' },
    { id: 's6', name: 'AWS & Cloud Fundamentals', level: 'Beginner', rating: 65, category: 'Cloud & DevOps' },
    { id: 's7', name: 'Tailwind CSS & UI Design', level: 'Advanced', rating: 92, category: 'Frontend' },
    { id: 's8', name: 'Git & Version Control', level: 'Advanced', rating: 89, category: 'Tools' },
  ],

  // Featured Projects
  projects: [
    {
      id: 'proj_1',
      title: 'Smart Campus Placement Portal',
      description: 'A comprehensive web portal for managing placement drives, student tracking, and automated job matching algorithms using React, Node.js, and SQL.',
      duration: 'Jan 2025 - Present',
      role: 'Lead Frontend Developer',
      technologies: ['React', 'Node.js', 'PostgreSQL', 'Tailwind CSS', 'Recharts'],
      githubLink: 'https://github.com/rahulkumar/smart-placement',
      liveLink: 'https://smartplacify.demo.app'
    },
    {
      id: 'proj_2',
      title: 'AI-Powered Resume ATS Analyzer',
      description: 'An NLP tool built with Python and React that calculates match score between student resumes and recruiter job descriptions.',
      duration: 'Oct 2024 - Dec 2024',
      role: 'Full Stack Engineer',
      technologies: ['Python', 'FastAPI', 'React', 'Tailwind CSS', 'SpaCy'],
      githubLink: 'https://github.com/rahulkumar/resume-ats-analyzer',
      liveLink: 'https://ats-analyzer.demo.app'
    },
    {
      id: 'proj_3',
      title: 'Distributed Cloud Microservices',
      description: 'Built scalable mock microservices deployed on Docker container cluster with Redis caching and API gateway routing.',
      duration: 'May 2024 - Aug 2024',
      role: 'Backend Intern Project',
      technologies: ['Node.js', 'Docker', 'Redis', 'Express', 'MongoDB'],
      githubLink: 'https://github.com/rahulkumar/cloud-microservices'
    }
  ],

  // Certifications
  certifications: [
    {
      id: 'cert_1',
      name: 'AWS Certified Cloud Practitioner',
      issuer: 'Amazon Web Services (AWS)',
      issueDate: 'Aug 2024',
      expiryDate: 'Aug 2027',
      credentialId: 'AWS-9923847291',
      verifyUrl: 'https://aws.amazon.com/verification'
    },
    {
      id: 'cert_2',
      name: 'Meta Front-End Developer Specialization',
      issuer: 'Coursera / Meta',
      issueDate: 'May 2024',
      expiryDate: 'No Expiration',
      credentialId: 'META-FE-8819203',
      verifyUrl: 'https://coursera.org/verify/META-FE'
    },
    {
      id: 'cert_3',
      name: 'Data Structures and Algorithms in Java',
      issuer: 'NPTEL / IIT Kharagpur',
      issueDate: 'Nov 2023',
      expiryDate: 'No Expiration',
      credentialId: 'NPTEL23CS89',
      verifyUrl: 'https://nptel.ac.in/noc'
    }
  ],

  // Resume Management
  resumes: [
    {
      id: 'res_1',
      name: 'Rahul_Kumar_Resume_2026_V3.pdf',
      uploadDate: '15 Oct 2025',
      size: '1.2 MB',
      isPrimary: true,
      atsScore: 92
    },
    {
      id: 'res_2',
      name: 'Rahul_Kumar_Backend_Focus.pdf',
      uploadDate: '01 Sep 2025',
      size: '1.1 MB',
      isPrimary: false,
      atsScore: 88
    }
  ]
};

export const MOCK_STUDENTS_LIST = [
  MOCK_STUDENT_PROFILE,
  {
    id: 'usr_student_2',
    name: 'Sneha Patel',
    role: 'student',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    enrollmentNo: 'CS2022089',
    department: 'Computer Science & Engineering',
    institution: 'Institute of Technology & Science',
    batch: '2022 - 2026',
    graduationYear: 2026,
    email: 'sneha.patel@university.edu.in',
    phone: '+91 98123 45678',
    academics: { overallCgpa: 9.12, activeBacklogs: 0 },
    skills: ['Python', 'Machine Learning', 'SQL', 'TensorFlow', 'React'],
    placementStatus: 'Placed',
    placedCompany: 'Google India',
    placedPackage: '32 LPA',
    profileCompletion: 95
  },
  {
    id: 'usr_student_3',
    name: 'Ankit Verma',
    role: 'student',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    enrollmentNo: 'EC2022012',
    department: 'Electronics & Communication',
    institution: 'Institute of Technology & Science',
    batch: '2022 - 2026',
    graduationYear: 2026,
    email: 'ankit.verma@university.edu.in',
    phone: '+91 97654 32109',
    academics: { overallCgpa: 8.15, activeBacklogs: 0 },
    skills: ['C++', 'Embedded Systems', 'IoT', 'Python'],
    placementStatus: 'In Process',
    placedCompany: null,
    placedPackage: null,
    profileCompletion: 80
  },
  {
    id: 'usr_student_4',
    name: 'Pooja Hegde',
    role: 'student',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    enrollmentNo: 'IT2022034',
    department: 'Information Technology',
    institution: 'Institute of Technology & Science',
    batch: '2022 - 2026',
    graduationYear: 2026,
    email: 'pooja.hegde@university.edu.in',
    phone: '+91 99887 76655',
    academics: { overallCgpa: 8.65, activeBacklogs: 0 },
    skills: ['Java', 'Spring Boot', 'MySQL', 'Docker', 'Angular'],
    placementStatus: 'Placed',
    placedCompany: 'TCS Digital',
    placedPackage: '9 LPA',
    profileCompletion: 90
  }
];
