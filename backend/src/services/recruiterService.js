import { query, pool } from '../config/database.js';
import * as companyService from './companyService.js';
import { updateRecruiterApplicationStatus } from './applicationService.js';

/**
 * Format raw recruiter row to standard object
 */
const formatRecruiterProfile = (row) => ({
  id: row.recruiterId,
  userId: row.userId,
  name: row.name,
  email: row.email,
  phone: row.phone || '',
  role: row.role,
  status: row.status,
  designation: row.designation || 'Recruiter',
  recruiterCode: row.recruiterCode || '',
  lastLogin: row.lastLogin,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
  companyId: row.companyId || null,
  company: row.companyId
    ? {
        id: row.companyId,
        companyName: row.companyName,
        name: row.companyName,
        industry: row.companyIndustry || '',
        website: row.companyWebsite || '',
        location: row.companyLocation || '',
        logoUrl: row.companyLogoUrl || '',
        logo: row.companyLogoUrl || '',
        status: row.companyStatus || 'ACTIVE',
      }
    : null,
});

/**
 * 1. GET /api/recruiters/profile
 */
export const getRecruiterProfile = async (userId) => {
  const res = await query(
    `SELECT 
       r.id as "recruiterId",
       r.user_id as "userId",
       r.company_id as "companyId",
       r.designation,
       r.recruiter_code as "recruiterCode",
       r.created_at as "createdAt",
       r.updated_at as "updatedAt",
       u.name,
       u.email,
       u.phone,
       u.role,
       u.status,
       u.last_login as "lastLogin",
       c.company_name as "companyName",
       c.industry as "companyIndustry",
       c.website as "companyWebsite",
       c.location as "companyLocation",
       c.logo_url as "companyLogoUrl",
       c.status as "companyStatus"
     FROM users u
     LEFT JOIN recruiters r ON u.id = r.user_id
     LEFT JOIN companies c ON r.company_id = c.id
     WHERE u.id = $1`,
    [userId]
  );

  if (res.rows.length === 0) {
    const error = new Error('Recruiter profile not found');
    error.statusCode = 404;
    throw error;
  }

  return formatRecruiterProfile(res.rows[0]);
};

/**
 * 2. PUT /api/recruiters/profile
 */
export const updateRecruiterProfile = async (userId, data) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Update users table (name, phone)
    if (data.name !== undefined || data.phone !== undefined) {
      await client.query(
        `UPDATE users
         SET name = COALESCE($1, name),
             phone = COALESCE($2, phone),
             updated_at = NOW()
         WHERE id = $3`,
        [data.name, data.phone, userId]
      );
    }

    // Update recruiters table (designation)
    if (data.designation !== undefined) {
      // Ensure recruiter row exists
      const recCheck = await client.query('SELECT id FROM recruiters WHERE user_id = $1', [userId]);
      if (recCheck.rows.length === 0) {
        const recruiterCode = `REC-${Date.now().toString().slice(-6)}`;
        await client.query(
          `INSERT INTO recruiters (user_id, designation, recruiter_code)
           VALUES ($1, $2, $3)`,
          [userId, data.designation, recruiterCode]
        );
      } else {
        await client.query(
          `UPDATE recruiters
           SET designation = COALESCE($1, designation),
               updated_at = NOW()
           WHERE user_id = $2`,
          [data.designation, userId]
        );
      }
    }

    await client.query('COMMIT');
    return getRecruiterProfile(userId);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * 3. GET /api/recruiters/company
 */
export const getRecruiterCompany = async (userId) => {
  const recCheck = await query('SELECT company_id FROM recruiters WHERE user_id = $1', [userId]);
  const companyId = recCheck.rows[0]?.company_id;

  if (!companyId) {
    const error = new Error('No company currently linked to this recruiter profile');
    error.statusCode = 404;
    throw error;
  }

  return companyService.getCompanyById(companyId);
};

/**
 * 4. PUT /api/recruiters/company
 */
