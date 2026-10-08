import { query } from '../config/database.js';
import { getStudentByUserId } from './studentService.js';

/**
 * Re-computes and updates the latest/average CGPA on students table
 */
const syncStudentCgpa = async (studentId) => {
  const countRes = await query(
    `SELECT COUNT(*) as count, ROUND(AVG(cgpa), 2) as avg_cgpa
     FROM academic_records
     WHERE student_id = $1 AND cgpa IS NOT NULL`,
    [studentId]
  );
  if (parseInt(countRes.rows[0]?.count || 0, 10) > 0) {
    const avgCgpa = countRes.rows[0].avg_cgpa;
    await query('UPDATE students SET cgpa = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [avgCgpa, studentId]);
  }
};

/**
 * 2. GET ACADEMIC RECORDS
 * Returns all semester records belonging to the authenticated student
 */
export const getAcademics = async (userId) => {
  const student = await getStudentByUserId(userId);

  const res = await query(
    `SELECT id, student_id as "studentId", semester, academic_year as "academicYear",
            cgpa, percentage, backlogs, created_at as "createdAt", updated_at as "updatedAt"
     FROM academic_records
     WHERE student_id = $1
     ORDER BY semester ASC, created_at ASC`,
    [student.id]
  );

  const records = res.rows;
  const totalBacklogs = records.reduce((acc, curr) => acc + (parseInt(curr.backlogs, 10) || 0), 0);
  const validCgpas = records.map((r) => parseFloat(r.cgpa)).filter((val) => !isNaN(val) && val > 0);
  const avgCgpa = validCgpas.length > 0 ? (validCgpas.reduce((a, b) => a + b, 0) / validCgpas.length).toFixed(2) : '0.00';

  return {
    studentId: student.id,
    overallCgpa: parseFloat(avgCgpa),
    overall_cgpa: parseFloat(avgCgpa),
    totalBacklogs,
    records,
  };
};

/**
 * 2. POST ACADEMIC RECORD
 * Creates a new semester academic record for the student
 */
export const createAcademicRecord = async (userId, data) => {
  const student = await getStudentByUserId(userId);

  const semester = (data.semester || '').trim();
  const academicYear = (data.academic_year || data.academicYear || '').trim();
  const cgpa = data.cgpa !== undefined && data.cgpa !== null && data.cgpa !== '' ? parseFloat(data.cgpa) : null;
  const percentage = data.percentage !== undefined && data.percentage !== null && data.percentage !== '' ? parseFloat(data.percentage) : null;
  const backlogs = data.backlogs !== undefined && data.backlogs !== null && data.backlogs !== '' ? parseInt(data.backlogs, 10) : 0;

  // Check for duplicate semester record
  const existing = await query(
    'SELECT id FROM academic_records WHERE student_id = $1 AND semester = $2',
    [student.id, semester]
  );

  if (existing.rows.length > 0) {
    const error = new Error(`Academic record for semester "${semester}" already exists.`);
    error.statusCode = 409;
    throw error;
  }

  const insertRes = await query(
    `INSERT INTO academic_records (student_id, semester, academic_year, cgpa, percentage, backlogs)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, student_id as "studentId", semester, academic_year as "academicYear",
               cgpa, percentage, backlogs, created_at as "createdAt", updated_at as "updatedAt"`,
    [student.id, semester, academicYear, cgpa, percentage, backlogs]
  );

  await syncStudentCgpa(student.id);

  return insertRes.rows[0];
};

/**
 * 2. PUT ACADEMIC RECORD
 * Updates an existing semester record with ownership validation
 */
export const updateAcademicRecord = async (userId, recordId, data) => {
  const student = await getStudentByUserId(userId);

  // Verify record exists and ownership
  const checkRes = await query('SELECT id, student_id, semester FROM academic_records WHERE id = $1', [recordId]);

  if (checkRes.rows.length === 0) {
    const error = new Error('Academic record not found.');
    error.statusCode = 404;
    throw error;
  }

  const existingRecord = checkRes.rows[0];
  if (existingRecord.student_id !== student.id) {
    const error = new Error('Access denied: You do not have permission to modify this academic record.');
    error.statusCode = 403;
    throw error;
  }

  const newSemester = data.semester !== undefined ? data.semester.trim() : null;
  const newYear = data.academic_year || data.academicYear || null;
  const newCgpa = data.cgpa !== undefined && data.cgpa !== null && data.cgpa !== '' ? parseFloat(data.cgpa) : null;
  const newPercentage = data.percentage !== undefined && data.percentage !== null && data.percentage !== '' ? parseFloat(data.percentage) : null;
  const newBacklogs = data.backlogs !== undefined && data.backlogs !== null && data.backlogs !== '' ? parseInt(data.backlogs, 10) : null;

  // If changing semester name, ensure no conflict
  if (newSemester && newSemester !== existingRecord.semester) {
    const conflict = await query(
      'SELECT id FROM academic_records WHERE student_id = $1 AND semester = $2 AND id != $3',
      [student.id, newSemester, recordId]
    );
    if (conflict.rows.length > 0) {
      const error = new Error(`Academic record for semester "${newSemester}" already exists.`);
      error.statusCode = 409;
      throw error;
    }
  }

  const updateRes = await query(
    `UPDATE academic_records
     SET semester = COALESCE($1, semester),
         academic_year = COALESCE($2, academic_year),
         cgpa = COALESCE($3, cgpa),
         percentage = COALESCE($4, percentage),
         backlogs = COALESCE($5, backlogs),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $6
     RETURNING id, student_id as "studentId", semester, academic_year as "academicYear",
               cgpa, percentage, backlogs, created_at as "createdAt", updated_at as "updatedAt"`,
    [newSemester, newYear, newCgpa, newPercentage, newBacklogs, recordId]
  );

  await syncStudentCgpa(student.id);

  return updateRes.rows[0];
};

/**
 * 2. DELETE ACADEMIC RECORD
 * Deletes a semester record with ownership validation
 */
export const deleteAcademicRecord = async (userId, recordId) => {
  const student = await getStudentByUserId(userId);

  const checkRes = await query('SELECT id, student_id FROM academic_records WHERE id = $1', [recordId]);

  if (checkRes.rows.length === 0) {
    const error = new Error('Academic record not found.');
    error.statusCode = 404;
    throw error;
  }

  if (checkRes.rows[0].student_id !== student.id) {
    const error = new Error('Access denied: You do not have permission to delete this academic record.');
    error.statusCode = 403;
    throw error;
  }

  await query('DELETE FROM academic_records WHERE id = $1', [recordId]);

  await syncStudentCgpa(student.id);

  return { message: 'Academic record deleted successfully.' };
};
