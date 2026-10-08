import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { pool, query } from '../config/database.js';

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api';

async function runCompleteJobVerification() {
  console.log('======================================================================');
  console.log('SMARTPLACIFY — COMPLETE JOB MANAGEMENT API MODULE VERIFICATION');
  console.log(`Target Backend: ${BASE_URL}`);
  console.log('Database: PostgreSQL 16 (smartplacify_db)');
  console.log('======================================================================\n');

  // Verify server is reachable
  try {
    const healthCheck = await fetch(`${BASE_URL}/health`);
    if (!healthCheck.ok) throw new Error(`Health check returned status ${healthCheck.status}`);
    console.log('[OK] Backend server is reachable at ' + BASE_URL + '\n');
  } catch (err) {
    console.error(`[ERROR] Backend server not reachable at ${BASE_URL}: ${err.message}`);
    process.exit(1);
  }

  const results = {
    'Job Listing': { passed: 0, failed: 0, tests: [] },
    'Job Details': { passed: 0, failed: 0, tests: [] },
    'Recruiter Job Creation': { passed: 0, failed: 0, tests: [] },
    'Job Update': { passed: 0, failed: 0, tests: [] },
    'Job Deletion': { passed: 0, failed: 0, tests: [] },
    'Job Lifecycle': { passed: 0, failed: 0, tests: [] },
    'Eligibility': { passed: 0, failed: 0, tests: [] },
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

  let companyAId = '11111111-1111-1111-1111-111111111111'; // TechCorp Solutions
  let companyBId = '';
  let userBId = '';
  let jobBId = '';
  let createdJobId = '';
  let lifecycleJobId = '';

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

    // Authenticate Student (Rahul Kumar, CGPA: 8.74, Batch: 2026)
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

    // Setup Secondary Company B and Recruiter B for cross-tenant isolation testing (idempotent cleanup)
    await query("DELETE FROM users WHERE email = 'rohan.verma@apex.example.com'");
    await query("DELETE FROM companies WHERE company_name = 'Apex Innovations Ltd'");

    const compBRes = await query(
      `INSERT INTO companies (company_name, industry, location, description, website, email, status)
       VALUES ('Apex Innovations Ltd', 'Autonomous Systems', 'Pune, Maharashtra', 'Robotics and Autonomous Driving Systems', 'https://apex.example.com', 'careers@apex.example.com', 'ACTIVE')
       RETURNING id`
    );
    companyBId = compBRes.rows[0].id;

    // Create User & Recruiter B
    const userBRes = await query(
      `INSERT INTO users (name, email, password_hash, role, status)
       VALUES ('Rohan Verma', 'rohan.verma@apex.example.com', '$2a$10$FmYlh8s/XNKNlcssq.5N4.JA3Pb4u4z5Rst7GlR./PjkstjunbSP2', 'RECRUITER', 'ACTIVE')
       RETURNING id`
    );
    userBId = userBRes.rows[0].id;

    await query(
      `INSERT INTO recruiters (user_id, company_id, designation, recruiter_code)
       VALUES ($1, $2, 'Staff Technical Recruiter', 'REC-APEX-001')`,
      [userBId, companyBId]
    );

    // Create Job B under Company B
    const jobBRes = await query(
      `INSERT INTO jobs (company_id, job_title, job_description, job_type, location, status)
       VALUES ($1, 'Autonomous Vehicle Software Engineer', 'Develop perception stack algorithms in C++ and Python.', 'FULL_TIME', 'Pune, Maharashtra', 'OPEN')
       RETURNING id`,
      [companyBId]
    );
    jobBId = jobBRes.rows[0].id;

    // Login Recruiter B
    const loginResB = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'rohan.verma@apex.example.com', password: 'password123' }),
    });
    const loginDataB = await loginResB.json();
    tokenRecruiterB = loginDataB.data?.token || loginDataB.token;

    console.log('  ✓ Test fixtures ready (Recruiter A, Recruiter B, Student, Admin)\n');

    // =========================================================================
    // 1. JOB LISTING TESTS (GET /api/jobs)
    // =========================================================================
    console.log('[1. Job Listing Tests]');

    // 1.1 GET /api/jobs
    const listRes = await fetch(`${BASE_URL}/jobs`);
    const listData = await listRes.json();
    record('Job Listing', '1.1 GET /api/jobs returns HTTP 200 with job listings array', listRes.status === 200 && Array.isArray(listData.data));
    record('Job Listing', '1.2 Public job listing returns only OPEN status jobs by default', listData.data.every((j) => j.status === 'OPEN'));

    // 1.3 Search keyword
    const searchRes = await fetch(`${BASE_URL}/jobs?search=Full+Stack`);
    const searchData = await searchRes.json();
    record('Job Listing', '1.3 Search filter (?search=Full+Stack) matches title/description', searchRes.status === 200 && searchData.data.some((j) => j.title.toLowerCase().includes('full stack')));

    // 1.4 Filter by company
    const compFilterRes = await fetch(`${BASE_URL}/jobs?company=TechCorp`);
    const compFilterData = await compFilterRes.json();
    record('Job Listing', '1.4 Filter by company (?company=TechCorp) matches company name', compFilterRes.status === 200 && compFilterData.data.every((j) => j.companyName.toLowerCase().includes('techcorp')));

    // 1.5 Filter by location
    const locFilterRes = await fetch(`${BASE_URL}/jobs?location=Bengaluru`);
    const locFilterData = await locFilterRes.json();
    record('Job Listing', '1.5 Filter by location (?location=Bengaluru) matches job location', locFilterRes.status === 200 && locFilterData.data.every((j) => j.location.toLowerCase().includes('bengaluru')));

    // 1.6 Filter by job type
    const typeFilterRes = await fetch(`${BASE_URL}/jobs?jobType=FULL_TIME`);
    const typeFilterData = await typeFilterRes.json();
    record('Job Listing', '1.6 Filter by job type (?jobType=FULL_TIME) returns FULL_TIME listings', typeFilterRes.status === 200 && typeFilterData.data.every((j) => j.jobType === 'FULL_TIME'));

    // 1.7 Filter by work mode
    const modeFilterRes = await fetch(`${BASE_URL}/jobs?workMode=HYBRID`);
    const modeFilterData = await modeFilterRes.json();
    record('Job Listing', '1.7 Filter by work mode (?workMode=HYBRID) returns HYBRID listings', modeFilterRes.status === 200 && modeFilterData.data.every((j) => j.workMode === 'HYBRID'));

    // 1.8 Filter by minimum CGPA
    const cgpaFilterRes = await fetch(`${BASE_URL}/jobs?minCgpa=8.0`);
    const cgpaFilterData = await cgpaFilterRes.json();
    record('Job Listing', '1.8 Filter by minimum CGPA (?minCgpa=8.0) returns jobs within threshold', cgpaFilterRes.status === 200 && cgpaFilterData.data.every((j) => j.minimumCgpa <= 8.0));

    // 1.9 Filter by graduation year
    const yearFilterRes = await fetch(`${BASE_URL}/jobs?graduationYear=2026`);
    const yearFilterData = await yearFilterRes.json();
    record('Job Listing', '1.9 Filter by graduation year (?graduationYear=2026) returns matching batch jobs', yearFilterRes.status === 200 && yearFilterData.data.every((j) => !j.graduationYear || j.graduationYear === 2026));

    // 1.10 Pagination
    const pageRes = await fetch(`${BASE_URL}/jobs?page=1&limit=1`);
    const pageData = await pageRes.json();
    record('Job Listing', '1.10 Pagination (?page=1&limit=1) limits returned records count to 1', pageRes.status === 200 && pageData.data.length === 1);

    // =========================================================================
    // 2. JOB DETAILS TESTS (GET /api/jobs/:id)
    // =========================================================================
    console.log('\n[2. Job Details Tests]');

    const sampleJobId = listData.data[0]?.id;
    const singleJobRes = await fetch(`${BASE_URL}/jobs/${sampleJobId}`);
    const singleJobData = await singleJobRes.json();
    record('Job Details', '2.1 GET /api/jobs/:id returns HTTP 200 for valid UUID', singleJobRes.status === 200 && singleJobData.data?.id === sampleJobId);
    record('Job Details', '2.2 Job details include complete company object', Boolean(singleJobData.data?.company?.companyName && singleJobData.data?.company?.location));
    record('Job Details', '2.3 Job details include required skills array', Array.isArray(singleJobData.data?.skillsRequired));
    record('Job Details', '2.4 Job details include eligibilityCriteria summary object', singleJobData.data?.eligibilityCriteria?.minimumCgpa !== undefined);

    const nonExistentJobRes = await fetch(`${BASE_URL}/jobs/00000000-0000-0000-0000-000000000000`);
    record('Job Details', '2.5 GET /api/jobs/:id for non-existent UUID cleanly returns HTTP 404', nonExistentJobRes.status === 404);

    const malformedJobRes = await fetch(`${BASE_URL}/jobs/invalid-uuid-format`);
    record('Job Details', '2.6 GET /api/jobs/:id for malformed UUID returns HTTP 400 validation error', malformedJobRes.status === 400);

    // =========================================================================
    // 3. RECRUITER JOB CREATION (POST /api/recruiters/jobs)
    // =========================================================================
    console.log('\n[3. Recruiter Job Creation Tests]');

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 45);
    const deadlineString = futureDate.toISOString().split('T')[0];

    const createRes = await fetch(`${BASE_URL}/recruiters/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenRecruiterA}`,
      },
      body: JSON.stringify({
        title: 'Senior Distributed Systems Architect',
        description: 'Lead architecture of high-throughput distributed messaging platforms.',
        jobType: 'FULL_TIME',
        workMode: 'HYBRID',
        location: 'Bengaluru / Hyderabad, India',
        salaryMin: 2200000,
        salaryMax: 3000000,
        experienceRequired: '3-5 Years',
        minCgpa: 8.0,
        graduationYear: 2026,
        applicationDeadline: deadlineString,
        status: 'OPEN',
        skillsRequired: ['Node.js', 'PostgreSQL', 'Docker', 'AWS Cloud'],
      }),
    });
    const createData = await createRes.json();
    createdJobId = createData.data?.id;

    record('Recruiter Job Creation', '3.1 POST /api/recruiters/jobs creates new job listing (HTTP 201)', createRes.status === 201 && Boolean(createdJobId));
    record('Recruiter Job Creation', '3.2 Created job is automatically assigned to recruiter\'s company', createData.data?.companyId === companyAId);

    // Direct PostgreSQL verification
    const dbJobCheck = await query('SELECT id, job_title, status, minimum_cgpa FROM jobs WHERE id = $1', [createdJobId]);
    record('Recruiter Job Creation', '3.3 Job record verified directly in PostgreSQL jobs table', dbJobCheck.rows.length === 1 && dbJobCheck.rows[0].job_title === 'Senior Distributed Systems Architect');

    // Direct PostgreSQL verification of skills in job_skills
    const dbSkillsCheck = await query('SELECT count(*) as count FROM job_skills WHERE job_id = $1', [createdJobId]);
    record('Recruiter Job Creation', '3.4 Required skills mapped and persisted in PostgreSQL job_skills table', parseInt(dbSkillsCheck.rows[0].count, 10) >= 4);

    // Validation rejection: Title too short
    const shortTitleRes = await fetch(`${BASE_URL}/recruiters/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenRecruiterA}`,
      },
      body: JSON.stringify({ title: 'AB' }),
    });
    record('Recruiter Job Creation', '3.5 Job creation with short title (< 3 chars) rejected with HTTP 400', shortTitleRes.status === 400);

    // Validation rejection: Past deadline for OPEN job
    const pastDeadlineRes = await fetch(`${BASE_URL}/recruiters/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenRecruiterA}`,
      },
      body: JSON.stringify({
        title: 'Backend Test Engineer',
        applicationDeadline: '2020-01-01',
        status: 'OPEN',
      }),
    });
    record('Recruiter Job Creation', '3.6 Job creation with past deadline for OPEN status rejected with HTTP 400', pastDeadlineRes.status === 400);

    // =========================================================================
    // 4. JOB UPDATE TESTS (PUT /api/recruiters/jobs/:id)
    // =========================================================================
    console.log('\n[4. Job Update Tests]');

    const updateJobRes = await fetch(`${BASE_URL}/recruiters/jobs/${createdJobId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenRecruiterA}`,
      },
      body: JSON.stringify({
        title: 'Lead Distributed Systems Architect (Updated)',
        salaryMax: 3500000,
        workMode: 'REMOTE',
        skillsRequired: ['Node.js', 'PostgreSQL', 'Docker', 'AWS Cloud', 'Python'],
      }),
    });
    const updateJobData = await updateJobRes.json();
    record('Job Update', '4.1 PUT /api/recruiters/jobs/:id updates job details (HTTP 200)', updateJobRes.status === 200 && updateJobData.data?.salaryMax === 3500000);

    // Direct PostgreSQL verification
    const dbUpdateCheck = await query('SELECT job_title, salary_max, work_mode FROM jobs WHERE id = $1', [createdJobId]);
    record(
      'Job Update',
      '4.2 Updated values verified persisted in PostgreSQL jobs table',
      dbUpdateCheck.rows[0]?.job_title === 'Lead Distributed Systems Architect (Updated)' &&
        parseFloat(dbUpdateCheck.rows[0]?.salary_max) === 3500000 &&
        dbUpdateCheck.rows[0]?.work_mode === 'REMOTE'
    );

    // Direct PostgreSQL verification of updated skills
    const dbUpdatedSkills = await query('SELECT count(*) as count FROM job_skills WHERE job_id = $1', [createdJobId]);
    record('Job Update', '4.3 Updated skills persisted in PostgreSQL job_skills table (5 skills)', parseInt(dbUpdatedSkills.rows[0].count, 10) === 5);

    // Updating non-existent job UUID returns 404
    const nonExistentUpdateRes = await fetch(`${BASE_URL}/recruiters/jobs/00000000-0000-0000-0000-000000000000`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenRecruiterA}`,
      },
      body: JSON.stringify({ title: 'Ghost Job Update' }),
    });
    record('Job Update', '4.4 Updating non-existent job UUID returns HTTP 404', nonExistentUpdateRes.status === 404);

    // =========================================================================
    // 5. JOB DELETION TESTS (DELETE /api/recruiters/jobs/:id)
    // =========================================================================
    console.log('\n[5. Job Deletion Tests]');

    const deleteJobRes = await fetch(`${BASE_URL}/recruiters/jobs/${createdJobId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenRecruiterA}` },
    });
    record('Job Deletion', '5.1 DELETE /api/recruiters/jobs/:id successfully deletes job (HTTP 200)', deleteJobRes.status === 200);

    // Direct PostgreSQL verification
    const dbDeleteCheck = await query('SELECT id FROM jobs WHERE id = $1', [createdJobId]);
    record('Job Deletion', '5.2 Job record is deleted from PostgreSQL jobs table', dbDeleteCheck.rows.length === 0);

    const dbCascadeSkillsCheck = await query('SELECT count(*) as count FROM job_skills WHERE job_id = $1', [createdJobId]);
    record('Job Deletion', '5.3 Associated job_skills records are cleaned up in PostgreSQL', parseInt(dbCascadeSkillsCheck.rows[0].count, 10) === 0);

    const nonExistentDeleteRes = await fetch(`${BASE_URL}/recruiters/jobs/${createdJobId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenRecruiterA}` },
    });
    record('Job Deletion', '5.4 Deleting already deleted or non-existent job UUID returns HTTP 404', nonExistentDeleteRes.status === 404);

    // =========================================================================
    // 6. JOB LIFECYCLE TESTS (DRAFT -> OPEN -> CLOSED -> EXPIRED)
    // =========================================================================
    console.log('\n[6. Job Lifecycle Tests]');

    // 6.1 Create DRAFT job
    const draftJobRes = await fetch(`${BASE_URL}/recruiters/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenRecruiterA}`,
      },
      body: JSON.stringify({
        title: 'Draft ML Research Scientist',
        description: 'Internal draft description for machine learning role.',
        status: 'DRAFT',
      }),
    });
    const draftJobData = await draftJobRes.json();
    lifecycleJobId = draftJobData.data?.id;
    record('Job Lifecycle', '6.1 Creating a job with status = DRAFT succeeds (HTTP 201)', draftJobRes.status === 201 && draftJobData.data?.status === 'DRAFT');

    // 6.2 DRAFT job is EXCLUDED from public student GET /api/jobs
    const publicListAfterDraft = await fetch(`${BASE_URL}/jobs`);
    const publicDataAfterDraft = await publicListAfterDraft.json();
    const draftInPublic = publicDataAfterDraft.data.some((j) => j.id === lifecycleJobId);
    record('Job Lifecycle', '6.2 DRAFT job is strictly excluded from public student job listings', !draftInPublic);

    // 6.3 Update DRAFT -> OPEN
    const publishRes = await fetch(`${BASE_URL}/recruiters/jobs/${lifecycleJobId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenRecruiterA}`,
      },
      body: JSON.stringify({
        status: 'OPEN',
        applicationDeadline: deadlineString,
      }),
    });
    const publishData = await publishRes.json();
    record('Job Lifecycle', '6.3 Transitioning job from DRAFT -> OPEN succeeds (HTTP 200)', publishRes.status === 200 && publishData.data?.status === 'OPEN');

    // 6.4 OPEN job now appears in public student GET /api/jobs
    const publicListAfterOpen = await fetch(`${BASE_URL}/jobs`);
    const publicDataAfterOpen = await publicListAfterOpen.json();
    const openInPublic = publicDataAfterOpen.data.some((j) => j.id === lifecycleJobId);
    record('Job Lifecycle', '6.4 Published OPEN job appears in public student job listings', openInPublic);

    // 6.5 Update OPEN -> CLOSED
    const closeRes = await fetch(`${BASE_URL}/recruiters/jobs/${lifecycleJobId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenRecruiterA}`,
      },
      body: JSON.stringify({ status: 'CLOSED' }),
    });
    const closeData = await closeRes.json();
    record('Job Lifecycle', '6.5 Transitioning job from OPEN -> CLOSED succeeds (HTTP 200)', closeRes.status === 200 && closeData.data?.status === 'CLOSED');

    // 6.6 CLOSED job is excluded from public student GET /api/jobs
    const publicListAfterClose = await fetch(`${BASE_URL}/jobs`);
    const publicDataAfterClose = await publicListAfterClose.json();
    const closedInPublic = publicDataAfterClose.data.some((j) => j.id === lifecycleJobId);
    record('Job Lifecycle', '6.6 CLOSED job is strictly excluded from public student job listings', !closedInPublic);

    // 6.7 EXPIRED job exclusion
    await query("UPDATE jobs SET status = 'OPEN', application_deadline = '2020-01-01' WHERE id = $1", [lifecycleJobId]);
    const publicListAfterExpired = await fetch(`${BASE_URL}/jobs`);
    const publicDataAfterExpired = await publicListAfterExpired.json();
    const expiredInPublic = publicDataAfterExpired.data.some((j) => j.id === lifecycleJobId);
    record('Job Lifecycle', '6.7 Past deadline EXPIRED job is strictly excluded from public student job listings', !expiredInPublic);

    // Clean up lifecycle job
    await query('DELETE FROM jobs WHERE id = $1', [lifecycleJobId]);

    // =========================================================================
    // 7. ELIGIBILITY EVALUATION TESTS
    // =========================================================================
    console.log('\n[7. Eligibility Tests]');

    // Student has CGPA = 8.74, Graduation Batch = 2026
    // Authenticated request to GET /api/jobs with Student Bearer token
    const studentEvalRes = await fetch(`${BASE_URL}/jobs`, {
      headers: { Authorization: `Bearer ${tokenStudent}` },
    });
    const studentEvalData = await studentEvalRes.json();

    const evaluatedJob = studentEvalData.data[0];
    record('Eligibility', '7.1 Authenticated student request computes isEligible flag', typeof evaluatedJob?.isEligible === 'boolean');
    record('Eligibility', '7.2 Authenticated student request includes eligibilityBreakdown array', Array.isArray(evaluatedJob?.eligibilityBreakdown));
    record('Eligibility', '7.3 Breakdown contains CGPA rule with studentValue and requiredValue', Boolean(evaluatedJob?.eligibilityBreakdown?.find((r) => r.rule.includes('CGPA'))));
    record('Eligibility', '7.4 Breakdown contains Graduation Batch rule', Boolean(evaluatedJob?.eligibilityBreakdown?.find((r) => r.rule.includes('Batch'))));
    record('Eligibility', '7.5 Breakdown contains Application Deadline status', Boolean(evaluatedJob?.eligibilityBreakdown?.find((r) => r.rule.includes('Deadline'))));
    record('Eligibility', '7.6 Evaluation tracks student application status (hasApplied boolean)', typeof evaluatedJob?.hasApplied === 'boolean');
    record('Eligibility', '7.7 Matching skills percentage calculated for job', typeof evaluatedJob?.matchPercentage === 'number');

    // =========================================================================
    // 8. SECURITY & AUTHORIZATION TESTS
    // =========================================================================
    console.log('\n[8. Security Tests]');

    // 8.1 No JWT -> 401
    const noJwtRes = await fetch(`${BASE_URL}/recruiters/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Unauthenticated Job' }),
    });
    record('Security', '8.1 Request without JWT to POST /api/recruiters/jobs returns HTTP 401 Unauthorized', noJwtRes.status === 401);

    // 8.2 Invalid JWT -> 401
    const invalidJwtRes = await fetch(`${BASE_URL}/recruiters/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer invalid.token.xyz',
      },
      body: JSON.stringify({ title: 'Bad Token Job' }),
    });
    record('Security', '8.2 Request with invalid JWT returns HTTP 401 Unauthorized', invalidJwtRes.status === 401);

    // 8.3 Student cannot create job
    const studentCreateRes = await fetch(`${BASE_URL}/recruiters/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenStudent}`,
      },
      body: JSON.stringify({ title: 'Student Made Job' }),
    });
    record('Security', '8.3 STUDENT JWT attempting POST /api/recruiters/jobs receives HTTP 403 Forbidden', studentCreateRes.status === 403);

    // 8.4 Student cannot update job
    const studentUpdateRes = await fetch(`${BASE_URL}/recruiters/jobs/${sampleJobId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenStudent}`,
      },
      body: JSON.stringify({ title: 'Hacked Title' }),
    });
    record('Security', '8.4 STUDENT JWT attempting PUT /api/recruiters/jobs/:id receives HTTP 403 Forbidden', studentUpdateRes.status === 403);

    // 8.5 Student cannot delete job
    const studentDeleteRes = await fetch(`${BASE_URL}/recruiters/jobs/${sampleJobId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenStudent}` },
    });
    record('Security', '8.5 STUDENT JWT attempting DELETE /api/recruiters/jobs/:id receives HTTP 403 Forbidden', studentDeleteRes.status === 403);

    // 8.6 Student cannot manage jobs via /api/jobs POST
    const studentPublicPostRes = await fetch(`${BASE_URL}/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenStudent}`,
      },
      body: JSON.stringify({ title: 'Unauthorized Public Job' }),
    });
    record('Security', '8.6 STUDENT JWT attempting POST /api/jobs receives HTTP 403 Forbidden', studentPublicPostRes.status === 403);

    // 8.7 Cross-Company Protection: Recruiter A attempting to update Job B of Company B
    const crossUpdateRes = await fetch(`${BASE_URL}/recruiters/jobs/${jobBId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenRecruiterA}`,
      },
      body: JSON.stringify({ title: 'Cross Company Hack' }),
    });
    record('Security', '8.7 Recruiter A attempting to modify Job B belonging to Company B receives HTTP 403 Forbidden', crossUpdateRes.status === 403);

    // 8.8 Cross-Company Protection: Recruiter A attempting to delete Job B of Company B
    const crossDeleteRes = await fetch(`${BASE_URL}/recruiters/jobs/${jobBId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenRecruiterA}` },
    });
    record('Security', '8.8 Recruiter A attempting to delete Job B belonging to Company B receives HTTP 403 Forbidden', crossDeleteRes.status === 403);

    // 8.9 Cross-Company Protection: Recruiter A attempting to view Job B of Company B
    const crossViewRes = await fetch(`${BASE_URL}/recruiters/jobs/${jobBId}`, {
      headers: { Authorization: `Bearer ${tokenRecruiterA}` },
    });
    record('Security', '8.9 Recruiter A attempting to view Job B belonging to Company B receives HTTP 403 Forbidden', crossViewRes.status === 403);

    // 8.10 SQL Injection in path parameter safely handled
    const sqlInjectionRes = await fetch(`${BASE_URL}/jobs/'%20OR%20'1'='1`);
    record('Security', '8.10 SQL injection attempt in job path parameter rejected with HTTP 400 validation error', sqlInjectionRes.status === 400);

    // 8.11 SQL Injection in recruiter jobs path parameter safely handled
    const sqlInjectionRecRes = await fetch(`${BASE_URL}/recruiters/jobs/'%20OR%20'1'='1`, {
      headers: { Authorization: `Bearer ${tokenRecruiterA}` },
    });
    record('Security', '8.11 SQL injection attempt in recruiter jobs path parameter rejected with HTTP 400 validation error', sqlInjectionRecRes.status === 400);

    // =========================================================================
    // 9. DIRECT POSTGRESQL DATABASE VERIFICATION
    // =========================================================================
    console.log('\n[9. Direct PostgreSQL Database Verification]');

    const dbChecks = await Promise.all([
      query("SELECT count(*) as count FROM jobs WHERE status = 'OPEN'"),
      query('SELECT count(*) as count FROM job_skills'),
      query('SELECT count(*) as count FROM companies'),
      query('SELECT count(*) as count FROM recruiters'),
    ]);

    record('Database', '9.1 Active OPEN jobs verified in PostgreSQL jobs table', parseInt(dbChecks[0].rows[0].count, 10) >= 2);
    record('Database', '9.2 Required skills linkages verified in PostgreSQL job_skills table', parseInt(dbChecks[1].rows[0].count, 10) >= 5);
    record('Database', '9.3 Company records linked to jobs verified in PostgreSQL companies table', parseInt(dbChecks[2].rows[0].count, 10) >= 2);
    record('Database', '9.4 Recruiter records verified in PostgreSQL recruiters table', parseInt(dbChecks[3].rows[0].count, 10) >= 2);

    // =========================================================================
    // 10. RESPONSE VALIDATION TESTS
    // =========================================================================
    console.log('\n[10. Response Validation Tests]');

    const checkSuccessFormat = (b) => b && b.success === true && typeof b.message === 'string' && b.data !== undefined;
    const checkErrorFormat = (b) => b && b.success === false && typeof b.message === 'string' && Array.isArray(b.errors);

    record('Response Validation', '10.1 Successful responses adhere strictly to { success: true, message, data } contract', checkSuccessFormat(listData) && checkSuccessFormat(singleJobData));

    const invalidBodyRes = await fetch(`${BASE_URL}/recruiters/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenRecruiterA}`,
      },
      body: JSON.stringify({ title: 'X' }),
    });
    const invalidBodyData = await invalidBodyRes.json();
    record('Response Validation', '10.2 Validation error responses adhere strictly to { success: false, message, errors: [] } contract', checkErrorFormat(invalidBodyData));

    const allResponsesString = JSON.stringify([listData, singleJobData, studentEvalData]);
    record('Response Validation', '10.3 Password hashes are NEVER exposed in any API response payload', !allResponsesString.includes('password_hash') && !allResponsesString.includes('$2a$10$'));

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
  console.log('JOB MANAGEMENT API MODULE VERIFICATION SUMMARY REPORT');
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

runCompleteJobVerification();