export const updateRecruiterCompany = async (userId, data) => {
  const recCheck = await query('SELECT company_id FROM recruiters WHERE user_id = $1', [userId]);
  let companyId = recCheck.rows[0]?.company_id;

  if (!companyId) {
    // If recruiter has no company linked yet, link to first company or create one
    const firstCompany = await query('SELECT id FROM companies ORDER BY created_at ASC LIMIT 1');
    if (firstCompany.rows.length > 0) {
      companyId = firstCompany.rows[0].id;
      await query('UPDATE recruiters SET company_id = $1 WHERE user_id = $2', [companyId, userId]);
    } else {
      const error = new Error('No company currently linked to this recruiter profile');
      error.statusCode = 404;
      throw error;
    }
  }

  return companyService.updateCompany(companyId, data, { id: userId, role: 'RECRUITER' });
};

/**
 * 7. GET /api/recruiters/dashboard
 */
export const getRecruiterDashboard = async (userId) => {
  // Find recruiter's company
  const recRes = await query(
    `SELECT r.id as "recruiterId", r.company_id as "companyId"
     FROM recruiters r
     WHERE r.user_id = $1`,
    [userId]
  );

  const companyId = recRes.rows[0]?.companyId || recRes.rows[0]?.company_id;

  if (!companyId) {
    return {
      company: null,
      totalJobs: 0,
      activeJobs: 0,
      totalApplications: 0,
      shortlistedCandidates: 0,
      selectedCandidates: 0,
      upcomingInterviews: [],
      upcomingInterviewsCount: 0,
      statusBreakdown: {
        APPLIED: 0,
        SCREENING: 0,
        SHORTLISTED: 0,
        INTERVIEW: 0,
        SELECTED: 0,
        REJECTED: 0,
        WITHDRAWN: 0,
      },
    };
  }

  // Fetch company info
  const company = await companyService.getCompanyById(companyId);

  // Statistics queries in parallel
  const [
    totalJobsRes,
    activeJobsRes,
    appsStatsRes,
    interviewsRes,
    upcomingCountRes,
  ] = await Promise.all([
    query('SELECT COUNT(*) as count FROM jobs WHERE company_id = $1', [companyId]),
    query("SELECT COUNT(*) as count FROM jobs WHERE company_id = $1 AND status = 'OPEN'", [companyId]),
    query(
      `SELECT 
         COUNT(*) as total_apps,
         COUNT(*) FILTER (WHERE a.status = 'APPLIED') as applied_count,
         COUNT(*) FILTER (WHERE a.status = 'SCREENING') as screening_count,
         COUNT(*) FILTER (WHERE a.status = 'SHORTLISTED') as shortlisted_count,
         COUNT(*) FILTER (WHERE a.status = 'INTERVIEW') as interview_count,
         COUNT(*) FILTER (WHERE a.status = 'SELECTED') as selected_count,
         COUNT(*) FILTER (WHERE a.status = 'REJECTED') as rejected_count,
         COUNT(*) FILTER (WHERE a.status = 'WITHDRAWN') as withdrawn_count
       FROM applications a
       JOIN jobs j ON a.job_id = j.id
       WHERE j.company_id = $1`,
      [companyId]
    ),
    query(
      `SELECT 
         i.id,
         i.interview_type as "interviewType",
         to_char(i.interview_date, 'YYYY-MM-DD') as "interviewDate",
         i.start_time as "startTime",
         i.end_time as "endTime",
         i.meeting_link as "meetingLink",
         i.location,
         i.status,
         j.id as "jobId",
         j.job_title as "jobTitle",
         u.name as "candidateName",
         u.email as "candidateEmail",
         s.roll_number as "candidateRollNumber"
       FROM interviews i
       JOIN applications a ON i.application_id = a.id
       JOIN jobs j ON a.job_id = j.id
       JOIN students s ON a.student_id = s.id
       JOIN users u ON s.user_id = u.id
       WHERE j.company_id = $1
         AND i.status = 'SCHEDULED'
         AND i.interview_date >= CURRENT_DATE
       ORDER BY i.interview_date ASC, i.start_time ASC
       LIMIT 10`,
      [companyId]
    ),
    query(
      `SELECT COUNT(*) as count
       FROM interviews i
       JOIN applications a ON i.application_id = a.id
       JOIN jobs j ON a.job_id = j.id
       WHERE j.company_id = $1
         AND i.status = 'SCHEDULED'
         AND i.interview_date >= CURRENT_DATE`,
      [companyId]
    ),
  ]);

  const appsStats = appsStatsRes.rows[0] || {};

  return {
    company,
    totalJobs: parseInt(totalJobsRes.rows[0]?.count || 0, 10),
    activeJobs: parseInt(activeJobsRes.rows[0]?.count || 0, 10),
    totalApplications: parseInt(appsStats.total_apps || 0, 10),
    shortlistedCandidates: parseInt(appsStats.shortlisted_count || 0, 10),
    selectedCandidates: parseInt(appsStats.selected_count || 0, 10),
    upcomingInterviews: interviewsRes.rows,
    upcomingInterviewsCount: parseInt(upcomingCountRes.rows[0]?.count || 0, 10),
    statusBreakdown: {
      APPLIED: parseInt(appsStats.applied_count || 0, 10),
      SCREENING: parseInt(appsStats.screening_count || 0, 10),
      SHORTLISTED: parseInt(appsStats.shortlisted_count || 0, 10),
      INTERVIEW: parseInt(appsStats.interview_count || 0, 10),
      SELECTED: parseInt(appsStats.selected_count || 0, 10),
      REJECTED: parseInt(appsStats.rejected_count || 0, 10),
      WITHDRAWN: parseInt(appsStats.withdrawn_count || 0, 10),
    },
  };
};

