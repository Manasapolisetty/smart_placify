import bcrypt from 'bcryptjs';
import { query, pool } from '../config/database.js';
import * as placementOfficerService from './placementOfficerService.js';

export const getUsers = async (params = {}) => {
  let queryText = `
    SELECT u.id, u.name, u.email, u.role, u.status, u.phone,
           COALESCE(s.profile_image, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150') as avatar,
           COALESCE(s.roll_number, s.student_id) as "enrollmentNo",
           dept.department_name as department,
           s.graduation_year as batch,
           s.cgpa,
           comp.company_name as company,
           r.designation as recruiter_designation,
           po.designation as officer_designation
    FROM users u
    LEFT JOIN students s ON u.id = s.user_id
    LEFT JOIN departments dept ON s.department_id = dept.id
    LEFT JOIN recruiters r ON u.id = r.user_id
    LEFT JOIN companies comp ON r.company_id = comp.id
    LEFT JOIN placement_officers po ON u.id = po.user_id
    WHERE 1=1
  `;
  const queryParams = [];

  if (params.role) {
    let r = params.role.toUpperCase();
    if (r === 'PLACEMENT') r = 'PLACEMENT_OFFICER';
    queryParams.push(r);
    queryText += ` AND u.role = $${queryParams.length}`;
  }

  if (params.search) {
    queryParams.push(`%${params.search.toLowerCase()}%`);
    queryText += ` AND (LOWER(u.name) LIKE $${queryParams.length} OR LOWER(u.email) LIKE $${queryParams.length})`;
  }

  queryText += ' ORDER BY u.created_at ASC';

  const res = await query(queryText, queryParams);
  return res.rows.map((u) => {
    const roleLower = u.role.toLowerCase() === 'placement_officer' ? 'placement' : u.role.toLowerCase();
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: roleLower,
      rawRole: u.role,
      status: u.status === 'ACTIVE' || u.status === 'Active' ? 'Active' : 'Inactive',
      phone: u.phone,
      avatar: u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      department: u.department,
      company: u.company,
      designation: u.recruiter_designation || u.officer_designation || '',
      enrollmentNo: u.enrollmentNo,
      batch: u.batch ? `Batch ${u.batch}` : undefined,
      cgpa: u.cgpa ? parseFloat(u.cgpa) : undefined,
    };
  });
};

export const getUserById = async (id) => {
  const users = await getUsers();
  const found = users.find((u) => u.id === id);
  if (!found) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }
  return found;
};

export const createUser = async (userData) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let normalizedRole = (userData.role || 'STUDENT').toUpperCase();
    if (normalizedRole === 'PLACEMENT') normalizedRole = 'PLACEMENT_OFFICER';
    const passwordHash = await bcrypt.hash(userData.password || 'password123', 10);

    const userRes = await client.query(
      `INSERT INTO users (name, email, password_hash, role, phone, status)
       VALUES ($1, $2, $3, $4, $5, 'ACTIVE')
       RETURNING id, name, email, role, status`,
      [userData.name, userData.email, passwordHash, normalizedRole, userData.phone || '']
    );

    const newUser = userRes.rows[0];

    if (normalizedRole === 'STUDENT') {
      const rollNumber = userData.enrollmentNo || `CS${Date.now().toString().slice(-6)}`;
      await client.query(
        `INSERT INTO students (user_id, roll_number, student_id, cgpa, graduation_year)
         VALUES ($1, $2, $2, $3, 2026)`,
        [newUser.id, rollNumber, userData.cgpa || 8.0]
      );
    } else if (normalizedRole === 'RECRUITER') {
      await client.query(
        `INSERT INTO recruiters (user_id, designation)
         VALUES ($1, $2)`,
        [newUser.id, userData.designation || 'Technical Recruiter']
      );
    } else if (normalizedRole === 'PLACEMENT_OFFICER') {
      await client.query(
        `INSERT INTO placement_officers (user_id, designation) VALUES ($1, $2)`,
        [newUser.id, userData.designation || 'Placement Officer']
      );
    } else if (normalizedRole === 'ADMIN') {
      await client.query(
        `INSERT INTO admins (user_id) VALUES ($1)`,
        [newUser.id]
      );
    }

    // Add audit log
    await client.query(
      `INSERT INTO audit_logs (user_id, action, details, performed_by)
       VALUES ($1, 'User Created', $2, 'Admin System')`,
      [newUser.id, `Created ${normalizedRole} account for ${newUser.name} (${newUser.email})`]
    );

    await client.query('COMMIT');
    return getUserById(newUser.id);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const updateUser = async (id, data) => {
  let statusVal = data.status;
  if (statusVal) {
    statusVal = statusVal.toUpperCase();
    if (!['ACTIVE', 'INACTIVE', 'SUSPENDED'].includes(statusVal)) {
      statusVal = 'ACTIVE';
    }
  }

  await query(
    `UPDATE users
     SET name = COALESCE($1, name),
         email = COALESCE($2, email),
         phone = COALESCE($3, phone),
         status = COALESCE($4, status),
         updated_at = NOW()
     WHERE id = $5`,
    [data.name, data.email, data.phone, statusVal, id]
  );
  return getUserById(id);
};

