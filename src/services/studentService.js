import { apiClient, mockDelay } from './api.js';
import { MOCK_STUDENT_PROFILE } from '../data/students.js';

export const normalizeStudentProfile = (data) => {
  if (!data) return MOCK_STUDENT_PROFILE;
  return {
    ...MOCK_STUDENT_PROFILE,
    ...data,
    id: data.id || data.studentId || data.userId || MOCK_STUDENT_PROFILE.id,
    name: data.name || MOCK_STUDENT_PROFILE.name,
    email: data.email || MOCK_STUDENT_PROFILE.email,
    phone: data.phone || data.student_phone || MOCK_STUDENT_PROFILE.phone,
    avatar:
      data.avatar ||
      data.profileImage ||
      data.profile_image ||
      MOCK_STUDENT_PROFILE.avatar,
    enrollmentNo:
      data.enrollmentNo ||
      data.rollNumber ||
      data.roll_number ||
      MOCK_STUDENT_PROFILE.enrollmentNo,
    department:
      data.department ||
      data.departmentName ||
      MOCK_STUDENT_PROFILE.department,
    course: data.course || data.courseName || MOCK_STUDENT_PROFILE.course,
    cgpa: data.cgpa ? parseFloat(data.cgpa) : MOCK_STUDENT_PROFILE.academics.overallCgpa,
    graduationYear: data.graduationYear || data.graduation_year || 2026,
    batch: data.graduationYear
      ? `${data.graduationYear - 4} - ${data.graduationYear}`
      : MOCK_STUDENT_PROFILE.batch,
    placementStatus: data.placementStatus
      ? data.placementStatus === 'NOT_PLACED'
        ? 'Not Placed'
        : data.placementStatus === 'PLACED'
        ? 'Placed'
        : data.placementStatus
      : MOCK_STUDENT_PROFILE.placementStatus,
    profileCompletion: data.profileCompletion || 85,
    skills:
      Array.isArray(data.skills)
        ? data.skills.map((s, idx) => ({
            id: s.id || `s_${idx}`,
            name: s.name || s.skillName || s.skill_name,
            level: s.level || s.proficiencyLevel || s.proficiency_level || 'Intermediate',
            rating:
              s.rating ||
              (s.proficiencyLevel === 'EXPERT' || s.level === 'EXPERT'
                ? 95
                : s.proficiencyLevel === 'ADVANCED' || s.level === 'ADVANCED'
                ? 88
                : s.proficiencyLevel === 'INTERMEDIATE' || s.level === 'INTERMEDIATE'
                ? 78
                : 65),
            category: s.category || s.skillCategory || s.skill_category || 'Technical',
          }))
        : MOCK_STUDENT_PROFILE.skills,
    projects:
      Array.isArray(data.projects)
        ? data.projects.map((p, idx) => ({
            id: p.id || `proj_${idx}`,
            title: p.title || p.projectTitle || p.project_title,
            description: p.description || '',
            technologies: Array.isArray(p.technologies)
              ? p.technologies
              : typeof p.technologies === 'string'
              ? p.technologies.split(',').map((t) => t.trim())
              : ['React', 'Node.js'],
            duration: p.duration || '2025 - 2026',
            role: p.role || 'Full Stack Developer',
            githubLink: p.githubLink || p.githubUrl || p.github_url || '',
            liveLink: p.liveLink || p.liveUrl || p.live_url || '',
          }))
        : MOCK_STUDENT_PROFILE.projects,
    certifications:
      Array.isArray(data.certifications)
        ? data.certifications.map((c, idx) => ({
            id: c.id || `cert_${idx}`,
            name: c.name || c.certificationName || c.certification_name,
            issuer: c.issuer || c.issuingOrganization || c.issuing_organization,
            issueDate: c.issueDate || c.issue_date ? new Date(c.issueDate || c.issue_date).toLocaleDateString('en-GB') : '2026',
            expiryDate: c.expiryDate || c.expiry_date || 'No Expiration',
            credentialId: c.credentialId || c.credential_id || 'ID-VERIFIED',
            verifyUrl: c.credentialUrl || c.credential_url || '',
          }))
        : MOCK_STUDENT_PROFILE.certifications,
    resumes:
      Array.isArray(data.resumes)
        ? data.resumes.map((r, idx) => ({
            id: r.id || `res_${idx}`,
            name: r.name || r.fileName || r.file_name || 'Resume.pdf',
            uploadDate: r.uploadedAt ? new Date(r.uploadedAt).toLocaleDateString('en-GB') : 'Today',
            size: r.size || '1.2 MB',
            isPrimary: r.isActive ?? r.isPrimary ?? true,
            atsScore: r.atsScore || 92,
            fileUrl: r.fileUrl || r.file_url || '#',
          }))
        : MOCK_STUDENT_PROFILE.resumes,
    academics: {
      ...MOCK_STUDENT_PROFILE.academics,
      overallCgpa: data.cgpa ? parseFloat(data.cgpa) : MOCK_STUDENT_PROFILE.academics.overallCgpa,
      currentSgpa: data.cgpa ? parseFloat(data.cgpa) : MOCK_STUDENT_PROFILE.academics.currentSgpa,
    },
    stats: {
      ...MOCK_STUDENT_PROFILE.stats,
      ...(data.stats || {}),
    },
  };
};

