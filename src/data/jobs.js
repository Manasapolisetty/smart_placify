export const MOCK_JOBS = [
  {
    id: 'job_101',
    title: 'Software Engineer - Full Stack',
    companyId: 'comp_1',
    companyName: 'TechCorp Solutions',
    companyLogo: 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=100&auto=format&fit=crop&q=80',
    location: 'Bengaluru, India (Hybrid)',
    employmentType: 'Full-time',
    jobType: 'On-Campus Placement Drive',
    salary: '₹14.5 - ₹18.0 LPA',
    minSalary: 14.5,
    maxSalary: 18.0,
    currency: 'INR',
    matchPercentage: 92,
    isEligible: true,
    applicationDeadline: '15 Nov 2025',
    postedDate: '01 Oct 2025',
    openings: 15,
    appliedCount: 142,

    skillsRequired: ['React.js', 'Node.js', 'PostgreSQL', 'Data Structures', 'Git'],
    eligibleDepartments: ['Computer Science & Engineering', 'Information Technology', 'Electronics & Communication'],
    minCgpa: 7.5,
    maxBacklogsAllowed: 0,
    eligibleBatch: '2026',

    eligibilityBreakdown: [
      { rule: 'CGPA Requirement (Min 7.50)', satisfied: true, studentValue: '8.74', requiredValue: '7.50' },
      { rule: 'Department Eligibility', satisfied: true, studentValue: 'CSE', requiredValue: 'CSE / IT / ECE' },
      { rule: 'Graduation Batch', satisfied: true, studentValue: '2026', requiredValue: '2026' },
      { rule: 'Active Backlog Check', satisfied: true, studentValue: '0 Backlogs', requiredValue: '0 Active Backlogs' }
    ],

    overview: 'TechCorp Solutions is seeking driven Full Stack Software Engineers to build next-generation enterprise SaaS products. You will collaborate with cross-functional teams to design, develop, test, and deploy resilient web applications.',
    responsibilities: [
      'Architect and write scalable, clean, and maintainable TypeScript/React components for front-end portals.',
      'Develop robust REST APIs using Node.js, Express, and PostgreSQL microservices.',
      'Participate in code reviews, automated unit testing, and continuous deployment pipelines.',
      'Work closely with Product Managers and UI/UX Designers to deliver seamless user experiences.'
    ],
    selectionProcess: [
      { step: 1, title: 'Online Technical & Aptitude Assessment', duration: '90 Mins' },
      { step: 2, title: 'Hands-on Coding Round', duration: '60 Mins' },
      { step: 3, title: 'Technical Interview (Rounds 1 & 2)', duration: '45 Mins each' },
      { step: 4, title: 'HR & Management Discussion', duration: '30 Mins' }
    ]
  },

  {
    id: 'job_102',
    title: 'Associate Cloud Engineer',
    companyId: 'comp_1',
    companyName: 'TechCorp Solutions',
    companyLogo: 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=100&auto=format&fit=crop&q=80',
    location: 'Bengaluru / Pune',
    employmentType: 'Full-time',
    jobType: 'On-Campus Placement Drive',
    salary: '₹12.0 - ₹15.0 LPA',
    minSalary: 12.0,
    maxSalary: 15.0,
    currency: 'INR',
    matchPercentage: 86,
    isEligible: true,
    applicationDeadline: '20 Nov 2025',
    postedDate: '02 Oct 2025',
    openings: 8,
    appliedCount: 98,

    skillsRequired: ['AWS', 'Docker', 'Linux', 'Python', 'Networking'],
    eligibleDepartments: ['Computer Science & Engineering', 'Information Technology'],
    minCgpa: 7.0,
    maxBacklogsAllowed: 0,
    eligibleBatch: '2026',

    eligibilityBreakdown: [
      { rule: 'CGPA Requirement (Min 7.00)', satisfied: true, studentValue: '8.74', requiredValue: '7.00' },
      { rule: 'Department Eligibility', satisfied: true, studentValue: 'CSE', requiredValue: 'CSE / IT' },
      { rule: 'Graduation Batch', satisfied: true, studentValue: '2026', requiredValue: '2026' },
      { rule: 'Active Backlog Check', satisfied: true, studentValue: '0 Backlogs', requiredValue: '0 Active Backlogs' }
    ],

    overview: 'Join our Cloud Infrastructure Engineering team to build multi-region AWS cloud solutions, Kubernetes clusters, and automated CI/CD deployment pipelines.',
    responsibilities: [
      'Design terraform scripts for provisioning AWS Cloud Resources.',
      'Monitor application metrics using Datadog and Grafana dashboards.',
      'Implement zero-downtime rolling updates for microservices.'
    ],
    selectionProcess: [
      { step: 1, title: 'Cloud Fundamentals Online Test', duration: '60 Mins' },
      { step: 2, title: 'Technical Interview', duration: '45 Mins' },
      { step: 3, title: 'HR Discussion', duration: '20 Mins' }
    ]
  },

  {
    id: 'job_103',
    title: 'Software Development Engineer 1 (SDE-1)',
    companyId: 'comp_2',
    companyName: 'TCS Digital',
    companyLogo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80',
    location: 'Pan India (Bengaluru, Hyderabad, Chennai)',
    employmentType: 'Full-time',
    jobType: 'Bulk Campus Drive',
    salary: '₹9.0 - ₹11.5 LPA',
    minSalary: 9.0,
    maxSalary: 11.5,
    currency: 'INR',
    matchPercentage: 88,
    isEligible: true,
    applicationDeadline: '25 Nov 2025',
    postedDate: '28 Sep 2025',
    openings: 50,
    appliedCount: 380,

    skillsRequired: ['Java', 'Spring Boot', 'SQL', 'Data Structures', 'REST API'],
    eligibleDepartments: ['Computer Science & Engineering', 'Information Technology', 'Electronics & Communication', 'Electrical Engg'],
    minCgpa: 7.0,
    maxBacklogsAllowed: 1,
    eligibleBatch: '2026',

    eligibilityBreakdown: [
      { rule: 'CGPA Requirement (Min 7.00)', satisfied: true, studentValue: '8.74', requiredValue: '7.00' },
      { rule: 'Department Eligibility', satisfied: true, studentValue: 'CSE', requiredValue: 'All Engg Branches' },
      { rule: 'Graduation Batch', satisfied: true, studentValue: '2026', requiredValue: '2026' },
      { rule: 'Active Backlog Check', satisfied: true, studentValue: '0 Backlogs', requiredValue: 'Max 1 Backlog' }
    ],

    overview: 'TCS Digital cadre recruitment offers high-impact engineering roles working directly on enterprise transformations for Fortune 500 clients worldwide.',
    responsibilities: [
      'Write modular Java microservices using Spring Boot framework.',
      'Develop SQL queries and optimize database indexing performance.',
      'Collaborate in agile sprints.'
    ],
    selectionProcess: [
      { step: 1, title: 'TCS NQT / Digital Assessment Test', duration: '180 Mins' },
      { step: 2, title: 'Technical Interview', duration: '45 Mins' },
      { step: 3, title: 'HR Round', duration: '20 Mins' }
    ]
  },

  {
    id: 'job_104',
    title: 'Data Analyst & Insights Associate',
    companyId: 'comp_3',
    companyName: 'Deloitte India',
    companyLogo: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=100&auto=format&fit=crop&q=80',
    location: 'Hyderabad / Gurugram',
    employmentType: 'Full-time',
    jobType: 'On-Campus Drive',
    salary: '₹10.5 - ₹13.0 LPA',
    minSalary: 10.5,
    maxSalary: 13.0,
    currency: 'INR',
    matchPercentage: 79,
    isEligible: true,
    applicationDeadline: '30 Nov 2025',
    postedDate: '04 Oct 2025',
    openings: 12,
    appliedCount: 210,

    skillsRequired: ['Python', 'SQL', 'Tableau', 'Power BI', 'Excel', 'Statistics'],
    eligibleDepartments: ['Computer Science & Engineering', 'Information Technology', 'Data Science'],
    minCgpa: 7.5,
    maxBacklogsAllowed: 0,
    eligibleBatch: '2026',

    eligibilityBreakdown: [
      { rule: 'CGPA Requirement (Min 7.50)', satisfied: true, studentValue: '8.74', requiredValue: '7.50' },
      { rule: 'Department Eligibility', satisfied: true, studentValue: 'CSE', requiredValue: 'CSE / IT / Data Science' },
      { rule: 'Graduation Batch', satisfied: true, studentValue: '2026', requiredValue: '2026' },
      { rule: 'Active Backlog Check', satisfied: true, studentValue: '0 Backlogs', requiredValue: '0 Active Backlogs' }
    ],

    overview: 'Work with Deloitte Advisory team to extract business insights, create executive Tableau reporting dashboards, and clean massive enterprise datasets.',
    responsibilities: [
      'Extract data using complex SQL queries and Python ETL scripts.',
      'Build dynamic visualization dashboards for C-suite clients.',
      'Perform statistical analysis to identify trends and anomalies.'
    ],
    selectionProcess: [
      { step: 1, title: 'Aptitude & Analytical Reasoning Test', duration: '60 Mins' },
      { step: 2, title: 'Case Study & Domain Interview', duration: '45 Mins' },
      { step: 3, title: 'Partner Round', duration: '30 Mins' }
    ]
  },

  {
    id: 'job_105',
    title: 'Frontend Engineer (React / Next.js)',
    companyId: 'comp_4',
    companyName: 'Accenture Interactive',
    companyLogo: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=100&auto=format&fit=crop&q=80',
    location: 'Bengaluru (Hybrid)',
    employmentType: 'Full-time',
    jobType: 'On-Campus Drive',
    salary: '₹11.0 - ₹14.0 LPA',
    minSalary: 11.0,
    maxSalary: 14.0,
    currency: 'INR',
    matchPercentage: 94,
    isEligible: true,
    applicationDeadline: '10 Dec 2025',
    postedDate: '05 Oct 2025',
    openings: 20,
    appliedCount: 165,

    skillsRequired: ['React.js', 'JavaScript', 'HTML5/CSS3', 'Tailwind CSS', 'TypeScript'],
    eligibleDepartments: ['Computer Science & Engineering', 'Information Technology'],
    minCgpa: 7.2,
    maxBacklogsAllowed: 0,
    eligibleBatch: '2026',

    eligibilityBreakdown: [
      { rule: 'CGPA Requirement (Min 7.20)', satisfied: true, studentValue: '8.74', requiredValue: '7.20' },
      { rule: 'Department Eligibility', satisfied: true, studentValue: 'CSE', requiredValue: 'CSE / IT' },
      { rule: 'Graduation Batch', satisfied: true, studentValue: '2026', requiredValue: '2026' },
      { rule: 'Active Backlog Check', satisfied: true, studentValue: '0 Backlogs', requiredValue: '0 Active Backlogs' }
    ],

    overview: 'Create pixel-perfect, accessible, and high-performance Web UI applications for global retail, healthcare, and fintech clients.',
    responsibilities: [
      'Develop modern React components using HTML5, Tailwind CSS, and TypeScript.',
      'Implement state management using Context API and Redux Toolkit.',
      'Optimize web pages for maximum performance and mobile responsiveness.'
    ],
    selectionProcess: [
      { step: 1, title: 'Cognitive & Technical Assessment', duration: '90 Mins' },
      { step: 2, title: 'Live UI Coding Challenge', duration: '60 Mins' },
      { step: 3, title: 'Technical & Behavioral Interview', duration: '45 Mins' }
    ]
  }
];
