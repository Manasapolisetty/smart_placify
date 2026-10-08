import { query, pool } from '../config/database.js';

/**
 * Format a raw database placement row into standardized camelCase object
 */
const formatPlacementRow = (r) => ({
  id: r.id,
  studentId: r.student_id,
  studentName: r.student_name,
  rollNumber: r.roll_number,
  department: r.department,
  cgpa: r.cgpa ? parseFloat(r.cgpa) : null,
  companyId: r.company_id,
  companyName: r.company_name,
  companyLogo: r.company_logo,
  jobId: r.job_id,
  jobTitle: r.job_title,
  applicationId: r.application_id,
  package: r.package,
  placementDate: r.placement_date,
  joiningDate: r.joining_date,
  status: r.status,
  placementStatus: r.status,
  offerDetails: r.offer_details,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

/**
 * Retrieve recruiter company ID from users table / recruiters table
 */
const getRecruiterCompanyId = async (userId) => {
  const res = await query('SELECT company_id FROM recruiters WHERE user_id = $1', [userId]);
  return res.rows[0]?.company_id || null;
};

/**
 * Retrieve student ID from users table / students table
 */
const getStudentIdByUserId = async (userId) => {
  const res = await query('SELECT id FROM students WHERE user_id = $1', [userId]);
  return res.rows[0]?.id || null;
};

/**
 * 1. GET /api/placements
 * Retrieve placements list scoped by user role and optional filters
 */
export const getPlacements = async (user, filters = {}) => {
  let queryText = `
    SELECT 
      p.id,
      p.student_id,
      u.name as student_name,
      s.roll_number,
      d.department_name as department,
      s.cgpa,
      p.company_id,
      c.company_name,
      c.logo_url as company_logo,
      p.job_id,
      j.job_title,
      p.application_id,
      p.package,
      p.placement_date,
      p.joining_date,
      p.status,
      p.offer_details,
      p.created_at,
      p.updated_at
    FROM placements p
    JOIN students s ON p.student_id = s.id
    JOIN users u ON s.user_id = u.id
    LEFT JOIN departments d ON s.department_id = d.id
    JOIN companies c ON p.company_id = c.id
    LEFT JOIN jobs j ON p.job_id = j.id
    WHERE 1=1
  `;
  const queryParams = [];

  // Role scoping:
  if (user?.role === 'STUDENT') {
    const studentId = await getStudentIdByUserId(user.id);
    queryParams.push(studentId);
    queryText += ` AND p.student_id = $${queryParams.length}`;
  } else if (user?.role === 'RECRUITER') {
    const companyId = await getRecruiterCompanyId(user.id);
    queryParams.push(companyId);
    queryText += ` AND p.company_id = $${queryParams.length}`;
  } else {
    // Placement Officer / Admin can filter by specific student or company
    if (filters.studentId) {
      queryParams.push(filters.studentId);
      queryText += ` AND p.student_id = $${queryParams.length}`;
    }
    if (filters.companyId) {
      queryParams.push(filters.companyId);
      queryText += ` AND p.company_id = $${queryParams.length}`;
    }
  }

  // Common filters
  if (filters.jobId) {
    queryParams.push(filters.jobId);
    queryText += ` AND p.job_id = $${queryParams.length}`;
  }
  if (filters.status) {
    queryParams.push(filters.status);
    queryText += ` AND p.status = $${queryParams.length}`;
  }

  queryText += ' ORDER BY p.placement_date DESC, p.created_at DESC';

  const res = await query(queryText, queryParams);
  return res.rows.map(formatPlacementRow);
};

/**
 * 2. GET /api/placements/:id
 * Retrieve single placement by ID with strict ownership validation
 */
export const getPlacementById = async (id, user) => {
  const res = await query(
    `SELECT 
      p.id,
      p.student_id,
      u.name as student_name,
      s.roll_number,
      d.department_name as department,
      s.cgpa,
      p.company_id,
      c.company_name,
      c.logo_url as company_logo,
      p.job_id,
      j.job_title,
      p.application_id,
      p.package,
      p.placement_date,
      p.joining_date,
      p.status,
      p.offer_details,
      p.created_at,
      p.updated_at
    FROM placements p
    JOIN students s ON p.student_id = s.id
    JOIN users u ON s.user_id = u.id
    LEFT JOIN departments d ON s.department_id = d.id
    JOIN companies c ON p.company_id = c.id
    LEFT JOIN jobs j ON p.job_id = j.id
    WHERE p.id = $1`,
    [id]
  );

  if (res.rows.length === 0) {
    const err = new Error('Placement record not found');
    err.statusCode = 404;
    throw err;
  }

  const record = formatPlacementRow(res.rows[0]);

  // Ownership verification
  if (user?.role === 'STUDENT') {
    const studentId = await getStudentIdByUserId(user.id);
    if (record.studentId !== studentId) {
      const err = new Error("Access denied: You cannot view another student's placement");
      err.statusCode = 403;
      throw err;
    }
  } else if (user?.role === 'RECRUITER') {
    const companyId = await getRecruiterCompanyId(user.id);
    if (record.companyId !== companyId) {
      const err = new Error('Access denied: You cannot view placements for another company');
      err.statusCode = 403;
      throw err;
    }
  }

  return record;
};

/**
 * 3. POST /api/placements
 * Create a new placement offer with deep relational and business integrity checks
 */
export const createPlacement = async (data, user) => {
  // Role authorization
  if (user?.role === 'STUDENT') {
    const err = new Error('Students are not authorized to create placement records');
    err.statusCode = 403;
    throw err;
  }

  // Recruiter authorization check
  if (user?.role === 'RECRUITER') {
    const recruiterCompanyId = await getRecruiterCompanyId(user.id);
    if (!recruiterCompanyId || recruiterCompanyId !== data.companyId) {
      const err = new Error('Unauthorized: Recruiters can only create placements for their own company');
      err.statusCode = 403;
      throw err;
    }
  }

  // 1. Verify student exists
  const studentCheck = await query('SELECT id, user_id FROM students WHERE id = $1', [data.studentId]);
  if (studentCheck.rows.length === 0) {
    const err = new Error('Student not found');
    err.statusCode = 404;
    throw err;
  }

  // 2. Verify company exists
  const companyCheck = await query('SELECT id, company_name FROM companies WHERE id = $1', [data.companyId]);
  if (companyCheck.rows.length === 0) {
    const err = new Error('Company not found');
    err.statusCode = 404;
    throw err;
  }

  // 3. Verify job if provided
  if (data.jobId) {
    const jobCheck = await query('SELECT id, company_id, job_title FROM jobs WHERE id = $1', [data.jobId]);
    if (jobCheck.rows.length === 0) {
      const err = new Error('Job not found');
      err.statusCode = 404;
      throw err;
    }
    if (jobCheck.rows[0].company_id !== data.companyId) {
      const err = new Error('Job does not belong to the specified company');
      err.statusCode = 400;
      throw err;
    }
  }

  // 4. Verify application if provided
  if (data.applicationId) {
    const appCheck = await query(
      `SELECT a.id, a.student_id, a.job_id, a.status, j.company_id
       FROM applications a
       JOIN jobs j ON a.job_id = j.id
       WHERE a.id = $1`,
      [data.applicationId]
    );

    if (appCheck.rows.length === 0) {
      const err = new Error('Application not found');
      err.statusCode = 404;
      throw err;
    }

    const app = appCheck.rows[0];

    // Check student match
    if (app.student_id !== data.studentId) {
      const err = new Error('Application does not belong to the specified student');
      err.statusCode = 400;
      throw err;
    }

    // Check company match
    if (app.company_id !== data.companyId) {
      const err = new Error('Application does not belong to the specified company');
      err.statusCode = 400;
      throw err;
    }

    // Check application validity
    if (['REJECTED', 'WITHDRAWN'].includes(app.status)) {
      const err = new Error(`Cannot create placement for an application with status ${app.status}`);
      err.statusCode = 400;
      throw err;
    }

    // Check for duplicate placement on this application
    const duplicateAppPlacement = await query(
      `SELECT id FROM placements WHERE application_id = $1 AND status != 'DECLINED'`,
      [data.applicationId]
    );
    if (duplicateAppPlacement.rows.length > 0) {
      const err = new Error('A placement offer already exists for this application');
      err.statusCode = 409;
      throw err;
    }
  }

  // 5. Check duplicate/conflicting placement for same student and job
  if (data.jobId) {
    const duplicateJobPlacement = await query(
      `SELECT id FROM placements WHERE student_id = $1 AND job_id = $2 AND status != 'DECLINED'`,
      [data.studentId, data.jobId]
    );
    if (duplicateJobPlacement.rows.length > 0) {
      const err = new Error('A placement offer already exists for this student and job');
      err.statusCode = 409;
      throw err;
    }
  }

  // 6. Execute insertion within a transaction
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const placementStatus = data.status || 'OFFERED';
    const placementDate = data.placementDate ? new Date(data.placementDate) : new Date();
    const joiningDate = data.joiningDate ? new Date(data.joiningDate) : null;

    const insertRes = await client.query(
      `INSERT INTO placements (
        student_id,
        company_id,
        job_id,
        application_id,
        package,
        placement_date,
        joining_date,
        status,
        offer_details,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id`,
      [
        data.studentId,
        data.companyId,
        data.jobId || null,
        data.applicationId || null,
        data.package,
        placementDate,
        joiningDate,
        placementStatus,
        data.offerDetails || null,
      ]
    );

    const placementId = insertRes.rows[0].id;

    // If an application exists, advance status to SELECTED
    if (data.applicationId) {
      await client.query(
        `UPDATE applications 
         SET status = 'SELECTED', updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [data.applicationId]
      );

      // Record in status history
      await client.query(
        `INSERT INTO application_status_history (
          application_id, old_status, new_status, changed_by, remarks
        ) VALUES ($1, 'SHORTLISTED', 'SELECTED', $2, 'Selected - Placement offer generated')`,
        [data.applicationId, user?.id || null]
      );
    }

    // Create student notification
    const studentUserId = studentCheck.rows[0].user_id;
    const companyName = companyCheck.rows[0].company_name;
    await client.query(
      `INSERT INTO notifications (
        user_id, title, message, notification_type, is_read, created_at
      ) VALUES ($1, $2, $3, 'OFFER', false, CURRENT_TIMESTAMP)`,
      [
        studentUserId,
        'Congratulations! Placement Offer Received',
        `You have received a placement offer from ${companyName} with package ${data.package}.`,
      ]
    );

    await client.query('COMMIT');

    // Return the newly created record
    return await getPlacementById(placementId, user);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * 4. PUT /api/placements/:id
 * Update placement details or status
 */
export const updatePlacement = async (id, data, user) => {
  const existing = await getPlacementById(id, user);

  // Permission checks
  if (user?.role === 'STUDENT') {
    const studentId = await getStudentIdByUserId(user.id);
    if (existing.studentId !== studentId) {
      const err = new Error("Forbidden: You cannot update another student's placement");
      err.statusCode = 403;
      throw err;
    }
    // Students can only accept or decline offers
    if (data.status && !['ACCEPTED', 'DECLINED'].includes(data.status)) {
      const err = new Error('Students can only update status to ACCEPTED or DECLINED');
      err.statusCode = 400;
      throw err;
    }
    if (data.package !== undefined || data.joiningDate !== undefined) {
      const err = new Error('Students cannot modify compensation package or joining date');
      err.statusCode = 403;
      throw err;
    }
  } else if (user?.role === 'RECRUITER') {
    const recruiterCompanyId = await getRecruiterCompanyId(user.id);
    if (existing.companyId !== recruiterCompanyId) {
      const err = new Error('Forbidden: You can only update placements for your own company');
      err.statusCode = 403;
      throw err;
    }
  }

  const updates = [];
  const params = [id];

  if (data.status !== undefined) {
    params.push(data.status);
    updates.push(`status = $${params.length}`);
  }
  if (data.package !== undefined) {
    params.push(data.package);
    updates.push(`package = $${params.length}`);
  }
  if (data.joiningDate !== undefined) {
    params.push(data.joiningDate ? new Date(data.joiningDate) : null);
    updates.push(`joining_date = $${params.length}`);
  }
  if (data.offerDetails !== undefined) {
    params.push(data.offerDetails);
    updates.push(`offer_details = $${params.length}`);
  }

  if (updates.length === 0) {
    return existing;
  }

  updates.push('updated_at = CURRENT_TIMESTAMP');

  await query(
    `UPDATE placements
     SET ${updates.join(', ')}
     WHERE id = $1`,
    params
  );

  // Notify parties on status transition or package update
  try {
    if (data.status === 'ACCEPTED' || data.status === 'DECLINED') {
      const recs = await query('SELECT user_id FROM recruiters WHERE company_id = $1', [existing.companyId]);
      for (const r of recs.rows) {
        if (r.user_id) {
          await query(
            `INSERT INTO notifications (user_id, title, message, notification_type, is_read, created_at)
             VALUES ($1, 'Placement Status Update', $2, 'PLACEMENT', FALSE, CURRENT_TIMESTAMP)`,
            [
              r.user_id,
              `Candidate ${existing.studentName || 'Student'} has ${data.status.toLowerCase()} the offer for ${existing.jobTitle || 'Job'}.`,
            ]
          ).catch(() => {});
        }
      }
    } else if (data.package || data.joiningDate || data.offerDetails) {
      const stuUser = await query('SELECT user_id FROM students WHERE id = $1', [existing.studentId]);
      if (stuUser.rows[0]?.user_id) {
        await query(
          `INSERT INTO notifications (user_id, title, message, notification_type, is_read, created_at)
           VALUES ($1, 'Placement Offer Updated', $2, 'PLACEMENT', FALSE, CURRENT_TIMESTAMP)`,
          [
            stuUser.rows[0].user_id,
            `Your placement offer from ${existing.companyName} has been updated. Package: ${data.package || existing.package}.`,
          ]
        ).catch(() => {});
      }
    }
  } catch (err) {
    // Non-blocking notification dispatch
  }

  return await getPlacementById(id, user);
};

/**
 * 5. DELETE /api/placements/:id
 * Delete or cancel a placement offer
 */
export const deletePlacement = async (id, user) => {
  const existing = await getPlacementById(id, user);

  // Students cannot delete placement records
  if (user?.role === 'STUDENT') {
    const err = new Error('Students are not permitted to delete or cancel placement records');
    err.statusCode = 403;
    throw err;
  }

  // Recruiters can only delete their own company's offers
  if (user?.role === 'RECRUITER') {
    const recruiterCompanyId = await getRecruiterCompanyId(user.id);
    if (existing.companyId !== recruiterCompanyId) {
      const err = new Error('Forbidden: You cannot delete placements of another company');
      err.statusCode = 403;
      throw err;
    }
    // Prevent deleting already joined/accepted placements
    if (['ACCEPTED', 'JOINED'].includes(existing.status)) {
      const err = new Error('Cannot delete an offer that has already been accepted or joined');
      err.statusCode = 400;
      throw err;
    }
  }

  await query('DELETE FROM placements WHERE id = $1', [id]);
  return { id, deleted: true, message: 'Placement record deleted successfully' };
};