export const studentService = {
  getProfile: async () => {
    try {
      // Endpoint: GET /api/students/profile
      const res = await apiClient.get('/students/profile');
      const data = res?.data || res;
      return normalizeStudentProfile(data);
    } catch {
      await mockDelay();
      return MOCK_STUDENT_PROFILE;
    }
  },

  updateProfile: async (updatedData) => {
    try {
      // Endpoint: PUT /api/students/profile
      const res = await apiClient.put('/students/profile', updatedData);
      const data = res?.data || res;
      return normalizeStudentProfile(data);
    } catch {
      await mockDelay();
      Object.assign(MOCK_STUDENT_PROFILE, updatedData);
      return MOCK_STUDENT_PROFILE;
    }
  },

  getAcademics: async () => {
    try {
      // Endpoint: GET /api/students/academics
      const res = await apiClient.get('/students/academics');
      const data = res?.data || res;
      const records = data?.records || (Array.isArray(data) ? data : []);
      const semesters = records.map((r, idx) => ({
        id: r.id,
        sem: parseInt(String(r.semester).replace(/[^0-9]/g, ''), 10) || idx + 1,
        year: r.academicYear || `Year ${Math.ceil((idx + 1) / 2)}`,
        sgpa: parseFloat(r.cgpa || 0),
        totalCredits: 24,
        status: (parseInt(r.backlogs, 10) || 0) === 0 ? 'Passed' : 'Backlog',
        backlogs: parseInt(r.backlogs, 10) || 0,
      }));
      const sgpaHistory = semesters.map((s) => ({
        semester: `Sem ${s.sem}`,
        sgpa: s.sgpa,
      }));
      return {
        ...MOCK_STUDENT_PROFILE.academics,
        ...data,
        overallCgpa:
          data?.overallCgpa ??
          (semesters.length
            ? parseFloat((semesters.reduce((a, b) => a + b.sgpa, 0) / semesters.length).toFixed(2))
            : MOCK_STUDENT_PROFILE.academics.overallCgpa),
        currentSgpa: semesters.length
          ? semesters[semesters.length - 1].sgpa
          : MOCK_STUDENT_PROFILE.academics.currentSgpa,
        activeBacklogs: data?.totalBacklogs ?? MOCK_STUDENT_PROFILE.academics.activeBacklogs,
        semesters: semesters.length ? semesters : MOCK_STUDENT_PROFILE.academics.semesters,
        sgpaHistory: sgpaHistory.length ? sgpaHistory : MOCK_STUDENT_PROFILE.academics.sgpaHistory,
      };
    } catch {
      await mockDelay();
      return MOCK_STUDENT_PROFILE.academics;
    }
  },

  addSkill: async (skillData) => {
    return await apiClient.post('/students/skills', {
      name: skillData.name,
      skill_name: skillData.name,
      level: (skillData.level || 'INTERMEDIATE').toUpperCase(),
      proficiency_level: (skillData.level || 'INTERMEDIATE').toUpperCase(),
      category: skillData.category || 'Technical',
      skill_category: skillData.category || 'Technical',
    });
  },

  deleteSkill: async (id) => {
    return await apiClient.delete(`/students/skills/${id}`);
  },

  addProject: async (projectData) => {
    return await apiClient.post('/students/projects', {
      title: projectData.title,
      project_title: projectData.title,
      description: projectData.description || 'Student engineering project',
      technologies: Array.isArray(projectData.technologies)
        ? projectData.technologies.join(', ')
        : projectData.technologies || 'React, Node.js',
      live_url: projectData.liveLink || undefined,
      github_url: projectData.githubLink || undefined,
    });
  },

  deleteProject: async (id) => {
    return await apiClient.delete(`/students/projects/${id}`);
  },

  addCertification: async (certData) => {
    let issueStr = new Date().toISOString().slice(0, 10);
    if (certData.issueDate) {
      const d = new Date(certData.issueDate);
      if (!isNaN(d.getTime())) issueStr = d.toISOString().slice(0, 10);
    }
    return await apiClient.post('/students/certifications', {
      name: certData.name,
      certification_name: certData.name,
      issuer: certData.issuer || 'Online Certification Body',
      issuing_organization: certData.issuer || 'Online Certification Body',
      issue_date: issueStr,
      expiry_date: certData.expiryDate ? new Date(certData.expiryDate).toISOString().slice(0, 10) : undefined,
      credential_id: certData.credentialId || undefined,
      credential_url: certData.verifyUrl || undefined,
    });
  },

  deleteCertification: async (id) => {
    return await apiClient.delete(`/students/certifications/${id}`);
  },

  getResumes: async () => {
    try {
      const res = await apiClient.get('/students/resumes');
      return Array.isArray(res) ? res : res?.data || [];
    } catch {
      await mockDelay();
      return MOCK_STUDENT_PROFILE.resumes;
    }
  },

  uploadResume: async (dataOrFormData) => {
    const payload = {
      file_name: dataOrFormData?.name || dataOrFormData?.fileName || 'Resume_Document.pdf',
      file_url: dataOrFormData?.fileUrl || dataOrFormData?.file_url || 'https://smartplacify.edu/resumes/resume.pdf',
      is_active: true,
    };
    return await apiClient.post('/students/resumes', payload);
  },

  deleteResume: async (id) => {
    return await apiClient.delete(`/students/resumes/${id}`);
  },

  getEligibleJobs: async () => {
    try {
      const res = await apiClient.get('/students/eligible-jobs');
      return Array.isArray(res) ? res : res?.data || [];
    } catch {
      await mockDelay();
      return [];
    }
  },

  getPlacementStatus: async () => {
    try {
      const res = await apiClient.get('/students/placement-status');
      return res?.data || res;
    } catch {
      await mockDelay();
      return { status: 'Not Placed' };
    }
  },
};

