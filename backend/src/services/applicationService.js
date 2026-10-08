import { query, pool } from '../config/database.js';
import { getStudentByUserId } from './studentService.js';

const ALLOWED_STATUSES = ['APPLIED', 'SHORTLISTED', 'REJECTED', 'SELECTED', 'WITHDRAWN', 'INTERVIEW', 'SCREENING'];

/**
 * Helper: Retrieve Recruiter's Company ID
 */
export const getRecruiterCompanyId = async (userId) => {
  const recRes = await query('SELECT company_id FROM recruiters WHERE user_id = $1', [userId]);
  if (recRes.rows.length === 0 || !recRes.rows[0].company_id) {
    const error = new Error('Recruiter profile or associated company not found.');
    error.statusCode = 404;
    throw error;
  }
  return recRes.rows[0].company_id;
};

// ============================================================================
// STUDENT APPLICATION SERVICES
// ============================================================================

/**
 * 1. POST /api/jobs/:jobId/apply
 * Applies for a job with full validation, eligibility checks, and transaction
 */
export const applyForJob = async (userId, jobId, options = {}) => {
  // Step 1: Verify student profile
  const student = await getStudentByUserId(userId);

  // Step 2: Verify job existence
  const jobRes = await query(
    `SELECT j.*, c.company_name, c.id as comp_id
     FROM jobs j
     JOIN companies c ON j.company_id = c.id
     WHERE j.id = $1`,
    [jobId]
  );

  if (jobRes.rows.length === 0) {
    const error = new Error('Job listing not found.');
    error.statusCode = 404;
    throw error;
  }
  const job = jobRes.rows[0];

  // Step 3: Verify job is OPEN
  if (job.status !== 'OPEN') {
    const error = new Error(`Cannot apply. This job listing is ${job.status.toLowerCase()}.`);
    error.statusCode = 400;
    throw error;
  }

  // Step 4: Verify application deadline has not passed
  if (job.application_deadline) {
    const deadline = new Date(job.application_deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (deadline < today) {
      const error = new Error('Application deadline for this job has passed.');
      error.statusCode = 400;
      throw error;
    }
  }

  // Step 5: Verify candidate eligibility
  // CGPA check
  const studentCgpa = parseFloat(student.cgpa || 0);
  const minCgpa = job.minimum_cgpa ? parseFloat(job.minimum_cgpa) : 0;
  if (minCgpa > 0 && studentCgpa < minCgpa) {
    const error = new Error(
      `Eligibility requirement not met: Minimum CGPA required is ${minCgpa.toFixed(2)}, your CGPA is ${studentCgpa.toFixed(2)}.`
    );
    error.statusCode = 400;
    throw error;
  }

  // Graduation year check
  if (job.graduation_year && student.graduation_year) {
    if (parseInt(student.graduation_year, 10) !== parseInt(job.graduation_year, 10)) {
      const error = new Error(
        `Eligibility requirement not met: Eligible batch is ${job.graduation_year}, your graduation year is ${student.graduation_year}.`
      );
      error.statusCode = 400;
      throw error;
    }
  }

  // Required skills check
  const reqSkillsRes = await query(
    `SELECT js.skill_id, s.skill_name
     FROM job_skills js
     JOIN skills s ON js.skill_id = s.id
     WHERE js.job_id = $1 AND js.is_required = TRUE`,
    [job.id]
  );

  if (reqSkillsRes.rows.length > 0) {
    const studentSkillsRes = await query(
      'SELECT skill_id FROM student_skills WHERE student_id = $1',
      [student.id]
    );
    const studentSkillIds = new Set(studentSkillsRes.rows.map((r) => r.skill_id));

    const missingSkills = reqSkillsRes.rows
      .filter((r) => !studentSkillIds.has(r.skill_id))
      .map((r) => r.skill_name);

    if (missingSkills.length > 0) {
      const error = new Error(
        `Eligibility requirement not met: Missing required skills: ${missingSkills.join(', ')}.`
      );
      error.statusCode = 400;
      throw error;
    }
  }

  // Step 6: Verify student has not already applied
  const existingApp = await query(
    'SELECT id, status FROM applications WHERE job_id = $1 AND student_id = $2',
    [job.id, student.id]
  );

  if (existingApp.rows.length > 0) {
    const error = new Error('You have already applied for this position.');
    error.statusCode = 409;
    throw error;
  }

  // Step 7: Resolve target resume
  let targetResumeId = options.resume_id || options.resumeId || null;
  if (targetResumeId) {
    const resCheck = await query(
      'SELECT id FROM resumes WHERE id = $1 AND student_id = $2',
      [targetResumeId, student.id]
    );
    if (resCheck.rows.length === 0) {
      targetResumeId = null;
    }
  }

  if (!targetResumeId) {
    const primaryRes = await query(
      'SELECT id FROM resumes WHERE student_id = $1 ORDER BY is_active DESC, uploaded_at DESC LIMIT 1',
      [student.id]
    );
    if (primaryRes.rows.length > 0) {
      targetResumeId = primaryRes.rows[0].id;
    }
  }

  const coverLetter = options.cover_letter || options.coverLetter || null;

  // Execute database transaction
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Insert application
    const appInsert = await client.query(
      `INSERT INTO applications (job_id, student_id, resume_id, cover_letter, status)
       VALUES ($1, $2, $3, $4, 'APPLIED')
       RETURNING *`,
      [job.id, student.id, targetResumeId, coverLetter]
    );
    const application = appInsert.rows[0];

    // 2. Insert application status history
    await client.query(
      `INSERT INTO application_status_history (application_id, old_status, new_status, changed_by, remarks)
       VALUES ($1, NULL, 'APPLIED', $2, 'Application submitted by candidate')`,
      [application.id, userId]
    );

    // 3. Insert notification for the student
    await client.query(
      `INSERT INTO notifications (user_id, title, message, notification_type, is_read)
       VALUES ($1, 'Application Submitted', $2, 'APPLICATION', FALSE)`,
      [
        userId,
        `Your application for ${job.job_title} at ${job.company_name} has been submitted successfully.`,
      ]
    );

    // 4. Notify recruiters for this company
    const recUsers = await client.query(
      'SELECT user_id FROM recruiters WHERE company_id = $1',
      [job.company_id]
    );
    for (const rec of recUsers.rows) {
      if (rec.user_id) {
        await client.query(
          `INSERT INTO notifications (user_id, title, message, notification_type, is_read)
           VALUES ($1, 'New Job Application', $2, 'APPLICATION', FALSE)`,
          [
            rec.user_id,
            `New application received for ${job.job_title} from ${student.name || 'a student'}.`,
          ]
        );
      }
    }

    await client.query('COMMIT');

    return {
      id: application.id,
      jobId: application.job_id,
      studentId: application.student_id,
      resumeId: application.resume_id,
      coverLetter: application.cover_letter,
      status: application.status,
      appliedAt: application.applied_at,
      updatedAt: application.updated_at,
      jobTitle: job.job_title,
      companyName: job.company_name,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * 2. GET /api/students/applications
 * Returns all applications for authenticated student
 */
export const getStudentApplications = async (userId) => {
  const student = await getStudentByUserId(userId);

  const res = await query(
    `SELECT a.id, a.job_id as "jobId", a.student_id as "studentId", a.resume_id as "resumeId",
            a.cover_letter as "coverLetter", a.status, a.applied_at as "appliedAt", a.updated_at as "updatedAt",
            j.job_title as "jobTitle", j.job_title as title, j.job_type as "jobType", j.location, j.work_mode as "workMode",
            j.salary_min as "salaryMin", j.salary_max as "salaryMax",
            c.id as "companyId", c.company_name as "companyName", c.company_name as company, c.logo_url as "companyLogo",
            r.file_name as "resumeName", r.file_url as "resumeUrl"
     FROM applications a
     JOIN jobs j ON a.job_id = j.id
     JOIN companies c ON j.company_id = c.id
     LEFT JOIN resumes r ON a.resume_id = r.id
     WHERE a.student_id = $1
     ORDER BY a.applied_at DESC`,
    [student.id]
  );

  return res.rows;
};

/**
 * 3. GET /api/students/applications/:id
 * Returns single application details with status history and interviews
 */
export const getStudentApplicationById = async (userId, applicationId) => {
  const student = await getStudentByUserId(userId);

  const appCheck = await query(
    `SELECT a.id, a.student_id, a.job_id, a.resume_id, a.cover_letter, a.status,
            a.applied_at, a.updated_at,
            j.job_title, j.job_type, j.location, j.work_mode, j.salary_min, j.salary_max,
            c.id as company_id, c.company_name, c.logo_url as company_logo,
            r.file_name as resume_name, r.file_url as resume_url
     FROM applications a
     JOIN jobs j ON a.job_id = j.id
     JOIN companies c ON j.company_id = c.id
     LEFT JOIN resumes r ON a.resume_id = r.id
     WHERE a.id = $1`,
    [applicationId]
  );

  if (appCheck.rows.length === 0) {
    const error = new Error('Application not found.');
    error.statusCode = 404;
    throw error;
  }

  const app = appCheck.rows[0];

  // Ownership verification
  if (app.student_id !== student.id) {
    const error = new Error('Access denied: You do not have permission to view this application.');
    error.statusCode = 403;
    throw error;
  }

  // Fetch status history
  const historyRes = await query(
    `SELECT id, old_status as "oldStatus", new_status as "newStatus", remarks, changed_at as "changedAt"
     FROM application_status_history
     WHERE application_id = $1
     ORDER BY changed_at ASC`,
    [applicationId]
  );

  // Fetch linked interviews
  const interviewsRes = await query(
    `SELECT id, interview_type as "interviewType", interview_date as "interviewDate",
            start_time as "startTime", end_time as "endTime", meeting_link as "meetingLink",
            location, status, feedback, created_at as "createdAt"
     FROM interviews
     WHERE application_id = $1
     ORDER BY interview_date ASC`,
    [applicationId]
  );

  return {
    id: app.id,
    jobId: app.job_id,
    studentId: app.student_id,
    resumeId: app.resume_id,
    coverLetter: app.cover_letter,
    status: app.status,
    appliedAt: app.applied_at,
    updatedAt: app.updated_at,
    jobTitle: app.job_title,
    title: app.job_title,
    jobType: app.job_type,
    location: app.location,
    workMode: app.work_mode,
    salaryMin: app.salary_min ? parseFloat(app.salary_min) : null,
    salaryMax: app.salary_max ? parseFloat(app.salary_max) : null,
    company: {
      id: app.company_id,
      name: app.company_name,
      companyName: app.company_name,
      logo: app.company_logo,
      logoUrl: app.company_logo,
    },
    resume: app.resume_id
      ? {
          id: app.resume_id,
          fileName: app.resume_name,
          fileUrl: app.resume_url,
        }
      : null,
    statusHistory: historyRes.rows,
    interviews: interviewsRes.rows,
  };
};

/**
 * 4. POST /api/students/applications/:id/withdraw
 * Allows student to withdraw own application with transaction
 */
export const withdrawStudentApplication = async (userId, applicationId) => {
  const student = await getStudentByUserId(userId);

  const check = await query(
    `SELECT a.id, a.student_id, a.status, j.job_title, j.company_id
     FROM applications a
     JOIN jobs j ON a.job_id = j.id
     WHERE a.id = $1`,
    [applicationId]
  );

  if (check.rows.length === 0) {
    const error = new Error('Application not found.');
    error.statusCode = 404;
    throw error;
  }

  const app = check.rows[0];

  // Ownership verification
  if (app.student_id !== student.id) {
    const error = new Error('Access denied: You do not have permission to withdraw this application.');
    error.statusCode = 403;
    throw error;
  }

  if (app.status === 'WITHDRAWN') {
    const error = new Error('Application is already withdrawn.');
    error.statusCode = 400;
    throw error;
  }

  if (['SELECTED', 'REJECTED'].includes(app.status)) {
    const error = new Error(`Cannot withdraw an application that is already ${app.status}.`);
    error.statusCode = 400;
    throw error;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const updateRes = await client.query(
      `UPDATE applications
       SET status = 'WITHDRAWN', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [applicationId]
    );

    // Audit log
    await client.query(
      `INSERT INTO application_status_history (application_id, old_status, new_status, changed_by, remarks)
       VALUES ($1, $2, 'WITHDRAWN', $3, 'Application withdrawn by candidate')`,
      [applicationId, app.status, userId]
    );

    // Notification for candidate
    await client.query(
      `INSERT INTO notifications (user_id, title, message, notification_type, is_read)
       VALUES ($1, 'Application Withdrawn', $2, 'APPLICATION', FALSE)`,
      [userId, `Your application for ${app.job_title} has been withdrawn.`]
    );

    // Notification for company recruiters
    const recUsers = await client.query(
      'SELECT user_id FROM recruiters WHERE company_id = $1',
      [app.company_id]
    );
    for (const rec of recUsers.rows) {
      if (rec.user_id) {
        await client.query(
          `INSERT INTO notifications (user_id, title, message, notification_type, is_read)
           VALUES ($1, 'Application Withdrawn', $2, 'APPLICATION', FALSE)`,
          [
            rec.user_id,
            `Candidate ${student.name || 'Student'} withdrew their application for ${app.job_title}.`,
          ]
        );
      }
    }

    await client.query('COMMIT');

    const updated = updateRes.rows[0];
    return {
      id: updated.id,
      jobId: updated.job_id,
      studentId: updated.student_id,
      status: updated.status,
      appliedAt: updated.applied_at,
      updatedAt: updated.updated_at,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// ============================================================================
// RECRUITER APPLICATION SERVICES
// ============================================================================

/**
 * 5. GET /api/recruiters/applications
 * Returns applications for recruiter's company with search, filters, pagination
 */
export const getRecruiterApplications = async (userId, userRole, params = {}) => {
  let companyId = null;

  if (userRole === 'RECRUITER') {
    companyId = await getRecruiterCompanyId(userId);
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
      a.updated_at as "updatedAt",
      j.job_title as "jobTitle",
      j.job_type as "jobType",
      j.location as "jobLocation",
      j.company_id as "companyId",
      c.company_name as "companyName",
      u.name as "candidateName",
      u.name as "studentName",
      u.email as "candidateEmail",
      u.email as "studentEmail",
      u.phone as "candidatePhone",
      u.phone as "studentPhone",
      s.roll_number as "rollNumber",
      s.roll_number as "enrollmentNo",
      s.student_id as "studentIdNumber",
      s.cgpa,
      s.graduation_year as "graduationYear",
      d.department_name as "department",
      r.file_name as "resumeName",
      r.file_url as "resumeUrl"
    FROM applications a
    JOIN jobs j ON a.job_id = j.id
    JOIN companies c ON j.company_id = c.id
    JOIN students s ON a.student_id = s.id
    JOIN users u ON s.user_id = u.id
    LEFT JOIN departments d ON s.department_id = d.id
    LEFT JOIN resumes r ON a.resume_id = r.id
    WHERE 1=1
  `;
  const queryParams = [];

  // Recruiter multi-tenant isolation
  if (companyId) {
    queryParams.push(companyId);
    queryText += ` AND j.company_id = $${queryParams.length}`;
  }

  // Filter by job ID
  if (params.jobId) {
    queryParams.push(params.jobId);
    queryText += ` AND a.job_id = $${queryParams.length}`;
  }

  // Filter by application status
  if (params.status) {
    queryParams.push(params.status.toUpperCase());
    queryText += ` AND UPPER(a.status) = $${queryParams.length}`;
  }

  // Search keyword (candidate name, email, roll number, job title)
  if (params.search && params.search.trim()) {
    queryParams.push(`%${params.search.trim().toLowerCase()}%`);
    queryText += ` AND (
      LOWER(u.name) LIKE $${queryParams.length} OR
      LOWER(u.email) LIKE $${queryParams.length} OR
      LOWER(s.roll_number) LIKE $${queryParams.length} OR
      LOWER(j.job_title) LIKE $${queryParams.length}
    )`;
  }

  // Total count query for pagination
  const countQuery = `SELECT count(*) FROM (${queryText}) as count_subquery`;
  const countRes = await query(countQuery, queryParams);
  const total = parseInt(countRes.rows[0].count, 10);

  // Sorting
  queryText += ` ORDER BY a.applied_at DESC`;

  // Pagination
  const page = parseInt(params.page || 1, 10);
  const limit = parseInt(params.limit || 50, 10);
  const offset = (page - 1) * limit;

  queryParams.push(limit);
  queryText += ` LIMIT $${queryParams.length}`;
  queryParams.push(offset);
  queryText += ` OFFSET $${queryParams.length}`;

  const res = await query(queryText, queryParams);

  const applications = res.rows.map((row) => ({
    ...row,
    cgpa: row.cgpa ? parseFloat(row.cgpa) : 0,
    resume: row.resumeId
      ? {
          id: row.resumeId,
          fileName: row.resumeName,
          fileUrl: row.resumeUrl,
        }
      : null,
  }));

  return {
    applications,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

/**
 * 6. GET /api/recruiters/applications/:id
 * Returns complete single application details for recruiter with security check
 */
export const getRecruiterApplicationById = async (userId, userRole, applicationId) => {
  const appRes = await query(
    `SELECT 
      a.id,
      a.job_id as "jobId",
      a.student_id as "studentId",
      a.resume_id as "resumeId",
      a.cover_letter as "coverLetter",
      a.status,
      a.applied_at as "appliedAt",
      a.updated_at as "updatedAt",
      j.job_title as "jobTitle",
      j.job_type as "jobType",
      j.location as "jobLocation",
      j.work_mode as "workMode",
      j.salary_min as "salaryMin",
      j.salary_max as "salaryMax",
      j.status as "jobStatus",
      j.minimum_cgpa as "minimumCgpa",
      j.graduation_year as "jobGraduationYear",
      j.company_id as "companyId",
      c.company_name as "companyName",
      u.name as "candidateName",
      u.name as "studentName",
      u.email as "candidateEmail",
      u.email as "studentEmail",
      u.phone as "candidatePhone",
      s.roll_number as "rollNumber",
      s.roll_number as "enrollmentNo",
      s.student_id as "studentIdNumber",
      s.cgpa,
      s.graduation_year as "graduationYear",
      d.department_name as "department",
      cour.course_name as "course",
      r.file_name as "resumeName",
      r.file_url as "resumeUrl"
    FROM applications a
    JOIN jobs j ON a.job_id = j.id
    JOIN companies c ON j.company_id = c.id
    JOIN students s ON a.student_id = s.id
    JOIN users u ON s.user_id = u.id
    LEFT JOIN departments d ON s.department_id = d.id
    LEFT JOIN courses cour ON s.course_id = cour.id
    LEFT JOIN resumes r ON a.resume_id = r.id
    WHERE a.id = $1`,
    [applicationId]
  );

  if (appRes.rows.length === 0) {
    const error = new Error('Application not found.');
    error.statusCode = 404;
    throw error;
  }

  const row = appRes.rows[0];

  // Recruiter multi-tenant isolation: verify application belongs to recruiter's company
  if (userRole === 'RECRUITER') {
    const recruiterCompanyId = await getRecruiterCompanyId(userId);
    if (recruiterCompanyId !== row.companyId) {
      const error = new Error('Access denied: You can only view applications for your company\'s jobs.');
      error.statusCode = 403;
      throw error;
    }
  }

  // Fetch student skills
  const skillsRes = await query(
    `SELECT s.id, s.skill_name as "skillName", ss.proficiency_level as "proficiency"
     FROM student_skills ss
     JOIN skills s ON ss.skill_id = s.id
     WHERE ss.student_id = $1`,
    [row.studentId]
  );

  // Fetch status history
  const historyRes = await query(
    `SELECT 
      ash.id,
      ash.old_status as "oldStatus",
      ash.new_status as "newStatus",
      ash.remarks,
      ash.changed_at as "changedAt",
      u.name as "changedByName"
     FROM application_status_history ash
     LEFT JOIN users u ON ash.changed_by = u.id
     WHERE ash.application_id = $1
     ORDER BY ash.changed_at ASC`,
    [applicationId]
  );

  // Fetch scheduled interviews
  const interviewsRes = await query(
    `SELECT 
      id,
      interview_type as "interviewType",
      interview_date as "interviewDate",
      start_time as "startTime",
      end_time as "endTime",
      meeting_link as "meetingLink",
      location,
      status,
      feedback,
      created_at as "createdAt"
     FROM interviews
     WHERE application_id = $1
     ORDER BY interview_date ASC`,
    [applicationId]
  );

  return {
    id: row.id,
    jobId: row.jobId,
    studentId: row.studentId,
    status: row.status,
    coverLetter: row.coverLetter,
    appliedAt: row.appliedAt,
    updatedAt: row.updatedAt,
    job: {
      id: row.jobId,
      title: row.jobTitle,
      jobTitle: row.jobTitle,
      jobType: row.jobType,
      location: row.jobLocation,
      workMode: row.workMode,
      salaryMin: row.salaryMin ? parseFloat(row.salaryMin) : null,
      salaryMax: row.salaryMax ? parseFloat(row.salaryMax) : null,
      status: row.jobStatus,
      minimumCgpa: row.minimumCgpa ? parseFloat(row.minimumCgpa) : 0,
      graduationYear: row.jobGraduationYear,
      companyId: row.companyId,
      companyName: row.companyName,
    },
    candidate: {
      id: row.studentId,
      name: row.candidateName,
      email: row.candidateEmail,
      phone: row.candidatePhone,
      rollNumber: row.rollNumber,
      enrollmentNo: row.enrollmentNo,
      cgpa: row.cgpa ? parseFloat(row.cgpa) : 0,
      graduationYear: row.graduationYear,
      department: row.department,
      course: row.course,
      skills: skillsRes.rows,
    },
    resume: row.resumeId
      ? {
          id: row.resumeId,
          fileName: row.resumeName,
          fileUrl: row.resumeUrl,
        }
      : null,
    statusHistory: historyRes.rows,
    interviews: interviewsRes.rows,
  };
};

/**
 * 7. PUT /api/recruiters/applications/:id/status
 * Updates application status with tenant ownership checks, history logging, and notifications
 */
export const updateRecruiterApplicationStatus = async (userId, userRole, applicationId, targetStatus, remarks = '') => {
  const normStatus = (targetStatus || '').trim().toUpperCase();

  if (!ALLOWED_STATUSES.includes(normStatus)) {
    const error = new Error(`Invalid status: ${targetStatus}. Allowed statuses: ${ALLOWED_STATUSES.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }

  // Fetch current application
  const appRes = await query(
    `SELECT 
      a.id,
      a.status,
      a.student_id,
      j.id as job_id,
      j.job_title,
      j.company_id,
      c.company_name,
      s.user_id as student_user_id
     FROM applications a
     JOIN jobs j ON a.job_id = j.id
     JOIN companies c ON j.company_id = c.id
     JOIN students s ON a.student_id = s.id
     WHERE a.id = $1`,
    [applicationId]
  );

  if (appRes.rows.length === 0) {
    const error = new Error('Application not found.');
    error.statusCode = 404;
    throw error;
  }

  const app = appRes.rows[0];

  // Recruiter multi-tenant isolation
  if (userRole === 'RECRUITER') {
    const recruiterCompanyId = await getRecruiterCompanyId(userId);
    if (recruiterCompanyId !== app.company_id) {
      const error = new Error('Access denied: You cannot modify applications for another company.');
      error.statusCode = 403;
      throw error;
    }
  }

  // Prevent modifying an application that candidate already withdrew
  if (app.status === 'WITHDRAWN') {
    const error = new Error('Cannot update status of a withdrawn application.');
    error.statusCode = 400;
    throw error;
  }

  const oldStatus = app.status;

  // Execute in database transaction
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Update application
    const updateRes = await client.query(
      `UPDATE applications
       SET status = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [normStatus, applicationId]
    );

    // 2. Insert application status history
    const historyRemark = remarks && remarks.trim()
      ? remarks.trim()
      : `Application status updated from ${oldStatus} to ${normStatus} by recruiter`;

    await client.query(
      `INSERT INTO application_status_history (application_id, old_status, new_status, changed_by, remarks)
       VALUES ($1, $2, $3, $4, $5)`,
      [applicationId, oldStatus, normStatus, userId, historyRemark]
    );

    // 3. Create contextual notification for the student
    let notifTitle = 'Application Status Update';
    let notifMessage = `Your application for ${app.job_title} at ${app.company_name} status updated to: ${normStatus}.`;
    let notifType = 'APPLICATION';

    if (normStatus === 'SELECTED') {
      notifTitle = 'Congratulations! Job Offer';
      notifMessage = `You have been selected for ${app.job_title} at ${app.company_name}!`;
      notifType = 'PLACEMENT';
    } else if (normStatus === 'SHORTLISTED') {
      notifTitle = 'Application Shortlisted';
      notifMessage = `Your application for ${app.job_title} at ${app.company_name} has been shortlisted.`;
    } else if (normStatus === 'REJECTED') {
      notifTitle = 'Application Status Update';
      notifMessage = `Your application for ${app.job_title} at ${app.company_name} has been updated to Rejected.`;
    }

    if (app.student_user_id) {
      await client.query(
        `INSERT INTO notifications (user_id, title, message, notification_type, is_read)
         VALUES ($1, $2, $3, $4, FALSE)`,
        [app.student_user_id, notifTitle, notifMessage, notifType]
      );
    }

    await client.query('COMMIT');

    const updated = updateRes.rows[0];
    return {
      id: updated.id,
      jobId: updated.job_id,
      studentId: updated.student_id,
      status: updated.status,
      oldStatus,
      updatedAt: updated.updated_at,
      remarks: historyRemark,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};
