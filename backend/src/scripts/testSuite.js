import http from 'http';
import app from '../app.js';
import { pool } from '../config/database.js';

let testPort = 5000;

function request(method, path, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const dataStr = body ? JSON.stringify(body) : null;
    const reqHeaders = {
      'Content-Type': 'application/json',
      ...headers,
    };
    if (dataStr) {
      reqHeaders['Content-Length'] = Buffer.byteLength(dataStr);
    }

    const options = {
      hostname: 'localhost',
      port: testPort,
      path,
      method,
      headers: reqHeaders,
    };

    const req = http.request(options, (res) => {
      let rawData = '';
      res.on('data', (chunk) => {
        rawData += chunk;
      });
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(rawData);
        } catch {
          json = rawData;
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: json,
        });
      });
    });

    req.on('error', (err) => reject(err));
    if (dataStr) req.write(dataStr);
    req.end();
  });
}

async function runTests() {
  console.log('--- Starting SmartPlacify Backend Test Suite ---');
  let server;
  let passed = 0;
  let failed = 0;

  function assert(condition, message, details = '') {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message} - ${details}`);
      failed++;
    }
  }

  try {
    server = app.listen(0);
    testPort = server.address().port;
    await new Promise((r) => setTimeout(r, 500));

    // 1. Health Checks
    console.log('\n[1. Health Checks]');
    const health = await request('GET', '/api/health');
    assert(health.status === 200 && health.body.success === true, 'GET /api/health returns 200 OK');

    const dbHealth = await request('GET', '/api/health/db');
    assert(dbHealth.status === 200 && dbHealth.body.message === 'Database connection successful', 'GET /api/health/db returns 200 OK');

    // 2. Auth Flow: Student Login
    console.log('\n[2. Authentication - Login]');
    const studentLogin = await request('POST', '/api/auth/login', {}, {
      email: 'rahul.kumar@university.edu.in',
      password: 'password123',
    });
    assert(studentLogin.status === 200 && studentLogin.body.token, 'POST /api/auth/login returns 200 & JWT token');
    const studentToken = studentLogin.body.token;

    // Recruiter Login
    const recruiterLogin = await request('POST', '/api/auth/login', {}, {
      email: 'priya.sharma@techcorp.com',
      password: 'password123',
    });
    assert(recruiterLogin.status === 200 && recruiterLogin.body.token, 'POST /api/auth/login for recruiter returns 200');
    const recruiterToken = recruiterLogin.body.token;

    // Placement Officer Login
    const placementLogin = await request('POST', '/api/auth/login', {}, {
      email: 'placement.head@university.edu.in',
      password: 'password123',
    });
    assert(placementLogin.status === 200 && placementLogin.body.token, 'POST /api/auth/login for placement officer returns 200');
    const placementToken = placementLogin.body.token;

    // Admin Login
    const adminLogin = await request('POST', '/api/auth/login', {}, {
      email: 'admin@smartplacify.edu.in',
      password: 'password123',
    });
    assert(adminLogin.status === 200 && adminLogin.body.token, 'POST /api/auth/login for admin returns 200');
    const adminToken = adminLogin.body.token;

    // Invalid Credentials Test
    const badLogin = await request('POST', '/api/auth/login', {}, {
      email: 'rahul.kumar@university.edu.in',
      password: 'wrongpassword',
    });
    assert(badLogin.status === 401 && badLogin.body.success === false, 'POST /api/auth/login with wrong password returns 401');

    // 3. Auth Flow: Registration
    console.log('\n[3. Authentication - Registration]');
    const testRegEmail = `test.student.${Date.now()}@university.edu.in`;
    const regRes = await request('POST', '/api/auth/register', {}, {
      email: testRegEmail,
      password: 'password123',
      name: 'Test Student',
      role: 'STUDENT',
      deptOrComp: 'Computer Science & Engineering',
    });
    assert(regRes.status === 201 && regRes.body.token, 'POST /api/auth/register creates new student account (201)');

    // Prevent duplicate email registration
    const dupReg = await request('POST', '/api/auth/register', {}, {
      email: testRegEmail,
      password: 'password123',
      name: 'Duplicate Student',
    });
    assert(dupReg.status === 409 && dupReg.body.success === false, 'POST /api/auth/register prevents duplicate email (409 Conflict)');

    // Prevent Admin self-registration
    const badRoleReg = await request('POST', '/api/auth/register', {}, {
      email: `hacker.${Date.now()}@test.com`,
      password: 'password123',
      name: 'Hacker',
      role: 'ADMIN',
    });
    assert(badRoleReg.status === 400 && badRoleReg.body.success === false, 'POST /api/auth/register rejects ADMIN registration (400)');

    // 4. Protected Routes & GET /api/auth/me
    console.log('\n[4. Protected Routes & Token Verification]');
    const meRes = await request('GET', '/api/auth/me', { Authorization: `Bearer ${studentToken}` });
    assert(meRes.status === 200 && meRes.body.data.email === 'rahul.kumar@university.edu.in', 'GET /api/auth/me returns current student data');

    const noAuth = await request('GET', '/api/auth/me');
    assert(noAuth.status === 401, 'GET /api/auth/me without token returns 401 Unauthorized');

    // 5. Role-based Authorization
    console.log('\n[5. Role-Based Authorization Checks]');
    // Student attempting to access Admin users endpoint
    const studentAccessAdmin = await request('GET', '/api/admin/users', { Authorization: `Bearer ${studentToken}` });
    assert(studentAccessAdmin.status === 403, 'Student denied access to /api/admin/users (403 Forbidden)');

    // Admin accessing Admin users endpoint
    const adminAccessUsers = await request('GET', '/api/admin/users', { Authorization: `Bearer ${adminToken}` });
    assert(adminAccessUsers.status === 200 && Array.isArray(adminAccessUsers.body.data), 'Admin can access /api/admin/users (200 OK)');

    // 6. Student APIs
    console.log('\n[6. Student APIs]');
    const studentProfile = await request('GET', '/api/students/profile', { Authorization: `Bearer ${studentToken}` });
    assert(studentProfile.status === 200 && studentProfile.body.data.enrollmentNo, 'GET /api/students/profile returns full profile with metrics');

    const studentAcademics = await request('GET', '/api/students/academics', { Authorization: `Bearer ${studentToken}` });
    assert(studentAcademics.status === 200 && studentAcademics.body.data.overall_cgpa, 'GET /api/students/academics returns academic records');

    const studentSkills = await request('GET', '/api/students/skills', { Authorization: `Bearer ${studentToken}` });
    assert(studentSkills.status === 200 && Array.isArray(studentSkills.body.data), 'GET /api/students/skills returns skills list');

    // 7. Job Listings & Eligibility
    console.log('\n[7. Job Engine & Filters]');
    const jobsList = await request('GET', '/api/jobs', { Authorization: `Bearer ${studentToken}` });
    assert(jobsList.status === 200 && Array.isArray(jobsList.body.data) && jobsList.body.data.length > 0, 'GET /api/jobs returns active job listings');

    const firstJobId = jobsList.body.data[0].id;
    const singleJob = await request('GET', `/api/jobs/${firstJobId}`, { Authorization: `Bearer ${studentToken}` });
    assert(singleJob.status === 200 && singleJob.body.data.title, 'GET /api/jobs/:id returns job details and eligibility rules');

    // 8. Applications & Duplicate Prevention
    console.log('\n[8. Application Flow & Duplicate Prevention]');
    // Rahul Kumar already applied to job 1 in seed data -> should reject duplicate
    const dupApp = await request('POST', `/api/jobs/${firstJobId}/apply`, { Authorization: `Bearer ${studentToken}` }, {});
    assert(dupApp.status === 409, 'Duplicate application correctly rejected with 409 Conflict');

    // 9. Interviews & Recruiter Endpoints
    console.log('\n[9. Recruiter & Interview Endpoints]');
    const recruiterCandidates = await request('GET', '/api/recruiters/candidates', { Authorization: `Bearer ${recruiterToken}` });
    assert(recruiterCandidates.status === 200 && Array.isArray(recruiterCandidates.body.data), 'GET /api/recruiters/candidates returns candidates list');

    const interviewsList = await request('GET', '/api/interviews', { Authorization: `Bearer ${studentToken}` });
    assert(interviewsList.status === 200 && Array.isArray(interviewsList.body.data), 'GET /api/interviews returns student interviews');

    // 10. Placement Officer & Analytics
    console.log('\n[10. Placement Officer & Analytics]');
    const analyticsRes = await request('GET', '/api/placement/analytics', { Authorization: `Bearer ${placementToken}` });
    assert(analyticsRes.status === 200 && analyticsRes.body.data.overallPlacementRate, 'GET /api/placement/analytics returns real metrics');

    const drivesList = await request('GET', '/api/placement/drives', { Authorization: `Bearer ${placementToken}` });
    assert(drivesList.status === 200 && Array.isArray(drivesList.body.data), 'GET /api/placement/drives returns drives');

    // 11. Notifications
    console.log('\n[11. Notifications Module]');
    const notifs = await request('GET', '/api/notifications', { Authorization: `Bearer ${studentToken}` });
    assert(notifs.status === 200 && Array.isArray(notifs.body.data), 'GET /api/notifications returns user notifications');

    const markAll = await request('PUT', '/api/notifications/read-all', { Authorization: `Bearer ${studentToken}` });
    assert(markAll.status === 200, 'PUT /api/notifications/read-all marks all read');

    // 12. 404 & Error Handling
    console.log('\n[12. 404 & Validation Error Handling]');
    const notFound = await request('GET', '/api/non-existent-route-xyz');
    assert(notFound.status === 404 && notFound.body.success === false, 'Non-existent route returns standard 404 JSON');

    const invalidBody = await request('POST', '/api/auth/login', {}, { email: 'not-an-email' });
    assert(invalidBody.status === 400 && invalidBody.body.errors.length > 0, 'Invalid request input returns 400 with validation errors array');

    console.log(`\n========================================`);
    console.log(`Test Suite Finished: ${passed} Passed, ${failed} Failed`);
    console.log(`========================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Unhandled error during test run:', error);
    process.exit(1);
  } finally {
    if (server) server.close();
    await pool.end();
  }
}

runTests();