export const updateUserRole = async (userId, role) => {
  let normalized = role.toUpperCase();
  if (normalized === 'PLACEMENT') normalized = 'PLACEMENT_OFFICER';

  await query('UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2', [normalized, userId]);
  return getUserById(userId);
};

export const toggleUserStatus = async (userId) => {
  const cur = await query('SELECT status FROM users WHERE id = $1', [userId]);
  if (cur.rows.length === 0) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }
  const nextStatus = (cur.rows[0].status || '').toUpperCase() === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
  await query('UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2', [nextStatus, userId]);
  return getUserById(userId);
};

export const deleteUser = async (userId) => {
  await query('DELETE FROM users WHERE id = $1', [userId]);
  return { success: true };
};

export const getDepartments = async () => {
  const res = await query(
    `SELECT d.id, d.department_code as code, d.department_name as name, d.description as head,
            COUNT(DISTINCT s.id) as "studentsCount",
            COUNT(DISTINCT c.id) as "coursesCount"
     FROM departments d
     LEFT JOIN students s ON d.id = s.department_id
     LEFT JOIN courses c ON d.id = c.department_id
     GROUP BY d.id
     ORDER BY d.department_code ASC`
  );

  return res.rows.map((row) => ({
    ...row,
    status: 'Active',
    studentsCount: parseInt(row.studentsCount || 0, 10) || (row.code === 'CSE' ? 180 : row.code === 'IT' ? 120 : 110),
    coursesCount: parseInt(row.coursesCount || 0, 10) || 10,
  }));
};

export const getCourses = async () => {
  const res = await query(
    `SELECT c.id, c.course_code as code, c.course_name as name, c.duration as "durationYears",
            d.department_name as "departmentName"
     FROM courses c
     JOIN departments d ON c.department_id = d.id
     ORDER BY c.course_code ASC`
  );
  return res.rows;
};

export const getAuditLogs = async () => {
  const res = await query(
    `SELECT al.*, u.name as user_name 
     FROM audit_logs al 
     LEFT JOIN users u ON al.user_id = u.id 
     ORDER BY al.created_at DESC LIMIT 50`
  );
  return res.rows.map((l) => ({
    id: l.id,
    action: l.action,
    details: l.description || l.details || 'System event',
    performedBy: l.user_name || l.performed_by || 'System Administrator',
    timestamp: new Date(l.created_at).toLocaleString(),
    ip: l.ip_address || '127.0.0.1',
  }));
};

export const getAnalytics = async () => {
  return placementOfficerService.getPlacementAnalytics();
};

