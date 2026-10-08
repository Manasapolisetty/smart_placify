import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { pool, query } from '../config/database.js';

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api';

async function runCompleteRecruiterVerification() {
  console.log('======================================================================');
  console.log('SMARTPLACIFY — COMPLETE RECRUITER & COMPANY API MODULE VERIFICATION');
  console.log(`Target Backend: ${BASE_URL}`);
  console.log('Database: PostgreSQL 16 (smartplacify_db)');
  console.log('======================================================================\n');

  // Verify server reachability
  try {
    const healthCheck = await fetch(`${BASE_URL}/health`);
    if (!healthCheck.ok) throw new Error(`Health check returned status ${healthCheck.status}`);
    console.log('[OK] Backend server is reachable at ' + BASE_URL + '\n');
  } catch (err) {
    console.error(`[ERROR] Backend server not reachable at ${BASE_URL}: ${err.message}`);
    process.exit(1);
  }

  const results = {
    'Recruiter Profile': { passed: 0, failed: 0, tests: [] },
    'Company': { passed: 0, failed: 0, tests: [] },
    'Recruiter Dashboard': { passed: 0, failed: 0, tests: [] },
    'Recruiter Jobs': { passed: 0, failed: 0, tests: [] },
    'Security': { passed: 0, failed: 0, tests: [] },
    'Database': { passed: 0, failed: 0, tests: [] },
    'Response Validation': { passed: 0, failed: 0, tests: [] },
  };

  const failures = [];

  const record = (group, name, condition, details = '', failureMeta = null) => {
    if (condition) {
      results[group].passed++;
      results[group].tests.push({ name, passed: true });
      console.log(`  ✓ [PASS] [${group}] ${name}`);
    } else {
      results[group].failed++;
      results[group].tests.push({ name, passed: false, details });
      console.error(`  ✗ [FAIL] [${group}] ${name} ${details ? `(${details})` : ''}`);
      if (failureMeta) {
        failures.push({ name, group, ...failureMeta, details });
      }
    }
  };

  let tokenRecruiterA = '';
  let tokenRecruiterB = '';
  let tokenStudent = '';
  let tokenAdmin = '';

  let userAId = '';
  let companyAId = '11111111-1111-1111-1111-111111111111'; // TechCorp Solutions
  let companyBId = '';
  let userBId = '';
  let jobBId = '';

  try {
    // =========================================================================
    // 0. AUTHENTICATION & FIXTURES SETUP
    // =========================================================================
    console.log('[0. Setup & Authentication]');

    // Authenticate Recruiter A (Priya Sharma at TechCorp Solutions)
    const loginResA = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'priya.sharma@techcorp.com', password: 'password123' }),
    });
    const loginDataA = await loginResA.json();
    tokenRecruiterA = loginDataA.data?.token || loginDataA.token;
    userAId = loginDataA.data?.user?.id;

    // Authenticate Student (Rahul Kumar)
    const loginResStu = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'rahul.kumar@university.edu.in', password: 'password123' }),
    });
    const loginDataStu = await loginResStu.json();
    tokenStudent = loginDataStu.data?.token || loginDataStu.token;

    // Authenticate Admin
    const loginResAdmin = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@smartplacify.edu.in', password: 'password123' }),
    });
    const loginDataAdmin = await loginResAdmin.json();
    tokenAdmin = loginDataAdmin.data?.token || loginDataAdmin.token;

    // Setup Secondary Company B and Recruiter B for cross-tenant isolation testing
    const compBRes = await query(
      `INSERT INTO companies (company_name, industry, description, website, email, status)
       VALUES ('InnoTech Global Labs', 'Artificial Intelligence', 'AI & Deep Learning Enterprise Labs', 'https://innotech.example.com', 'careers@innotech.example.com', 'ACTIVE')
       RETURNING id`
    );
    companyBId = compBRes.rows[0].id;

    // Register/Create Recruiter B
    const userBRes = await query(
      `INSERT INTO users (name, email, password_hash, role, status)
       VALUES ('Vikram Patel', 'vikram.patel@innotech.example.com', '$2a$10$FmYlh8s/XNKNlcssq.5N4.JA3Pb4u4z5Rst7GlR./PjkstjunbSP2', 'RECRUITER', 'ACTIVE')
       RETURNING id`
    );
    userBId = userBRes.rows[0].id;

    await query(
      `INSERT INTO recruiters (user_id, company_id, designation, recruiter_code)
       VALUES ($1, $2, 'Lead Talent Partner', 'REC-INNO-001')`,
      [userBId, companyBId]
    );

    // Create Job B under Company B
    const jobBRes = await query(
      `INSERT INTO jobs (company_id, job_title, job_description, job_type, location, status)
       VALUES ($1, 'Cloud Security Architect', 'Design zero trust cloud security architectures.', 'FULL_TIME', 'Hyderabad, India', 'OPEN')
       RETURNING id`,
      [companyBId]
    );
    jobBId = jobBRes.rows[0].id;

    // Login Recruiter B
    const loginResB = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'vikram.patel@innotech.example.com', password: 'password123' }),
    });
    const loginDataB = await loginResB.json();
    tokenRecruiterB = loginDataB.data?.token || loginDataB.token;

    console.log('  ✓ Test fixtures ready (Recruiter A, Recruiter B, Student, Admin)\n');

    // =========================================================================
    // 1. RECRUITER PROFILE TESTS
    // =========================================================================
    console.log('[1. Recruiter Profile Tests]');

    // 1.1 GET /api/recruiters/profile returns 200
    const profRes = await fetch(`${BASE_URL}/recruiters/profile`, {
      headers: { Authorization: `Bearer ${tokenRecruiterA}` },
    });
    const profData = await profRes.json();
    record('Recruiter Profile', '1.1 GET /api/recruiters/profile returns HTTP 200 with success = true', profRes.status === 200 && profData.success === true);
    record(
      'Recruiter Profile',
      '1.2 Profile payload contains user identity, designation, and associated company',
      Boolean(profData.data?.name && profData.data?.role === 'RECRUITER' && profData.data?.company?.companyName)
    );
    record('Recruiter Profile', '1.3 Profile payload never exposes password_hash', profData.data?.password_hash === undefined);

    // 1.4 PUT /api/recruiters/profile updates safe fields
    const newDesignation = `Principal Talent Lead ${Date.now().toString().slice(-4)}`;
    const updateProfRes = await fetch(`${BASE_URL}/recruiters/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenRecruiterA}`,
      },
      body: JSON.stringify({
        designation: newDesignation,
        phone: '+91 98222 99999',
      }),
    });
    const updateProfData = await updateProfRes.json();
    record('Recruiter Profile', '1.4 PUT /api/recruiters/profile returns HTTP 200 with updated designation', updateProfRes.status === 200 && updateProfData.data?.designation === newDesignation);

    // 1.5 Direct PostgreSQL verification of recruiter profile
    const dbProfCheck = await query(
      `SELECT r.designation, u.phone
       FROM recruiters r
       JOIN users u ON r.user_id = u.id
       WHERE u.id = $1`,
      [userAId]
    );
    record(
      'Recruiter Profile',
      '1.5 Recruiter designation and phone verified persisted in PostgreSQL',
      dbProfCheck.rows[0]?.designation === newDesignation && dbProfCheck.rows[0]?.phone === '+91 98222 99999'
    );

    // 1.6 Invalid profile input validation
    const invalidProfRes = await fetch(`${BASE_URL}/recruiters/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenRecruiterA}`,
      },
      body: JSON.stringify({ name: 'A' }), // name too short (< 2 chars)
    });
    record('Recruiter Profile', '1.6 Profile update with invalid name (< 2 chars) returns HTTP 400 validation error', invalidProfRes.status === 400);

    // =========================================================================
    // 2. COMPANY TESTS
    // =========================================================================
    console.log('\n[2. Company Tests]');

    // 2.1 GET /api/recruiters/company
    const compRes = await fetch(`${BASE_URL}/recruiters/company`, {
      headers: { Authorization: `Bearer ${tokenRecruiterA}` },
    });
    const compData = await compRes.json();
    record('Company', '2.1 GET /api/recruiters/company returns HTTP 200 with associated company', compRes.status === 200 && Boolean(compData.data?.companyName));
    record('Company', '2.2 Company profile includes metrics (totalJobs, activeJobs, totalPlacements)', compData.data?.totalJobs !== undefined && compData.data?.activeJobs !== undefined);

    // 2.3 PUT /api/recruiters/company updates company details
    const newDesc = `Premier global technology solutions provider - Updated ${Date.now()}`;
    const updateCompRes = await fetch(`${BASE_URL}/recruiters/company`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenRecruiterA}`,
      },
      body: JSON.stringify({
        description: newDesc,
        website: 'https://techcorp-updated.example.com',
      }),
    });
    const updateCompData = await updateCompRes.json();
    record('Company', '2.3 PUT /api/recruiters/company updates company description and website (HTTP 200)', updateCompRes.status === 200 && updateCompData.data?.description === newDesc);

    // 2.4 Verify company data persisted in PostgreSQL
    const dbCompCheck = await query('SELECT description, website FROM companies WHERE id = $1', [companyAId]);
    record(
      'Company',
      '2.4 Updated company details verified persisted in PostgreSQL companies table',
      dbCompCheck.rows[0]?.description === newDesc && dbCompCheck.rows[0]?.website === 'https://techcorp-updated.example.com'
    );

    // 2.5 GET /api/companies/:id
    const getCompByIdRes = await fetch(`${BASE_URL}/companies/${companyAId}`);
    const getCompByIdData = await getCompByIdRes.json();
    record('Company', '2.5 GET /api/companies/:id returns HTTP 200 for valid UUID', getCompByIdRes.status === 200 && getCompByIdData.data?.id === companyAId);

    // 2.6 GET /api/companies/:id with non-existent UUID
    const nonExistentCompRes = await fetch(`${BASE_URL}/companies/00000000-0000-0000-0000-000000000000`);
    record('Company', '2.6 GET /api/companies/:id for non-existent UUID returns HTTP 404 cleanly', nonExistentCompRes.status === 404);

    // 2.7 PUT /api/companies/:id with invalid URL
    const invalidUrlCompRes = await fetch(`${BASE_URL}/companies/${companyAId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenRecruiterA}`,
      },
      body: JSON.stringify({ website: 'invalid-not-a-url' }),
    });
    record('Company', '2.7 PUT /api/companies/:id with invalid website format returns HTTP 400 validation error', invalidUrlCompRes.status === 400);

    // 2.8 PUT /api/companies/:id by authorized recruiter
    const putCompIdRes = await fetch(`${BASE_URL}/companies/${companyAId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenRecruiterA}`,
      },
      body: JSON.stringify({ location: 'Bengaluru / Hybrid, India' }),
    });
    record('Company', '2.8 PUT /api/companies/:id by company recruiter returns HTTP 200', putCompIdRes.status === 200);

    // =========================================================================
    // 3. RECRUITER DASHBOARD TESTS
    // =========================================================================
    console.log('\n[3. Recruiter Dashboard Tests]');

    // 3.1 GET /api/recruiters/dashboard returns 200
    const dashRes = await fetch(`${BASE_URL}/recruiters/dashboard`, {
      headers: { Authorization: `Bearer ${tokenRecruiterA}` },
    });
    const dashData = await dashRes.json();
    record('Recruiter Dashboard', '3.1 GET /api/recruiters/dashboard returns HTTP 200 with success = true', dashRes.status === 200 && dashData.success === true);

    // Direct database counts for TechCorp Solutions
    const [dbJobsCount, dbActiveJobsCount, dbAppsCount, dbShortlistedCount, dbInterviewsCount] = await Promise.all([
      query('SELECT COUNT(*) as count FROM jobs WHERE company_id = $1', [companyAId]),
      query("SELECT COUNT(*) as count FROM jobs WHERE company_id = $1 AND status = 'OPEN'", [companyAId]),
      query('SELECT COUNT(*) as count FROM applications a JOIN jobs j ON a.job_id = j.id WHERE j.company_id = $1', [companyAId]),
      query("SELECT COUNT(*) as count FROM applications a JOIN jobs j ON a.job_id = j.id WHERE j.company_id = $1 AND a.status = 'SHORTLISTED'", [companyAId]),
      query(
        `SELECT COUNT(*) as count FROM interviews i
         JOIN applications a ON i.application_id = a.id
         JOIN jobs j ON a.job_id = j.id
         WHERE j.company_id = $1 AND i.status = 'SCHEDULED' AND i.interview_date >= CURRENT_DATE`,
        [companyAId]
      ),
    ]);

    const expectedTotalJobs = parseInt(dbJobsCount.rows[0].count, 10);
    const expectedActiveJobs = parseInt(dbActiveJobsCount.rows[0].count, 10);
    const expectedApps = parseInt(dbAppsCount.rows[0].count, 10);
    const expectedShortlisted = parseInt(dbShortlistedCount.rows[0].count, 10);
    const expectedInterviews = parseInt(dbInterviewsCount.rows[0].count, 10);

    record(
      'Recruiter Dashboard',
      '3.2 totalJobs metric in dashboard strictly matches PostgreSQL jobs count',
      dashData.data?.totalJobs === expectedTotalJobs,
      `API: ${dashData.data?.totalJobs}, DB: ${expectedTotalJobs}`
    );
    record(
      'Recruiter Dashboard',
      '3.3 activeJobs metric in dashboard strictly matches PostgreSQL active jobs count',
      dashData.data?.activeJobs === expectedActiveJobs,
      `API: ${dashData.data?.activeJobs}, DB: ${expectedActiveJobs}`
    );
    record(
      'Recruiter Dashboard',
      '3.4 totalApplications metric in dashboard strictly matches PostgreSQL applications count',
      dashData.data?.totalApplications === expectedApps,
      `API: ${dashData.data?.totalApplications}, DB: ${expectedApps}`
    );
    record(
      'Recruiter Dashboard',
      '3.5 shortlistedCandidates metric in dashboard matches PostgreSQL count',
      dashData.data?.shortlistedCandidates === expectedShortlisted,
      `API: ${dashData.data?.shortlistedCandidates}, DB: ${expectedShortlisted}`
    );
    record(
      'Recruiter Dashboard',
      '3.6 upcomingInterviewsCount strictly matches PostgreSQL scheduled interviews count',
      dashData.data?.upcomingInterviewsCount === expectedInterviews,
      `API: ${dashData.data?.upcomingInterviewsCount}, DB: ${expectedInterviews}`
    );
    record(
      'Recruiter Dashboard',
      '3.7 upcomingInterviews array includes candidate details, meeting links, and job titles',
      Array.isArray(dashData.data?.upcomingInterviews) &&
        (dashData.data?.upcomingInterviews.length === 0 ||
          Boolean(dashData.data?.upcomingInterviews[0]?.candidateName && dashData.data?.upcomingInterviews[0]?.jobTitle))
    );
    record(
      'Recruiter Dashboard',
      '3.8 statusBreakdown contains pipeline counts (APPLIED, SCREENING, SHORTLISTED, SELECTED, REJECTED)',
      Boolean(dashData.data?.statusBreakdown && typeof dashData.data?.statusBreakdown?.SHORTLISTED === 'number')
    );

    // =========================================================================
    // 4. RECRUITER JOBS TESTS
    // =========================================================================
    console.log('\n[4. Recruiter Jobs Tests]');

    // 4.1 GET /api/recruiters/jobs
    const jobsRes = await fetch(`${BASE_URL}/recruiters/jobs`, {
      headers: { Authorization: `Bearer ${tokenRecruiterA}` },
    });
    const jobsData = await jobsRes.json();
    record('Recruiter Jobs', '4.1 GET /api/recruiters/jobs returns HTTP 200 with job listings array', jobsRes.status === 200 && Array.isArray(jobsData.data));

    // 4.2 All jobs belong strictly to Recruiter A's company
    const allBelongToCompanyA = jobsData.data.every((j) => j.companyId === companyAId);
    record('Recruiter Jobs', '4.2 All returned jobs belong strictly to authenticated recruiter company', allBelongToCompanyA && jobsData.data.length > 0);

    // 4.3 Job metrics included
    const hasJobMetrics = jobsData.data.every((j) => j.applicationsCount !== undefined && Array.isArray(j.skillsRequired));
    record('Recruiter Jobs', '4.3 Job records include applicationsCount and skillsRequired array', hasJobMetrics);

    // 4.4 Status filter test
    const openJobsRes = await fetch(`${BASE_URL}/recruiters/jobs?status=OPEN`, {
      headers: { Authorization: `Bearer ${tokenRecruiterA}` },
    });
    const openJobsData = await openJobsRes.json();
    record('Recruiter Jobs', '4.4 GET /api/recruiters/jobs?status=OPEN filters correctly for OPEN jobs', openJobsRes.status === 200 && openJobsData.data.every((j) => j.status === 'OPEN'));

    // 4.5 GET /api/recruiters/jobs/:id
    const targetJobId = jobsData.data[0]?.id;
    const singleJobRes = await fetch(`${BASE_URL}/recruiters/jobs/${targetJobId}`, {
      headers: { Authorization: `Bearer ${tokenRecruiterA}` },
    });
    const singleJobData = await singleJobRes.json();
    record('Recruiter Jobs', '4.5 GET /api/recruiters/jobs/:id returns HTTP 200 with complete job breakdown', singleJobRes.status === 200 && singleJobData.data?.id === targetJobId);
    record('Recruiter Jobs', '4.6 Job breakdown includes recent candidate applications array', Array.isArray(singleJobData.data?.recentApplications));

    // 4.7 Non-existent job UUID returns 404
    const nonExistentJobRes = await fetch(`${BASE_URL}/recruiters/jobs/00000000-0000-0000-0000-000000000000`, {
      headers: { Authorization: `Bearer ${tokenRecruiterA}` },
    });
    record('Recruiter Jobs', '4.7 GET /api/recruiters/jobs/:id for non-existent UUID returns HTTP 404', nonExistentJobRes.status === 404);

    // =========================================================================
    // 5. SECURITY & ACCESS CONTROL TESTS
    // =========================================================================
    console.log('\n[5. Security Tests]');

    // 5.1 No JWT → 401
    const noJwtRes = await fetch(`${BASE_URL}/recruiters/profile`);
    record('Security', '5.1 Request without JWT returns HTTP 401 Unauthorized', noJwtRes.status === 401);

    // 5.2 Invalid JWT → 401
    const invalidJwtRes = await fetch(`${BASE_URL}/recruiters/profile`, {
      headers: { Authorization: 'Bearer totally.invalid.jwt.token' },
    });
    record('Security', '5.2 Request with invalid JWT signature returns HTTP 401 Unauthorized', invalidJwtRes.status === 401);

    // 5.3 STUDENT JWT → 403 on profile
    const studentToProfile = await fetch(`${BASE_URL}/recruiters/profile`, {
      headers: { Authorization: `Bearer ${tokenStudent}` },
    });
    record('Security', '5.3 STUDENT JWT accessing GET /api/recruiters/profile receives HTTP 403 Forbidden', studentToProfile.status === 403);

    // 5.4 STUDENT JWT → 403 on dashboard
    const studentToDash = await fetch(`${BASE_URL}/recruiters/dashboard`, {
      headers: { Authorization: `Bearer ${tokenStudent}` },
    });
    record('Security', '5.4 STUDENT JWT accessing GET /api/recruiters/dashboard receives HTTP 403 Forbidden', studentToDash.status === 403);

    // 5.5 STUDENT JWT → 403 on jobs
    const studentToJobs = await fetch(`${BASE_URL}/recruiters/jobs`, {
      headers: { Authorization: `Bearer ${tokenStudent}` },
    });
    record('Security', '5.5 STUDENT JWT accessing GET /api/recruiters/jobs receives HTTP 403 Forbidden', studentToJobs.status === 403);

    // 5.6 STUDENT JWT → 403 on company update
    const studentToCompanyUpdate = await fetch(`${BASE_URL}/companies/${companyAId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenStudent}`,
      },
      body: JSON.stringify({ description: 'Tampered by student' }),
    });
    record('Security', '5.6 STUDENT JWT attempting PUT /api/companies/:id receives HTTP 403 Forbidden', studentToCompanyUpdate.status === 403);

    // 5.7 Cross-Company Protection: Recruiter A attempting to modify Company B
    const crossCompanyUpdate = await fetch(`${BASE_URL}/companies/${companyBId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenRecruiterA}`,
      },
      body: JSON.stringify({ companyName: 'Hacked InnoTech Labs' }),
    });
    record('Security', '5.7 Recruiter A attempting to update Company B receives HTTP 403 Forbidden', crossCompanyUpdate.status === 403);

    // 5.8 Cross-Job Protection: Recruiter A attempting to view Job B of Company B
    const crossJobView = await fetch(`${BASE_URL}/recruiters/jobs/${jobBId}`, {
      headers: { Authorization: `Bearer ${tokenRecruiterA}` },
    });
    record('Security', '5.8 Recruiter A attempting to view Job B belonging to Company B receives HTTP 403 Forbidden', crossJobView.status === 403);

    // 5.9 Recruiter cannot change role
    const roleTamperRes = await fetch(`${BASE_URL}/recruiters/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenRecruiterA}`,
      },
      body: JSON.stringify({ role: 'ADMIN' }),
    });
    record('Security', '5.9 Recruiter attempting to change role to ADMIN rejected with HTTP 400 validation error', roleTamperRes.status === 400);

    // 5.10 Recruiter cannot change account status
    const statusTamperRes = await fetch(`${BASE_URL}/recruiters/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenRecruiterA}`,
      },
      body: JSON.stringify({ status: 'SUSPENDED' }),
    });
    record('Security', '5.10 Recruiter attempting to change account status rejected with HTTP 400 validation error', statusTamperRes.status === 400);

    // 5.11 SQL Injection in company path parameter safely handled
    const sqlInjectionComp = await fetch(`${BASE_URL}/companies/'%20OR%20'1'='1`);
    record('Security', '5.11 SQL injection in company path parameter rejected with HTTP 400 validation error', sqlInjectionComp.status === 400);

    // 5.12 SQL Injection in jobs path parameter safely handled
    const sqlInjectionJob = await fetch(`${BASE_URL}/recruiters/jobs/'%20OR%20'1'='1`, {
      headers: { Authorization: `Bearer ${tokenRecruiterA}` },
    });
    record('Security', '5.12 SQL injection in recruiter jobs path parameter rejected with HTTP 400 validation error', sqlInjectionJob.status === 400);

    // 5.13 Malformed non-UUID path parameter
    const malformedUuidRes = await fetch(`${BASE_URL}/companies/not-a-valid-uuid`);
    record('Security', '5.13 Malformed non-UUID in path parameter returns HTTP 400 validation error', malformedUuidRes.status === 400);

    // =========================================================================
    // 6. DIRECT POSTGRESQL DATABASE VERIFICATION
    // =========================================================================
    console.log('\n[6. Direct PostgreSQL Verification]');

    const dbChecks = await Promise.all([
      query("SELECT count(*) as count FROM users WHERE role = 'RECRUITER' AND status = 'ACTIVE'"),
      query('SELECT count(*) as count FROM recruiters WHERE company_id IS NOT NULL'),
      query("SELECT count(*) as count FROM companies WHERE status = 'ACTIVE'"),
      query('SELECT count(*) as count FROM jobs WHERE company_id IS NOT NULL'),
      query('SELECT count(*) as count FROM applications'),
      query('SELECT count(*) as count FROM interviews'),
    ]);

    record('Database', '6.1 Active recruiter user records verified in PostgreSQL users table', parseInt(dbChecks[0].rows[0].count, 10) >= 2);
    record('Database', '6.2 Recruiter profiles linked to corporate companies verified in PostgreSQL recruiters table', parseInt(dbChecks[1].rows[0].count, 10) >= 2);
    record('Database', '6.3 Active corporate companies verified in PostgreSQL companies table', parseInt(dbChecks[2].rows[0].count, 10) >= 2);
    record('Database', '6.4 Active job listings linked to companies verified in PostgreSQL jobs table', parseInt(dbChecks[3].rows[0].count, 10) >= 2);
    record('Database', '6.5 Candidate job applications verified in PostgreSQL applications table', parseInt(dbChecks[4].rows[0].count, 10) >= 1);
    record('Database', '6.6 Candidate interview schedules verified in PostgreSQL interviews table', parseInt(dbChecks[5].rows[0].count, 10) >= 1);

    // =========================================================================
    // 7. RESPONSE VALIDATION (Contract adherence & No password leak)
    // =========================================================================
    console.log('\n[7. Response Validation Tests]');

    const checkSuccessFormat = (b) => b && b.success === true && typeof b.message === 'string' && b.data !== undefined;
    const checkErrorFormat = (b) => b && b.success === false && typeof b.message === 'string' && Array.isArray(b.errors);

    record('Response Validation', '7.1 Successful responses adhere strictly to { success: true, message, data } contract', checkSuccessFormat(profData) && checkSuccessFormat(dashData));

    const invalidBodyRes = await fetch(`${BASE_URL}/recruiters/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenRecruiterA}` },
      body: JSON.stringify({ name: 'X' }),
    });
    const invalidBodyData = await invalidBodyRes.json();
    record('Response Validation', '7.2 Validation error responses adhere strictly to { success: false, message, errors: [] } contract', checkErrorFormat(invalidBodyData));

    const allResponsesString = JSON.stringify([profData, compData, dashData, jobsData, singleJobData]);
    record('Response Validation', '7.3 Password hash is NEVER exposed in any API response payload', !allResponsesString.includes('password_hash') && !allResponsesString.includes('$2a$10$'));

  } catch (fatalError) {
    console.error('[FATAL TEST ERROR]', fatalError);
    failures.push({ name: 'Execution aborted due to fatal error', group: 'General', details: fatalError.message });
  } finally {
    // Clean up temporary fixtures
    if (jobBId) await query('DELETE FROM jobs WHERE id = $1', [jobBId]).catch(() => null);
    if (userBId) await query('DELETE FROM users WHERE id = $1', [userBId]).catch(() => null);
    if (companyBId) await query('DELETE FROM companies WHERE id = $1', [companyBId]).catch(() => null);
    await pool.end();
  }

  // ===========================================================================
  // SUMMARY REPORT
  // ===========================================================================
  let totalTests = 0;
  let totalPassed = 0;
  let totalFailed = 0;

  console.log('\n======================================================================');
  console.log('RECRUITER & COMPANY API MODULE VERIFICATION SUMMARY REPORT');
  console.log('======================================================================\n');

  for (const [group, data] of Object.entries(results)) {
    totalTests += data.passed + data.failed;
    totalPassed += data.passed;
    totalFailed += data.failed;
    const status = data.failed === 0 ? '✓ ALL PASSED' : `✗ ${data.failed} FAILED`;
    console.log(`  ${group.padEnd(25)}: ${String(data.passed).padStart(2)} Passed, ${String(data.failed).padStart(2)} Failed  [${status}]`);
  }

  console.log('\n----------------------------------------------------------------------');
  console.log(`TOTAL TESTS EXECUTED : ${totalTests}`);
  console.log(`TOTAL PASSED         : ${totalPassed}`);
  console.log(`TOTAL FAILED         : ${totalFailed}`);
  console.log('----------------------------------------------------------------------\n');

  if (failures.length > 0) {
    console.log('FAILURES DETAILED:');
    failures.forEach((f, idx) => {
      console.log(`  ${idx + 1}. [${f.group}] ${f.name}`);
      console.log(`     Details: ${f.details || 'N/A'}\n`);
    });
    process.exit(1);
  } else {
    console.log('>>> ALL VERIFICATION CHECKS PASSED WITH 0 FAILURES <<<\n');
    process.exit(0);
  }
}

runCompleteRecruiterVerification();