/**
 * 8. GET /api/recruiters/jobs
 */
export const getRecruiterJobs = async (userId, userRole, filters = {}) => {
  let companyId = null;

  if (userRole === 'RECRUITER') {
    const recCheck = await query('SELECT company_id FROM recruiters WHERE user_id = $1', [userId]);
    companyId = recCheck.rows[0]?.company_id;
    if (!companyId) return [];
  } else if (filters.companyId) {
    companyId = filters.companyId;
  }

  let queryText = `
    SELECT 
      j.id,
      j.company_id as "companyId",
      j.recruiter_id as "recruiterId",
      j.job_title as "jobTitle",
      j.job_title as "title",
      j.job_description as "jobDescription",
      j.job_description as "description",
      j.job_type as "jobType",
      j.location,
      j.work_mode as "workMode",
      j.salary_min as "salaryMin",
      j.salary_max as "salaryMax",
      j.experience_required as "experienceRequired",
      j.minimum_cgpa as "minimumCgpa",
      j.graduation_year as "graduationYear",
      to_char(j.application_deadline, 'YYYY-MM-DD') as "applicationDeadline",
      j.status,
      j.created_at as "createdAt",
      j.updated_at as "updatedAt",
      c.company_name as "companyName",
      c.logo_url as "companyLogo",
      COUNT(DISTINCT a.id) as "applicationsCount",
      COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'SHORTLISTED') as "shortlistedCount",
      COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'SELECTED') as "selectedCount",
      COUNT(DISTINCT i.id) as "interviewsCount",
      COALESCE(
        ARRAY_AGG(DISTINCT s.skill_name) FILTER (WHERE s.skill_name IS NOT NULL),
        '{}'
      ) as "skillsRequired"
    FROM jobs j
    JOIN companies c ON j.company_id = c.id
    LEFT JOIN applications a ON j.id = a.job_id
    LEFT JOIN interviews i ON a.id = i.application_id
    LEFT JOIN job_skills js ON j.id = js.job_id
    LEFT JOIN skills s ON js.skill_id = s.id
    WHERE 1=1
  `;
  const params = [];

  if (companyId) {
    params.push(companyId);
    queryText += ` AND j.company_id = $${params.length}`;
  }

  if (filters.status && filters.status !== 'ALL') {
    params.push(filters.status.toUpperCase());
    queryText += ` AND j.status = $${params.length}`;
  }

  if (filters.jobType) {
    params.push(filters.jobType.toUpperCase());
    queryText += ` AND j.job_type = $${params.length}`;
  }

  if (filters.search) {
    params.push(`%${filters.search.toLowerCase()}%`);
    queryText += ` AND (LOWER(j.job_title) LIKE $${params.length} OR LOWER(j.location) LIKE $${params.length})`;
  }

  queryText += `
    GROUP BY j.id, c.id
    ORDER BY j.created_at DESC
  `;

  const res = await query(queryText, params);
  return res.rows.map((row) => ({
    ...row,
    salaryMin: row.salaryMin ? parseFloat(row.salaryMin) : null,
    salaryMax: row.salaryMax ? parseFloat(row.salaryMax) : null,
    minimumCgpa: row.minimumCgpa ? parseFloat(row.minimumCgpa) : 0,
    applicationsCount: parseInt(row.applicationsCount || 0, 10),
    shortlistedCount: parseInt(row.shortlistedCount || 0, 10),
    selectedCount: parseInt(row.selectedCount || 0, 10),
    interviewsCount: parseInt(row.interviewsCount || 0, 10),
  }));
};

