import { query } from '../config/database.js';
import { getStudentByUserId } from './studentService.js';

const formatCertification = (r) => ({
  id: r.id,
  studentId: r.student_id,
  certificationName: r.certification_name,
  name: r.certification_name,
  issuingOrganization: r.issuing_organization,
  issuer: r.issuing_organization,
  issueDate: r.issue_date,
  expiryDate: r.expiry_date,
  credentialId: r.credential_id,
  credentialUrl: r.credential_url,
  verifyUrl: r.credential_url,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

/**
 * 5. GET CERTIFICATIONS
 * Returns all certifications earned by the authenticated student
 */
export const getCertifications = async (userId) => {
  const student = await getStudentByUserId(userId);

  const res = await query(
    `SELECT * FROM certifications
     WHERE student_id = $1
     ORDER BY issue_date DESC NULLS LAST, created_at DESC`,
    [student.id]
  );

  return res.rows.map(formatCertification);
};

/**
 * 5. POST CERTIFICATION
 * Adds a new verified or student certification
 */
export const createCertification = async (userId, data) => {
  const student = await getStudentByUserId(userId);

  const name = (data.certification_name || data.name || '').trim();
  const issuer = (data.issuing_organization || data.issuer || '').trim();
  const issueDate = data.issue_date || data.issueDate || null;
  const expiryDate = data.expiry_date || data.expiryDate || null;
  const credentialId = data.credential_id || data.credentialId || null;
  const credentialUrl = data.credential_url || data.credentialUrl || data.verifyUrl || null;

  const insertRes = await query(
    `INSERT INTO certifications
     (student_id, certification_name, issuing_organization, issue_date, expiry_date, credential_id, credential_url)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [student.id, name, issuer, issueDate, expiryDate, credentialId, credentialUrl]
  );

  return formatCertification(insertRes.rows[0]);
};

/**
 * 5. PUT CERTIFICATION
 * Updates an existing certification with strict ownership validation
 */
export const updateCertification = async (userId, certId, data) => {
  const student = await getStudentByUserId(userId);

  const check = await query('SELECT id, student_id FROM certifications WHERE id = $1', [certId]);

  if (check.rows.length === 0) {
    const err = new Error('Certification not found.');
    err.statusCode = 404;
    throw err;
  }

  if (check.rows[0].student_id !== student.id) {
    const err = new Error('Access denied: You do not have permission to modify this certification.');
    err.statusCode = 403;
    throw err;
  }

  const name = data.certification_name !== undefined ? data.certification_name.trim() : (data.name !== undefined ? data.name.trim() : null);
  const issuer = data.issuing_organization !== undefined ? data.issuing_organization.trim() : (data.issuer !== undefined ? data.issuer.trim() : null);
  const issueDate = data.issue_date !== undefined ? data.issue_date : (data.issueDate !== undefined ? data.issueDate : null);
  const expiryDate = data.expiry_date !== undefined ? data.expiry_date : (data.expiryDate !== undefined ? data.expiryDate : null);
  const credentialId = data.credential_id !== undefined ? data.credential_id : (data.credentialId !== undefined ? data.credentialId : null);
  const credentialUrl = data.credential_url !== undefined ? data.credential_url : (data.credentialUrl !== undefined ? data.credentialUrl : (data.verifyUrl !== undefined ? data.verifyUrl : null));

  const updateRes = await query(
    `UPDATE certifications
     SET certification_name = COALESCE($1, certification_name),
         issuing_organization = COALESCE($2, issuing_organization),
         issue_date = COALESCE($3, issue_date),
         expiry_date = COALESCE($4, expiry_date),
         credential_id = COALESCE($5, credential_id),
         credential_url = COALESCE($6, credential_url),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $7
     RETURNING *`,
    [name, issuer, issueDate, expiryDate, credentialId, credentialUrl, certId]
  );

  return formatCertification(updateRes.rows[0]);
};

/**
 * 5. DELETE CERTIFICATION
 * Deletes a certification with strict ownership validation
 */
export const deleteCertification = async (userId, certId) => {
  const student = await getStudentByUserId(userId);

  const check = await query('SELECT id, student_id FROM certifications WHERE id = $1', [certId]);

  if (check.rows.length === 0) {
    const err = new Error('Certification not found.');
    err.statusCode = 404;
    throw err;
  }

  if (check.rows[0].student_id !== student.id) {
    const err = new Error('Access denied: You do not have permission to delete this certification.');
    err.statusCode = 403;
    throw err;
  }

  await query('DELETE FROM certifications WHERE id = $1', [certId]);

  return { message: 'Certification deleted successfully.' };
};
