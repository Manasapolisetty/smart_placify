import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import app from '../app.js';
import { pool, query } from '../config/database.js';

async function runAuthTests() {
  console.log('====================================================');
  console.log('SMARTPLACIFY AUTHENTICATION & AUTHORIZATION TESTS');
  console.log('====================================================\n');

  // Start app on ephemeral port for tests
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;
  console.log(`Test server running on ${baseUrl}\n`);

  let passedCount = 0;
  let failedCount = 0;

  const assert = (name, condition, details = '') => {
    if (condition) {
      console.log(`[PASS] ${name}`);
      passedCount++;
    } else {
      console.error(`[FAIL] ${name} ${details ? `(${details})` : ''}`);
      failedCount++;
    }
  };

  const testEmailStudent = `verify.student.${Date.now()}@smartplacify.edu`;
  const testEmailRecruiter = `verify.recruiter.${Date.now()}@smartplacify.edu`;
  const testPassword = 'StrongPassword123!';

  let studentToken = '';
  let recruiterToken = '';
  let officerToken = '';
  let adminToken = '';

  try {
    // =========================================================================
    // 1. BACKEND HEALTH
    // =========================================================================
    console.log('--- 1. BACKEND HEALTH ---');
    const healthRes = await fetch(`${baseUrl}/api/health`);
    const healthData = await healthRes.json();
    assert(
      '1.1 GET /api/health returns HTTP 200',
      healthRes.status === 200 && healthData.success === true,
      `Status: ${healthRes.status}`
    );

    const dbHealthRes = await fetch(`${baseUrl}/api/health/db`);
    const dbHealthData = await dbHealthRes.json();
    assert(
      '1.2 GET /api/health/db returns HTTP 200 and successful PostgreSQL connection',
      dbHealthRes.status === 200 && dbHealthData.success === true,
      `Status: ${dbHealthRes.status}`
    );

    // =========================================================================
    // 2. REGISTRATION TESTS
    // =========================================================================
    console.log('\n--- 2. REGISTRATION TESTS ---');
    // Student registration
    const regStudentRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Verification Student',
        email: testEmailStudent,
        password: testPassword,
        phone: '9876543210',
        role: 'STUDENT',
      }),
    });
    const regStudentData = await regStudentRes.json();
    assert(
      '2.1 Student registration returns HTTP 201',
      regStudentRes.status === 201 && regStudentData.success === true,
      `Status: ${regStudentRes.status}`
    );

    const dbStudent = await query('SELECT id, email, password_hash, role FROM users WHERE email = $1', [testEmailStudent]);
    assert(
      '2.2 Student user record exists in PostgreSQL',
      dbStudent.rows.length === 1,
      `Found: ${dbStudent.rows.length}`
    );
    assert(
      '2.3 Password is bcrypt hashed in database',
      Boolean(dbStudent.rows[0]?.password_hash && dbStudent.rows[0].password_hash.startsWith('$2a$')),
      `Hash prefix verified`
    );
    assert(
      '2.4 password_hash is NEVER returned in response',
      regStudentData.data?.user?.password_hash === undefined && regStudentData.user?.password_hash === undefined
    );
    assert(
      '2.5 User role is STUDENT',
      dbStudent.rows[0]?.role === 'STUDENT' && (regStudentData.data?.user?.role || regStudentData.user?.role) === 'STUDENT'
    );

    // Recruiter registration
    const regRecruiterRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Verification Recruiter',
        email: testEmailRecruiter,
        password: testPassword,
        phone: '9812345678',
        role: 'RECRUITER',
      }),
    });
    const regRecruiterData = await regRecruiterRes.json();
    assert(
      '2.6 Recruiter registration returns HTTP 201',
      regRecruiterRes.status === 201 && regRecruiterData.success === true
    );
    const dbRecruiter = await query('SELECT id, email, password_hash, role FROM users WHERE email = $1', [testEmailRecruiter]);
    assert(
      '2.7 Recruiter user record exists in PostgreSQL with bcrypt hash and role RECRUITER',
      dbRecruiter.rows.length === 1 && dbRecruiter.rows[0].role === 'RECRUITER' && dbRecruiter.rows[0].password_hash.startsWith('$2a$')
    );
    assert(
      '2.8 password_hash is NEVER returned for recruiter registration',
      regRecruiterData.data?.user?.password_hash === undefined
    );

    // Attempt role = ADMIN registration (Must be rejected)
    const regAdminRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Rogue Admin',
        email: `rogue.admin.${Date.now()}@test.edu`,
        password: testPassword,
        role: 'ADMIN',
      }),
    });
    const regAdminData = await regAdminRes.json();
    assert(
      '2.9 Attempting public registration with role=ADMIN is rejected (HTTP 400 or 403)',
      (regAdminRes.status === 400 || regAdminRes.status === 403) && regAdminData.success === false,
      `Status: ${regAdminRes.status}, Message: ${regAdminData.message}`
    );

    // Attempt duplicate email registration
    const dupRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Duplicate Student',
        email: testEmailStudent,
        password: testPassword,
        role: 'STUDENT',
      }),
    });
    const dupData = await dupRes.json();
    assert(
      '2.10 Attempt duplicate email registration returns HTTP 409',
      dupRes.status === 409 && dupData.success === false,
      `Status: ${dupRes.status}, Message: ${dupData.message}`
    );

    // =========================================================================
    // 3. LOGIN TESTS
    // =========================================================================
    console.log('\n--- 3. LOGIN TESTS ---');
    // Valid student login
    const loginStudentRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmailStudent,
        password: testPassword,
      }),
    });
    const loginStudentData = await loginStudentRes.json();
    studentToken = loginStudentData.data?.token || loginStudentData.token;
    assert(
      '3.1 Valid student login returns HTTP 200',
      loginStudentRes.status === 200 && loginStudentData.success === true,
      `Status: ${loginStudentRes.status}`
    );
    assert(
      '3.2 JWT is generated upon login',
      Boolean(studentToken && typeof studentToken === 'string' && studentToken.split('.').length === 3),
      `Token format verified`
    );
    assert(
      '3.3 User information is returned',
      Boolean(loginStudentData.data?.user?.email === testEmailStudent),
      `Email matched`
    );
    assert(
      '3.4 password_hash is NOT returned in login response',
      loginStudentData.data?.user?.password_hash === undefined && loginStudentData.user?.password_hash === undefined
    );
    assert(
      '3.5 Role is returned in login response',
      (loginStudentData.data?.user?.role || loginStudentData.user?.role) === 'STUDENT'
    );

    // Valid recruiter login
    const loginRecruiterRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmailRecruiter,
        password: testPassword,
      }),
    });
    const loginRecruiterData = await loginRecruiterRes.json();
    recruiterToken = loginRecruiterData.data?.token || loginRecruiterData.token;
    assert(
      '3.6 Valid recruiter login returns HTTP 200 with JWT and role RECRUITER',
      loginRecruiterRes.status === 200 && Boolean(recruiterToken) && (loginRecruiterData.data?.user?.role || loginRecruiterData.user?.role) === 'RECRUITER'
    );

    // Invalid password
    const invalidPassRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmailStudent,
        password: 'IncorrectPassword999!',
      }),
    });
    const invalidPassData = await invalidPassRes.json();
    assert(
      '3.7 Login with invalid password returns HTTP 401',
      invalidPassRes.status === 401 && invalidPassData.success === false,
      `Status: ${invalidPassRes.status}`
    );

    // Nonexistent email
    const unknownEmailRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'does_not_exist_ever@unknown.edu',
        password: testPassword,
      }),
    });
    const unknownEmailData = await unknownEmailRes.json();
    assert(
      '3.8 Login with nonexistent email returns HTTP 401',
      unknownEmailRes.status === 401 && unknownEmailData.success === false,
      `Status: ${unknownEmailRes.status}`
    );

    // =========================================================================
    // 4. JWT TESTS
    // =========================================================================
    console.log('\n--- 4. JWT TESTS ---');
    // Valid JWT to /api/auth/me
    const meValidRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const meValidData = await meValidRes.json();
    assert(
      '4.1 GET /api/auth/me with valid Bearer JWT returns HTTP 200',
      meValidRes.status === 200 && meValidData.success === true && meValidData.data?.email === testEmailStudent,
      `Status: ${meValidRes.status}`
    );

    // Without Authorization header
    const meNoHeaderRes = await fetch(`${baseUrl}/api/auth/me`);
    const meNoHeaderData = await meNoHeaderRes.json();
    assert(
      '4.2 GET /api/auth/me without Authorization header returns HTTP 401',
      meNoHeaderRes.status === 401 && meNoHeaderData.success === false,
      `Status: ${meNoHeaderRes.status}`
    );

    // With invalid JWT
    const meInvalidTokenRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: 'Bearer invalid.token.payload' },
    });
    const meInvalidTokenData = await meInvalidTokenRes.json();
    assert(
      '4.3 GET /api/auth/me with invalid JWT returns HTTP 401',
      meInvalidTokenRes.status === 401 && meInvalidTokenData.success === false,
      `Status: ${meInvalidTokenRes.status}`
    );

    // With expired JWT
    const secret = process.env.JWT_SECRET || 'smartplacify_dev_jwt_secret_key_2026';
    const expiredToken = jwt.sign(
      { userId: dbStudent.rows[0].id, role: 'STUDENT' },
      secret,
      { expiresIn: '-5s' }
    );
    const meExpiredRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${expiredToken}` },
    });
    const meExpiredData = await meExpiredRes.json();
    assert(
      '4.4 GET /api/auth/me with expired JWT returns HTTP 401',
      meExpiredRes.status === 401 && meExpiredData.success === false,
      `Status: ${meExpiredRes.status}`
    );

    // =========================================================================
    // 5. ROLE AUTHORIZATION TESTS
    // =========================================================================
    console.log('\n--- 5. ROLE AUTHORIZATION TESTS ---');
    // Retrieve officer and admin tokens from seed accounts
    const officerLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'officer.demo@smartplacify.edu',
        password: 'password123',
      }),
    });
    const officerLoginData = await officerLoginRes.json();
    officerToken = officerLoginData.data?.token || officerLoginData.token;

    const adminLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin.demo@smartplacify.edu',
        password: 'password123',
      }),
    });
    const adminLoginData = await adminLoginRes.json();
    adminToken = adminLoginData.data?.token || adminLoginData.token;

    // STUDENT cannot access recruiter-only routes
    const resStudOnRec = await fetch(`${baseUrl}/api/test/recruiter`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(
      '5.1 STUDENT cannot access recruiter-only routes (returns HTTP 403)',
      resStudOnRec.status === 403,
      `Status: ${resStudOnRec.status}`
    );

    // RECRUITER cannot access student-only routes
    const resRecOnStud = await fetch(`${baseUrl}/api/test/student`, {
      headers: { Authorization: `Bearer ${recruiterToken}` },
    });
    assert(
      '5.2 RECRUITER cannot access student-only routes (returns HTTP 403)',
      resRecOnStud.status === 403,
      `Status: ${resRecOnStud.status}`
    );

    // STUDENT cannot access placement-officer routes
    const resStudOnOff = await fetch(`${baseUrl}/api/test/placement-officer`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(
      '5.3 STUDENT cannot access placement-officer routes (returns HTTP 403)',
      resStudOnOff.status === 403,
      `Status: ${resStudOnOff.status}`
    );

    // RECRUITER cannot access admin routes
    const resRecOnAdm = await fetch(`${baseUrl}/api/test/admin`, {
      headers: { Authorization: `Bearer ${recruiterToken}` },
    });
    assert(
      '5.4 RECRUITER cannot access admin routes (returns HTTP 403)',
      resRecOnAdm.status === 403,
      `Status: ${resRecOnAdm.status}`
    );

    // PLACEMENT_OFFICER cannot access admin-only routes
    const resOffOnAdm = await fetch(`${baseUrl}/api/test/admin`, {
      headers: { Authorization: `Bearer ${officerToken}` },
    });
    assert(
      '5.5 PLACEMENT_OFFICER cannot access admin-only routes (returns HTTP 403)',
      resOffOnAdm.status === 403,
      `Status: ${resOffOnAdm.status}`
    );

    // ADMIN can access admin routes
    const resAdmOnAdm = await fetch(`${baseUrl}/api/test/admin`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(
      '5.6 ADMIN can access admin routes (returns HTTP 200)',
      resAdmOnAdm.status === 200,
      `Status: ${resAdmOnAdm.status}`
    );

    // =========================================================================
    // 6. ACCOUNT STATUS TESTS
    // =========================================================================
    console.log('\n--- 6. ACCOUNT STATUS TESTS ---');
    // ACTIVE user can log in
    assert(
      '6.1 ACTIVE user can log in (verified via student login)',
      loginStudentRes.status === 200
    );

    // INACTIVE user cannot log in
    const inactiveEmail = `status.inactive.${Date.now()}@smartplacify.edu`;
    await query(
      `INSERT INTO users (name, email, password_hash, role, status)
       VALUES ('Inactive User', $1, '$2a$10$FmYlh8s/XNKNlcssq.5N4.JA3Pb4u4z5Rst7GlR./PjkstjunbSP2', 'STUDENT', 'INACTIVE')`,
      [inactiveEmail]
    );
    const loginInactiveRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inactiveEmail, password: 'password123' }),
    });
    assert(
      '6.2 INACTIVE user cannot log in (returns HTTP 403)',
      loginInactiveRes.status === 403,
      `Status: ${loginInactiveRes.status}`
    );

    // SUSPENDED user cannot log in
    const suspendedEmail = `status.suspended.${Date.now()}@smartplacify.edu`;
    await query(
      `INSERT INTO users (name, email, password_hash, role, status)
       VALUES ('Suspended User', $1, '$2a$10$FmYlh8s/XNKNlcssq.5N4.JA3Pb4u4z5Rst7GlR./PjkstjunbSP2', 'STUDENT', 'SUSPENDED')`,
      [suspendedEmail]
    );
    const loginSuspendedRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: suspendedEmail, password: 'password123' }),
    });
    assert(
      '6.3 SUSPENDED user cannot log in (returns HTTP 403)',
      loginSuspendedRes.status === 403,
      `Status: ${loginSuspendedRes.status}`
    );

    // =========================================================================
    // 7. DATABASE VERIFICATION
    // =========================================================================
    console.log('\n--- 7. DATABASE VERIFICATION ---');
    const allUsers = await query('SELECT id, name, email, role, status, last_login, password_hash FROM users');
    assert(
      '7.1 users records exist in PostgreSQL',
      allUsers.rows.length >= 8,
      `Total users: ${allUsers.rows.length}`
    );

    const emailSet = new Set(allUsers.rows.map((u) => u.email.toLowerCase()));
    assert(
      '7.2 emails are completely unique across all user records',
      emailSet.size === allUsers.rows.length,
      `Unique count: ${emailSet.size}, Total rows: ${allUsers.rows.length}`
    );

    const allBcrypt = allUsers.rows.every((u) => u.password_hash.startsWith('$2a$') || u.password_hash.startsWith('$2b$'));
    assert(
      '7.3 All user passwords stored in DB are valid bcrypt hashes',
      allBcrypt,
      `Every record verified`
    );

    const validRoles = ['STUDENT', 'RECRUITER', 'PLACEMENT_OFFICER', 'ADMIN'];
    const allRolesValid = allUsers.rows.every((u) => validRoles.includes(u.role));
    assert(
      '7.4 All user roles conform to allowed roles',
      allRolesValid
    );

    const checkLoginUpdate = await query('SELECT last_login FROM users WHERE email = $1', [testEmailStudent]);
    assert(
      '7.5 last_login updates after successful login in PostgreSQL',
      Boolean(checkLoginUpdate.rows[0]?.last_login),
      `last_login: ${checkLoginUpdate.rows[0]?.last_login}`
    );

    // =========================================================================
    // 8. SECURITY VERIFICATION
    // =========================================================================
    console.log('\n--- 8. SECURITY VERIFICATION ---');
    assert(
      '8.1 password_hash is never exposed in responses or public projections',
      regStudentData.data?.user?.password_hash === undefined &&
      loginStudentData.data?.user?.password_hash === undefined &&
      meValidData.data?.password_hash === undefined
    );

    assert(
      '8.2 Public registration cannot create ADMIN accounts (backend enforced)',
      regAdminRes.status === 400 || regAdminRes.status === 403
    );

    assert(
      '8.3 Role authorization is enforced at backend route level',
      resStudOnRec.status === 403 && resRecOnStud.status === 403 && resStudOnOff.status === 403 && resRecOnAdm.status === 403
    );

    console.log('\n====================================================');
    console.log(`TOTAL VERIFICATION CHECKS: ${passedCount + failedCount}`);
    console.log(`PASSED: ${passedCount}`);
    console.log(`FAILED: ${failedCount}`);
    console.log('====================================================\n');
  } catch (err) {
    console.error('Verification error:', err);
  } finally {
    server.close();
    await pool.end();
  }
}

runAuthTests();
