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

async function verifyPlacementModule() {
  console.log('======================================================================');
  console.log('SMARTPLACIFY — PLACEMENT API COMPLETE VERIFICATION SUITE');
  console.log(`Target Backend: ${BASE_URL}`);
  console.log('Database Engine: PostgreSQL 16 (smartplacify_db)');
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
  let tokenOfficer;
  let tokenAdmin;
  let tokenStudentA;
  let tokenStudentB;
  let tokenRecruiterA;
  let tokenRecruiterB;

  let studentAId;
  let studentBId;
  let companyAId;
  let companyBId;
  let sampleJobAId;
  let sampleJobBId;
  let validAppId;
  let rejectedAppId;

  let createdPlacementId;

  try {
    // -------------------------------------------------------------------------
    // 0. SETUP & AUTHENTICATION
    // -------------------------------------------------------------------------
    console.log('[0. Setup & Authentication]');

    // 0.1 Authenticate Placement Officer
    const officerLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'officer.demo@smartplacify.edu', password: 'password123' }),
    });
    const officerLoginData = await officerLoginRes.json();
    tokenOfficer = officerLoginData.data?.token || officerLoginData.token;

    // 0.2 Authenticate Admin
    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@smartplacify.edu.in', password: 'password123' }),
    });
    const adminLoginData = await adminLoginRes.json();
    tokenAdmin = adminLoginData.data?.token || adminLoginData.token;

    // 0.3 Authenticate Student A (Rahul Kumar)
    const stuALoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'rahul.kumar@university.edu.in', password: 'password123' }),
    });
    const stuALoginData = await stuALoginRes.json();
    tokenStudentA = stuALoginData.data?.token || stuALoginData.token;

    const stuADb = await query("SELECT s.id FROM students s JOIN users u ON s.user_id = u.id WHERE u.email = 'rahul.kumar@university.edu.in'");
    studentAId = stuADb.rows[0]?.id;

    // 0.4 Authenticate Student B (Priya Patel)
    const stuBLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'priya.patel@university.edu.in', password: 'password123' }),
    });
    const stuBLoginData = await stuBLoginRes.json();
    tokenStudentB = stuBLoginData.data?.token || stuBLoginData.token;

    const stuBDb = await query("SELECT s.id FROM students s JOIN users u ON s.user_id = u.id WHERE u.email = 'priya.patel@university.edu.in'");
    studentBId = stuBDb.rows[0]?.id;

    // 0.5 Authenticate Recruiter A (TechCorp)
    const recALoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'priya.sharma@techcorp.com', password: 'password123' }),
    });
    const recALoginData = await recALoginRes.json();
    tokenRecruiterA = recALoginData.data?.token || recALoginData.token;

    const recADb = await query("SELECT r.company_id FROM recruiters r JOIN users u ON r.user_id = u.id WHERE u.email = 'priya.sharma@techcorp.com'");
    companyAId = recADb.rows[0]?.company_id;

    // 0.6 Authenticate Recruiter B (Apex Systems / Rohan Verma)
    const recBLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'rohan.verma@apex.example.com', password: 'password123' }),
    });
    const recBLoginData = await recBLoginRes.json();
    tokenRecruiterB = recBLoginData.data?.token || recBLoginData.token;

    const recBDb = await query("SELECT r.company_id FROM recruiters r JOIN users u ON r.user_id = u.id WHERE u.email = 'rohan.verma@apex.example.com'");
    companyBId = recBDb.rows[0]?.company_id;

    // Sample jobs
    const jobADb = await query('SELECT id FROM jobs WHERE company_id = $1 LIMIT 1', [companyAId]);
    sampleJobAId = jobADb.rows[0]?.id;

    const jobBDb = await query('SELECT id FROM jobs WHERE company_id = $1 LIMIT 1', [companyBId]);
    sampleJobBId = jobBDb.rows[0]?.id;

    // Ensure a test application exists for Student A with Company A Job A
    let appCheck = await query(
      `SELECT id, status FROM applications WHERE student_id = $1 AND job_id = $2`,
      [studentAId, sampleJobAId]
    );

    if (appCheck.rows.length === 0) {
      const newApp = await query(
        `INSERT INTO applications (student_id, job_id, status, applied_at, cover_letter)
         VALUES ($1, $2, 'SHORTLISTED', CURRENT_TIMESTAMP, 'Test Application for Placement Verification')
         RETURNING id`,
        [studentAId, sampleJobAId]
      );
      validAppId = newApp.rows[0].id;
    } else {
      validAppId = appCheck.rows[0].id;
      // Set to SHORTLISTED if was rejected
      await query(`UPDATE applications SET status = 'SHORTLISTED' WHERE id = $1`, [validAppId]);
    }

    // Clean up any existing placement on this test application to avoid stale conflicts
    await query(`DELETE FROM placements WHERE application_id = $1 OR (student_id = $2 AND job_id = $3)`, [
      validAppId,
      studentAId,
      sampleJobAId,
    ]);

    // Create a dummy rejected application to test rejected application handling
    const rejAppRes = await query(
      `INSERT INTO applications (student_id, job_id, status, applied_at, cover_letter)
       VALUES ($1, $2, 'REJECTED', CURRENT_TIMESTAMP, 'Rejected Application Test')
       RETURNING id`,
      [studentBId, sampleJobAId]
    );
    rejectedAppId = rejAppRes.rows[0].id;

    console.log(`  ✓ Auth & Test fixtures ready (Student A: ${studentAId}, Company A: ${companyAId}, App: ${validAppId})\n`);

    // =========================================================================
    // 1. CREATE PLACEMENT
    // =========================================================================
    console.log('[1. Create Placement - POST /api/placements]');

    const createPlacementPayload = {
      studentId: studentAId,
      companyId: companyAId,
      jobId: sampleJobAId,
      applicationId: validAppId,
      package: '18.5 LPA',
      placementDate: '2026-10-15',
      joiningDate: '2027-07-01',
      status: 'OFFERED',
      offerDetails: 'Full-time Software Engineer offer including base salary, stock options, and relocation bonus.',
    };

    const createRes = await fetch(`${BASE_URL}/placements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenOfficer}`,
      },
      body: JSON.stringify(createPlacementPayload),
    });
    const createData = await createRes.json();

    record('1. Create Placement', 'POST /api/placements returns HTTP 201 Created', createRes.status === 201 && createData.success === true);
    createdPlacementId = createData.data?.id;

    record('1. Create Placement', 'Response contains created placement ID and expected package', Boolean(createdPlacementId && createData.data?.package === '18.5 LPA'));
    record('1. Create Placement', 'Response returns student and company details', Boolean(createData.data?.studentName && createData.data?.companyName));

    // Authorized recruiter creating placement for own company
    // Create another application for Student B
    let appB = await query(
      `SELECT id FROM applications WHERE student_id = $1 AND job_id = $2`,
      [studentBId, sampleJobBId]
    );
    let appBId;
    if (appB.rows.length === 0) {
      const insAppB = await query(
        `INSERT INTO applications (student_id, job_id, status, applied_at)
         VALUES ($1, $2, 'SHORTLISTED', CURRENT_TIMESTAMP) RETURNING id`,
        [studentBId, sampleJobBId]
      );
      appBId = insAppB.rows[0].id;
    } else {
      appBId = appB.rows[0].id;
      await query(`DELETE FROM placements WHERE application_id = $1`, [appBId]);
    }

    const recCreateRes = await fetch(`${BASE_URL}/placements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenRecruiterB}`,
      },
      body: JSON.stringify({
        studentId: studentBId,
        companyId: companyBId,
        jobId: sampleJobBId,
        applicationId: appBId,
        package: '14.0 LPA',
        status: 'OFFERED',
      }),
    });
    const recCreateData = await recCreateRes.json();
    record('1. Create Placement', 'Authorized recruiter can create placement for their own company (HTTP 201)', recCreateRes.status === 201 && recCreateData.success === true);

    // =========================================================================
    // 2. VERIFY POSTGRESQL
    // =========================================================================
    console.log('\n[2. Verify PostgreSQL Persistence]');

    const dbPlacementCheck = await query('SELECT * FROM placements WHERE id = $1', [createdPlacementId]);
    record('2. PostgreSQL Persistence', 'Placement record physically exists in placements table', dbPlacementCheck.rows.length === 1);

    const dbRow = dbPlacementCheck.rows[0];
    record('2. PostgreSQL Persistence', 'Foreign keys student_id, company_id, job_id, application_id accurately stored', 
      dbRow?.student_id === studentAId &&
      dbRow?.company_id === companyAId &&
      dbRow?.job_id === sampleJobAId &&
      dbRow?.application_id === validAppId
    );
    record('2. PostgreSQL Persistence', 'Package and status correctly stored in PostgreSQL', dbRow?.package === '18.5 LPA' && dbRow?.status === 'OFFERED');
    record('2. PostgreSQL Persistence', 'PostgreSQL auto-generated timestamps created_at and updated_at exist', Boolean(dbRow?.created_at && dbRow?.updated_at));

    // Verify application status transitioned to 'SELECTED'
    const appStatusDb = await query('SELECT status FROM applications WHERE id = $1', [validAppId]);
    record('2. PostgreSQL Persistence', "Associated application status automatically updated to 'SELECTED'", appStatusDb.rows[0]?.status === 'SELECTED');

    // Verify notification created for student
    const notifDb = await query(
      `SELECT * FROM notifications WHERE notification_type = 'OFFER' ORDER BY created_at DESC LIMIT 1`
    );
    record('2. PostgreSQL Persistence', 'Placement notification automatically inserted for student', notifDb.rows.length > 0 && notifDb.rows[0].title.includes('Offer'));

    // =========================================================================
    // 3. VIEW PLACEMENT
    // =========================================================================
    console.log('\n[3. View Placement - GET /api/placements]');

    // 3.1 View by ID
    const viewDetailRes = await fetch(`${BASE_URL}/placements/${createdPlacementId}`, {
      headers: { Authorization: `Bearer ${tokenOfficer}` },
    });
    const viewDetailData = await viewDetailRes.json();

    record('3. View Placement', 'GET /api/placements/:id returns HTTP 200 OK', viewDetailRes.status === 200 && viewDetailData.data?.id === createdPlacementId);
    record('3. View Placement', 'Placement details include companyName, jobTitle, package, and status', Boolean(
      viewDetailData.data?.companyName &&
      viewDetailData.data?.jobTitle &&
      viewDetailData.data?.package === '18.5 LPA' &&
      viewDetailData.data?.status === 'OFFERED'
    ));

    // 3.2 View listing
    const viewListRes = await fetch(`${BASE_URL}/placements`, {
      headers: { Authorization: `Bearer ${tokenOfficer}` },
    });
    const viewListData = await viewListRes.json();

    record('3. View Placement', 'GET /api/placements returns HTTP 200 with array of placements', viewListRes.status === 200 && Array.isArray(viewListData.data));
    record('3. View Placement', 'Placements list contains newly created placement record', viewListData.data?.some((p) => p.id === createdPlacementId));

    // 3.3 Filter by status
    const filterStatusRes = await fetch(`${BASE_URL}/placements?status=OFFERED`, {
      headers: { Authorization: `Bearer ${tokenOfficer}` },
    });
    const filterStatusData = await filterStatusRes.json();
    record('3. View Placement', 'Status filter (?status=OFFERED) returns matching placement records', filterStatusRes.status === 200 && filterStatusData.data?.every((p) => p.status === 'OFFERED'));

    // =========================================================================
    // 4. UPDATE PLACEMENT
    // =========================================================================
    console.log('\n[4. Update Placement - PUT /api/placements/:id]');

    const updatePayload = {
      package: '20.0 LPA',
      joiningDate: '2027-08-01',
      offerDetails: 'Revised offer package with increased annual performance bonus.',
    };

    const updateRes = await fetch(`${BASE_URL}/placements/${createdPlacementId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenOfficer}`,
      },
      body: JSON.stringify(updatePayload),
    });
    const updateData = await updateRes.json();

    record('4. Update Placement', 'PUT /api/placements/:id returns HTTP 200 OK', updateRes.status === 200 && updateData.success === true);
    record('4. Update Placement', 'Response reflects updated package = 20.0 LPA', updateData.data?.package === '20.0 LPA');

    // Verify PostgreSQL persistence of update
    const dbUpdateCheck = await query('SELECT package, offer_details FROM placements WHERE id = $1', [createdPlacementId]);
    record('4. Update Placement', 'PostgreSQL directly verifies updated package = 20.0 LPA and offerDetails', 
      dbUpdateCheck.rows[0]?.package === '20.0 LPA' &&
      dbUpdateCheck.rows[0]?.offer_details?.includes('Revised offer')
    );

    // Student accepts their own placement offer
    const stuAcceptRes = await fetch(`${BASE_URL}/placements/${createdPlacementId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenStudentA}`,
      },
      body: JSON.stringify({ status: 'ACCEPTED' }),
    });
    const stuAcceptData = await stuAcceptRes.json();
    record('4. Update Placement', "Student can update own placement status to 'ACCEPTED' (HTTP 200)", stuAcceptRes.status === 200 && stuAcceptData.data?.status === 'ACCEPTED');

    // =========================================================================
    // 5. DELETE / CANCEL PLACEMENT WHERE PERMITTED
    // =========================================================================
    console.log('\n[5. Delete / Cancel Placement Where Permitted]');

    // Create a temporary placement for deletion
    const tempPlacementRes = await fetch(`${BASE_URL}/placements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenOfficer}`,
      },
      body: JSON.stringify({
        studentId: studentBId,
        companyId: companyAId,
        package: '12.0 LPA',
        status: 'OFFERED',
      }),
    });
    const tempPlacementData = await tempPlacementRes.json();
    const tempPlacementId = tempPlacementData.data?.id;

    // Student attempting to delete receives 403
    const stuDeleteRes = await fetch(`${BASE_URL}/placements/${tempPlacementId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenStudentB}` },
    });
    record('5. Delete Placement', 'Student attempting to delete placement receives HTTP 403 Forbidden', stuDeleteRes.status === 403);

    // Placement Officer deleting placement receives 200 OK
    const deleteRes = await fetch(`${BASE_URL}/placements/${tempPlacementId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenOfficer}` },
    });
    const deleteData = await deleteRes.json();

    record('5. Delete Placement', 'Authorized officer deleting placement returns HTTP 200 OK', deleteRes.status === 200 && deleteData.success === true);

    // Verify deletion in PostgreSQL
    const dbDelCheck = await query('SELECT * FROM placements WHERE id = $1', [tempPlacementId]);
    record('5. Delete Placement', 'Placement physically purged from PostgreSQL placements table', dbDelCheck.rows.length === 0);

    // Deleting already deleted placement returns 404
    const deleteAgainRes = await fetch(`${BASE_URL}/placements/${tempPlacementId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenOfficer}` },
    });
    record('5. Delete Placement', 'Deleting non-existent placement returns HTTP 404 Not Found', deleteAgainRes.status === 404);

    // =========================================================================
    // 6. STUDENT VIEWS OWN PLACEMENT STATUS
    // =========================================================================
    console.log('\n[6. Student Views Own Placement Status]');

    // 6.1 Via GET /api/students/placement-status
    const stuStatusRes = await fetch(`${BASE_URL}/students/placement-status`, {
      headers: { Authorization: `Bearer ${tokenStudentA}` },
    });
    const stuStatusData = await stuStatusRes.json();

    record('6. Student Placement Status', 'GET /api/students/placement-status returns HTTP 200 OK', stuStatusRes.status === 200 && stuStatusData.success === true);
    record('6. Student Placement Status', 'Student placement status returns isPlaced = true', stuStatusData.data?.isPlaced === true);
    record('6. Student Placement Status', "Student placementStatus reflects 'ACCEPTED'", stuStatusData.data?.placementStatus === 'ACCEPTED');
    record('6. Student Placement Status', 'Status payload includes company name and placements array', Boolean(stuStatusData.data?.placedCompany && Array.isArray(stuStatusData.data?.placements)));

    // 6.2 Via GET /api/placements (Student view returns only own records)
    const stuPlacementsRes = await fetch(`${BASE_URL}/placements`, {
      headers: { Authorization: `Bearer ${tokenStudentA}` },
    });
    const stuPlacementsData = await stuPlacementsRes.json();

    record('6. Student Placement Status', 'GET /api/placements for Student returns HTTP 200 OK', stuPlacementsRes.status === 200 && Array.isArray(stuPlacementsData.data));
    record('6. Student Placement Status', 'Student sees only own placements (no other students)', stuPlacementsData.data?.every((p) => p.studentId === studentAId));

    // =========================================================================
    // 7. STUDENT CANNOT VIEW ANOTHER STUDENT'S PLACEMENT
    // =========================================================================
    console.log("\n[7. Student Cannot View Another Student's Placement]");

    // Student B attempts to access Student A's placement
    const crossStuRes = await fetch(`${BASE_URL}/placements/${createdPlacementId}`, {
      headers: { Authorization: `Bearer ${tokenStudentB}` },
    });
    record('7. Cross-Student Isolation', "Student B attempting to view Student A's placement receives HTTP 403 Forbidden", crossStuRes.status === 403);

    // =========================================================================
    // 8. RECRUITER CANNOT CREATE UNAUTHORIZED PLACEMENT
    // =========================================================================
    console.log('\n[8. Recruiter Cannot Create Unauthorized Placement]');

    // Recruiter A attempts to create placement for Company B
    const unauthRecRes = await fetch(`${BASE_URL}/placements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenRecruiterA}`,
      },
      body: JSON.stringify({
        studentId: studentBId,
        companyId: companyBId, // Belongs to InnovateLab, not TechCorp!
        package: '15.0 LPA',
        status: 'OFFERED',
      }),
    });
    record('8. Recruiter Auth Enforcement', 'Recruiter attempting to create placement for another company receives HTTP 403 Forbidden', unauthRecRes.status === 403);

    // =========================================================================
    // 9. DUPLICATE / CONFLICTING PLACEMENT IS REJECTED
    // =========================================================================
    console.log('\n[9. Duplicate / Conflicting Placement Is Rejected]');

    // Attempting to create duplicate placement for same application
    const dupAppRes = await fetch(`${BASE_URL}/placements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenOfficer}`,
      },
      body: JSON.stringify({
        studentId: studentAId,
        companyId: companyAId,
        jobId: sampleJobAId,
        applicationId: validAppId,
        package: '22.0 LPA',
        status: 'OFFERED',
      }),
    });
    record('9. Duplicate Prevention', 'Duplicate placement on same application is rejected with HTTP 409 Conflict', dupAppRes.status === 409);

    // Attempting to create duplicate placement for same student & job without applicationId
    const dupJobRes = await fetch(`${BASE_URL}/placements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenOfficer}`,
      },
      body: JSON.stringify({
        studentId: studentAId,
        companyId: companyAId,
        jobId: sampleJobAId,
        package: '25.0 LPA',
        status: 'OFFERED',
      }),
    });
    record('9. Duplicate Prevention', 'Conflicting placement for same student and job is rejected with HTTP 409 Conflict', dupJobRes.status === 409);

    // =========================================================================
    // 10. INVALID APPLICATION IS REJECTED
    // =========================================================================
    console.log('\n[10. Invalid Application Is Rejected]');

    // 10.1 Non-existent application ID -> 404
    const nonExistentAppRes = await fetch(`${BASE_URL}/placements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenOfficer}`,
      },
      body: JSON.stringify({
        studentId: studentBId,
        companyId: companyAId,
        applicationId: '00000000-0000-0000-0000-000000000000',
        package: '12.0 LPA',
      }),
    });
    record('10. Invalid Application', 'Non-existent application ID is rejected with HTTP 404 Not Found', nonExistentAppRes.status === 404);

    // 10.2 Rejected application -> 400 Bad Request
    const rejAppPlacementRes = await fetch(`${BASE_URL}/placements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenOfficer}`,
      },
      body: JSON.stringify({
        studentId: studentBId,
        companyId: companyAId,
        applicationId: rejectedAppId,
        package: '12.0 LPA',
      }),
    });
    record('10. Invalid Application', 'Placement on REJECTED application is rejected with HTTP 400 Bad Request', rejAppPlacementRes.status === 400);

    // 10.3 Application belonging to different student -> 400 Bad Request
    const mismatchAppRes = await fetch(`${BASE_URL}/placements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenOfficer}`,
      },
      body: JSON.stringify({
        studentId: studentBId, // Does NOT match studentA of validAppId
        companyId: companyAId,
        applicationId: validAppId,
        package: '12.0 LPA',
      }),
    });
    record('10. Invalid Application', 'Application mismatched with studentId is rejected with HTTP 400 Bad Request', mismatchAppRes.status === 400);

    // =========================================================================
    // 11. JWT AND ROLE SECURITY
    // =========================================================================
    console.log('\n[11. JWT and Role Security]');

    // 11.1 Missing JWT -> 401
    const noJwtRes = await fetch(`${BASE_URL}/placements`);
    record('11. Security - Auth', 'Request without JWT returns HTTP 401 Unauthorized', noJwtRes.status === 401);

    // 11.2 Invalid JWT -> 401
    const badJwtRes = await fetch(`${BASE_URL}/placements`, {
      headers: { Authorization: 'Bearer this.is.an.invalid.jwt.token' },
    });
    record('11. Security - Auth', 'Request with invalid JWT returns HTTP 401 Unauthorized', badJwtRes.status === 401);

    // 11.3 Student attempting to create placement -> 403
    const stuCreateRes = await fetch(`${BASE_URL}/placements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenStudentA}`,
      },
      body: JSON.stringify({
        studentId: studentAId,
        companyId: companyAId,
        package: '50.0 LPA',
      }),
    });
    record('11. Security - Role', 'Student attempting to create placement receives HTTP 403 Forbidden', stuCreateRes.status === 403);

    // 11.4 Recruiter attempting to access another company's placement -> 403
    const recCrossRes = await fetch(`${BASE_URL}/placements/${createdPlacementId}`, {
      headers: { Authorization: `Bearer ${tokenRecruiterB}` },
    });
    record('11. Security - Role', "Recruiter attempting to view another company's placement receives HTTP 403 Forbidden", recCrossRes.status === 403);

    // 11.5 Recruiter attempting to delete another company's placement -> 403
    const recCrossDelRes = await fetch(`${BASE_URL}/placements/${createdPlacementId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenRecruiterB}` },
    });
    record('11. Security - Role', "Recruiter attempting to delete another company's placement receives HTTP 403 Forbidden", recCrossDelRes.status === 403);

    // 11.6 Admin access verified -> 200
    const adminViewRes = await fetch(`${BASE_URL}/placements/${createdPlacementId}`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    record('11. Security - Role', 'Admin role can access any placement record (HTTP 200 OK)', adminViewRes.status === 200);

    // =========================================================================
    // 12. DATABASE CONSISTENCY
    // =========================================================================
    console.log('\n[12. Database Consistency]');

    // 12.1 Status validation (CHECK constraint enforcement)
    const badStatusRes = await fetch(`${BASE_URL}/placements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenOfficer}`,
      },
      body: JSON.stringify({
        studentId: studentBId,
        companyId: companyAId,
        package: '10.0 LPA',
        status: 'INVALID_STATUS',
      }),
    });
    record('12. Database Consistency', 'Invalid status value rejected by validation (HTTP 400 Bad Request)', badStatusRes.status === 400);

    // 12.2 Verify foreign keys in PostgreSQL
    const fkCheck = await query(`
      SELECT conname, confrelid::regclass as ref_table
      FROM pg_constraint
      WHERE conrelid = 'placements'::regclass AND contype = 'f'
    `);
    const refTables = fkCheck.rows.map((r) => r.ref_table.toString());
    record('12. Database Consistency', 'Foreign keys configured to students, companies, jobs, applications', 
      refTables.includes('students') &&
      refTables.includes('companies') &&
      refTables.includes('jobs') &&
      refTables.includes('applications')
    );

    // 12.3 Verify timestamp ordering (updated_at >= created_at)
    const timeCheck = await query('SELECT count(*) FROM placements WHERE updated_at < created_at');
    record('12. Database Consistency', 'All placement timestamps satisfy updated_at >= created_at', parseInt(timeCheck.rows[0].count, 10) === 0);

  } catch (error) {
    console.error('Fatal execution error:', error);
    results.failed++;
  } finally {
    // Cleanup temporary test records if any
    if (rejectedAppId) {
      await query('DELETE FROM applications WHERE id = $1', [rejectedAppId]).catch(() => {});
    }
    await pool.end();
  }

  // ===========================================================================
  // REPORTING SUMMARY
  // ===========================================================================
  console.log('\n======================================================================');
  console.log('PLACEMENT API MODULE COMPLETE TESTING REPORT');
  console.log('======================================================================');
  console.log(`Total Tests Run : ${results.total}`);
  console.log(`Passed          : ${results.passed}`);
  console.log(`Failed          : ${results.failed}`);
  console.log(`Success Rate    : ${((results.passed / results.total) * 100).toFixed(1)}%`);
  console.log('----------------------------------------------------------------------');

  for (const [cat, data] of Object.entries(results.categories)) {
    const rate = ((data.passed / data.total) * 100).toFixed(0);
    console.log(`- ${cat.padEnd(35)}: ${data.passed}/${data.total} passed (${rate}%)`);
  }
  console.log('======================================================================\n');

  if (results.failed > 0) {
    console.error(`FAILED: ${results.failed} tests did not pass.`);
    process.exit(1);
  } else {
    console.log('SUCCESS: All Placement API tests passed with 100% integrity!');
    process.exit(0);
  }
}

verifyPlacementModule();
