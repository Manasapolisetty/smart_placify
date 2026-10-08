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

async function verifyPlacementOfficerModule() {
  console.log('======================================================================');
  console.log('SMARTPLACIFY — PLACEMENT OFFICER API COMPLETE VERIFICATION SUITE');
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
  let tokenStudent;
  let tokenRecruiter;

  let sampleStudentId;
  let sampleStudentUserId;
  let sampleCompanyId;
  let createdDriveId;

  // Baseline user and password integrity snapshots
  let baselinePasswordHashes = new Map();
  let baselineUserRoles = new Map();

  try {
    // -------------------------------------------------------------------------
    // 0. SETUP & AUTHENTICATION
    // -------------------------------------------------------------------------
    console.log('[0. Setup & Authentication]');

    // Snapshot users passwords and roles before tests run
    const usersSnapshot = await query('SELECT id, email, role, password_hash FROM users');
    for (const u of usersSnapshot.rows) {
      baselinePasswordHashes.set(u.id, u.password_hash);
      baselineUserRoles.set(u.id, u.role);
    }
    console.log(`  ✓ Security baseline captured for ${usersSnapshot.rows.length} system users`);

    // Authenticate Placement Officer (Dr. Aris V. Nair / Demo Placement Officer)
    const officerLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'officer.demo@smartplacify.edu', password: 'password123' }),
    });
    const officerLoginData = await officerLoginRes.json();
    tokenOfficer = officerLoginData.data?.token || officerLoginData.token;

    // Authenticate Admin
    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@smartplacify.edu.in', password: 'password123' }),
    });
    const adminLoginData = await adminLoginRes.json();
    tokenAdmin = adminLoginData.data?.token || adminLoginData.token;

    // Authenticate Student
    const studentLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'rahul.kumar@university.edu.in', password: 'password123' }),
    });
    const studentLoginData = await studentLoginRes.json();
    tokenStudent = studentLoginData.data?.token || studentLoginData.token;

    // Authenticate Recruiter
    const recruiterLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'priya.sharma@techcorp.com', password: 'password123' }),
    });
    const recruiterLoginData = await recruiterLoginRes.json();
    tokenRecruiter = recruiterLoginData.data?.token || recruiterLoginData.token;

    // Get sample student & company
    const stuDb = await query('SELECT id, user_id FROM students LIMIT 1');
    sampleStudentId = stuDb.rows[0]?.id;
    sampleStudentUserId = stuDb.rows[0]?.user_id;

    const compDb = await query('SELECT id FROM companies LIMIT 1');
    sampleCompanyId = compDb.rows[0]?.id;

    console.log(`  ✓ Auth ready: Placement Officer, Admin, Student, Recruiter\n`);

    // =========================================================================
    // 1. DASHBOARD STATISTICS
    // =========================================================================
    console.log('[1. Dashboard Statistics - GET /api/placement-officers/dashboard]');
    const dashRes = await fetch(`${BASE_URL}/placement-officers/dashboard`, {
      headers: { Authorization: `Bearer ${tokenOfficer}` },
    });
    const dashData = await dashRes.json();

    record('1. Dashboard', 'GET /api/placement-officers/dashboard returns HTTP 200 OK', dashRes.status === 200 && dashData.success === true);
    const dStats = dashData.data || {};

    record('1. Dashboard', 'Dashboard contains total students statistic', dStats.totalStudents !== undefined || dStats.total_students !== undefined);
    record('1. Dashboard', 'Dashboard contains eligible students statistic', dStats.eligibleStudents !== undefined || dStats.eligible_students !== undefined);
    record('1. Dashboard', 'Dashboard contains total companies statistic', dStats.totalCompanies !== undefined || dStats.total_companies !== undefined);
    record('1. Dashboard', 'Dashboard contains active jobs statistic', dStats.activeJobs !== undefined || dStats.active_jobs !== undefined);
    record('1. Dashboard', 'Dashboard contains total applications statistic', dStats.totalApplications !== undefined || dStats.total_applications !== undefined);
    record('1. Dashboard', 'Dashboard contains shortlisted students statistic', dStats.shortlistedStudents !== undefined || dStats.shortlisted_students !== undefined);
    record('1. Dashboard', 'Dashboard contains placed students statistic', dStats.placedStudents !== undefined || dStats.placed_students !== undefined);
    record('1. Dashboard', 'Dashboard contains placement percentage statistic', dStats.placementPercentage !== undefined || dStats.placement_percentage !== undefined);

    // Cross-verify statistical accuracy against PostgreSQL directly
    const sqlTotalStu = await query('SELECT count(*) FROM students');
    const sqlTotalComp = await query('SELECT count(*) FROM companies');
    const sqlActiveJobs = await query("SELECT count(*) FROM jobs WHERE status = 'OPEN'");
    const sqlTotalApps = await query('SELECT count(*) FROM applications');
    const sqlPlaced = await query(
      `SELECT count(DISTINCT s_id) FROM (
         SELECT student_id as s_id FROM applications WHERE status = 'SELECTED'
         UNION
         SELECT student_id as s_id FROM placements WHERE status IN ('OFFERED', 'ACCEPTED', 'JOINED')
       ) sub`
    );

    record('1. Dashboard', 'totalStudents matches PostgreSQL students table count', (dStats.totalStudents ?? dStats.total_students) === parseInt(sqlTotalStu.rows[0].count, 10));
    record('1. Dashboard', 'totalCompanies matches PostgreSQL companies table count', (dStats.totalCompanies ?? dStats.total_companies) === parseInt(sqlTotalComp.rows[0].count, 10));
    record('1. Dashboard', 'activeJobs matches PostgreSQL OPEN jobs count', (dStats.activeJobs ?? dStats.active_jobs) === parseInt(sqlActiveJobs.rows[0].count, 10));
    record('1. Dashboard', 'totalApplications matches PostgreSQL applications count', (dStats.totalApplications ?? dStats.total_applications) === parseInt(sqlTotalApps.rows[0].count, 10));
    record('1. Dashboard', 'placedStudents matches PostgreSQL placed students count', (dStats.placedStudents ?? dStats.placed_students) === parseInt(sqlPlaced.rows[0].count, 10));

    // =========================================================================
    // 2. STUDENT LISTING
    // =========================================================================
    console.log('\n[2. Student Listing - GET /api/placement-officers/students]');
    const stuListRes = await fetch(`${BASE_URL}/placement-officers/students`, {
      headers: { Authorization: `Bearer ${tokenOfficer}` },
    });
    const stuListData = await stuListRes.json();

    record('2. Student Listing', 'GET /api/placement-officers/students returns HTTP 200 OK', stuListRes.status === 200 && Array.isArray(stuListData.data));
    record('2. Student Listing', 'Student records contain profile, academics, and placementStatus', Boolean(stuListData.data?.[0]?.rollNumber && stuListData.data?.[0]?.placementStatus));
    record('2. Student Listing', 'Student records contain pagination metadata', Boolean(stuListData.pagination && stuListData.pagination.total !== undefined));
    record('2. Student Listing', 'Student listing never exposes password_hash', stuListData.data?.every((s) => s.password_hash === undefined));

    // Department filter
    const deptStuRes = await fetch(`${BASE_URL}/placement-officers/students?department=Computer%20Science%20and%20Engineering`, {
      headers: { Authorization: `Bearer ${tokenOfficer}` },
    });
    const deptStuData = await deptStuRes.json();
    record('2. Student Listing', 'Department filter works correctly', deptStuRes.status === 200 && deptStuData.data?.every((s) => s.department === 'Computer Science and Engineering'));

    // Min CGPA filter
    const minCgpaRes = await fetch(`${BASE_URL}/placement-officers/students?minCgpa=8.0`, {
      headers: { Authorization: `Bearer ${tokenOfficer}` },
    });
    const minCgpaData = await minCgpaRes.json();
    record('2. Student Listing', 'Min CGPA filter (?minCgpa=8.0) works correctly', minCgpaRes.status === 200 && minCgpaData.data?.every((s) => s.cgpa >= 8.0));

    // Search filter
    const searchStuRes = await fetch(`${BASE_URL}/placement-officers/students?search=Rahul`, {
      headers: { Authorization: `Bearer ${tokenOfficer}` },
    });
    const searchStuData = await searchStuRes.json();
    record('2. Student Listing', 'Search filter (?search=Rahul) works correctly', searchStuRes.status === 200 && searchStuData.data?.some((s) => s.name?.includes('Rahul')));

    // Pagination test
    const pageStuRes = await fetch(`${BASE_URL}/placement-officers/students?page=1&limit=2`, {
      headers: { Authorization: `Bearer ${tokenOfficer}` },
    });
    const pageStuData = await pageStuRes.json();
    record('2. Student Listing', 'Pagination limit respects requested limit=2', pageStuRes.status === 200 && pageStuData.data?.length <= 2 && pageStuData.pagination.limit === 2);

    // =========================================================================
    // 3. STUDENT DETAILS
    // =========================================================================
    console.log('\n[3. Student Details - GET /api/placement-officers/students/:id]');
    // Fetch by student table UUID
    const stuDetailRes = await fetch(`${BASE_URL}/placement-officers/students/${sampleStudentId}`, {
      headers: { Authorization: `Bearer ${tokenOfficer}` },
    });
    const stuDetailData = await stuDetailRes.json();

    record('3. Student Details', 'GET /api/placement-officers/students/:id returns HTTP 200 OK', stuDetailRes.status === 200 && stuDetailData.data?.id === sampleStudentId);
    record('3. Student Details', 'Student details include comprehensive academics, skills, and applications breakdown', Boolean(stuDetailData.data?.academics && stuDetailData.data?.skills && stuDetailData.data?.applications));
    record('3. Student Details', 'Student details never expose password_hash or credentials', stuDetailData.data?.password_hash === undefined);

    // Fetch by user_id UUID also resolves to the student profile
    const stuByUserRes = await fetch(`${BASE_URL}/placement-officers/students/${sampleStudentUserId}`, {
      headers: { Authorization: `Bearer ${tokenOfficer}` },
    });
    const stuByUserData = await stuByUserRes.json();
    record('3. Student Details', 'Resolving student details via user_id returns HTTP 200 OK', stuByUserRes.status === 200 && stuByUserData.data?.userId === sampleStudentUserId);

    // Non-existent student -> 404
    const notFoundStu = await fetch(`${BASE_URL}/placement-officers/students/00000000-0000-0000-0000-000000000000`, {
      headers: { Authorization: `Bearer ${tokenOfficer}` },
    });
    record('3. Student Details', 'Non-existent student returns HTTP 404 Not Found', notFoundStu.status === 404);

    // Malformed UUID parameter -> 400
    const malformedStuRes = await fetch(`${BASE_URL}/placement-officers/students/not-a-valid-uuid`, {
      headers: { Authorization: `Bearer ${tokenOfficer}` },
    });
    record('3. Student Details', 'Malformed UUID parameter returns HTTP 400 Bad Request', malformedStuRes.status === 400);

    // =========================================================================
    // 4. COMPANY LISTING
    // =========================================================================
    console.log('\n[4. Company Listing - GET /api/placement-officers/companies]');
    const compListRes = await fetch(`${BASE_URL}/placement-officers/companies`, {
      headers: { Authorization: `Bearer ${tokenOfficer}` },
    });
    const compListData = await compListRes.json();

    record('4. Company Listing', 'GET /api/placement-officers/companies returns HTTP 200 OK', compListRes.status === 200 && Array.isArray(compListData.data));
    record('4. Company Listing', 'Company records include metrics (totalJobs, activeJobs, totalApplications, placedStudents)', Boolean(
      compListData.data?.[0]?.totalJobs !== undefined &&
      compListData.data?.[0]?.activeJobs !== undefined &&
      compListData.data?.[0]?.totalApplications !== undefined &&
      compListData.data?.[0]?.placedStudents !== undefined
    ));

    // Company search
    const compSearchRes = await fetch(`${BASE_URL}/placement-officers/companies?search=TechCorp`, {
      headers: { Authorization: `Bearer ${tokenOfficer}` },
    });
    const compSearchData = await compSearchRes.json();
    record('4. Company Listing', 'Company search (?search=TechCorp) works correctly', compSearchRes.status === 200 && compSearchData.data?.some((c) => c.name?.includes('TechCorp')));

    // Company pagination
    record('4. Company Listing', 'Company listing contains pagination structure', Boolean(compListData.pagination && compListData.pagination.total !== undefined));

    // =========================================================================
    // 5. JOB LISTING
    // =========================================================================
    console.log('\n[5. Job Listing - GET /api/placement-officers/jobs]');
    const jobsListRes = await fetch(`${BASE_URL}/placement-officers/jobs`, {
      headers: { Authorization: `Bearer ${tokenOfficer}` },
    });
    const jobsListData = await jobsListRes.json();

    record('5. Job Listing', 'GET /api/placement-officers/jobs returns HTTP 200 OK', jobsListRes.status === 200 && Array.isArray(jobsListData.data));
    record('5. Job Listing', 'Job records include companyName, jobType, status, and applicationsCount', Boolean(
      jobsListData.data?.[0]?.companyName &&
      jobsListData.data?.[0]?.jobType &&
      jobsListData.data?.[0]?.status &&
      jobsListData.data?.[0]?.applicationsCount !== undefined
    ));

    // Status filter
    const openJobsRes = await fetch(`${BASE_URL}/placement-officers/jobs?status=OPEN`, {
      headers: { Authorization: `Bearer ${tokenOfficer}` },
    });
    const openJobsData = await openJobsRes.json();
    record('5. Job Listing', 'Status filter (?status=OPEN) returns only OPEN jobs', openJobsRes.status === 200 && openJobsData.data?.every((j) => j.status === 'OPEN'));

    // Pagination
    record('5. Job Listing', 'Job listing contains pagination metadata', Boolean(jobsListData.pagination && jobsListData.pagination.total !== undefined));

    // =========================================================================
    // 6. APPLICATION LISTING
    // =========================================================================
    console.log('\n[6. Application Listing - GET /api/placement-officers/applications]');
    const appsListRes = await fetch(`${BASE_URL}/placement-officers/applications`, {
      headers: { Authorization: `Bearer ${tokenOfficer}` },
    });
    const appsListData = await appsListRes.json();

    record('6. Application Listing', 'GET /api/placement-officers/applications returns HTTP 200 OK', appsListRes.status === 200 && Array.isArray(appsListData.data));
    record('6. Application Listing', 'Application records contain joined candidate, company, and job details', Boolean(
      appsListData.data?.[0]?.candidate?.name &&
      appsListData.data?.[0]?.companyName &&
      appsListData.data?.[0]?.jobTitle
    ));

    // Status filter
    const appStatusRes = await fetch(`${BASE_URL}/placement-officers/applications?status=APPLIED`, {
      headers: { Authorization: `Bearer ${tokenOfficer}` },
    });
    const appStatusData = await appStatusRes.json();
    record('6. Application Listing', 'Application status filter (?status=APPLIED) returns only matching status', appStatusRes.status === 200 && appStatusData.data?.every((a) => a.status === 'APPLIED'));

    // Pagination
    record('6. Application Listing', 'Applications list includes pagination metadata', Boolean(appsListData.pagination && appsListData.pagination.total !== undefined));

    // =========================================================================
    // 7. INTERVIEW LISTING
    // =========================================================================
    console.log('\n[7. Interview Listing - GET /api/placement-officers/interviews]');
    const intListRes = await fetch(`${BASE_URL}/placement-officers/interviews`, {
      headers: { Authorization: `Bearer ${tokenOfficer}` },
    });
    const intListData = await intListRes.json();

    record('7. Interview Listing', 'GET /api/placement-officers/interviews returns HTTP 200 OK', intListRes.status === 200 && Array.isArray(intListData.data));
    record('7. Interview Listing', 'Interviews list includes pagination object', Boolean(intListData.pagination && intListData.pagination.total !== undefined));
    if (intListData.data?.length > 0) {
      record('7. Interview Listing', 'Interview records contain candidate, recruiter, and status details', Boolean(
        intListData.data[0].candidate?.name &&
        intListData.data[0].recruiter?.name &&
        intListData.data[0].status
      ));
    } else {
      record('7. Interview Listing', 'Interview list returned empty array cleanly without database errors', true);
    }

    // =========================================================================
    // 8. PLACEMENT DRIVE CRUD
    // =========================================================================
    console.log('\n[8. Placement Drive CRUD]');

    // 8.1 CREATE (POST)
    const createDrivePayload = {
      companyId: sampleCompanyId,
      driveTitle: 'Full Campus Placement Drive 2026 - CSE/IT',
      description: 'Annual placement drive for engineering batch of 2026',
      startDate: '2026-11-20',
      endDate: '2026-11-30',
      eligibilityCriteria: 'Minimum CGPA 7.0, zero active backlogs',
      status: 'UPCOMING',
    };

    const createDriveRes = await fetch(`${BASE_URL}/placement-officers/placement-drives`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenOfficer}`,
      },
      body: JSON.stringify(createDrivePayload),
    });
    const createDriveData = await createDriveRes.json();

    record('8. Placement Drive CRUD', 'POST /api/placement-officers/placement-drives creates drive (HTTP 201)', createDriveRes.status === 201 && createDriveData.success === true);
    createdDriveId = createDriveData.data?.id;

    record('8. Placement Drive CRUD', 'Created drive returns expected fields and UPCOMING status', createDriveData.data?.driveTitle === createDrivePayload.driveTitle && createDriveData.data?.status === 'UPCOMING');

    // 8.2 LIST (GET)
    const drivesListRes = await fetch(`${BASE_URL}/placement-officers/placement-drives`, {
      headers: { Authorization: `Bearer ${tokenOfficer}` },
    });
    const drivesListData = await drivesListRes.json();

    record('8. Placement Drive CRUD', 'GET /api/placement-officers/placement-drives returns HTTP 200 OK', drivesListRes.status === 200 && Array.isArray(drivesListData.data));
    record('8. Placement Drive CRUD', 'Drives list contains company object and newly created drive', drivesListData.data?.some((d) => d.id === createdDriveId));

    // 8.3 DETAILS (GET by ID)
    const driveDetailRes = await fetch(`${BASE_URL}/placement-officers/placement-drives/${createdDriveId}`, {
      headers: { Authorization: `Bearer ${tokenOfficer}` },
    });
    const driveDetailData = await driveDetailRes.json();

    record('8. Placement Drive CRUD', 'GET /api/placement-officers/placement-drives/:id returns HTTP 200 OK', driveDetailRes.status === 200 && driveDetailData.data?.id === createdDriveId);
    record('8. Placement Drive CRUD', 'Drive details include full company details object', Boolean(driveDetailData.data?.company && driveDetailData.data?.company.name));

    // 8.4 UPDATE (PUT)
    const updateDrivePayload = {
      driveTitle: 'Full Campus Placement Drive 2026 - Phase 1 Active',
      status: 'ONGOING',
      eligibilityCriteria: 'Minimum CGPA 7.5, zero backlogs',
    };

    const updateDriveRes = await fetch(`${BASE_URL}/placement-officers/placement-drives/${createdDriveId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenOfficer}`,
      },
      body: JSON.stringify(updateDrivePayload),
    });
    const updateDriveData = await updateDriveRes.json();

    record('8. Placement Drive CRUD', 'PUT /api/placement-officers/placement-drives/:id returns HTTP 200 OK', updateDriveRes.status === 200 && updateDriveData.success === true);
    record('8. Placement Drive CRUD', 'Updated drive reflects status = ONGOING and new title', updateDriveData.data?.status === 'ONGOING' && updateDriveData.data?.driveTitle === updateDrivePayload.driveTitle);

    // Validation: Missing title on create -> 400
    const badDriveRes = await fetch(`${BASE_URL}/placement-officers/placement-drives`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenOfficer}`,
      },
      body: JSON.stringify({ companyId: sampleCompanyId, startDate: '2026-11-20' }),
    });
    record('8. Placement Drive CRUD', 'Missing driveTitle returns HTTP 400 validation error', badDriveRes.status === 400);

    // Validation: Non-existent companyId on create -> 404
    const notFoundCompRes = await fetch(`${BASE_URL}/placement-officers/placement-drives`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenOfficer}`,
      },
      body: JSON.stringify({
        companyId: '00000000-0000-0000-0000-000000000000',
        driveTitle: 'Invalid Company Drive',
        startDate: '2026-11-20',
      }),
    });
    record('8. Placement Drive CRUD', 'Non-existent companyId returns HTTP 404 Not Found', notFoundCompRes.status === 404);

    // 8.5 DELETE (DELETE)
    const deleteDriveRes = await fetch(`${BASE_URL}/placement-officers/placement-drives/${createdDriveId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenOfficer}` },
    });
    const deleteDriveData = await deleteDriveRes.json();

    record('8. Placement Drive CRUD', 'DELETE /api/placement-officers/placement-drives/:id returns HTTP 200 OK', deleteDriveRes.status === 200 && deleteDriveData.success === true);

    // GET deleted drive -> 404
    const getDeletedDriveRes = await fetch(`${BASE_URL}/placement-officers/placement-drives/${createdDriveId}`, {
      headers: { Authorization: `Bearer ${tokenOfficer}` },
    });
    record('8. Placement Drive CRUD', 'GET on deleted drive returns HTTP 404 Not Found', getDeletedDriveRes.status === 404);

    // DELETE again -> 404
    const deleteAgainRes = await fetch(`${BASE_URL}/placement-officers/placement-drives/${createdDriveId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenOfficer}` },
    });
    record('8. Placement Drive CRUD', 'Deleting already deleted drive returns HTTP 404 Not Found', deleteAgainRes.status === 404);

    // =========================================================================
    // 9. POSTGRESQL PERSISTENCE
    // =========================================================================
    console.log('\n[9. PostgreSQL Persistence]');

    // Create a temporary drive to trace PostgreSQL persistence lifecycle
    const persistDriveRes = await fetch(`${BASE_URL}/placement-officers/placement-drives`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenOfficer}`,
      },
      body: JSON.stringify({
        companyId: sampleCompanyId,
        driveTitle: 'PostgreSQL Persistence Verification Drive',
        startDate: '2026-12-01',
        endDate: '2026-12-10',
        status: 'UPCOMING',
      }),
    });
    const persistDriveData = await persistDriveRes.json();
    const persistId = persistDriveData.data?.id;

    // Check direct insertion in PostgreSQL placement_drives
    const sqlInsertCheck = await query('SELECT * FROM placement_drives WHERE id = $1', [persistId]);
    record('9. PostgreSQL Persistence', 'Inserted drive physically exists in placement_drives table', sqlInsertCheck.rows.length === 1 && sqlInsertCheck.rows[0].drive_title === 'PostgreSQL Persistence Verification Drive');
    record('9. PostgreSQL Persistence', 'Foreign key company_id and created_by accurately persisted', sqlInsertCheck.rows[0].company_id === sampleCompanyId && Boolean(sqlInsertCheck.rows[0].created_by));
    record('9. PostgreSQL Persistence', 'Created_at and updated_at timestamps generated by PostgreSQL', Boolean(sqlInsertCheck.rows[0].created_at && sqlInsertCheck.rows[0].updated_at));

    // Update through API and check PostgreSQL
    await fetch(`${BASE_URL}/placement-officers/placement-drives/${persistId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenOfficer}`,
      },
      body: JSON.stringify({ status: 'COMPLETED', driveTitle: 'PostgreSQL Persistence Verified Title' }),
    });

    const sqlUpdateCheck = await query('SELECT status, drive_title, updated_at FROM placement_drives WHERE id = $1', [persistId]);
    record('9. PostgreSQL Persistence', 'Updated drive status and title directly confirmed in PostgreSQL', sqlUpdateCheck.rows[0]?.status === 'COMPLETED' && sqlUpdateCheck.rows[0]?.drive_title === 'PostgreSQL Persistence Verified Title');

    // Delete through API and verify PostgreSQL removal
    await fetch(`${BASE_URL}/placement-officers/placement-drives/${persistId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenOfficer}` },
    });

    const sqlDeleteCheck = await query('SELECT * FROM placement_drives WHERE id = $1', [persistId]);
    record('9. PostgreSQL Persistence', 'Drive record completely purged from PostgreSQL placement_drives', sqlDeleteCheck.rows.length === 0);

    // =========================================================================
    // 10. ROLE-BASED AUTHORIZATION & SECURITY
    // =========================================================================
    console.log('\n[10. Role-Based Authorization & Security]');

    // 10.1 STUDENT -> 403 on ALL Placement Officer endpoints
    const studentEndpoints = [
      { method: 'GET', path: '/placement-officers/dashboard', name: 'Dashboard' },
      { method: 'GET', path: '/placement-officers/students', name: 'Students List' },
      { method: 'GET', path: `/placement-officers/students/${sampleStudentId}`, name: 'Student Details' },
      { method: 'GET', path: '/placement-officers/companies', name: 'Companies List' },
      { method: 'GET', path: '/placement-officers/jobs', name: 'Jobs List' },
      { method: 'GET', path: '/placement-officers/applications', name: 'Applications List' },
      { method: 'GET', path: '/placement-officers/interviews', name: 'Interviews List' },
      { method: 'GET', path: '/placement-officers/placement-drives', name: 'Drives List' },
      { method: 'POST', path: '/placement-officers/placement-drives', name: 'Create Drive', body: { companyId: sampleCompanyId, driveTitle: 'Hack', startDate: '2026-11-20' } },
      { method: 'PUT', path: `/placement-officers/placement-drives/${sampleCompanyId}`, name: 'Update Drive', body: { driveTitle: 'Hack' } },
      { method: 'DELETE', path: `/placement-officers/placement-drives/${sampleCompanyId}`, name: 'Delete Drive' },
    ];

    // 10.1 STUDENT -> 403 on ALL Placement Officer endpoints
    for (const ep of studentEndpoints) {
      const res = await fetch(`${BASE_URL}${ep.path}`, {
        method: ep.method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenStudent}`,
        },
        body: ep.body ? JSON.stringify(ep.body) : undefined,
      });
      record('10. Security: Student 403', `Student on ${ep.method} ${ep.name} returns HTTP 403 Forbidden`, res.status === 403);
    }

    // 10.2 RECRUITER -> 403 where unauthorized on ALL Placement Officer endpoints
    for (const ep of studentEndpoints) {
      const res = await fetch(`${BASE_URL}${ep.path}`, {
        method: ep.method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenRecruiter}`,
        },
        body: ep.body ? JSON.stringify(ep.body) : undefined,
      });
      record('10. Security: Recruiter 403', `Recruiter on ${ep.method} ${ep.name} returns HTTP 403 Forbidden`, res.status === 403);
    }

    // 10.3 ADMIN -> appropriate access (HTTP 200 OK)
    const adminDashRes = await fetch(`${BASE_URL}/placement-officers/dashboard`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    record('10. Security: Admin Access', 'Admin accessing Placement Officer dashboard receives HTTP 200 OK', adminDashRes.status === 200);

    const adminStuRes = await fetch(`${BASE_URL}/placement-officers/students`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    record('10. Security: Admin Access', 'Admin accessing Placement Officer students list receives HTTP 200 OK', adminStuRes.status === 200);

    const adminDrivesRes = await fetch(`${BASE_URL}/placement-officers/placement-drives`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    record('10. Security: Admin Access', 'Admin accessing Placement Officer drives list receives HTTP 200 OK', adminDrivesRes.status === 200);

    // 10.4 Invalid JWT -> 401 Unauthorized
    const invalidJwtDash = await fetch(`${BASE_URL}/placement-officers/dashboard`, {
      headers: { Authorization: 'Bearer this.is.an.invalid.jwt.token' },
    });
    record('10. Security: Invalid JWT', 'Invalid JWT returns HTTP 401 Unauthorized on dashboard', invalidJwtDash.status === 401);

    const invalidJwtDrives = await fetch(`${BASE_URL}/placement-officers/placement-drives`, {
      headers: { Authorization: 'Bearer this.is.an.invalid.jwt.token' },
    });
    record('10. Security: Invalid JWT', 'Invalid JWT returns HTTP 401 Unauthorized on placement drives', invalidJwtDrives.status === 401);

    // 10.5 Missing JWT -> 401 Unauthorized
    const missingJwtDash = await fetch(`${BASE_URL}/placement-officers/dashboard`);
    record('10. Security: Missing JWT', 'Missing JWT returns HTTP 401 Unauthorized on dashboard', missingJwtDash.status === 401);

    const missingJwtDrives = await fetch(`${BASE_URL}/placement-officers/placement-drives`);
    record('10. Security: Missing JWT', 'Missing JWT returns HTTP 401 Unauthorized on placement drives', missingJwtDrives.status === 401);

    // 10.6 SQL Injection resistance
    const sqlInjRes = await fetch(`${BASE_URL}/placement-officers/students/00000000-0000-0000-0000-000000000000' OR '1'='1`, {
      headers: { Authorization: `Bearer ${tokenOfficer}` },
    });
    record('10. Security: Injection Resistance', 'SQL injection in path parameter safely rejected with HTTP 400 Bad Request', sqlInjRes.status === 400);

    // 10.7 Verify NO unauthorized student / user / security modification
    const postTestUsers = await query('SELECT id, email, role, password_hash FROM users');
    let passwordsUntouched = true;
    let rolesUntouched = true;

    for (const u of postTestUsers.rows) {
      if (baselinePasswordHashes.has(u.id)) {
        if (baselinePasswordHashes.get(u.id) !== u.password_hash) {
          passwordsUntouched = false;
          console.error(`  Security breach: Password hash altered for user ${u.email}`);
        }
      }
      if (baselineUserRoles.has(u.id)) {
        if (baselineUserRoles.get(u.id) !== u.role) {
          rolesUntouched = false;
          console.error(`  Security breach: Role altered for user ${u.email}`);
        }
      }
    }

    record('10. Security: Tampering Prevention', 'Zero student or user password hashes modified in PostgreSQL', passwordsUntouched);
    record('10. Security: Tampering Prevention', 'Zero user roles modified or escalated in PostgreSQL', rolesUntouched);

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
  console.log('PLACEMENT OFFICER API COMPLETE TESTING REPORT');
  console.log('======================================================================');
  console.log(`Total Tests Run : ${results.total}`);
  console.log(`Passed          : ${results.passed}`);
  console.log(`Failed          : ${results.failed}`);
  console.log(`Success Rate    : ${((results.passed / results.total) * 100).toFixed(1)}%`);
  console.log('----------------------------------------------------------------------');

  for (const [cat, data] of Object.entries(results.categories)) {
    const rate = ((data.passed / data.total) * 100).toFixed(0);
    console.log(`- ${cat.padEnd(38)}: ${data.passed}/${data.total} passed (${rate}%)`);
  }
  console.log('======================================================================\n');

  if (results.failed > 0) {
    console.error(`FAILED: ${results.failed} tests did not pass.`);
    process.exit(1);
  } else {
    console.log('SUCCESS: All Placement Officer API tests passed with 100% integrity!');
    process.exit(0);
  }
}

verifyPlacementOfficerModule();