/**
 * 9. GET /api/recruiters/jobs/:id
 */
export const getRecruiterJobById = async (userId, userRole, jobId) => {
  // Query job by UUID
  const jobRes = await query(
    `SELECT 
       j.id,
       j.company_id as "companyId",
       j.recruiter_id as "recruiterId",
       j.job_title as "jobTitle",
       j.job_title as "title",
       j.job_description as "jobDescription",
       j.job_description as "description",
       j.job_type as "jobType",
       j.location,
       j.work_mode as "workMode",
       j.salary_min as "salaryMin",
       j.salary_max as "salaryMax",
       j.experience_required as "experienceRequired",
       j.minimum_cgpa as "minimumCgpa",
       j.graduation_year as "graduationYear",
       to_char(j.application_deadline, 'YYYY-MM-DD') as "applicationDeadline",
       j.status,
       j.created_at as "createdAt",
       j.updated_at as "updatedAt",
       c.company_name as "companyName",
       c.logo_url as "companyLogo",
       c.website as "companyWebsite",
       c.location as "companyLocation",
       COUNT(DISTINCT a.id) as "applicationsCount",
       COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'SHORTLISTED') as "shortlistedCount",
       COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'SELECTED') as "selectedCount",
       COUNT(DISTINCT i.id) as "interviewsCount",
       COALESCE(
         ARRAY_AGG(DISTINCT s.skill_name) FILTER (WHERE s.skill_name IS NOT NULL),
         '{}'
       ) as "skillsRequired"
     FROM jobs j
     JOIN companies c ON j.company_id = c.id
     LEFT JOIN applications a ON j.id = a.job_id
     LEFT JOIN interviews i ON a.id = i.application_id
     LEFT JOIN job_skills js ON j.id = js.job_id
     LEFT JOIN skills s ON js.skill_id = s.id
     WHERE j.id = $1
     GROUP BY j.id, c.id`,
    [jobId]
  );

  if (jobRes.rows.length === 0) {
    const error = new Error('Job not found');
    error.statusCode = 404;
    throw error;
  }

  const job = jobRes.rows[0];

  // Security: If recruiter, ensure job belongs to their company
  if (userRole === 'RECRUITER') {
    const recCheck = await query('SELECT company_id FROM recruiters WHERE user_id = $1', [userId]);
    const recruiterCompanyId = recCheck.rows[0]?.company_id;
    if (!recruiterCompanyId || recruiterCompanyId !== job.companyId) {
      const error = new Error('Access denied: You do not have permission to view this job');
      error.statusCode = 403;
      throw error;
    }
  }

  // Also fetch applications breakdown for this job
  const appsRes = await query(
    `SELECT 
       a.id,
       a.status,
       to_char(a.applied_at, 'YYYY-MM-DD HH24:MI') as "appliedAt",
       u.name as "candidateName",
       u.email as "candidateEmail",
       u.phone as "candidatePhone",
       s.roll_number as "rollNumber",
       s.cgpa,
       s.graduation_year as "graduationYear"
     FROM applications a
     JOIN students s ON a.student_id = s.id
     JOIN users u ON s.user_id = u.id
     WHERE a.job_id = $1
     ORDER BY a.applied_at DESC
     LIMIT 20`,
    [jobId]
  );

  return {
    ...job,
    salaryMin: job.salaryMin ? parseFloat(job.salaryMin) : null,
    salaryMax: job.salaryMax ? parseFloat(job.salaryMax) : null,
    minimumCgpa: job.minimumCgpa ? parseFloat(job.minimumCgpa) : 0,
    applicationsCount: parseInt(job.applicationsCount || 0, 10),
    shortlistedCount: parseInt(job.shortlistedCount || 0, 10),
    selectedCount: parseInt(job.selectedCount || 0, 10),
    interviewsCount: parseInt(job.interviewsCount || 0, 10),
    recentApplications: appsRes.rows,
  };
};

