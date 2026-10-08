import { query, pool } from '../config/database.js';
import { getStudentByUserId } from './studentService.js';
import { getRecruiterCompanyId } from './applicationService.js';

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const ALLOWED_TYPES = ['TECHNICAL', 'HR', 'MANAGERIAL', 'OTHER'];
const ALLOWED_STATUSES = ['SCHEDULED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED'];

export const formatInterviewRecord = (row) => {
  const time = row.startTime
    ? `${row.startTime}${row.endTime ? ' - ' + row.endTime : ''}`
    : row.time || null;
  const locationOrMode = row.location || row.mode || 'Virtual / Online';

  return {
    id: row.id,
    applicationId: row.applicationId,
    application_id: row.applicationId,
    interviewType: row.interviewType,
    interview_type: row.interviewType,
    type: row.interviewType,
    interviewDate: row.interviewDate,
    interview_date: row.interviewDate,
    date: row.interviewDate,
    startTime: row.startTime,
    start_time: row.startTime,
    endTime: row.endTime,
    end_time: row.endTime,
    time: time,
    interviewTime: time,
    interview_time: time,
    meetingLink: row.meetingLink,
    meeting_link: row.meetingLink,
    location: locationOrMode,
    mode: locationOrMode,
    status: row.status,
    feedback: row.feedback,
    result: row.feedback,
    interviewerId: row.interviewerId,
    interviewer_id: row.interviewerId,
    interviewerName: row.interviewerName || null,
    interviewer: (row.interviewerName || row.interviewerId) ? {
      id: row.interviewerId,
      name: row.interviewerName || 'Interviewer',
      email: row.interviewerEmail || null,
    } : null,
    recruiter: (row.interviewerName || row.interviewerId || row.companyName) ? {
      id: row.interviewerId,
      name: row.interviewerName || 'Recruiter',
      email: row.interviewerEmail || null,
      companyId: row.companyId,
      companyName: row.companyName,
    } : null,
    application: {
      id: row.applicationId,
      status: row.applicationStatus,
      studentId: row.studentId,
      jobId: row.jobId,
    },
    candidate: {
      id: row.studentId,
      name: row.candidateName,
      email: row.candidateEmail,
      phone: row.candidatePhone,
      rollNumber: row.rollNumber,
      cgpa: row.cgpa !== undefined && row.cgpa !== null ? parseFloat(row.cgpa) : 0,
      department: row.department,
    },
    job: {
      id: row.jobId,
      title: row.jobTitle,
      jobTitle: row.jobTitle,
      jobType: row.jobType,
      companyId: row.companyId,
      companyName: row.companyName,
      companyLogo: row.companyLogo,
    },
    company: {
      id: row.companyId,
      name: row.companyName,
      companyName: row.companyName,
      logo: row.companyLogo,
    },
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
};

// ============================================================================
// RECRUITER INTERVIEW SERVICES
// ============================================================================

/**
 * 3. POST /api/recruiters/interviews
 * Schedule interview for valid application with company ownership checks
 */
export const scheduleInterview = async (userId, userRole, data) => {
  const appId = data.applicationId || data.application_id;
  if (!appId) {
    const error = new Error('Application ID is required');
    error.statusCode = 400;
    throw error;
  }

  // Verify application exists and retrieve company & candidate info
  const appRes = await query(
    `SELECT 
      a.id,
      a.status,
      a.student_id,
      j.id as job_id,
      j.job_title,
      j.job_type,
      j.company_id,
      c.company_name,
      c.logo_url as company_logo,
      s.user_id as student_user_id,
      u.name as candidate_name,
      u.email as candidate_email,
      u.phone as candidate_phone,
      s.roll_number,
      s.cgpa,
      d.department_name as department
     FROM applications a
     JOIN jobs j ON a.job_id = j.id
     JOIN companies c ON j.company_id = c.id
     JOIN students s ON a.student_id = s.id
     JOIN users u ON s.user_id = u.id
     LEFT JOIN departments d ON s.department_id = d.id
     WHERE a.id = $1`,
    [appId]
  );

  if (appRes.rows.length === 0) {
    const error = new Error('Application not found.');
    error.statusCode = 404;
    throw error;
  }

  const app = appRes.rows[0];

  // Recruiter multi-tenant ownership check
  if (userRole === 'RECRUITER') {
    const recruiterCompanyId = await getRecruiterCompanyId(userId);
    if (recruiterCompanyId !== app.company_id) {
      const error = new Error("Access denied: You can only schedule interviews for your company's applications.");
      error.statusCode = 403;
      throw error;
    }
  }

  // Validate application status
  if (app.status === 'WITHDRAWN') {
    const error = new Error('Cannot schedule interview for a withdrawn application.');
    error.statusCode = 400;
    throw error;
  }

  if (app.status === 'REJECTED') {
    const error = new Error('Cannot schedule interview for a rejected application.');
    error.statusCode = 400;
    throw error;
  }

  // Parse parameters
  const interviewType = (data.interviewType || data.interview_type || data.type || 'TECHNICAL').toUpperCase();
  const rawDate = data.interviewDate || data.interview_date || data.date;
  const interviewDate = new Date(rawDate).toISOString().split('T')[0];

  let startTime = data.startTime || data.start_time || null;
  let endTime = data.endTime || data.end_time || null;
  const rawTime = data.interviewTime || data.interview_time || data.time;

  if (!startTime && rawTime) {
    if (typeof rawTime === 'string' && rawTime.includes('-')) {
      const parts = rawTime.split('-').map((s) => s.trim());
      startTime = parts[0] || '10:00:00';
      endTime = endTime || parts[1] || '11:00:00';
    } else {
      startTime = rawTime;
    }
  }
  if (!startTime) {
    startTime = '10:00:00';
  }
  if (!endTime) {
    endTime = '11:00:00';
  }

  const meetingLink = data.meetingLink || data.meeting_link || 'https://meet.google.com/smartplacify-interview';
  const location = data.location || data.mode || 'Virtual / Online';
  const status = (data.status || 'SCHEDULED').toUpperCase();
  const feedback = data.feedback || data.result || null;

  let interviewerId = userId;
  const candInterviewer = data.interviewerId || data.interviewer_id || data.interviewer;
  if (candInterviewer && UUID_REGEX.test(candInterviewer)) {
    interviewerId = candInterviewer;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Insert interview record
    const insertRes = await client.query(
      `INSERT INTO interviews (
         application_id, interviewer_id, interview_type, interview_date,
         start_time, end_time, meeting_link, location, status, feedback
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        app.id,
        interviewerId,
        interviewType,
        interviewDate,
        startTime,
        endTime,
        meetingLink,
        location,
        status,
        feedback,
      ]
    );
    const interview = insertRes.rows[0];

    // 2. Dispatch notification to the candidate
    const timeDisplay = `${startTime} - ${endTime}`;
    await client.query(
      `INSERT INTO notifications (user_id, title, message, notification_type, is_read)
       VALUES ($1, 'Interview Scheduled', $2, 'INTERVIEW', FALSE)`,
      [
        app.student_user_id,
        `Your ${interviewType} interview for ${app.job_title} at ${app.company_name} is scheduled on ${interviewDate} at ${timeDisplay}.`,
      ]
    );

    await client.query('COMMIT');

    return getRecruiterInterviewById(userId, userRole, interview.id);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * 4. GET /api/recruiters/interviews
 * List interviews for recruiter's company
 */
export const getRecruiterInterviews = async (userId, userRole, params = {}) => {
  let companyId = null;

  if (userRole === 'RECRUITER') {
    companyId = await getRecruiterCompanyId(userId);
  } else if (params.companyId) {
    companyId = params.companyId;
  }

  let queryText = `
    SELECT 
      i.id,
      i.application_id as "applicationId",
      i.interviewer_id as "interviewerId",
      i.interview_type as "interviewType",
      to_char(i.interview_date, 'YYYY-MM-DD') as "interviewDate",
      i.start_time as "startTime",
      i.end_time as "endTime",
      i.meeting_link as "meetingLink",
      i.location,
      i.status,
      i.feedback,
      i.created_at as "createdAt",
      i.updated_at as "updatedAt",
      a.id as "applicationId",
      a.status as "applicationStatus",
      a.student_id as "studentId",
      j.id as "jobId",
      j.job_title as "jobTitle",
      j.job_type as "jobType",
      j.company_id as "companyId",
      c.company_name as "companyName",
      c.logo_url as "companyLogo",
      u.name as "candidateName",
      u.email as "candidateEmail",
      u.phone as "candidatePhone",
      s.roll_number as "rollNumber",
      s.cgpa,
      d.department_name as "department",
      interviewer_u.name as "interviewerName",
      interviewer_u.email as "interviewerEmail"
    FROM interviews i
    JOIN applications a ON i.application_id = a.id
    JOIN jobs j ON a.job_id = j.id
    JOIN companies c ON j.company_id = c.id
    JOIN students s ON a.student_id = s.id
    JOIN users u ON s.user_id = u.id
    LEFT JOIN departments d ON s.department_id = d.id
    LEFT JOIN users interviewer_u ON i.interviewer_id = interviewer_u.id
    WHERE 1=1
  `;
  const queryParams = [];

  // Multi-tenant company filtering
  if (companyId) {
    queryParams.push(companyId);
    queryText += ` AND j.company_id = $${queryParams.length}`;
  }

  // Filter by application
  const filterAppId = params.applicationId || params.application_id;
  if (filterAppId) {
    queryParams.push(filterAppId);
    queryText += ` AND i.application_id = $${queryParams.length}`;
  }

  // Filter by job
  const filterJobId = params.jobId || params.job_id;
  if (filterJobId) {
    queryParams.push(filterJobId);
    queryText += ` AND a.job_id = $${queryParams.length}`;
  }

  // Filter by status
  if (params.status) {
    queryParams.push(params.status.toUpperCase());
    queryText += ` AND UPPER(i.status) = $${queryParams.length}`;
  }

  // Search keyword (candidate name, job title)
  if (params.search && params.search.trim()) {
    queryParams.push(`%${params.search.trim().toLowerCase()}%`);
    queryText += ` AND (
      LOWER(u.name) LIKE $${queryParams.length} OR
      LOWER(j.job_title) LIKE $${queryParams.length}
    )`;
  }

  // Total count for pagination
  const countQuery = `SELECT count(*) FROM (${queryText}) as count_sub`;
  const countRes = await query(countQuery, queryParams);
  const total = parseInt(countRes.rows[0].count, 10);

  queryText += ` ORDER BY i.interview_date DESC, i.start_time DESC`;

  // Pagination
  const page = parseInt(params.page || 1, 10);
  const limit = parseInt(params.limit || 50, 10);
  const offset = (page - 1) * limit;

  queryParams.push(limit);
  queryText += ` LIMIT $${queryParams.length}`;
  queryParams.push(offset);
  queryText += ` OFFSET $${queryParams.length}`;

  const res = await query(queryText, queryParams);

  return {
    interviews: res.rows.map(formatInterviewRecord),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

/**
 * 5. GET /api/recruiters/interviews/:id
 * Retrieve single interview details with multi-tenant ownership check
 */
export const getRecruiterInterviewById = async (userId, userRole, interviewId) => {
  const res = await query(
    `SELECT 
      i.id,
      i.application_id as "applicationId",
      i.interviewer_id as "interviewerId",
      i.interview_type as "interviewType",
      to_char(i.interview_date, 'YYYY-MM-DD') as "interviewDate",
      i.start_time as "startTime",
      i.end_time as "endTime",
      i.meeting_link as "meetingLink",
      i.location,
      i.status,
      i.feedback,
      i.created_at as "createdAt",
      i.updated_at as "updatedAt",
      a.id as "applicationId",
      a.status as "applicationStatus",
      a.student_id as "studentId",
      j.id as "jobId",
      j.job_title as "jobTitle",
      j.job_type as "jobType",
      j.company_id as "companyId",
      c.company_name as "companyName",
      c.logo_url as "companyLogo",
      u.name as "candidateName",
      u.email as "candidateEmail",
      u.phone as "candidatePhone",
      s.roll_number as "rollNumber",
      s.cgpa,
      d.department_name as "department",
      interviewer_u.name as "interviewerName",
      interviewer_u.email as "interviewerEmail"
    FROM interviews i
    JOIN applications a ON i.application_id = a.id
    JOIN jobs j ON a.job_id = j.id
    JOIN companies c ON j.company_id = c.id
    JOIN students s ON a.student_id = s.id
    JOIN users u ON s.user_id = u.id
    LEFT JOIN departments d ON s.department_id = d.id
    LEFT JOIN users interviewer_u ON i.interviewer_id = interviewer_u.id
    WHERE i.id = $1`,
    [interviewId]
  );

  if (res.rows.length === 0) {
    const error = new Error('Interview not found.');
    error.statusCode = 404;
    throw error;
  }

  const row = res.rows[0];

  // Recruiter multi-tenant check
  if (userRole === 'RECRUITER') {
    const recruiterCompanyId = await getRecruiterCompanyId(userId);
    if (recruiterCompanyId !== row.companyId) {
      const error = new Error("Access denied: You can only view interviews for your company's jobs.");
      error.statusCode = 403;
      throw error;
    }
  }

  return formatInterviewRecord(row);
};

/**
 * 6. PUT /api/recruiters/interviews/:id
 * Update interview details, time, link, mode, status, or feedback
 */
export const updateRecruiterInterview = async (userId, userRole, interviewId, data) => {
  // Check existence and ownership
  const checkRes = await query(
    `SELECT i.*, j.company_id, j.job_title, c.company_name, s.user_id as student_user_id
     FROM interviews i
     JOIN applications a ON i.application_id = a.id
     JOIN jobs j ON a.job_id = j.id
     JOIN companies c ON j.company_id = c.id
     JOIN students s ON a.student_id = s.id
     WHERE i.id = $1`,
    [interviewId]
  );

  if (checkRes.rows.length === 0) {
    const error = new Error('Interview not found.');
    error.statusCode = 404;
    throw error;
  }

  const interview = checkRes.rows[0];

  // Recruiter multi-tenant check
  if (userRole === 'RECRUITER') {
    const recruiterCompanyId = await getRecruiterCompanyId(userId);
    if (recruiterCompanyId !== interview.company_id) {
      const error = new Error('Access denied: You cannot modify interviews for another company.');
      error.statusCode = 403;
      throw error;
    }
  }

  // Formulate updates
  const rawType = data.interviewType || data.interview_type || data.type;
  const interviewType = rawType ? rawType.toUpperCase() : interview.interview_type;

  const rawDate = data.interviewDate || data.interview_date || data.date;
  const interviewDate = rawDate ? new Date(rawDate).toISOString().split('T')[0] : interview.interview_date;

  let startTime = data.startTime || data.start_time || null;
  let endTime = data.endTime || data.end_time || null;
  const rawTime = data.interviewTime || data.interview_time || data.time;

  if (!startTime && rawTime) {
    if (typeof rawTime === 'string' && rawTime.includes('-')) {
      const parts = rawTime.split('-').map((s) => s.trim());
      startTime = parts[0];
      endTime = endTime || parts[1];
    } else {
      startTime = rawTime;
    }
  }
  startTime = startTime !== null && startTime !== undefined ? startTime : interview.start_time;
  endTime = endTime !== null && endTime !== undefined ? endTime : interview.end_time;

  const meetingLink = data.meetingLink !== undefined ? data.meetingLink : (data.meeting_link !== undefined ? data.meeting_link : interview.meeting_link);
  const location = data.location !== undefined ? data.location : (data.mode !== undefined ? data.mode : interview.location);
  const status = data.status ? data.status.toUpperCase() : interview.status;
  const feedback = data.feedback !== undefined ? data.feedback : (data.result !== undefined ? data.result : interview.feedback);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      `UPDATE interviews
       SET interview_type = $1,
           interview_date = $2,
           start_time = $3,
           end_time = $4,
           meeting_link = $5,
           location = $6,
           status = $7,
           feedback = $8,
           updated_at = NOW()
       WHERE id = $9`,
      [interviewType, interviewDate, startTime, endTime, meetingLink, location, status, feedback, interviewId]
    );

    // Notify candidate of update / status change
    await client.query(
      `INSERT INTO notifications (user_id, title, message, notification_type, is_read)
       VALUES ($1, 'Interview Update', $2, 'INTERVIEW', FALSE)`,
      [
        interview.student_user_id,
        `Your ${interviewType} interview for ${interview.job_title} at ${interview.company_name} status updated to: ${status}.`,
      ]
    );

    await client.query('COMMIT');

    return getRecruiterInterviewById(userId, userRole, interviewId);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * 7. DELETE /api/recruiters/interviews/:id
 * Cancel / Delete an interview with ownership verification and notification
 */
export const deleteRecruiterInterview = async (userId, userRole, interviewId) => {
  const checkRes = await query(
    `SELECT i.*, j.company_id, j.job_title, c.company_name, s.user_id as student_user_id
     FROM interviews i
     JOIN applications a ON i.application_id = a.id
     JOIN jobs j ON a.job_id = j.id
     JOIN companies c ON j.company_id = c.id
     JOIN students s ON a.student_id = s.id
     WHERE i.id = $1`,
    [interviewId]
  );

  if (checkRes.rows.length === 0) {
    const error = new Error('Interview not found.');
    error.statusCode = 404;
    throw error;
  }

  const interview = checkRes.rows[0];

  // Recruiter multi-tenant check
  if (userRole === 'RECRUITER') {
    const recruiterCompanyId = await getRecruiterCompanyId(userId);
    if (recruiterCompanyId !== interview.company_id) {
      const error = new Error('Access denied: You cannot delete interviews for another company.');
      error.statusCode = 403;
      throw error;
    }
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query('DELETE FROM interviews WHERE id = $1', [interviewId]);

    // Notify candidate
    await client.query(
      `INSERT INTO notifications (user_id, title, message, notification_type, is_read)
       VALUES ($1, 'Interview Cancelled', $2, 'INTERVIEW', FALSE)`,
      [
        interview.student_user_id,
        `Your ${interview.interview_type} interview for ${interview.job_title} at ${interview.company_name} has been cancelled.`,
      ]
    );

    await client.query('COMMIT');
    return { id: interviewId, message: 'Interview deleted successfully' };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// ============================================================================
// STUDENT INTERVIEW SERVICES (Unified)
// ============================================================================

/**
 * 1. GET /api/students/interviews
 * List candidate's interviews
 */
export const getStudentInterviews = async (userId) => {
  const student = await getStudentByUserId(userId);

  const res = await query(
    `SELECT 
      i.id,
      i.application_id as "applicationId",
      i.interviewer_id as "interviewerId",
      i.interview_type as "interviewType",
      to_char(i.interview_date, 'YYYY-MM-DD') as "interviewDate",
      i.start_time as "startTime",
      i.end_time as "endTime",
      i.meeting_link as "meetingLink",
      i.location,
      i.status,
      i.feedback,
      i.created_at as "createdAt",
      i.updated_at as "updatedAt",
      a.id as "applicationId",
      a.status as "applicationStatus",
      a.student_id as "studentId",
      j.id as "jobId",
      j.job_title as "jobTitle",
      j.job_type as "jobType",
      j.company_id as "companyId",
      c.company_name as "companyName",
      c.logo_url as "companyLogo",
      u.name as "candidateName",
      u.email as "candidateEmail",
      u.phone as "candidatePhone",
      s.roll_number as "rollNumber",
      s.cgpa,
      d.department_name as "department",
      interviewer_u.name as "interviewerName",
      interviewer_u.email as "interviewerEmail"
    FROM interviews i
    JOIN applications a ON i.application_id = a.id
    JOIN jobs j ON a.job_id = j.id
    JOIN companies c ON j.company_id = c.id
    JOIN students s ON a.student_id = s.id
    JOIN users u ON s.user_id = u.id
    LEFT JOIN departments d ON s.department_id = d.id
    LEFT JOIN users interviewer_u ON i.interviewer_id = interviewer_u.id
    WHERE a.student_id = $1
    ORDER BY i.interview_date DESC, i.start_time DESC`,
    [student.id]
  );

  return res.rows.map(formatInterviewRecord);
};

/**
 * 2. GET /api/students/interviews/:id
 * Retrieve candidate's interview by ID with ownership verification
 */
export const getStudentInterviewById = async (userId, interviewId) => {
  const student = await getStudentByUserId(userId);

  const checkRes = await query(
    `SELECT 
      i.id,
      i.application_id as "applicationId",
      i.interviewer_id as "interviewerId",
      i.interview_type as "interviewType",
      to_char(i.interview_date, 'YYYY-MM-DD') as "interviewDate",
      i.start_time as "startTime",
      i.end_time as "endTime",
      i.meeting_link as "meetingLink",
      i.location,
      i.status,
      i.feedback,
      i.created_at as "createdAt",
      i.updated_at as "updatedAt",
      a.id as "applicationId",
      a.status as "applicationStatus",
      a.student_id as "studentId",
      j.id as "jobId",
      j.job_title as "jobTitle",
      j.job_type as "jobType",
      j.company_id as "companyId",
      c.company_name as "companyName",
      c.logo_url as "companyLogo",
      u.name as "candidateName",
      u.email as "candidateEmail",
      u.phone as "candidatePhone",
      s.roll_number as "rollNumber",
      s.cgpa,
      d.department_name as "department",
      interviewer_u.name as "interviewerName",
      interviewer_u.email as "interviewerEmail"
    FROM interviews i
    JOIN applications a ON i.application_id = a.id
    JOIN jobs j ON a.job_id = j.id
    JOIN companies c ON j.company_id = c.id
    JOIN students s ON a.student_id = s.id
    JOIN users u ON s.user_id = u.id
    LEFT JOIN departments d ON s.department_id = d.id
    LEFT JOIN users interviewer_u ON i.interviewer_id = interviewer_u.id
    WHERE i.id = $1`,
    [interviewId]
  );

  if (checkRes.rows.length === 0) {
    const err = new Error('Interview not found.');
    err.statusCode = 404;
    throw err;
  }

  const interview = checkRes.rows[0];

  if (interview.studentId !== student.id) {
    const err = new Error('Access denied: You do not have permission to view this interview.');
    err.statusCode = 403;
    throw err;
  }

  return formatInterviewRecord(interview);
};
