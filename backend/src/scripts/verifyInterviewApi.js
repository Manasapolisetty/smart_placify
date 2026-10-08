import { query, pool } from '../config/database.js';

const BASE_URL = process.env.BACKEND_URL || 'http://localhost:5000/api';

// Results Tracker
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  fixed: 0,
  remaining: 0,
  sections: {},
};

function record(sectionNum, sectionTitle, testName, passed, detail = '') {
  results.total++;
  const key = `${sectionNum}. ${sectionTitle}`;
  if (!results.sections[key]) {
    results.sections[key] = { total: 0, passed: 0, failed: 0 };
  }
  results.sections[key].total++;

  if (passed) {
    results.passed++;
    results.sections[key].passed++;
    console.log(`  ✓ [PASS] [${sectionNum}] ${testName}`);
  } else {
    results.failed++;
    results.sections[key].failed++;
    console.error(`  ✗ [FAIL] [${sectionNum}] ${testName} ${detail ? `-> ${detail}` : ''}`);
  }
}

async function runCompleteInterviewVerification() {
  console.log('======================================================================');
  console.log('SMARTPLACIFY — INTERVIEW API COMPLETE VERIFICATION & TESTING');
  console.log(`Backend Base URL: ${BASE_URL}`);
  console.log('Database Engine : PostgreSQL 16 (smartplacify_db)');
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

  // Tokens & Identifiers
  let tokenStudentA;
  let tokenStudentB;
  let tokenRecruiterA;
  let tokenRecruiterB;
  let tokenAdmin;

  let studentAId;
  let studentBId;
  let studentAUserId;
  let studentBUserId;
  let companyAId;
  let companyBId;
  let validAppAId;
  let withdrawnAppAId;
  let rejectedAppAId;
  let foreignAppBId;

  let createdInterviewId;

  try {
    // -------------------------------------------------------------------------
    // 0. FIXTURES SETUP & AUTHENTICATION
    // -------------------------------------------------------------------------
    console.log('[Setup & Authentication]');

    // Authenticate Recruiter A (TechCorp Solutions)
    const loginRecA = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'priya.sharma@techcorp.com', password: 'password123' }),
    });
    const dataRecA = await loginRecA.json();
    tokenRecruiterA = dataRecA.data?.token || dataRecA.token;

    const recADb = await query(
      `SELECT r.id, r.company_id, r.user_id FROM recruiters r JOIN users u ON r.user_id = u.id WHERE u.email = 'priya.sharma@techcorp.com'`
    );
    companyAId = recADb.rows[0].company_id;

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
      const userBId = uRes.rows[0].id;
      await query(
        `INSERT INTO recruiters (user_id, company_id, designation, recruiter_code)
         VALUES ($1, $2, 'Staff Technical Recruiter', 'REC-APEX-001') ON CONFLICT DO NOTHING`,
        [userBId, companyBId]
      );
    }

    const loginRecB = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'rohan.verma@apex.example.com', password: 'password123' }),
    });
    const dataRecB = await loginRecB.json();
    tokenRecruiterB = dataRecB.data?.token || dataRecB.token;

    // Authenticate Student A (Rahul Kumar)
    const loginStuA = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'rahul.kumar@university.edu.in', password: 'password123' }),
    });
    const dataStuA = await loginStuA.json();
    tokenStudentA = dataStuA.data?.token || dataStuA.token;

    const stuADb = await query(
      `SELECT s.id, s.user_id FROM students s JOIN users u ON s.user_id = u.id WHERE u.email = 'rahul.kumar@university.edu.in'`
    );
    studentAId = stuADb.rows[0].id;
    studentAUserId = stuADb.rows[0].user_id;

    // Setup Secondary Student B (Priya Patel)
    let userStuB = await query("SELECT id FROM users WHERE email = 'priya.patel@university.edu.in'");
    if (userStuB.rows.length === 0) {
      const uRes = await query(
        `INSERT INTO users (name, email, password_hash, role, status)
         VALUES ('Priya Patel', 'priya.patel@university.edu.in', '$2a$10$FmYlh8s/XNKNlcssq.5N4.JA3Pb4u4z5Rst7GlR./PjkstjunbSP2', 'STUDENT', 'ACTIVE')
         RETURNING id`
      );
      studentBUserId = uRes.rows[0].id;
      const sRes = await query(
        `INSERT INTO students (user_id, roll_number, cgpa, graduation_year)
         VALUES ($1, '2022CS088', 8.50, 2026)
         RETURNING id`,
        [studentBUserId]
      );
      studentBId = sRes.rows[0].id;
    } else {
      studentBUserId = userStuB.rows[0].id;
      const sRes = await query('SELECT id FROM students WHERE user_id = $1', [studentBUserId]);
      studentBId = sRes.rows[0].id;
    }

    const loginStuB = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'priya.patel@university.edu.in', password: 'password123' }),
    });
    const dataStuB = await loginStuB.json();
    tokenStudentB = dataStuB.data?.token || dataStuB.token;

    // Authenticate Admin
    const loginAdmin = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@smartplacify.edu.in', password: 'password123' }),
    });
    const dataAdmin = await loginAdmin.json();
    tokenAdmin = dataAdmin.data?.token || dataAdmin.token;

    // Ensure valid test job and applications exist for Company A & Student A
    const jobAQuery = await query(
      `SELECT id FROM jobs WHERE company_id = $1 AND status = 'OPEN' LIMIT 1`,
      [companyAId]
    );
    let jobAId = jobAQuery.rows[0]?.id;
    if (!jobAId) {
      const newJob = await query(
        `INSERT INTO jobs (company_id, job_title, job_description, job_type, location, work_mode, status)
         VALUES ($1, 'Software Engineer - Test', 'Job for test', 'FULL_TIME', 'Bangalore', 'HYBRID', 'OPEN')
         RETURNING id`,
        [companyAId]
      );
      jobAId = newJob.rows[0].id;
    }

    let appRes = await query(
      `SELECT id, status FROM applications WHERE job_id = $1 AND student_id = $2`,
      [jobAId, studentAId]
    );
    if (appRes.rows.length === 0) {
      const insApp = await query(
        `INSERT INTO applications (job_id, student_id, status) VALUES ($1, $2, 'SHORTLISTED') RETURNING id`,
        [jobAId, studentAId]
      );
      validAppAId = insApp.rows[0].id;
    } else {
      validAppAId = appRes.rows[0].id;
      await query(`UPDATE applications SET status = 'SHORTLISTED' WHERE id = $1`, [validAppAId]);
    }

    // Withdrawn application fixture
    const withdrawnJobRes = await query(
      `INSERT INTO jobs (company_id, job_title, job_description, job_type, location, status)
       VALUES ($1, 'Withdrawn Test Job', 'Desc', 'FULL_TIME', 'Remote', 'OPEN') RETURNING id`,
      [companyAId]
    );
    const withAppRes = await query(
      `INSERT INTO applications (job_id, student_id, status) VALUES ($1, $2, 'WITHDRAWN') RETURNING id`,
      [withdrawnJobRes.rows[0].id, studentAId]
    );
    withdrawnAppAId = withAppRes.rows[0].id;

    // Rejected application fixture
    const rejJobRes = await query(
      `INSERT INTO jobs (company_id, job_title, job_description, job_type, location, status)
       VALUES ($1, 'Rejected Test Job', 'Desc', 'FULL_TIME', 'Remote', 'OPEN') RETURNING id`,
      [companyAId]
    );
    const rejAppRes = await query(
      `INSERT INTO applications (job_id, student_id, status) VALUES ($1, $2, 'REJECTED') RETURNING id`,
      [rejJobRes.rows[0].id, studentAId]
    );
    rejectedAppAId = rejAppRes.rows[0].id;

    // Foreign company application fixture (Company B)
    const jobBQuery = await query(`SELECT id FROM jobs WHERE company_id = $1 LIMIT 1`, [companyBId]);
    let jobBId = jobBQuery.rows[0]?.id;
    if (!jobBId) {
      const newJobB = await query(
        `INSERT INTO jobs (company_id, job_title, job_description, job_type, location, status)
         VALUES ($1, 'InnovateSoft Analyst', 'Desc', 'FULL_TIME', 'Pune', 'OPEN') RETURNING id`,
        [companyBId]
      );
      jobBId = newJobB.rows[0].id;
    }
    const foreignAppRes = await query(
      `INSERT INTO applications (job_id, student_id, status) VALUES ($1, $2, 'SHORTLISTED')
       ON CONFLICT (job_id, student_id) DO UPDATE SET status = 'SHORTLISTED' RETURNING id`,
      [jobBId, studentBId]
    );
    foreignAppBId = foreignAppRes.rows[0].id;

    console.log(`  ✓ Auth ready: Recruiter A & B, Student A & B, Admin\n`);

    // =========================================================================
    // 1. RECRUITER CREATES INTERVIEW
    // =========================================================================
    console.log('[1. Recruiter creates interview]');
    const schedulePayload = {
      applicationId: validAppAId,
      interviewType: 'TECHNICAL',
      interviewDate: '2026-10-20',
      startTime: '10:00:00',
      endTime: '11:00:00',
      mode: 'Virtual / Google Meet',
      location: 'Virtual / Google Meet',
      meetingLink: 'https://meet.google.com/smartplacify-tech-round',
      status: 'SCHEDULED',
      feedback: 'Round 1 technical screening interview',
    };

    const schedRes = await fetch(`${BASE_URL}/recruiters/interviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenRecruiterA}`,
      },
      body: JSON.stringify(schedulePayload),
    });
    const schedData = await schedRes.json();

    record(1, 'Recruiter creates interview', 'POST /api/recruiters/interviews returns HTTP 201 Created', schedRes.status === 201 && schedData.success === true);
    createdInterviewId = schedData.data?.id;

    const interviewData = schedData.data || {};
    record(1, 'Recruiter creates interview', 'Response contains application information', Boolean(interviewData.applicationId || interviewData.application?.id));
    record(1, 'Recruiter creates interview', 'Response contains candidate details (name, email, rollNumber)', Boolean(interviewData.candidate && interviewData.candidate.name));
    record(1, 'Recruiter creates interview', 'Response contains recruiter / interviewer details', Boolean(interviewData.interviewer || interviewData.recruiter));
    record(1, 'Recruiter creates interview', 'Response contains interview date', interviewData.interviewDate === '2026-10-20' || interviewData.date === '2026-10-20');
    record(1, 'Recruiter creates interview', 'Response contains interview time (startTime & endTime)', Boolean(interviewData.startTime && interviewData.endTime));
    record(1, 'Recruiter creates interview', 'Response contains mode / location', Boolean(interviewData.mode || interviewData.location));
    record(1, 'Recruiter creates interview', 'Response contains meeting link', interviewData.meetingLink === 'https://meet.google.com/smartplacify-tech-round');
    record(1, 'Recruiter creates interview', 'Response contains status = SCHEDULED', interviewData.status === 'SCHEDULED');
    record(1, 'Recruiter creates interview', 'Response contains initial feedback / result', Boolean(interviewData.feedback || interviewData.result));

    // =========================================================================
    // 2. VERIFY POSTGRESQL
    // =========================================================================
    console.log('\n[2. Verify PostgreSQL]');
    const dbInterview = await query(`SELECT * FROM interviews WHERE id = $1`, [createdInterviewId]);
    record(2, 'Verify PostgreSQL', 'Row exists in PostgreSQL interviews table', dbInterview.rows.length === 1);
    const dbRow = dbInterview.rows[0] || {};
    record(2, 'Verify PostgreSQL', 'application_id matches valid application in database', dbRow.application_id === validAppAId);
    record(2, 'Verify PostgreSQL', 'status = SCHEDULED in PostgreSQL', dbRow.status === 'SCHEDULED');
    record(2, 'Verify PostgreSQL', 'meeting_link persisted correctly in PostgreSQL', dbRow.meeting_link === 'https://meet.google.com/smartplacify-tech-round');
    record(2, 'Verify PostgreSQL', 'interview_type = TECHNICAL in PostgreSQL', dbRow.interview_type === 'TECHNICAL');

    // =========================================================================
    // 3. STUDENT VIEWS INTERVIEW
    // =========================================================================
    console.log('\n[3. Student views interview]');
    const stuListRes = await fetch(`${BASE_URL}/students/interviews`, {
      headers: { Authorization: `Bearer ${tokenStudentA}` },
    });
    const stuListData = await stuListRes.json();
    record(3, 'Student views interview', 'GET /api/students/interviews returns HTTP 200 OK', stuListRes.status === 200 && Array.isArray(stuListData.data));
    record(3, 'Student views interview', 'Candidate sees created interview in listing', stuListData.data?.some((i) => i.id === createdInterviewId));

    const stuDetailRes = await fetch(`${BASE_URL}/students/interviews/${createdInterviewId}`, {
      headers: { Authorization: `Bearer ${tokenStudentA}` },
    });
    const stuDetailData = await stuDetailRes.json();
    record(3, 'Student views interview', 'GET /api/students/interviews/:id returns HTTP 200 OK', stuDetailRes.status === 200 && stuDetailData.data?.id === createdInterviewId);
    record(3, 'Student views interview', 'Details payload contains company, job, meeting link, and time', Boolean(stuDetailData.data?.company && stuDetailData.data?.job && stuDetailData.data?.meetingLink));

    // =========================================================================
    // 4. STUDENT VIEWS ONLY OWN INTERVIEW
    // =========================================================================
    console.log('\n[4. Student views only own interview]');
    const stuBListRes = await fetch(`${BASE_URL}/students/interviews`, {
      headers: { Authorization: `Bearer ${tokenStudentB}` },
    });
    const stuBListData = await stuBListRes.json();
    record(4, 'Student views only own interview', "Student B does NOT see Student A's interview in listing", stuBListRes.status === 200 && !stuBListData.data?.some((i) => i.id === createdInterviewId));

    const stuBCrossDetail = await fetch(`${BASE_URL}/students/interviews/${createdInterviewId}`, {
      headers: { Authorization: `Bearer ${tokenStudentB}` },
    });
    record(4, 'Student views only own interview', "Student B attempting to view Student A's interview returns HTTP 403 Forbidden", stuBCrossDetail.status === 403);

    // =========================================================================
    // 5. RECRUITER VIEWS COMPANY INTERVIEWS
    // =========================================================================
    console.log('\n[5. Recruiter views company interviews]');
    const recListRes = await fetch(`${BASE_URL}/recruiters/interviews`, {
      headers: { Authorization: `Bearer ${tokenRecruiterA}` },
    });
    const recListData = await recListRes.json();
    record(5, 'Recruiter views company interviews', 'GET /api/recruiters/interviews returns HTTP 200 OK with company interviews', recListRes.status === 200 && Array.isArray(recListData.data));
    record(5, 'Recruiter views company interviews', 'Listing contains scheduled interview', recListData.data?.some((i) => i.id === createdInterviewId));

    const recDetailRes = await fetch(`${BASE_URL}/recruiters/interviews/${createdInterviewId}`, {
      headers: { Authorization: `Bearer ${tokenRecruiterA}` },
    });
    const recDetailData = await recDetailRes.json();
    record(5, 'Recruiter views company interviews', 'GET /api/recruiters/interviews/:id returns HTTP 200 OK', recDetailRes.status === 200 && recDetailData.data?.id === createdInterviewId);

    const filterStatusRes = await fetch(`${BASE_URL}/recruiters/interviews?status=SCHEDULED`, {
      headers: { Authorization: `Bearer ${tokenRecruiterA}` },
    });
    const filterStatusData = await filterStatusRes.json();
    record(5, 'Recruiter views company interviews', 'Filtering by status (?status=SCHEDULED) returns matching interviews', filterStatusRes.status === 200 && filterStatusData.data?.every((i) => i.status === 'SCHEDULED'));

    // =========================================================================
    // 6. RECRUITER UPDATES INTERVIEW
    // =========================================================================
    console.log('\n[6. Recruiter updates interview]');
    const updatePayload = {
      interviewDate: '2026-10-21',
      startTime: '14:30:00',
      endTime: '15:30:00',
      status: 'RESCHEDULED',
      meetingLink: 'https://meet.google.com/smartplacify-rescheduled',
      mode: 'Virtual / Teams',
      feedback: 'Rescheduled to afternoon slot',
    };

    const updateRes = await fetch(`${BASE_URL}/recruiters/interviews/${createdInterviewId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenRecruiterA}`,
      },
      body: JSON.stringify(updatePayload),
    });
    const updateData = await updateRes.json();

    record(6, 'Recruiter updates interview', 'PUT /api/recruiters/interviews/:id returns HTTP 200 OK', updateRes.status === 200 && updateData.success === true);
    record(6, 'Recruiter updates interview', 'Status updated to RESCHEDULED in response', updateData.data?.status === 'RESCHEDULED');
    record(6, 'Recruiter updates interview', 'Updated date (2026-10-21) and time (14:30:00) reflected', (updateData.data?.interviewDate === '2026-10-21' || updateData.data?.date === '2026-10-21') && updateData.data?.startTime === '14:30:00');
    record(6, 'Recruiter updates interview', 'Updated meeting link reflected', updateData.data?.meetingLink === 'https://meet.google.com/smartplacify-rescheduled');

    const dbUpdateCheck = await query(`SELECT status, meeting_link FROM interviews WHERE id = $1`, [createdInterviewId]);
    record(6, 'Recruiter updates interview', 'PostgreSQL database row reflects updated status and meeting link', dbUpdateCheck.rows[0]?.status === 'RESCHEDULED' && dbUpdateCheck.rows[0]?.meeting_link === 'https://meet.google.com/smartplacify-rescheduled');

    // =========================================================================
    // 7. RECRUITER DELETES/CANCELS INTERVIEW
    // =========================================================================
    console.log('\n[7. Recruiter deletes/cancels interview]');
    const delRes = await fetch(`${BASE_URL}/recruiters/interviews/${createdInterviewId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenRecruiterA}` },
    });
    const delData = await delRes.json();

    record(7, 'Recruiter deletes/cancels interview', 'DELETE /api/recruiters/interviews/:id returns HTTP 200 OK', delRes.status === 200 && delData.success === true);

    const dbDelCheck = await query(`SELECT * FROM interviews WHERE id = $1`, [createdInterviewId]);
    record(7, 'Recruiter deletes/cancels interview', 'Interview record completely deleted from PostgreSQL interviews table', dbDelCheck.rows.length === 0);

    const delAgain = await fetch(`${BASE_URL}/recruiters/interviews/${createdInterviewId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenRecruiterA}` },
    });
    record(7, 'Recruiter deletes/cancels interview', 'Deleting non-existent / already deleted interview returns HTTP 404', delAgain.status === 404);

    // =========================================================================
    // 8. INVALID APPLICATION -> REJECTED
    // =========================================================================
    console.log('\n[8. Invalid application -> rejected]');
    const badAppIdRes = await fetch(`${BASE_URL}/recruiters/interviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenRecruiterA}`,
      },
      body: JSON.stringify({
        applicationId: '00000000-0000-0000-0000-000000000000',
        interviewDate: '2026-10-25',
      }),
    });
    record(8, 'Invalid application -> rejected', 'Non-existent applicationId is rejected with HTTP 404 Not Found', badAppIdRes.status === 404);

    const withAppResTest = await fetch(`${BASE_URL}/recruiters/interviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenRecruiterA}`,
      },
      body: JSON.stringify({
        applicationId: withdrawnAppAId,
        interviewDate: '2026-10-25',
      }),
    });
    record(8, 'Invalid application -> rejected', 'Scheduling for WITHDRAWN application rejected with HTTP 400 Bad Request', withAppResTest.status === 400);

    const rejAppResTest = await fetch(`${BASE_URL}/recruiters/interviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenRecruiterA}`,
      },
      body: JSON.stringify({
        applicationId: rejectedAppAId,
        interviewDate: '2026-10-25',
      }),
    });
    record(8, 'Invalid application -> rejected', 'Scheduling for REJECTED application rejected with HTTP 400 Bad Request', rejAppResTest.status === 400);

    // =========================================================================
    // 9. UNAUTHORIZED RECRUITER -> REJECTED
    // =========================================================================
    console.log('\n[9. Unauthorized recruiter -> rejected]');
    // Recruiter B scheduling for Company A application
    const crossSched = await fetch(`${BASE_URL}/recruiters/interviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenRecruiterB}`,
      },
      body: JSON.stringify({
        applicationId: validAppAId,
        interviewDate: '2026-10-28',
      }),
    });
    record(9, 'Unauthorized recruiter -> rejected', "Recruiter B denied scheduling for Company A application (HTTP 403 Forbidden)", crossSched.status === 403);

    // Schedule an interview for Company A again to test cross-tenant read/update/delete
    const newInterviewRes = await fetch(`${BASE_URL}/recruiters/interviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenRecruiterA}`,
      },
      body: JSON.stringify({
        applicationId: validAppAId,
        interviewDate: '2026-10-28',
      }),
    });
    const newInterviewData = await newInterviewRes.json();
    const tempInterviewId = newInterviewData.data?.id;

    // Recruiter B viewing Company A interview
    const crossView = await fetch(`${BASE_URL}/recruiters/interviews/${tempInterviewId}`, {
      headers: { Authorization: `Bearer ${tokenRecruiterB}` },
    });
    record(9, 'Unauthorized recruiter -> rejected', "Recruiter B denied viewing Company A interview (HTTP 403 Forbidden)", crossView.status === 403);

    // Recruiter B updating Company A interview
    const crossUpdate = await fetch(`${BASE_URL}/recruiters/interviews/${tempInterviewId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenRecruiterB}`,
      },
      body: JSON.stringify({ status: 'COMPLETED' }),
    });
    record(9, 'Unauthorized recruiter -> rejected', "Recruiter B denied updating Company A interview (HTTP 403 Forbidden)", crossUpdate.status === 403);

    // Recruiter B deleting Company A interview
    const crossDel = await fetch(`${BASE_URL}/recruiters/interviews/${tempInterviewId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenRecruiterB}` },
    });
    record(9, 'Unauthorized recruiter -> rejected', "Recruiter B denied deleting Company A interview (HTTP 403 Forbidden)", crossDel.status === 403);

    // Clean up temporary interview
    await query(`DELETE FROM interviews WHERE id = $1`, [tempInterviewId]);

    // =========================================================================
    // 10. STUDENT ATTEMPTING RECRUITER OPERATIONS -> 403
    // =========================================================================
    console.log('\n[10. Student attempting recruiter operations -> 403]');
    const stuPostRec = await fetch(`${BASE_URL}/recruiters/interviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenStudentA}`,
      },
      body: JSON.stringify({ applicationId: validAppAId, interviewDate: '2026-10-28' }),
    });
    record(10, 'Student attempting recruiter operations -> 403', 'Student attempting POST /api/recruiters/interviews receives HTTP 403 Forbidden', stuPostRec.status === 403);

    const stuGetRec = await fetch(`${BASE_URL}/recruiters/interviews`, {
      headers: { Authorization: `Bearer ${tokenStudentA}` },
    });
    record(10, 'Student attempting recruiter operations -> 403', 'Student attempting GET /api/recruiters/interviews receives HTTP 403 Forbidden', stuGetRec.status === 403);

    const stuPutRec = await fetch(`${BASE_URL}/recruiters/interviews/00000000-0000-0000-0000-000000000000`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenStudentA}`,
      },
      body: JSON.stringify({ status: 'COMPLETED' }),
    });
    record(10, 'Student attempting recruiter operations -> 403', 'Student attempting PUT /api/recruiters/interviews/:id receives HTTP 403 Forbidden', stuPutRec.status === 403);

    const stuDelRec = await fetch(`${BASE_URL}/recruiters/interviews/00000000-0000-0000-0000-000000000000`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenStudentA}` },
    });
    record(10, 'Student attempting recruiter operations -> 403', 'Student attempting DELETE /api/recruiters/interviews/:id receives HTTP 403 Forbidden', stuDelRec.status === 403);

    // =========================================================================
    // 11. MISSING JWT -> 401
    // =========================================================================
    console.log('\n[11. Missing JWT -> 401]');
    const noJwtRec = await fetch(`${BASE_URL}/recruiters/interviews`);
    record(11, 'Missing JWT -> 401', 'Recruiter route without JWT receives HTTP 401 Unauthorized', noJwtRec.status === 401);

    const noJwtStu = await fetch(`${BASE_URL}/students/interviews`);
    record(11, 'Missing JWT -> 401', 'Student route without JWT receives HTTP 401 Unauthorized', noJwtStu.status === 401);

    const badJwt = await fetch(`${BASE_URL}/recruiters/interviews`, {
      headers: { Authorization: 'Bearer invalid.token.payload' },
    });
    record(11, 'Missing JWT -> 401', 'Invalid JWT token receives HTTP 401 Unauthorized', badJwt.status === 401);

    // =========================================================================
    // 12. VERIFY INTERVIEW NOTIFICATIONS
    // =========================================================================
    console.log('\n[12. Verify interview notifications]');
    const schedNotif = await query(
      `SELECT * FROM notifications WHERE user_id = $1 AND title = 'Interview Scheduled' ORDER BY created_at DESC LIMIT 1`,
      [studentAUserId]
    );
    record(12, 'Verify interview notifications', 'Candidate received "Interview Scheduled" notification in PostgreSQL', schedNotif.rows.length === 1 && schedNotif.rows[0].notification_type === 'INTERVIEW');
    const msg = schedNotif.rows[0]?.message || '';
    record(12, 'Verify interview notifications', 'Scheduled notification contains company, job, and date details', msg.includes('TechCorp') && (msg.includes('2026-10-20') || msg.includes('2026-10-28')));

    const updateNotif = await query(
      `SELECT * FROM notifications WHERE user_id = $1 AND title = 'Interview Update' ORDER BY created_at DESC LIMIT 1`,
      [studentAUserId]
    );
    record(12, 'Verify interview notifications', 'Candidate received "Interview Update" notification in PostgreSQL', updateNotif.rows.length === 1 && updateNotif.rows[0].message.includes('RESCHEDULED'));

    const cancelNotif = await query(
      `SELECT * FROM notifications WHERE user_id = $1 AND title = 'Interview Cancelled' ORDER BY created_at DESC LIMIT 1`,
      [studentAUserId]
    );
    record(12, 'Verify interview notifications', 'Candidate received "Interview Cancelled" notification in PostgreSQL', cancelNotif.rows.length === 1 && cancelNotif.rows[0].title === 'Interview Cancelled');

    // =========================================================================
    // 13. CHECK DATABASE CONSISTENCY
    // =========================================================================
    console.log('\n[13. Check database consistency]');
    // Check no orphaned interviews exist
    const orphanedInterviews = await query(`
      SELECT count(*) FROM interviews i
      LEFT JOIN applications a ON i.application_id = a.id
      WHERE a.id IS NULL
    `);
    record(13, 'Check database consistency', 'Zero orphaned interviews (foreign keys fully intact)', parseInt(orphanedInterviews.rows[0].count, 10) === 0);

    // Check all notifications link to valid users
    const orphanedNotifs = await query(`
      SELECT count(*) FROM notifications n
      LEFT JOIN users u ON n.user_id = u.id
      WHERE u.id IS NULL
    `);
    record(13, 'Check database consistency', 'Zero orphaned notifications (user foreign keys intact)', parseInt(orphanedNotifs.rows[0].count, 10) === 0);

    // Check valid interview status constraints
    const invalidStatuses = await query(`
      SELECT count(*) FROM interviews
      WHERE status NOT IN ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED')
    `);
    record(13, 'Check database consistency', 'All interview records adhere to allowed status enum constraints', parseInt(invalidStatuses.rows[0].count, 10) === 0);

  } catch (error) {
    console.error('Fatal execution error:', error);
    results.failed++;
  } finally {
    await pool.end();
  }

  // ===========================================================================
  // REPORTING SUMMARY
  // ===========================================================================
  console.log('\n======================================================================');
  console.log('SMARTPLACIFY INTERVIEW API VERIFICATION SUMMARY REPORT');
  console.log('======================================================================');
  console.log(`Total     : ${results.total}`);
  console.log(`Passed    : ${results.passed}`);
  console.log(`Failed    : ${results.failed}`);
  console.log(`Fixed     : ${results.fixed}`);
  console.log(`Remaining : ${results.remaining}`);
  console.log(`Success   : ${((results.passed / results.total) * 100).toFixed(1)}%`);
  console.log('----------------------------------------------------------------------');

  for (const [sec, data] of Object.entries(results.sections)) {
    const rate = ((data.passed / data.total) * 100).toFixed(0);
    console.log(`- ${sec.padEnd(46)}: ${data.passed}/${data.total} passed (${rate}%)`);
  }
  console.log('======================================================================\n');

  if (results.failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runCompleteInterviewVerification();