/**
 * Candidate management for recruiter's company
 */
export const getCandidates = async (userId, userRole, params = {}) => {
  let companyId = null;

  if (userRole === 'RECRUITER') {
    const recCheck = await query('SELECT company_id FROM recruiters WHERE user_id = $1', [userId]);
    companyId = recCheck.rows[0]?.company_id;
    if (!companyId) return [];
  } else if (params.companyId) {
    companyId = params.companyId;
  }

  let queryText = `
    SELECT 
      a.id,
      a.job_id as "jobId",
      a.student_id as "studentId",
      a.resume_id as "resumeId",
      a.cover_letter as "coverLetter",
      a.status,
      a.applied_at as "appliedAt",
      j.job_title as "jobTitle",
      u.name as "studentName",
      u.email as "studentEmail",
      u.phone as "studentPhone",
      s.roll_number as "rollNumber",
      s.cgpa,
      s.graduation_year as "graduationYear",
      d.department_name as "department",
      r.file_url as "resumeUrl"
    FROM applications a
    JOIN jobs j ON a.job_id = j.id
    JOIN students s ON a.student_id = s.id
    JOIN users u ON s.user_id = u.id
    LEFT JOIN departments d ON s.department_id = d.id
    LEFT JOIN resumes r ON a.resume_id = r.id
    WHERE 1=1
  `;
  const queryParams = [];

  if (companyId) {
    queryParams.push(companyId);
    queryText += ` AND j.company_id = $${queryParams.length}`;
  }

  if (params.jobId) {
    queryParams.push(params.jobId);
    queryText += ` AND a.job_id = $${queryParams.length}`;
  }

  if (params.status) {
    queryParams.push(params.status.toUpperCase());
    queryText += ` AND a.status = $${queryParams.length}`;
  }

  queryText += ` ORDER BY a.applied_at DESC`;

  const res = await query(queryText, queryParams);
  return res.rows;
};

/**
 * Shortlist candidate with multi-tenant company check
 */
export const shortlistCandidate = async (applicationId, userId, userRole) => {
  return updateRecruiterApplicationStatus(userId, userRole, applicationId, 'SHORTLISTED', 'Candidate shortlisted by recruiter');
};

/**
 * Reject candidate with multi-tenant company check
 */
export const rejectCandidate = async (applicationId, userId, userRole) => {
  return updateRecruiterApplicationStatus(userId, userRole, applicationId, 'REJECTED', 'Application rejected by recruiter');
};
