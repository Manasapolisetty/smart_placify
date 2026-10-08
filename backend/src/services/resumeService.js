import { query, pool } from '../config/database.js';
import { getStudentByUserId } from './studentService.js';

const formatResume = (r) => ({
  id: r.id,
  studentId: r.student_id,
  fileName: r.file_name,
  name: r.file_name,
  fileUrl: r.file_url,
  filePath: r.file_url,
  isActive: r.is_active,
  isPrimary: r.is_active,
  uploadedAt: r.uploaded_at,
  updatedAt: r.updated_at,
});

/**
 * 6. GET RESUMES
 * Returns resumes belonging to the authenticated student
 */
export const getResumes = async (userId) => {
  const student = await getStudentByUserId(userId);

  const res = await query(
    `SELECT * FROM resumes
     WHERE student_id = $1
     ORDER BY is_active DESC, uploaded_at DESC`,
    [student.id]
  );

  return res.rows.map(formatResume);
};

/**
 * 6. POST RESUME
 * Adds a new resume with metadata and file URL
 * If marked active, sets all other resumes of this student to inactive
 */
export const createResume = async (userId, data) => {
  const student = await getStudentByUserId(userId);

  const fileName = (data.file_name || data.name || 'Resume.pdf').trim();
  const fileUrl = (data.file_url || data.filePath || '').trim();
  const markActive = data.is_active !== undefined ? Boolean(data.is_active) : (data.isPrimary !== undefined ? Boolean(data.isPrimary) : true);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (markActive) {
      await client.query('UPDATE resumes SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE student_id = $1', [student.id]);
    }

    const insertRes = await client.query(
      `INSERT INTO resumes (student_id, file_name, file_url, is_active)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [student.id, fileName, fileUrl, markActive]
    );

    await client.query('COMMIT');
    return formatResume(insertRes.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * 6. PUT RESUME
 * Updates resume details or toggles active status with ownership enforcement
 */
export const updateResume = async (userId, resumeId, data) => {
  const student = await getStudentByUserId(userId);

  const check = await query('SELECT id, student_id FROM resumes WHERE id = $1', [resumeId]);

  if (check.rows.length === 0) {
    const err = new Error('Resume not found.');
    err.statusCode = 404;
    throw err;
  }

  if (check.rows[0].student_id !== student.id) {
    const err = new Error('Access denied: You do not have permission to modify this resume.');
    err.statusCode = 403;
    throw err;
  }

  const fileName = data.file_name !== undefined ? data.file_name.trim() : (data.name !== undefined ? data.name.trim() : null);
  const fileUrl = data.file_url !== undefined ? data.file_url.trim() : (data.filePath !== undefined ? data.filePath.trim() : null);
  const markActive = data.is_active !== undefined ? Boolean(data.is_active) : (data.isPrimary !== undefined ? Boolean(data.isPrimary) : null);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (markActive === true) {
      await client.query('UPDATE resumes SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE student_id = $1', [student.id]);
    }

    const updateRes = await client.query(
      `UPDATE resumes
       SET file_name = COALESCE($1, file_name),
           file_url = COALESCE($2, file_url),
           is_active = COALESCE($3, is_active),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [fileName, fileUrl, markActive, resumeId]
    );

    await client.query('COMMIT');
    return formatResume(updateRes.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * 6. DELETE RESUME
 * Deletes a resume with strict ownership enforcement
 */
export const deleteResume = async (userId, resumeId) => {
  const student = await getStudentByUserId(userId);

  const check = await query('SELECT id, student_id FROM resumes WHERE id = $1', [resumeId]);

  if (check.rows.length === 0) {
    const err = new Error('Resume not found.');
    err.statusCode = 404;
    throw err;
  }

  if (check.rows[0].student_id !== student.id) {
    const err = new Error('Access denied: You do not have permission to delete this resume.');
    err.statusCode = 403;
    throw err;
  }

  await query('DELETE FROM resumes WHERE id = $1', [resumeId]);

  return { message: 'Resume deleted successfully.' };
};
