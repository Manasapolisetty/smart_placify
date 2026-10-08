import bcrypt from 'bcryptjs';
import { query, pool } from '../config/database.js';
import { generateToken } from '../utils/jwt.js';

/**
 * Register a new user (Public registration limited to STUDENT and RECRUITER)
 */
export const registerUser = async ({ name, email, password, phone = null, role = 'STUDENT' }) => {
  const normalizedEmail = (email || '').trim().toLowerCase();
  const normalizedRole = (role || 'STUDENT').trim().toUpperCase();

  // Security enforcement: public registration cannot create ADMIN or PLACEMENT_OFFICER
  if (normalizedRole === 'ADMIN' || normalizedRole === 'PLACEMENT_OFFICER') {
    const error = new Error('Public registration is not permitted for this role.');
    error.statusCode = 403;
    throw error;
  }

  if (!['STUDENT', 'RECRUITER'].includes(normalizedRole)) {
    const error = new Error('Invalid role specified for registration.');
    error.statusCode = 400;
    throw error;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check if email already registered
    const existing = await client.query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
    if (existing.rows.length > 0) {
      const error = new Error('Email address is already registered.');
      error.statusCode = 409;
      throw error;
    }

    // Hash password with bcrypt (salt rounds = 10)
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert user record
    const userInsert = await client.query(
      `INSERT INTO users (name, email, password_hash, role, phone, status)
       VALUES ($1, $2, $3, $4, $5, 'ACTIVE')
       RETURNING id, name, email, role, phone, status, created_at`,
      [name.trim(), normalizedEmail, passwordHash, normalizedRole, phone ? phone.trim() : null]
    );

    const newUser = userInsert.rows[0];

    // Create role-specific secondary profile
    if (normalizedRole === 'STUDENT') {
      const rollNumber = `ROLL-${Date.now().toString().slice(-6)}`;
      const studentId = `STU-${Date.now().toString().slice(-6)}`;

      await client.query(
        `INSERT INTO students (user_id, student_id, roll_number, phone)
         VALUES ($1, $2, $3, $4)`,
        [newUser.id, studentId, rollNumber, newUser.phone]
      );
    } else if (normalizedRole === 'RECRUITER') {
      const recruiterCode = `REC-${Date.now().toString().slice(-6)}`;
      await client.query(
        `INSERT INTO recruiters (user_id, designation, recruiter_code)
         VALUES ($1, 'Recruiter', $2)`,
        [newUser.id, recruiterCode]
      );
    }

    await client.query('COMMIT');

    const token = generateToken({ userId: newUser.id, role: newUser.role });

    return {
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        phone: newUser.phone || '',
        status: newUser.status,
      },
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

/**
 * Authenticate existing user with email and password
 */
export const loginUser = async ({ email, password }) => {
  const normalizedEmail = (email || '').trim().toLowerCase();

  const userRes = await query(
    `SELECT u.id, u.name, u.email, u.password_hash, u.role, u.phone, u.status,
            s.student_id, s.roll_number, s.cgpa,
            r.designation as recruiter_designation, c.company_name,
            po.designation as officer_designation
     FROM users u
     LEFT JOIN students s ON u.id = s.user_id
     LEFT JOIN recruiters r ON u.id = r.user_id
     LEFT JOIN companies c ON r.company_id = c.id
     LEFT JOIN placement_officers po ON u.id = po.user_id
     WHERE LOWER(u.email) = $1`,
    [normalizedEmail]
  );

  if (userRes.rows.length === 0) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  const user = userRes.rows[0];

  // Verify account status
  const normalizedStatus = (user.status || '').toUpperCase();
  if (normalizedStatus !== 'ACTIVE') {
    const error = new Error('Account is inactive or suspended. Please contact administrator.');
    error.statusCode = 403;
    throw error;
  }

  // Compare bcrypt password
  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  // Update last_login timestamp
  await query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);

  const token = generateToken({ userId: user.id, role: user.role });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone || '',
      status: user.status,
      studentId: user.student_id || undefined,
      rollNumber: user.roll_number || undefined,
      cgpa: user.cgpa ? parseFloat(user.cgpa) : undefined,
      company: user.company_name || undefined,
      designation: user.recruiter_designation || user.officer_designation || undefined,
    },
  };
};

/**
 * Retrieve user details by ID
 */
export const getUserById = async (userId) => {
  const userRes = await query(
    `SELECT u.id, u.name, u.email, u.role, u.phone, u.status, u.created_at, u.last_login,
            s.student_id, s.roll_number, s.cgpa,
            r.designation as recruiter_designation, c.company_name,
            po.designation as officer_designation
     FROM users u
     LEFT JOIN students s ON u.id = s.user_id
     LEFT JOIN recruiters r ON u.id = r.user_id
     LEFT JOIN companies c ON r.company_id = c.id
     LEFT JOIN placement_officers po ON u.id = po.user_id
     WHERE u.id = $1`,
    [userId]
  );

  if (userRes.rows.length === 0) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
  }

  const user = userRes.rows[0];

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone || '',
    status: user.status,
    studentId: user.student_id || undefined,
    rollNumber: user.roll_number || undefined,
    cgpa: user.cgpa ? parseFloat(user.cgpa) : undefined,
    company: user.company_name || undefined,
    designation: user.recruiter_designation || user.officer_designation || undefined,
    lastLogin: user.last_login,
    createdAt: user.created_at,
  };
};
