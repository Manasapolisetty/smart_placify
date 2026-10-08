import { query, pool } from '../config/database.js';
import { getStudentByUserId } from './studentService.js';

/**
 * 8. GET ALL APPLICATIONS
 * Returns all job applications submitted by the authenticated student
 */
export const getApplications = async (userId) => {
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
 * 8. GET APPLICATION BY ID
 * Returns a specific application including timeline status history and interviews
 */
export const getApplicationById = async (userId, applicationId) => {
  const student = await getStudentByUserId(userId);

  // Check application existence across database
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
    const err = new Error('Application not found.');
    err.statusCode = 404;
    throw err;
  }

  const app = appCheck.rows[0];

  // Ownership verification
  if (app.student_id !== student.id) {
    const err = new Error('Access denied: You do not have permission to view this application.');
    err.statusCode = 403;
    throw err;
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
    salaryMin: app.salary_min,
    salaryMax: app.salary_max,
    company: {
      id: app.company_id,
      name: app.company_name,
      logo: app.company_logo,
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
 * 8. APPLY FOR JOB
 * Executes the complete 9-step application process with eligibility validation
 */
export const applyForJob = async (userId, jobId, options = {}) => {
  // Step 1: Verify student exists
  const student = await getStudentByUserId(userId);

  // Step 2: Verify job exists
  const jobRes = await query('SELECT * FROM jobs WHERE id = $1', [jobId]);
  if (jobRes.rows.length === 0) {
    const err = new Error('Job not found.');
    err.statusCode = 404;
    throw err;
  }
  const job = jobRes.rows[0];

  // Step 3: Verify job is OPEN
  if (job.status !== 'OPEN') {
    const err = new Error('Job is not open for applications.');
    err.statusCode = 400;
    throw err;
  }

  // Step 4: Verify application deadline has not passed
  if (job.application_deadline) {
    const deadline = new Date(job.application_deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (deadline < today) {
      const err = new Error('Application deadline for this job has passed.');
      err.statusCode = 400;
      throw err;
    }
  }

  // Step 5: Verify student eligibility
  const studentCgpa = parseFloat(student.cgpa || 0);
  const minCgpa = job.minimum_cgpa ? parseFloat(job.minimum_cgpa) : 0;
  if (minCgpa > 0 && studentCgpa < minCgpa) {
    const err = new Error(
      `Eligibility requirement not met: Minimum CGPA required is ${minCgpa.toFixed(2)}, your CGPA is ${studentCgpa.toFixed(2)}.`
    );
    err.statusCode = 400;
    throw err;
  }

  if (job.graduation_year && student.graduation_year) {
    if (parseInt(student.graduation_year, 10) !== parseInt(job.graduation_year, 10)) {
      const err = new Error(
        `Eligibility requirement not met: Eligible batch is ${job.graduation_year}, your graduation year is ${student.graduation_year}.`
      );
      err.statusCode = 400;
      throw err;
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
      const err = new Error(
        `Eligibility requirement not met: Missing required skills: ${missingSkills.join(', ')}.`
      );
      err.statusCode = 400;
      throw err;
    }
  }

  // Step 6: Verify student has not already applied
  const existingApp = await query(
    'SELECT id, status FROM applications WHERE job_id = $1 AND student_id = $2',
    [job.id, student.id]
  );

  if (existingApp.rows.length > 0) {
    const err = new Error('You have already applied for this position.');
    err.statusCode = 409;
    throw err;
  }

  // Resolve resume ID
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

  // Execute Steps 7, 8, 9 in atomic transaction
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Step 7: Create application
    const appInsert = await client.query(
      `INSERT INTO applications (job_id, student_id, resume_id, cover_letter, status)
       VALUES ($1, $2, $3, $4, 'APPLIED')
       RETURNING *`,
      [job.id, student.id, targetResumeId, coverLetter]
    );
    const application = appInsert.rows[0];

    // Step 8: Create application status history
    await client.query(
      `INSERT INTO application_status_history (application_id, old_status, new_status, changed_by, remarks)
       VALUES ($1, NULL, 'APPLIED', $2, 'Application submitted by candidate')`,
      [application.id, userId]
    );

    // Step 9: Create notification for the student
    await client.query(
      `INSERT INTO notifications (user_id, title, message, notification_type, is_read)
       VALUES ($1, 'Application Submitted', 'Your application has been submitted successfully.', 'APPLICATION', FALSE)`,
      [userId]
    );

    // Step 10: Notify company recruiters
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
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * 8. WITHDRAW APPLICATION
 * Allows candidate to withdraw their own pending application
 */
export const withdrawApplication = async (userId, applicationId) => {
  const student = await getStudentByUserId(userId);

  const check = await query(
    `SELECT a.id, a.student_id, a.status, j.job_title, j.company_id
     FROM applications a
     JOIN jobs j ON a.job_id = j.id
     WHERE a.id = $1`,
    [applicationId]
  );

  if (check.rows.length === 0) {
    const err = new Error('Application not found.');
    err.statusCode = 404;
    throw err;
  }

  const app = check.rows[0];

  if (app.student_id !== student.id) {
    const err = new Error('Access denied: You do not have permission to withdraw this application.');
    err.statusCode = 403;
    throw err;
  }

  if (app.status === 'WITHDRAWN') {
    const err = new Error('Application is already withdrawn.');
    err.statusCode = 400;
    throw err;
  }

  if (['SELECTED', 'REJECTED'].includes(app.status)) {
    const err = new Error(`Cannot withdraw an application that is already ${app.status}.`);
    err.statusCode = 400;
    throw err;
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

    await client.query(
      `INSERT INTO application_status_history (application_id, old_status, new_status, changed_by, remarks)
       VALUES ($1, $2, 'WITHDRAWN', $3, 'Application withdrawn by candidate')`,
      [applicationId, app.status, userId]
    );

    await client.query(
      `INSERT INTO notifications (user_id, title, message, notification_type, is_read)
       VALUES ($1, 'Application Withdrawn', 'Your application has been withdrawn.', 'APPLICATION', FALSE)`,
      [userId]
    );

    // Notify company recruiters
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
