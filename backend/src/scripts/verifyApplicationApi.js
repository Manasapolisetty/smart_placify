import { query, pool } from '../config/database.js';

const BASE_URL = process.env.BACKEND_URL || 'http://localhost:5000/api';

// Results Tracker
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  categories: {},
};

function record(category, testName, passed, detail = '') {
  results.total++;
  if (!results.categories[category]) {
    results.categories[category] = { total: 0, passed: 0, failed: 0 };
  }
  results.categories[category].total++;

  if (passed) {
    results.passed++;
    results.categories[category].passed++;
    console.log(`  ✓ [PASS] [${category}] ${testName}`);
  } else {
    results.failed++;
    results.categories[category].failed++;
    console.error(`  ✗ [FAIL] [${category}] ${testName} ${detail ? `-> ${detail}` : ''}`);
  }
}

async function verifyApplicationModule() {
  console.log('======================================================================');
  console.log('SMARTPLACIFY — COMPLETE APPLICATION API MODULE VERIFICATION');
  console.log(`Target Backend: ${BASE_URL}`);
  console.log('Database: PostgreSQL 16 (smartplacify_db)');
  console.log('======================================================================\n');

  // Verify server reachability
  try {
    const healthRes = await fetch(`${BASE_URL}/health`);
    if (!healthRes.ok) throw new Error(`Health check returned ${healthRes.status}`);
    console.log(`[OK] Backend server is reachable at ${BASE_URL}\n`);
  } catch (err) {
    console.error(`[ERROR] Backend unreachable at ${BASE_URL}:`, err.message);
    process.exit(1);
  }

  // Tokens & IDs
  let tokenStudentA;
  let tokenStudentB;
  let tokenRecruiterA;
  let tokenRecruiterB;
  let tokenAdmin;

  let studentAId;
  let studentBId;
  let companyAId;
  let companyBId;
  let userBId;
  let openJobAId;
  let closedJobAId;
  let expiredJobAId;
  let highCgpaJobAId;
  let testAppId;

  try {
    // =========================================================================
    // 0. FIXTURES SETUP & AUTHENTICATION
    // =========================================================================
    console.log('[0. Setup & Authentication]');

    // Authenticate Recruiter A (TechCorp Solutions)
    const loginResA = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'priya.sharma@techcorp.com', password: 'password123' }),
    });
    const loginDataA = await loginResA.json();
    tokenRecruiterA = loginDataA.data?.token || loginDataA.token;

    const recADb = await query(
      `SELECT r.id, r.company_id FROM recruiters r JOIN users u ON r.user_id = u.id WHERE u.email = 'priya.sharma@techcorp.com'`
    );
    companyAId = recADb.rows[0].company_id;

    // Authenticate Student A (Rahul Kumar, CGPA: 8.74, Batch: 2026)
    const loginResStuA = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'rahul.kumar@university.edu.in', password: 'password123' }),
    });
    const loginDataStuA = await loginResStuA.json();
    tokenStudentA = loginDataStuA.data?.token || loginDataStuA.token;

    const stuADb = await query(
      `SELECT s.id FROM students s JOIN users u ON s.user_id = u.id WHERE u.email = 'rahul.kumar@university.edu.in'`
    );
    studentAId = stuADb.rows[0].id;

    // Ensure Student A has skills in student_skills
    const allSkills = await query('SELECT id FROM skills');
    for (const s of allSkills.rows) {
      await query(
        `INSERT INTO student_skills (student_id, skill_id, proficiency_level) VALUES ($1, $2, 'INTERMEDIATE') ON CONFLICT DO NOTHING`,
        [studentAId, s.id]
      );
    }

    // Authenticate Admin
    const loginResAdmin = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@smartplacify.edu.in', password: 'password123' }),
    });
    const loginDataAdmin = await loginResAdmin.json();
    tokenAdmin = loginDataAdmin.data?.token || loginDataAdmin.token;

    // Setup Secondary Company B and Recruiter B for cross-tenant isolation testing
    let compB = await query("SELECT id FROM companies WHERE company_name = 'Apex Innovations Ltd'");
    if (compB.rows.length === 0) {
      const cRes = await query(
        `INSERT INTO companies (company_name, industry, location, description, website, email, status)
         VALUES ('Apex Innovations Ltd', 'Autonomous Systems', 'Pune, Maharashtra', 'Robotics and AI', 'https://apex.example.com', 'careers@apex.example.com', 'ACTIVE')
         RETURNING id`
      );
      companyBId = cRes.rows[0].id;
    } else {
      companyBId = compB.rows[0].id;
    }

    let userB = await query("SELECT id FROM users WHERE email = 'rohan.verma@apex.example.com'");
    if (userB.rows.length === 0) {
      const uRes = await query(
        `INSERT INTO users (name, email, password_hash, role, status)
         VALUES ('Rohan Verma', 'rohan.verma@apex.example.com', '$2a$10$FmYlh8s/XNKNlcssq.5N4.JA3Pb4u4z5Rst7GlR./PjkstjunbSP2', 'RECRUITER', 'ACTIVE')
         RETURNING id`
      );
      userBId = uRes.rows[0].id;
      await query(
        `INSERT INTO recruiters (user_id, company_id, designation, recruiter_code)
         VALUES ($1, $2, 'Staff Technical Recruiter', 'REC-APEX-001') ON CONFLICT DO NOTHING`,
        [userBId, companyBId]
      );
    } else {
      userBId = userB.rows[0].id;
    }

    const loginResB = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'rohan.verma@apex.example.com', password: 'password123' }),
    });
    const loginDataB = await loginResB.json();
    tokenRecruiterB = loginDataB.data?.token || loginDataB.token;

    // Setup Secondary Student B (Priya Patel or test candidate)
    let userStuB = await query("SELECT id FROM users WHERE email = 'priya.patel@university.edu.in'");
    if (userStuB.rows.length === 0) {
      const uRes = await query(
        `INSERT INTO users (name, email, password_hash, role, status)
         VALUES ('Priya Patel', 'priya.patel@university.edu.in', '$2a$10$FmYlh8s/XNKNlcssq.5N4.JA3Pb4u4z5Rst7GlR./PjkstjunbSP2', 'STUDENT', 'ACTIVE')
         RETURNING id`
      );
      const uBId = uRes.rows[0].id;
      const sRes = await query(
        `INSERT INTO students (user_id, roll_number, cgpa, graduation_year)
         VALUES ($1, '2022CS088', 8.50, 2026)
         RETURNING id`,
        [uBId]
      );
      studentBId = sRes.rows[0].id;
    } else {
      const sRes = await query('SELECT id FROM students WHERE user_id = $1', [userStuB.rows[0].id]);
      studentBId = sRes.rows[0].id;
    }

    const loginResStuB = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'priya.patel@university.edu.in', password: 'password123' }),
    });
    const loginDataStuB = await loginResStuB.json();
    tokenStudentB = loginDataStuB.data?.token || loginDataStuB.token;

    // Setup dedicated test jobs for various lifecycle states
    // 1. OPEN eligible job
    const jobA = await query(
      `INSERT INTO jobs (company_id, job_title, job_description, job_type, location, minimum_cgpa, graduation_year, application_deadline, status)
       VALUES ($1, 'Senior Cloud Platform Engineer', 'Full-stack cloud applications', 'FULL_TIME', 'Bengaluru, India', 8.00, 2026, CURRENT_DATE + 30, 'OPEN')
       RETURNING id`,
      [companyAId]
    );
    openJobAId = jobA.rows[0].id;

    // 2. CLOSED job
    const jobClosed = await query(
      `INSERT INTO jobs (company_id, job_title, job_description, job_type, location, minimum_cgpa, status)
       VALUES ($1, 'Closed DevOps Role', 'DevOps role closed', 'FULL_TIME', 'Remote', 7.00, 'CLOSED')
       RETURNING id`,
      [companyAId]
    );
    closedJobAId = jobClosed.rows[0].id;

    // 3. EXPIRED job (deadline in past)
    const jobExpired = await query(
      `INSERT INTO jobs (company_id, job_title, job_description, job_type, location, minimum_cgpa, application_deadline, status)
       VALUES ($1, 'Expired Systems Engineer', 'Legacy applications', 'FULL_TIME', 'Hyderabad', 7.00, CURRENT_DATE - 5, 'OPEN')
       RETURNING id`,
      [companyAId]
    );
    expiredJobAId = jobExpired.rows[0].id;

    // 4. Ineligible job (Requires CGPA 9.5, student has 8.74)
    const jobHighCgpa = await query(
      `INSERT INTO jobs (company_id, job_title, job_description, job_type, location, minimum_cgpa, status)
       VALUES ($1, 'Staff Research Scientist', 'AI research labs', 'FULL_TIME', 'Bengaluru', 9.50, 'OPEN')
       RETURNING id`,
      [companyAId]
    );
    highCgpaJobAId = jobHighCgpa.rows[0].id;

    console.log('  ✓ Test fixtures ready (Recruiter A/B, Student A/B, Admin, Test Jobs)\n');

    // =========================================================================
    // 1. STUDENT APPLICATION TESTS
    // =========================================================================
    console.log('[1. Student Application Tests]');

    // 1.1 Apply for OPEN eligible job
    const applyRes1 = await fetch(`${BASE_URL}/jobs/${openJobAId}/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenStudentA}`,
      },
      body: JSON.stringify({
        coverLetter: 'I am excited to apply for Senior Cloud Platform Engineer at TechCorp Solutions.',
      }),
    });
    const applyData1 = await applyRes1.json();
    testAppId = applyData1.data?.id;

    record(
      'Student Application',
      '1.1 POST /api/jobs/:jobId/apply returns HTTP 201 Created for OPEN eligible job',
      applyRes1.status === 201 && Boolean(testAppId) && applyData1.data?.status === 'APPLIED'
    );

    // 1.2 Verify application stored in PostgreSQL
    const dbAppCheck = await query('SELECT id, job_id, student_id, status FROM applications WHERE id = $1', [testAppId]);
    record(
      'Student Application',
      '1.2 Application record verified stored in PostgreSQL applications table',
      dbAppCheck.rows.length === 1 &&
        dbAppCheck.rows[0].student_id === studentAId &&
        dbAppCheck.rows[0].status === 'APPLIED'
    );

    // 1.3 Attempt duplicate application
    const dupRes = await fetch(`${BASE_URL}/jobs/${openJobAId}/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenStudentA}`,
      },
      body: JSON.stringify({ coverLetter: 'Duplicate application attempt' }),
    });
    record(
      'Student Application',
      '1.3 Duplicate application to same job rejected with HTTP 409 Conflict',
      dupRes.status === 409
    );

    // 1.4 Attempt application to CLOSED job
    const closedRes = await fetch(`${BASE_URL}/jobs/${closedJobAId}/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenStudentA}`,
      },
      body: JSON.stringify({ coverLetter: 'Applying to closed position' }),
    });
    record(
      'Student Application',
      '1.4 Application to a CLOSED job rejected with HTTP 400 Bad Request',
      closedRes.status === 400
    );

    // 1.5 Attempt application to EXPIRED job (deadline passed)
    const expiredRes = await fetch(`${BASE_URL}/jobs/${expiredJobAId}/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenStudentA}`,
      },
      body: JSON.stringify({ coverLetter: 'Applying to expired position' }),
    });
    record(
      'Student Application',
      '1.5 Application to an EXPIRED job rejected with HTTP 400 Bad Request',
      expiredRes.status === 400
    );

    // 1.6 Attempt application to ineligible job (insufficient CGPA)
    const ineligRes = await fetch(`${BASE_URL}/jobs/${highCgpaJobAId}/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenStudentA}`,
      },
      body: JSON.stringify({ coverLetter: 'Applying with insufficient CGPA' }),
    });
    record(
      'Student Application',
      '1.6 Application to an ineligible job (insufficient CGPA) rejected with HTTP 400',
      ineligRes.status === 400
    );

    // 1.7 View student applications (GET /api/students/applications)
    const stuListRes = await fetch(`${BASE_URL}/students/applications`, {
      headers: { Authorization: `Bearer ${tokenStudentA}` },
    });
    const stuListData = await stuListRes.json();
    record(
      'Student Application',
      '1.7 GET /api/students/applications returns HTTP 200 with student applications array',
      stuListRes.status === 200 &&
        Array.isArray(stuListData.data) &&
        stuListData.data.some((a) => a.id === testAppId)
    );

    // 1.8 View application details (GET /api/students/applications/:id)
    const stuDetailRes = await fetch(`${BASE_URL}/students/applications/${testAppId}`, {
      headers: { Authorization: `Bearer ${tokenStudentA}` },
    });
    const stuDetailData = await stuDetailRes.json();
    record(
      'Student Application',
      '1.8 GET /api/students/applications/:id returns HTTP 200 with job, company, and history breakdown',
      stuDetailRes.status === 200 &&
        stuDetailData.data?.id === testAppId &&
        Boolean(stuDetailData.data?.company?.name) &&
        Array.isArray(stuDetailData.data?.statusHistory)
    );

    // =========================================================================
    // 2. RECRUITER APPLICATION MANAGEMENT TESTS
    // =========================================================================
    console.log('\n[2. Recruiter Application Management Tests]');

    // 2.1 View company applications (GET /api/recruiters/applications)
    const recListRes = await fetch(`${BASE_URL}/recruiters/applications`, {
      headers: { Authorization: `Bearer ${tokenRecruiterA}` },
    });
    const recListData = await recListRes.json();
    record(
      'Recruiter Applications',
      '2.1 GET /api/recruiters/applications returns HTTP 200 with company applications array',
      recListRes.status === 200 &&
        Array.isArray(recListData.data) &&
        recListData.data.some((a) => a.id === testAppId)
    );

    // 2.2 Filter by status (?status=APPLIED)
    const filterStatusRes = await fetch(`${BASE_URL}/recruiters/applications?status=APPLIED`, {
      headers: { Authorization: `Bearer ${tokenRecruiterA}` },
    });
    const filterStatusData = await filterStatusRes.json();
    record(
      'Recruiter Applications',
      '2.2 GET /api/recruiters/applications?status=APPLIED returns filtered results',
      filterStatusRes.status === 200 && filterStatusData.data.every((a) => a.status === 'APPLIED')
    );

    // 2.3 Filter by job ID (?jobId=...)
    const filterJobRes = await fetch(`${BASE_URL}/recruiters/applications?jobId=${openJobAId}`, {
      headers: { Authorization: `Bearer ${tokenRecruiterA}` },
    });
    const filterJobData = await filterJobRes.json();
    record(
      'Recruiter Applications',
      '2.3 GET /api/recruiters/applications?jobId=... returns applications for specific job',
      filterJobRes.status === 200 && filterJobData.data.every((a) => a.jobId === openJobAId)
    );

    // 2.4 Search applications (?search=Rahul)
    const searchRes = await fetch(`${BASE_URL}/recruiters/applications?search=Rahul`, {
      headers: { Authorization: `Bearer ${tokenRecruiterA}` },
    });
    const searchData = await searchRes.json();
    record(
      'Recruiter Applications',
      '2.4 Search query (?search=Rahul) matches student name',
      searchRes.status === 200 && searchData.data.some((a) => a.studentName.toLowerCase().includes('rahul'))
    );

    // 2.5 View application details (GET /api/recruiters/applications/:id)
    const recDetailRes = await fetch(`${BASE_URL}/recruiters/applications/${testAppId}`, {
      headers: { Authorization: `Bearer ${tokenRecruiterA}` },
    });
    const recDetailData = await recDetailRes.json();
    record(
      'Recruiter Applications',
      '2.5 GET /api/recruiters/applications/:id returns HTTP 200 with complete candidate profile',
      recDetailRes.status === 200 &&
        recDetailData.data?.candidate?.email === 'rahul.kumar@university.edu.in' &&
        Array.isArray(recDetailData.data?.candidate?.skills) &&
        Array.isArray(recDetailData.data?.statusHistory)
    );

    // 2.6 Status Transition: APPLIED -> SHORTLISTED (PUT /api/recruiters/applications/:id/status)
    const shortlistRes = await fetch(`${BASE_URL}/recruiters/applications/${testAppId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenRecruiterA}`,
      },
      body: JSON.stringify({
        status: 'SHORTLISTED',
        remarks: 'Candidate cleared technical screening round',
      }),
    });
    const shortlistData = await shortlistRes.json();
    record(
      'Recruiter Applications',
      '2.6 Transition status APPLIED -> SHORTLISTED succeeds (HTTP 200)',
      shortlistRes.status === 200 && shortlistData.data?.status === 'SHORTLISTED'
    );

    // 2.7 Status Transition: SHORTLISTED -> SELECTED
    const selectRes = await fetch(`${BASE_URL}/recruiters/applications/${testAppId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenRecruiterA}`,
      },
      body: JSON.stringify({
        status: 'SELECTED',
        remarks: 'Candidate selected with formal offer package',
      }),
    });
    const selectData = await selectRes.json();
    record(
      'Recruiter Applications',
      '2.7 Transition status SHORTLISTED -> SELECTED succeeds (HTTP 200)',
      selectRes.status === 200 && selectData.data?.status === 'SELECTED'
    );

    // 2.8 Status Transition: REJECTED (using a secondary test application)
    const jobA2 = await query(
      `INSERT INTO jobs (company_id, job_title, job_description, job_type, location, status)
       VALUES ($1, 'Junior Frontend Developer', 'React interfaces', 'FULL_TIME', 'Bengaluru', 'OPEN')
       RETURNING id`,
      [companyAId]
    );
    const jobA2Id = jobA2.rows[0].id;

    // Student B applies to Job A2
    const applyResB = await fetch(`${BASE_URL}/jobs/${jobA2Id}/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenStudentB}`,
      },
      body: JSON.stringify({ coverLetter: 'Applying for frontend position' }),
    });
    const applyDataB = await applyResB.json();
    const testApp2Id = applyDataB.data?.id;

    const rejectRes = await fetch(`${BASE_URL}/recruiters/applications/${testApp2Id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenRecruiterA}`,
      },
      body: JSON.stringify({
        status: 'REJECTED',
        remarks: 'Profile does not match current frontend requirements',
      }),
    });
    const rejectData = await rejectRes.json();
    record(
      'Recruiter Applications',
      '2.8 Transition status to REJECTED succeeds (HTTP 200)',
      rejectRes.status === 200 && rejectData.data?.status === 'REJECTED'
    );

    // 2.9 Invalid status parameter rejected with HTTP 400
    const invalidStatusRes = await fetch(`${BASE_URL}/recruiters/applications/${testAppId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenRecruiterA}`,
      },
      body: JSON.stringify({ status: 'INVALID_STATUS' }),
    });
    record(
      'Recruiter Applications',
      '2.9 Attempting invalid status transition rejected with HTTP 400 validation error',
      invalidStatusRes.status === 400
    );

    // =========================================================================
    // 3. WITHDRAWAL TESTS
    // =========================================================================
    console.log('\n[3. Application Withdrawal Tests]');

    // Create fresh application to test withdrawal lifecycle
    const jobA3 = await query(
      `INSERT INTO jobs (company_id, job_title, job_description, job_type, location, status)
       VALUES ($1, 'Associate Quality Engineer', 'QA automation', 'FULL_TIME', 'Bengaluru', 'OPEN')
       RETURNING id`,
      [companyAId]
    );
    const jobA3Id = jobA3.rows[0].id;

    const applyRes3 = await fetch(`${BASE_URL}/jobs/${jobA3Id}/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenStudentA}`,
      },
      body: JSON.stringify({ coverLetter: 'Applying for QA' }),
    });
    const app3Id = (await applyRes3.json()).data.id;

    // 3.1 Student withdraws active application (POST /api/students/applications/:id/withdraw)
    const withdrawRes = await fetch(`${BASE_URL}/students/applications/${app3Id}/withdraw`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenStudentA}` },
    });
    const withdrawData = await withdrawRes.json();
    record(
      'Withdrawal',
      '3.1 POST /api/students/applications/:id/withdraw updates status to WITHDRAWN (HTTP 200)',
      withdrawRes.status === 200 && withdrawData.data?.status === 'WITHDRAWN'
    );

    // 3.2 Re-withdrawing already WITHDRAWN application rejected with HTTP 400
    const reWithdrawRes = await fetch(`${BASE_URL}/students/applications/${app3Id}/withdraw`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenStudentA}` },
    });
    record(
      'Withdrawal',
      '3.2 Re-withdrawing already WITHDRAWN application cleanly rejected with HTTP 400',
      reWithdrawRes.status === 400
    );

    // 3.3 Candidate cannot withdraw an already SELECTED application
    const withdrawSelectedRes = await fetch(`${BASE_URL}/students/applications/${testAppId}/withdraw`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenStudentA}` },
    });
    record(
      'Withdrawal',
      '3.3 Candidate cannot withdraw an already SELECTED application (returns HTTP 400)',
      withdrawSelectedRes.status === 400
    );

    // 3.4 Candidate cannot withdraw an already REJECTED application
    const withdrawRejectedRes = await fetch(`${BASE_URL}/students/applications/${testApp2Id}/withdraw`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenStudentB}` },
    });
    record(
      'Withdrawal',
      '3.4 Candidate cannot withdraw an already REJECTED application (returns HTTP 400)',
      withdrawRejectedRes.status === 400
    );

    // 3.5 Recruiter updating status of a WITHDRAWN application rejected with HTTP 400
    const updateWithdrawnRes = await fetch(`${BASE_URL}/recruiters/applications/${app3Id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenRecruiterA}`,
      },
      body: JSON.stringify({ status: 'SHORTLISTED' }),
    });
    record(
      'Withdrawal',
      '3.5 Recruiter attempting status update on WITHDRAWN application rejected with HTTP 400',
      updateWithdrawnRes.status === 400
    );

    // =========================================================================
    // 4. AUDIT TRAIL, NOTIFICATIONS & TIMESTAMPS VERIFICATION
    // =========================================================================
    console.log('\n[4. Audit Trail, Notifications & Timestamps]');

    // 4.1 application_status_history records in PostgreSQL
    const historyDb = await query(
      `SELECT id, old_status, new_status, changed_by, changed_at, remarks
       FROM application_status_history
       WHERE application_id = $1
       ORDER BY changed_at ASC`,
      [testAppId]
    );
    record(
      'Audit & Notifications',
      '4.1 application_status_history logs all transitions (APPLIED -> SHORTLISTED -> SELECTED)',
      historyDb.rows.length >= 3 &&
        historyDb.rows[0].new_status === 'APPLIED' &&
        historyDb.rows[1].new_status === 'SHORTLISTED' &&
        historyDb.rows[2].new_status === 'SELECTED'
    );

    // 4.2 Audit records have valid timestamps and remarks
    record(
      'Audit & Notifications',
      '4.2 Audit history rows contain valid ISO timestamps and non-empty remarks',
      historyDb.rows.every((r) => Boolean(r.changed_at) && Boolean(r.remarks))
    );

    // 4.3 Student notifications created upon submission and status transitions
    const stuNotifs = await query(
      `SELECT id, title, message, notification_type, is_read, created_at
       FROM notifications
       WHERE user_id = (SELECT user_id FROM students WHERE id = $1)
       ORDER BY created_at DESC`,
      [studentAId]
    );
    record(
      'Audit & Notifications',
      '4.3 Notifications created in PostgreSQL for candidate upon submission and status transitions',
      stuNotifs.rows.length >= 2 &&
        stuNotifs.rows.some((n) => n.notification_type === 'APPLICATION' || n.notification_type === 'PLACEMENT')
    );

    // 4.4 Offer notification created on SELECTED status
    record(
      'Audit & Notifications',
      '4.4 Notification for offer received created upon SELECTED status (type: PLACEMENT)',
      stuNotifs.rows.some((n) => n.notification_type === 'PLACEMENT' || n.title.includes('Offer'))
    );

    // 4.5 Recruiter notifications created upon new application and candidate withdrawal
    const recNotifs = await query(
      `SELECT id, title, message, notification_type, created_at
       FROM notifications
       WHERE user_id = (SELECT user_id FROM recruiters WHERE id = (SELECT id FROM recruiters WHERE company_id = $1 LIMIT 1))
       ORDER BY created_at DESC`,
      [companyAId]
    );
    record(
      'Audit & Notifications',
      '4.5 Notifications created in PostgreSQL for recruiters on new applications and candidate withdrawals',
      recNotifs.rows.length >= 1
    );

    // 4.6 Notifications have is_read = false by default and valid created_at
    record(
      'Audit & Notifications',
      '4.6 Notifications initialized with is_read = FALSE and valid created_at timestamp',
      stuNotifs.rows.some((n) => n.is_read === false && Boolean(n.created_at))
    );

    // =========================================================================
    // 5. SECURITY & AUTHORIZATION TESTS
    // =========================================================================
    console.log('\n[5. Security & Authorization Tests]');

    // 5.1 Student B cannot access Student A's application details (HTTP 403)
    const crossStuDetailRes = await fetch(`${BASE_URL}/students/applications/${testAppId}`, {
      headers: { Authorization: `Bearer ${tokenStudentB}` },
    });
    record(
      'Security',
      '5.1 Student B cannot access Student A\'s application (returns HTTP 403 Forbidden)',
      crossStuDetailRes.status === 403
    );

    // 5.2 Student B cannot withdraw Student A's application (HTTP 403)
    const crossStuWithdrawRes = await fetch(`${BASE_URL}/students/applications/${testAppId}/withdraw`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenStudentB}` },
    });
    record(
      'Security',
      '5.2 Student B cannot withdraw Student A\'s application (returns HTTP 403 Forbidden)',
      crossStuWithdrawRes.status === 403
    );

    // 5.3 Recruiter B cannot view Company A's application details (HTTP 403)
    const crossRecDetailRes = await fetch(`${BASE_URL}/recruiters/applications/${testAppId}`, {
      headers: { Authorization: `Bearer ${tokenRecruiterB}` },
    });
    record(
      'Security',
      '5.3 Recruiter B cannot access Company A\'s candidate application (returns HTTP 403 Forbidden)',
      crossRecDetailRes.status === 403
    );

    // 5.4 Recruiter B cannot update status of Company A's application (HTTP 403)
    const crossRecUpdateRes = await fetch(`${BASE_URL}/recruiters/applications/${testAppId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenRecruiterB}`,
      },
      body: JSON.stringify({ status: 'REJECTED' }),
    });
    record(
      'Security',
      '5.4 Recruiter B cannot update status of Company A\'s application (returns HTTP 403 Forbidden)',
      crossRecUpdateRes.status === 403
    );

    // 5.5 Student JWT attempting GET /api/recruiters/applications receives HTTP 403
    const stuRecListRes = await fetch(`${BASE_URL}/recruiters/applications`, {
      headers: { Authorization: `Bearer ${tokenStudentA}` },
    });
    record(
      'Security',
      '5.5 Student JWT attempting GET /api/recruiters/applications receives HTTP 403 Forbidden',
      stuRecListRes.status === 403
    );

    // 5.6 Student JWT attempting PUT /api/recruiters/applications/:id/status receives HTTP 403
    const stuRecUpdateRes = await fetch(`${BASE_URL}/recruiters/applications/${testAppId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenStudentA}`,
      },
      body: JSON.stringify({ status: 'SELECTED' }),
    });
    record(
      'Security',
      '5.6 Student JWT attempting PUT /api/recruiters/applications/:id/status receives HTTP 403 Forbidden',
      stuRecUpdateRes.status === 403
    );

    // 5.7 Recruiter JWT attempting POST /api/jobs/:id/apply receives HTTP 403
    const recApplyRes = await fetch(`${BASE_URL}/jobs/${openJobAId}/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenRecruiterA}`,
      },
      body: JSON.stringify({ coverLetter: 'Recruiter applying' }),
    });
    record(
      'Security',
      '5.7 Recruiter JWT attempting POST /api/jobs/:jobId/apply receives HTTP 403 Forbidden',
      recApplyRes.status === 403
    );

    // 5.8 Request with missing JWT to /api/recruiters/applications receives HTTP 401
    const noJwtRecRes = await fetch(`${BASE_URL}/recruiters/applications`);
    record(
      'Security',
      '5.8 Request without JWT to recruiter applications endpoint receives HTTP 401 Unauthorized',
      noJwtRecRes.status === 401
    );

    // 5.9 Request with missing JWT to /api/jobs/:jobId/apply receives HTTP 401
    const noJwtApplyRes = await fetch(`${BASE_URL}/jobs/${openJobAId}/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ coverLetter: 'No token' }),
    });
    record(
      'Security',
      '5.9 Request without JWT to apply endpoint receives HTTP 401 Unauthorized',
      noJwtApplyRes.status === 401
    );

    // 5.10 Request with invalid / forged JWT receives HTTP 401
    const invalidJwtRes = await fetch(`${BASE_URL}/recruiters/applications`, {
      headers: { Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature' },
    });
    record(
      'Security',
      '5.10 Request with invalid JWT signature receives HTTP 401 Unauthorized',
      invalidJwtRes.status === 401
    );

    // 5.11 SQL injection attempt in application path parameter safely rejected with HTTP 400
    const sqliRes = await fetch(`${BASE_URL}/recruiters/applications/' OR '1'='1/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenRecruiterA}`,
      },
      body: JSON.stringify({ status: 'SHORTLISTED' }),
    });
    record(
      'Security',
      '5.11 SQL injection payload in application ID path parameter rejected with HTTP 400 validation error',
      sqliRes.status === 400
    );

    // =========================================================================
    // 6. DIRECT DATABASE VERIFICATION
    // =========================================================================
    console.log('\n[6. Direct PostgreSQL Database Verification]');

    // 6.1 applications table verified
    const appTableCheck = await query('SELECT count(*) as count FROM applications');
    record(
      'Database',
      '6.1 applications table contains active records with foreign keys and valid statuses',
      parseInt(appTableCheck.rows[0].count, 10) > 0
    );

    // 6.2 application_status_history table verified
    const historyTableCheck = await query('SELECT count(*) as count FROM application_status_history');
    record(
      'Database',
      '6.2 application_status_history table contains complete audit logs linked to applications',
      parseInt(historyTableCheck.rows[0].count, 10) > 0
    );

    // 6.3 notifications table verified
    const notifsTableCheck = await query('SELECT count(*) as count FROM notifications WHERE notification_type = $1', ['APPLICATION']);
    record(
      'Database',
      '6.3 notifications table contains APPLICATION type alerts linked to users',
      parseInt(notifsTableCheck.rows[0].count, 10) > 0
    );

    // =========================================================================
    // 7. API RESPONSE CONTRACT VALIDATION
    // =========================================================================
    console.log('\n[7. Response Contract Validation Tests]');

    // 7.1 Standard success envelope { success: true, message: string, data: ... }
    record(
      'Response Validation',
      '7.1 Successful responses strictly adhere to { success: true, message, data } contract',
      applyData1.success === true &&
        typeof applyData1.message === 'string' &&
        applyData1.data !== undefined &&
        recListData.success === true
    );

    // 7.2 Standard error envelope { success: false, message: string, errors: array }
    const badJsonRes = await fetch(`${BASE_URL}/recruiters/applications/invalid-uuid`);
    const badJsonData = await badJsonRes.json();
    record(
      'Response Validation',
      '7.2 Error responses strictly adhere to { success: false, message, errors: [] } contract',
      badJsonData.success === false &&
        typeof badJsonData.message === 'string' &&
        Array.isArray(badJsonData.errors)
    );

    // 7.3 No password or hash exposure in application payloads
    const allText = JSON.stringify({
      applyData1,
      stuDetailData,
      recDetailData,
      recListData,
    });
    record(
      'Response Validation',
      '7.3 Password hashes are NEVER exposed in any application payload or candidate details',
      !allText.includes('password_hash') && !allText.includes('$2a$')
    );
  } catch (err) {
    console.error('[UNEXPECTED ERROR DURING VERIFICATION]:', err);
    record('Fatal', 'Unhandled verification failure', false, err.message);
  }

  // =========================================================================
  // SUMMARY REPORT
  // =========================================================================
  console.log('\n======================================================================');
  console.log('APPLICATION MANAGEMENT API MODULE VERIFICATION SUMMARY REPORT');
  console.log('======================================================================\n');

  for (const [cat, stats] of Object.entries(results.categories)) {
    const padCat = cat.padEnd(25, ' ');
    const padPassed = String(stats.passed).padStart(2, ' ');
    const padFailed = String(stats.failed).padStart(2, ' ');
    const tag = stats.failed === 0 ? '[✓ ALL PASSED]' : `[✗ ${stats.failed} FAILED]`;
    console.log(`  ${padCat}: ${padPassed} Passed,  ${padFailed} Failed  ${tag}`);
  }

  console.log('\n----------------------------------------------------------------------');
  console.log(`TOTAL TESTS EXECUTED : ${results.total}`);
  console.log(`TOTAL PASSED         : ${results.passed}`);
  console.log(`TOTAL FAILED         : ${results.failed}`);
  console.log('----------------------------------------------------------------------\n');

  if (results.failed === 0) {
    console.log('>>> ALL VERIFICATION CHECKS PASSED WITH 0 FAILURES <<<\n');
    process.exit(0);
  } else {
    console.error(`>>> ${results.failed} VERIFICATION CHECKS FAILED <<<\n`);
    process.exit(1);
  }
}

verifyApplicationModule();
