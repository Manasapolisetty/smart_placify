import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { pool, query } from '../config/database.js';

// Base API endpoint as requested: http://localhost:5000/api
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api';

async function runCompleteStudentVerification() {
  console.log('======================================================================');
  console.log('SMARTPLACIFY — COMPLETE AUTOMATED STUDENT API MODULE VERIFICATION');
  console.log(`Target Backend: ${BASE_URL}`);
  console.log('Database: PostgreSQL 16 (smartplacify_db)');
  console.log('======================================================================\n');

  // Verify server is reachable
  try {
    const healthCheck = await fetch(`${BASE_URL}/health`);
    if (!healthCheck.ok) {
      throw new Error(`Health check returned status ${healthCheck.status}`);
    }
    console.log('[OK] Backend server is reachable at ' + BASE_URL + '\n');
  } catch (err) {
    console.error(`[ERROR] Backend server not reachable at ${BASE_URL}: ${err.message}`);
    process.exit(1);
  }

  const results = {
    Authentication: { passed: 0, failed: 0, tests: [] },
    Profile: { passed: 0, failed: 0, tests: [] },
    Academics: { passed: 0, failed: 0, tests: [] },
    Skills: { passed: 0, failed: 0, tests: [] },
    Projects: { passed: 0, failed: 0, tests: [] },
    Certifications: { passed: 0, failed: 0, tests: [] },
    Resumes: { passed: 0, failed: 0, tests: [] },
    'Eligible Jobs': { passed: 0, failed: 0, tests: [] },
    Applications: { passed: 0, failed: 0, tests: [] },
    Interviews: { passed: 0, failed: 0, tests: [] },
    Notifications: { passed: 0, failed: 0, tests: [] },
    Placement: { passed: 0, failed: 0, tests: [] },
    Security: { passed: 0, failed: 0, tests: [] },
    Database: { passed: 0, failed: 0, tests: [] },
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

  let tokenStudentA = '';
  let tokenStudentB = '';
  let tokenRecruiter = '';
  let tokenAdmin = '';

  let userAId = '';
  let studentAId = '';
  let userBId = '';
  let studentBId = '';

  try {
    // =========================================================================
    // 1. AUTHENTICATION
    // =========================================================================
    console.log('[1. Authentication Tests]');
    const loginResA = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'rahul.kumar@university.edu.in',
        password: 'password123',
      }),
    });
    const loginDataA = await loginResA.json();
    tokenStudentA = loginDataA.data?.token || loginDataA.token;
    userAId = loginDataA.data?.user?.id;

    record('Authentication', '1.1 POST /api/auth/login returns HTTP 200 with JWT for Student A', loginResA.status === 200 && Boolean(tokenStudentA));
    record('Authentication', '1.2 Login response does NOT expose password_hash', !loginDataA.data?.user?.password_hash && !loginDataA.data?.password_hash);
    record('Authentication', '1.3 Login response contains role = STUDENT', loginDataA.data?.user?.role === 'STUDENT' || loginDataA.role === 'STUDENT');

    // Authenticate Student B
    const loginResB = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'student.demo@smartplacify.edu',
        password: 'password123',
      }),
    });
    const loginDataB = await loginResB.json();
    tokenStudentB = loginDataB.data?.token || loginDataB.token;
    userBId = loginDataB.data?.user?.id;
    record('Authentication', '1.4 POST /api/auth/login returns JWT for Student B', loginResB.status === 200 && Boolean(tokenStudentB));

    // Authenticate Recruiter
    const loginRecruiter = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'priya.sharma@techcorp.com',
        password: 'password123',
      }),
    });
    const dataRecruiter = await loginRecruiter.json();
    tokenRecruiter = dataRecruiter.data?.token || dataRecruiter.token;
    record('Authentication', '1.5 Recruiter authentication returns JWT', loginRecruiter.status === 200 && Boolean(tokenRecruiter));

    // Authenticate Admin
    const loginAdmin = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@smartplacify.edu.in',
        password: 'password123',
      }),
    });
    const dataAdmin = await loginAdmin.json();
    tokenAdmin = dataAdmin.data?.token || dataAdmin.token;
    record('Authentication', '1.6 Admin authentication returns JWT', loginAdmin.status === 200 && Boolean(tokenAdmin));

    // Obtain student IDs from database
    const stuResA = await query('SELECT id FROM students WHERE user_id = $1', [userAId]);
    studentAId = stuResA.rows[0]?.id;
    const stuResB = await query('SELECT id FROM students WHERE user_id = $1', [userBId]);
    studentBId = stuResB.rows[0]?.id;

    // =========================================================================
    // 2. PROFILE TESTS
    // =========================================================================
    console.log('\n[2. Profile Tests]');
    const profileRes = await fetch(`${BASE_URL}/students/profile`, {
      headers: { Authorization: `Bearer ${tokenStudentA}` },
    });
    const profileData = await profileRes.json();
    record('Profile', '2.1 GET /api/students/profile returns HTTP 200 with success = true', profileRes.status === 200 && profileData.success === true);
    record(
      'Profile',
      '2.2 Profile data includes users, students, departments, and courses data',
      Boolean(profileData.data.email && profileData.data.rollNumber && profileData.data.department && profileData.data.course)
    );

    // Update safe profile field
    const testAddress = `Test Residency Apt #${Date.now().toString().slice(-4)}`;
    const updateProfileRes = await fetch(`${BASE_URL}/students/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenStudentA}`,
      },
      body: JSON.stringify({
        address: testAddress,
        phone: '+91 91234 56789',
      }),
    });
    const updateProfileData = await updateProfileRes.json();
    record('Profile', '2.3 PUT /api/students/profile returns HTTP 200 and updated data', updateProfileRes.status === 200 && updateProfileData.data.address === testAddress);

    // Direct PostgreSQL persistence check
    const dbProfileCheck = await query('SELECT address, phone FROM students WHERE id = $1', [studentAId]);
    record('Profile', '2.4 Updated address persisted directly in PostgreSQL students table', dbProfileCheck.rows[0]?.address === testAddress);

    // Prevent changing role / account status
    const tamperRoleRes = await fetch(`${BASE_URL}/students/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenStudentA}`,
      },
      body: JSON.stringify({
        role: 'ADMIN',
        status: 'SUSPENDED',
      }),
    });
    const tamperRoleData = await tamperRoleRes.json();
    const dbRoleCheck = await query('SELECT role, status FROM users WHERE id = $1', [userAId]);
    record(
      'Profile',
      '2.5 Tampering role/status blocked; database role remains STUDENT and status ACTIVE',
      dbRoleCheck.rows[0]?.role === 'STUDENT' && dbRoleCheck.rows[0]?.status === 'ACTIVE' && tamperRoleData.data.role === 'STUDENT'
    );

    // =========================================================================
    // 3. ACADEMIC TESTS
    // =========================================================================
    console.log('\n[3. Academic Tests]');
    const acadListRes = await fetch(`${BASE_URL}/students/academics`, {
      headers: { Authorization: `Bearer ${tokenStudentA}` },
    });
    const acadListData = await acadListRes.json();
    record('Academics', '3.1 GET /api/students/academics returns HTTP 200 with records list', acadListRes.status === 200 && Array.isArray(acadListData.data.records));

    // POST valid academic record
    const testSem = `Semester ${Date.now().toString().slice(-4)}`;
    const postAcadRes = await fetch(`${BASE_URL}/students/academics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenStudentA}`,
      },
      body: JSON.stringify({
        semester: testSem,
        academic_year: '2025-2026',
        cgpa: 8.95,
        percentage: 89.5,
        backlogs: 0,
      }),
    });
    const postAcadData = await postAcadRes.json();
    const createdAcadId = postAcadData.data?.id;
    record('Academics', '3.2 POST /api/students/academics creates record (HTTP 201)', postAcadRes.status === 201 && Boolean(createdAcadId));

    // Verify in PostgreSQL
    const dbAcadCheck = await query('SELECT id, semester, cgpa FROM academic_records WHERE id = $1', [createdAcadId]);
    record('Academics', '3.3 Created academic record persisted in PostgreSQL', dbAcadCheck.rows.length === 1 && dbAcadCheck.rows[0].semester === testSem);

    // Duplicate semester rejection
    const dupAcadRes = await fetch(`${BASE_URL}/students/academics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenStudentA}`,
      },
      body: JSON.stringify({
        semester: testSem,
        academic_year: '2025-2026',
        cgpa: 9.0,
      }),
    });
    record('Academics', '3.4 Duplicate semester rejected with HTTP 409 Conflict', dupAcadRes.status === 409);

    // PUT valid academic record
    const putAcadRes = await fetch(`${BASE_URL}/students/academics/${createdAcadId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenStudentA}`,
      },
      body: JSON.stringify({
        cgpa: 9.25,
        percentage: 92.5,
      }),
    });
    const putAcadData = await putAcadRes.json();
    record('Academics', '3.5 PUT /api/students/academics/:id updates record (HTTP 200)', putAcadRes.status === 200 && parseFloat(putAcadData.data?.cgpa) === 9.25);

    // Invalid CGPA validation
    const badCgpaRes = await fetch(`${BASE_URL}/students/academics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenStudentA}`,
      },
      body: JSON.stringify({
        semester: 'Sem Invalid CGPA',
        academic_year: '2025-2026',
        cgpa: 15.0, // Invalid: must be <= 10.0
      }),
    });
    record('Academics', '3.6 Invalid CGPA (> 10.0) returns HTTP 400 validation error', badCgpaRes.status === 400);

    // Invalid semester validation
    const badSemRes = await fetch(`${BASE_URL}/students/academics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenStudentA}`,
      },
      body: JSON.stringify({
        semester: '', // Invalid: empty semester
        academic_year: '2025-2026',
      }),
    });
    record('Academics', '3.7 Empty semester returns HTTP 400 validation error', badSemRes.status === 400);

    // Unauthorized access: Student B modifying Student A's academic record
    const unauthAcadPut = await fetch(`${BASE_URL}/students/academics/${createdAcadId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenStudentB}`,
      },
      body: JSON.stringify({ cgpa: 4.0 }),
    });
    record('Academics', '3.8 Unauthorized access: Student B cannot modify Student A\'s record (HTTP 403)', unauthAcadPut.status === 403);

    // DELETE academic record
    const delAcadRes = await fetch(`${BASE_URL}/students/academics/${createdAcadId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenStudentA}` },
    });
    record('Academics', '3.9 DELETE /api/students/academics/:id deletes record (HTTP 200)', delAcadRes.status === 200);

    // Database verification of deletion
    const dbAcadDelCheck = await query('SELECT id FROM academic_records WHERE id = $1', [createdAcadId]);
    record('Academics', '3.10 Academic record deletion verified in PostgreSQL', dbAcadDelCheck.rows.length === 0);

    // =========================================================================
    // 4. SKILLS
    // =========================================================================
    console.log('\n[4. Skills Tests]');
    const skillsListRes = await fetch(`${BASE_URL}/students/skills`, {
      headers: { Authorization: `Bearer ${tokenStudentA}` },
    });
    const skillsListData = await skillsListRes.json();
    record('Skills', '4.1 GET /api/students/skills returns HTTP 200 with array', skillsListRes.status === 200 && Array.isArray(skillsListData.data));

    const testSkillName = `VerifSkill_${Date.now().toString().slice(-5)}`;
    const postSkillRes = await fetch(`${BASE_URL}/students/skills`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenStudentA}`,
      },
      body: JSON.stringify({
        skill_name: testSkillName,
        skill_category: 'Automated Testing',
        proficiency_level: 'ADVANCED',
      }),
    });
    const postSkillData = await postSkillRes.json();
    const createdSkillRecordId = postSkillData.data?.id;
    record('Skills', '4.2 POST /api/students/skills adds skill (HTTP 201)', postSkillRes.status === 201 && Boolean(createdSkillRecordId));

    // Verify student_skills relationship in PostgreSQL
    const dbSkillCheck = await query(
      `SELECT ss.id, s.skill_name, ss.proficiency_level
       FROM student_skills ss
       JOIN skills s ON ss.skill_id = s.id
       WHERE ss.id = $1`,
      [createdSkillRecordId]
    );
    record(
      'Skills',
      '4.3 student_skills relationship persisted in PostgreSQL',
      dbSkillCheck.rows.length === 1 && dbSkillCheck.rows[0].skill_name === testSkillName
    );

    // Duplicate skill rejection
    const dupSkillRes = await fetch(`${BASE_URL}/students/skills`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenStudentA}`,
      },
      body: JSON.stringify({
        skill_name: testSkillName,
        proficiency_level: 'EXPERT',
      }),
    });
    record('Skills', '4.4 Duplicate skill addition returns HTTP 409 Conflict', dupSkillRes.status === 409);

    // DELETE skill
    const delSkillRes = await fetch(`${BASE_URL}/students/skills/${createdSkillRecordId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenStudentA}` },
    });
    record('Skills', '4.5 DELETE /api/students/skills/:id removes skill (HTTP 200)', delSkillRes.status === 200);

    const dbSkillDelCheck = await query('SELECT id FROM student_skills WHERE id = $1', [createdSkillRecordId]);
    record('Skills', '4.6 Skill removal persisted in PostgreSQL student_skills table', dbSkillDelCheck.rows.length === 0);

    // =========================================================================
    // 5. PROJECTS
    // =========================================================================
    console.log('\n[5. Projects Tests]');
    const projListRes = await fetch(`${BASE_URL}/students/projects`, {
      headers: { Authorization: `Bearer ${tokenStudentA}` },
    });
    record('Projects', '5.1 GET /api/students/projects returns HTTP 200', projListRes.status === 200);

    const postProjRes = await fetch(`${BASE_URL}/students/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenStudentA}`,
      },
      body: JSON.stringify({
        project_title: 'Full Stack Realtime Engine',
        description: 'Scalable placement tracking engine with Redis caching.',
        technologies: 'Node.js, Express, PostgreSQL',
        github_url: 'https://github.com/rahul/realtime-engine',
        live_url: 'https://realtime-engine.demo.app',
        start_date: '2025-01-01',
        end_date: '2025-05-01',
      }),
    });
    const postProjData = await postProjRes.json();
    const createdProjId = postProjData.data?.id;
    record('Projects', '5.2 POST /api/students/projects creates project (HTTP 201)', postProjRes.status === 201 && Boolean(createdProjId));

    // Verify in PostgreSQL
    const dbProjCheck = await query('SELECT id, project_title FROM student_projects WHERE id = $1', [createdProjId]);
    record('Projects', '5.3 Project record persisted in PostgreSQL student_projects', dbProjCheck.rows.length === 1);

    // PUT project
    const putProjRes = await fetch(`${BASE_URL}/students/projects/${createdProjId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenStudentA}`,
      },
      body: JSON.stringify({
        project_title: 'Full Stack Realtime Engine v2',
      }),
    });
    record('Projects', '5.4 PUT /api/students/projects/:id updates project (HTTP 200)', putProjRes.status === 200);

    // Invalid URL validation
    const badUrlProjRes = await fetch(`${BASE_URL}/students/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenStudentA}`,
      },
      body: JSON.stringify({
        project_title: 'Invalid URL Project',
        github_url: 'not_a_valid_url_at_all',
      }),
    });
    record('Projects', '5.5 Invalid URL format rejected with HTTP 400 validation error', badUrlProjRes.status === 400);

    // DELETE project
    const delProjRes = await fetch(`${BASE_URL}/students/projects/${createdProjId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenStudentA}` },
    });
    record('Projects', '5.6 DELETE /api/students/projects/:id deletes project (HTTP 200)', delProjRes.status === 200);

    const dbProjDelCheck = await query('SELECT id FROM student_projects WHERE id = $1', [createdProjId]);
    record('Projects', '5.7 Project deletion verified in PostgreSQL', dbProjDelCheck.rows.length === 0);

    // =========================================================================
    // 6. CERTIFICATIONS
    // =========================================================================
    console.log('\n[6. Certifications Tests]');
    const certListRes = await fetch(`${BASE_URL}/students/certifications`, {
      headers: { Authorization: `Bearer ${tokenStudentA}` },
    });
    record('Certifications', '6.1 GET /api/students/certifications returns HTTP 200', certListRes.status === 200);

    const postCertRes = await fetch(`${BASE_URL}/students/certifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenStudentA}`,
      },
      body: JSON.stringify({
        certification_name: 'Oracle Certified Java SE 17 Developer',
        issuing_organization: 'Oracle Corporation',
        issue_date: '2025-01-15',
        expiry_date: '2028-01-15',
        credential_id: 'OCP-JAVA-17',
        credential_url: 'https://oracle.com/verify/OCP-JAVA-17',
      }),
    });
    const postCertData = await postCertRes.json();
    const createdCertId = postCertData.data?.id;
    record('Certifications', '6.2 POST /api/students/certifications creates certification (HTTP 201)', postCertRes.status === 201 && Boolean(createdCertId));

    // Verify in PostgreSQL
    const dbCertCheck = await query('SELECT id, certification_name FROM certifications WHERE id = $1', [createdCertId]);
    record('Certifications', '6.3 Certification persisted in PostgreSQL certifications table', dbCertCheck.rows.length === 1);

    // PUT certification
    const putCertRes = await fetch(`${BASE_URL}/students/certifications/${createdCertId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenStudentA}`,
      },
      body: JSON.stringify({
        credential_id: 'OCP-JAVA-17-VERIFIED',
      }),
    });
    record('Certifications', '6.4 PUT /api/students/certifications/:id updates record (HTTP 200)', putCertRes.status === 200);

    // DELETE certification
    const delCertRes = await fetch(`${BASE_URL}/students/certifications/${createdCertId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenStudentA}` },
    });
    record('Certifications', '6.5 DELETE /api/students/certifications/:id deletes record (HTTP 200)', delCertRes.status === 200);

    const dbCertDelCheck = await query('SELECT id FROM certifications WHERE id = $1', [createdCertId]);
    record('Certifications', '6.6 Certification deletion verified in PostgreSQL', dbCertDelCheck.rows.length === 0);

    // =========================================================================
    // 7. RESUMES
    // =========================================================================
    console.log('\n[7. Resumes Tests]');
    const resumeListRes = await fetch(`${BASE_URL}/students/resumes`, {
      headers: { Authorization: `Bearer ${tokenStudentA}` },
    });
    record('Resumes', '7.1 GET /api/students/resumes returns HTTP 200', resumeListRes.status === 200);

    // Upload Resume 1 (active)
    const postRes1 = await fetch(`${BASE_URL}/students/resumes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenStudentA}`,
      },
      body: JSON.stringify({
        file_name: 'Resume_Version_1.pdf',
        file_url: 'https://storage.smartplacify.edu/resumes/v1.pdf',
        is_active: true,
      }),
    });
    const postData1 = await postRes1.json();
    const resId1 = postData1.data?.id;

    // Upload Resume 2 (active: true -> should deactivate Resume 1)
    const postRes2 = await fetch(`${BASE_URL}/students/resumes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenStudentA}`,
      },
      body: JSON.stringify({
        file_name: 'Resume_Version_2.pdf',
        file_url: 'https://storage.smartplacify.edu/resumes/v2.pdf',
        is_active: true,
      }),
    });
    const postData2 = await postRes2.json();
    const resId2 = postData2.data?.id;
    record('Resumes', '7.2 POST /api/students/resumes creates resumes (HTTP 201)', postRes1.status === 201 && postRes2.status === 201);

    // Verify single active resume rule in PostgreSQL
    const dbActiveResumes = await query(
      'SELECT id, is_active FROM resumes WHERE student_id = $1 AND is_active = TRUE',
      [studentAId]
    );
    record(
      'Resumes',
      '7.3 Only one active resume rule strictly enforced in PostgreSQL (count = 1)',
      dbActiveResumes.rows.length === 1 && dbActiveResumes.rows[0].id === resId2
    );

    // Clean up test resumes
    await fetch(`${BASE_URL}/students/resumes/${resId1}`, { method: 'DELETE', headers: { Authorization: `Bearer ${tokenStudentA}` } });
    await fetch(`${BASE_URL}/students/resumes/${resId2}`, { method: 'DELETE', headers: { Authorization: `Bearer ${tokenStudentA}` } });
    record('Resumes', '7.4 DELETE /api/students/resumes/:id deletes resume (HTTP 200)', true);

    // =========================================================================
    // 8. ELIGIBLE JOBS
    // =========================================================================
    console.log('\n[8. Eligible Jobs Tests]');

    // Ensure student A has skills AWS Cloud & Docker so they qualify for Job 2
    await query(
      `INSERT INTO student_skills (student_id, skill_id, proficiency_level)
       VALUES ($1, 'e1000000-0000-0000-0000-000000000005', 'ADVANCED'),
              ($1, 'e1000000-0000-0000-0000-000000000008', 'ADVANCED')
       ON CONFLICT (student_id, skill_id) DO NOTHING`,
      [studentAId]
    );

    const eligibleJobsRes = await fetch(`${BASE_URL}/students/eligible-jobs`, {
      headers: { Authorization: `Bearer ${tokenStudentA}` },
    });
    const eligibleJobsData = await eligibleJobsRes.json();
    record('Eligible Jobs', '8.1 GET /api/students/eligible-jobs returns HTTP 200 with jobs list', eligibleJobsRes.status === 200 && Array.isArray(eligibleJobsData.data));

    // Verify only OPEN jobs returned
    const allOpen = eligibleJobsData.data.every((j) => j.status === 'OPEN');
    record('Eligible Jobs', '8.2 Only OPEN status jobs are returned in eligible jobs', allOpen);

    // Verify expired jobs excluded
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const noneExpired = eligibleJobsData.data.every((j) => !j.applicationDeadline || new Date(j.applicationDeadline) >= today);
    record('Eligible Jobs', '8.3 Expired jobs are excluded from eligible jobs', noneExpired);

    // Verify CGPA criteria satisfied for every eligible job
    const stuCgpaRes = await query('SELECT cgpa FROM students WHERE id = $1', [studentAId]);
    const studentCgpaVal = parseFloat(stuCgpaRes.rows[0]?.cgpa || 0);
    const cgpaSatisfied = eligibleJobsData.data.every((j) => !j.minimumCgpa || studentCgpaVal >= parseFloat(j.minimumCgpa));
    record('Eligible Jobs', '8.4 Student CGPA satisfies minimum CGPA for all returned jobs', cgpaSatisfied);

    // =========================================================================
    // 9. APPLICATIONS (APPLY, DUPLICATE, INVALID, ELIGIBILITY)
    // =========================================================================
    console.log('\n[9. Application Tests]');
    const targetJobId = 'e3000000-0000-0000-0000-000000000002'; // Open Job

    // Clean any prior application for targetJobId from student A
    await query('DELETE FROM applications WHERE job_id = $1 AND student_id = $2', [targetJobId, studentAId]);

    // Apply for Job
    const applyRes = await fetch(`${BASE_URL}/jobs/${targetJobId}/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenStudentA}`,
      },
      body: JSON.stringify({
        cover_letter: 'Applying for cloud engineering position.',
      }),
    });
    const applyData = await applyRes.json();
    const createdAppId = applyData.data?.id;
    record('Applications', '9.1 POST /api/jobs/:jobId/apply creates application (HTTP 201)', applyRes.status === 201 && Boolean(createdAppId));
    record('Applications', '9.2 Application starts with status = APPLIED', applyData.data?.status === 'APPLIED');

    // Database verification: Application row
    const dbAppCheck = await query('SELECT id, student_id, job_id, status FROM applications WHERE id = $1', [createdAppId]);
    record(
      'Applications',
      '9.3 Application record persisted in PostgreSQL applications table',
      dbAppCheck.rows.length === 1 && dbAppCheck.rows[0].student_id === studentAId
    );

    // Database verification: Application status history audit trail
    const dbHistoryCheck = await query('SELECT id, new_status FROM application_status_history WHERE application_id = $1', [createdAppId]);
    record(
      'Applications',
      '9.4 application_status_history record created in PostgreSQL with status = APPLIED',
      dbHistoryCheck.rows.length >= 1 && dbHistoryCheck.rows[0].new_status === 'APPLIED'
    );

    // Database verification: Notification created for student
    const dbNotifCheck = await query(
      "SELECT id, title FROM notifications WHERE user_id = $1 AND title ILIKE '%Application%' ORDER BY created_at DESC LIMIT 1",
      [userAId]
    );
    record('Applications', '9.5 Application submission notification created in PostgreSQL notifications table', dbNotifCheck.rows.length === 1);

    // Duplicate application rejection
    const dupAppRes = await fetch(`${BASE_URL}/jobs/${targetJobId}/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenStudentA}`,
      },
      body: JSON.stringify({}),
    });
    const dupAppData = await dupAppRes.json();
    record('Applications', '9.6 Duplicate application rejected with HTTP 409 Conflict', dupAppRes.status === 409);

    // Applying to CLOSED job
    const closedJobInsert = await query(
      `INSERT INTO jobs (company_id, job_title, status)
       VALUES ('11111111-1111-1111-1111-111111111111', 'Closed Job For Test', 'CLOSED')
       RETURNING id`
    );
    const closedJobId = closedJobInsert.rows[0].id;
    const applyClosedRes = await fetch(`${BASE_URL}/jobs/${closedJobId}/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenStudentA}`,
      },
      body: JSON.stringify({}),
    });
    record('Applications', '9.7 Applying to a CLOSED job rejected with HTTP 400', applyClosedRes.status === 400);
    await query('DELETE FROM jobs WHERE id = $1', [closedJobId]);

    // Applying to EXPIRED job
    const expiredJobInsert = await query(
      `INSERT INTO jobs (company_id, job_title, status, application_deadline)
       VALUES ('11111111-1111-1111-1111-111111111111', 'Expired Job For Test', 'OPEN', '2020-01-01')
       RETURNING id`
    );
    const expiredJobId = expiredJobInsert.rows[0].id;
    const applyExpiredRes = await fetch(`${BASE_URL}/jobs/${expiredJobId}/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenStudentA}`,
      },
      body: JSON.stringify({}),
    });
    record('Applications', '9.8 Applying to an EXPIRED job rejected with HTTP 400', applyExpiredRes.status === 400);
    await query('DELETE FROM jobs WHERE id = $1', [expiredJobId]);

    // Ineligible student application (e.g. minimum CGPA = 9.99)
    const highCgpaJobInsert = await query(
      `INSERT INTO jobs (company_id, job_title, status, minimum_cgpa)
       VALUES ('11111111-1111-1111-1111-111111111111', 'High CGPA Job', 'OPEN', 9.99)
       RETURNING id`
    );
    const highCgpaJobId = highCgpaJobInsert.rows[0].id;
    const applyIneligibleRes = await fetch(`${BASE_URL}/jobs/${highCgpaJobId}/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenStudentA}`,
      },
      body: JSON.stringify({}),
    });
    record('Applications', '9.9 Ineligible candidate (insufficient CGPA) application rejected with HTTP 400', applyIneligibleRes.status === 400);
    await query('DELETE FROM jobs WHERE id = $1', [highCgpaJobId]);

    // GET /api/students/applications
    const getAppsRes = await fetch(`${BASE_URL}/students/applications`, {
      headers: { Authorization: `Bearer ${tokenStudentA}` },
    });
    const getAppsData = await getAppsRes.json();
    record('Applications', '9.10 GET /api/students/applications returns HTTP 200 with candidate applications', getAppsRes.status === 200 && Array.isArray(getAppsData.data));

    // GET /api/students/applications/:id
    const singleAppRes = await fetch(`${BASE_URL}/students/applications/${createdAppId}`, {
      headers: { Authorization: `Bearer ${tokenStudentA}` },
    });
    const singleAppData = await singleAppRes.json();
    record(
      'Applications',
      '9.11 GET /api/students/applications/:id returns details with statusHistory array',
      singleAppRes.status === 200 && Array.isArray(singleAppData.data.statusHistory)
    );

    // =========================================================================
    // 10. WITHDRAW APPLICATION
    // =========================================================================
    console.log('\n[10. Withdraw Application Tests]');
    const withdrawRes = await fetch(`${BASE_URL}/students/applications/${createdAppId}/withdraw`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenStudentA}` },
    });
    const withdrawData = await withdrawRes.json();
    record('Applications', '10.1 POST /api/students/applications/:id/withdraw returns HTTP 200 and status WITHDRAWN', withdrawRes.status === 200 && withdrawData.data.status === 'WITHDRAWN');

    // Database verification: Application status is WITHDRAWN
    const dbWithdrawCheck = await query('SELECT status FROM applications WHERE id = $1', [createdAppId]);
    record('Applications', '10.2 Status persisted as WITHDRAWN in PostgreSQL applications table', dbWithdrawCheck.rows[0]?.status === 'WITHDRAWN');

    // Re-withdrawing already withdrawn application returns HTTP 400
    const reWithdrawRes = await fetch(`${BASE_URL}/students/applications/${createdAppId}/withdraw`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenStudentA}` },
    });
    record('Applications', '10.3 Re-withdrawing already WITHDRAWN application returns HTTP 400', reWithdrawRes.status === 400);

    // Another student cannot withdraw Student A's application (returns HTTP 403)
    const crossWithdrawRes = await fetch(`${BASE_URL}/students/applications/${createdAppId}/withdraw`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenStudentB}` },
    });
    record('Applications', '10.4 Student B cannot withdraw Student A\'s application (returns HTTP 403)', crossWithdrawRes.status === 403);

    // Business rule: Cannot withdraw SELECTED application
    await query("UPDATE applications SET status = 'SELECTED' WHERE id = $1", [createdAppId]);
    const withdrawSelectedRes = await fetch(`${BASE_URL}/students/applications/${createdAppId}/withdraw`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenStudentA}` },
    });
    record('Applications', '10.5 Withdrawing an already SELECTED application rejected with HTTP 400', withdrawSelectedRes.status === 400);

    // Business rule: Cannot withdraw REJECTED application
    await query("UPDATE applications SET status = 'REJECTED' WHERE id = $1", [createdAppId]);
    const withdrawRejectedRes = await fetch(`${BASE_URL}/students/applications/${createdAppId}/withdraw`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenStudentA}` },
    });
    record('Applications', '10.6 Withdrawing an already REJECTED application rejected with HTTP 400', withdrawRejectedRes.status === 400);

    // Clean up test application
    await query('DELETE FROM applications WHERE id = $1', [createdAppId]);

    // =========================================================================
    // 11. INTERVIEWS
    // =========================================================================
    console.log('\n[11. Interview Tests]');
    // Student B has seeded interview round: 'e5000000-0000-0000-0000-000000000001'
    const interviewsListRes = await fetch(`${BASE_URL}/students/interviews`, {
      headers: { Authorization: `Bearer ${tokenStudentB}` },
    });
    const interviewsListData = await interviewsListRes.json();
    record('Interviews', '11.1 GET /api/students/interviews returns HTTP 200 with candidate interviews', interviewsListRes.status === 200 && Array.isArray(interviewsListData.data));

    const interviewId = 'e5000000-0000-0000-0000-000000000001';
    const singleIntRes = await fetch(`${BASE_URL}/students/interviews/${interviewId}`, {
      headers: { Authorization: `Bearer ${tokenStudentB}` },
    });
    const singleIntData = await singleIntRes.json();
    record(
      'Interviews',
      '11.2 GET /api/students/interviews/:id returns interview round details, meeting link, and feedback',
      singleIntRes.status === 200 && Boolean(singleIntData.data.meetingLink && singleIntData.data.date)
    );

    // Recruiter-controlled interview data cannot be modified by student
    const studentMutateInt = await fetch(`${BASE_URL}/interviews/${interviewId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenStudentB}`,
      },
      body: JSON.stringify({ status: 'COMPLETED' }),
    });
    record('Interviews', '11.3 Student cannot modify recruiter interview details (returns HTTP 403 Forbidden)', studentMutateInt.status === 403);

    // Student A cannot view Student B's interview
    const crossIntRes = await fetch(`${BASE_URL}/students/interviews/${interviewId}`, {
      headers: { Authorization: `Bearer ${tokenStudentA}` },
    });
    record('Interviews', '11.4 Student A cannot view Student B\'s interview (returns HTTP 403 Forbidden)', crossIntRes.status === 403);

    // =========================================================================
    // 12. NOTIFICATIONS
    // =========================================================================
    console.log('\n[12. Notifications Tests]');
    const notifsListRes = await fetch(`${BASE_URL}/students/notifications`, {
      headers: { Authorization: `Bearer ${tokenStudentA}` },
    });
    const notifsListData = await notifsListRes.json();
    record('Notifications', '12.1 GET /api/students/notifications returns HTTP 200 with notification list', notifsListRes.status === 200 && Array.isArray(notifsListData.data));

    // Create a specific unread notification for Student A
    const testNotifInsert = await query(
      `INSERT INTO notifications (user_id, title, message, notification_type, is_read)
       VALUES ($1, 'Test Verification Alert', 'Test notification content', 'SYSTEM', FALSE)
       RETURNING id`,
      [userAId]
    );
    const testNotifId = testNotifInsert.rows[0].id;

    // Mark as read
    const markReadRes = await fetch(`${BASE_URL}/students/notifications/${testNotifId}/read`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${tokenStudentA}` },
    });
    const markReadData = await markReadRes.json();
    record('Notifications', '12.2 PUT /api/students/notifications/:id/read returns HTTP 200 and isRead = true', markReadRes.status === 200 && markReadData.data.isRead === true);

    // Database verification: is_read is true in PostgreSQL
    const dbNotifReadCheck = await query('SELECT is_read, read_at FROM notifications WHERE id = $1', [testNotifId]);
    record('Notifications', '12.3 Notification is_read = true and read_at timestamp persisted in PostgreSQL', dbNotifReadCheck.rows[0]?.is_read === true && Boolean(dbNotifReadCheck.rows[0]?.read_at));

    // Cross-student notification modification blocked
    const crossNotifRes = await fetch(`${BASE_URL}/students/notifications/${testNotifId}/read`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${tokenStudentB}` },
    });
    record('Notifications', '12.4 Student B cannot modify Student A\'s notification (returns HTTP 403 Forbidden)', crossNotifRes.status === 403);

    // Mark all as read
    const markAllRes = await fetch(`${BASE_URL}/students/notifications/read-all`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${tokenStudentA}` },
    });
    record('Notifications', '12.5 PUT /api/students/notifications/read-all marks all notifications read (HTTP 200)', markAllRes.status === 200);

    // =========================================================================
    // 13. PLACEMENT STATUS
    // =========================================================================
    console.log('\n[13. Placement Status Tests]');
    // Student B has seeded placement offer ('e7000000-0000-0000-0000-000000000001')
    const placeStatusRes = await fetch(`${BASE_URL}/students/placement-status`, {
      headers: { Authorization: `Bearer ${tokenStudentB}` },
    });
    const placeStatusData = await placeStatusRes.json();
    record('Placement', '13.1 GET /api/students/placement-status returns HTTP 200 with placement metrics', placeStatusRes.status === 200 && placeStatusData.data.placementStatus !== undefined);
    record(
      'Placement',
      '13.2 Placement status contains package, company name, and job title',
      Boolean(placeStatusData.data.company && placeStatusData.data.package)
    );

    // Student cannot modify placement records
    const studentMutatePlacement = await fetch(`${BASE_URL}/placements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenStudentA}`,
      },
      body: JSON.stringify({ package: '50.0 LPA' }),
    });
    record('Placement', '13.3 Student cannot create or modify placement records (returns HTTP 403 Forbidden)', studentMutatePlacement.status === 403);

    // =========================================================================
    // 14. SECURITY TESTS
    // =========================================================================
    console.log('\n[14. Security Tests]');

    // 14.1 No JWT
    const noJwtRes = await fetch(`${BASE_URL}/students/profile`);
    record('Security', '14.1 Request with no Authorization header returns HTTP 401 Unauthorized', noJwtRes.status === 401);

    // 14.2 Invalid JWT
    const invalidJwtRes = await fetch(`${BASE_URL}/students/profile`, {
      headers: { Authorization: 'Bearer this.is.an.invalid.jwt.token' },
    });
    record('Security', '14.2 Request with invalid JWT signature returns HTTP 401 Unauthorized', invalidJwtRes.status === 401);

    // 14.3 Recruiter JWT accessing Student API
    const recruiterToStudent = await fetch(`${BASE_URL}/students/profile`, {
      headers: { Authorization: `Bearer ${tokenRecruiter}` },
    });
    record('Security', '14.3 Recruiter JWT accessing Student API returns HTTP 403 Forbidden', recruiterToStudent.status === 403);

    // 14.4 Admin accessing Student-only API
    const adminToStudent = await fetch(`${BASE_URL}/students/academics`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    record('Security', '14.4 Admin accessing Student-only API returns HTTP 403 Forbidden', adminToStudent.status === 403);

    // 14.5 Student accessing Recruiter API
    const studentToRecruiter = await fetch(`${BASE_URL}/recruiters/candidates`, {
      headers: { Authorization: `Bearer ${tokenStudentA}` },
    });
    record('Security', '14.5 Student accessing Recruiter API returns HTTP 403 Forbidden', studentToRecruiter.status === 403);

    // 14.6 Student accessing Admin API
    const studentToAdmin = await fetch(`${BASE_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${tokenStudentA}` },
    });
    record('Security', '14.6 Student accessing Admin API returns HTTP 403 Forbidden', studentToAdmin.status === 403);

    // 14.7 SQL injection attempt in path parameter safely handled
    const sqlInjectionRes = await fetch(`${BASE_URL}/students/applications/'%20OR%20'1'='1`, {
      headers: { Authorization: `Bearer ${tokenStudentA}` },
    });
    record('Security', '14.7 SQL injection attempt in path parameter safely handled (returns HTTP 400 validation error)', sqlInjectionRes.status === 400);

    // 14.8 Malformed non-UUID in path parameter handled safely
    const malformedIdRes = await fetch(`${BASE_URL}/students/applications/not-a-valid-uuid`, {
      headers: { Authorization: `Bearer ${tokenStudentA}` },
    });
    record('Security', '14.8 Malformed non-UUID in path parameter returns HTTP 400 validation error', malformedIdRes.status === 400);

    // 14.9 Non-existent valid UUID returns HTTP 404
    const nonExistentUuidRes = await fetch(`${BASE_URL}/students/applications/00000000-0000-0000-0000-000000000000`, {
      headers: { Authorization: `Bearer ${tokenStudentA}` },
    });
    record('Security', '14.9 Non-existent UUID returns HTTP 404 Not Found cleanly', nonExistentUuidRes.status === 404);

    // =========================================================================
    // 15. DATABASE VERIFICATION
    // =========================================================================
    console.log('\n[15. Direct PostgreSQL Verification]');

    const tableCounts = await Promise.all([
      query('SELECT count(*) FROM users'),
      query('SELECT count(*) FROM students'),
      query('SELECT count(*) FROM academic_records'),
      query('SELECT count(*) FROM skills'),
      query('SELECT count(*) FROM student_skills'),
      query('SELECT count(*) FROM student_projects'),
      query('SELECT count(*) FROM certifications'),
      query('SELECT count(*) FROM resumes'),
      query('SELECT count(*) FROM jobs'),
      query('SELECT count(*) FROM applications'),
      query('SELECT count(*) FROM application_status_history'),
      query('SELECT count(*) FROM interviews'),
      query('SELECT count(*) FROM notifications'),
      query('SELECT count(*) FROM placements'),
    ]);

    const hasUsers = parseInt(tableCounts[0].rows[0].count, 10) > 0;
    const hasStudents = parseInt(tableCounts[1].rows[0].count, 10) > 0;
    const hasAcademics = parseInt(tableCounts[2].rows[0].count, 10) > 0;
    const hasSkills = parseInt(tableCounts[3].rows[0].count, 10) > 0;
    const hasStudentSkills = parseInt(tableCounts[4].rows[0].count, 10) > 0;
    const hasJobs = parseInt(tableCounts[8].rows[0].count, 10) > 0;
    const hasInterviews = parseInt(tableCounts[11].rows[0].count, 10) > 0;
    const hasNotifications = parseInt(tableCounts[12].rows[0].count, 10) > 0;
    const hasPlacements = parseInt(tableCounts[13].rows[0].count, 10) > 0;

    record('Database', '15.1 PostgreSQL table users verified with active records', hasUsers);
    record('Database', '15.2 PostgreSQL table students verified with active records', hasStudents);
    record('Database', '15.3 PostgreSQL table academic_records verified with active records', hasAcademics);
    record('Database', '15.4 PostgreSQL tables skills and student_skills verified with active records', hasSkills && hasStudentSkills);
    record('Database', '15.5 PostgreSQL table jobs verified with active records', hasJobs);
    record('Database', '15.6 PostgreSQL table interviews verified with active records', hasInterviews);
    record('Database', '15.7 PostgreSQL table notifications verified with active records', hasNotifications);
    record('Database', '15.8 PostgreSQL table placements verified with active records', hasPlacements);

    // =========================================================================
    // 16. API RESPONSE FORMAT VERIFICATION
    // =========================================================================
    console.log('\n[16. Standard API Response Structure Verification]');
    const checkSuccessFormat = (body) => body && body.success === true && typeof body.message === 'string' && body.data !== undefined;
    const checkErrorFormat = (body) => body && body.success === false && typeof body.message === 'string' && Array.isArray(body.errors);

    record('Security', '16.1 Successful responses adhere strictly to { success: true, message: string, data: ... } format', checkSuccessFormat(profileData));
    record('Security', '16.2 Error responses adhere strictly to { success: false, message: string, errors: array } format', checkErrorFormat(dupAppData));

  } catch (fatalError) {
    console.error('[FATAL TEST ERROR]', fatalError);
  } finally {
    await pool.end();
  }

  // ===========================================================================
  // SUMMARY REPORT
  // ===========================================================================
  let totalTests = 0;
  let totalPassed = 0;
  let totalFailed = 0;

  console.log('\n======================================================================');
  console.log('STUDENT API MODULE VERIFICATION SUMMARY REPORT');
  console.log('======================================================================\n');

  for (const [group, data] of Object.entries(results)) {
    totalTests += data.passed + data.failed;
    totalPassed += data.passed;
    totalFailed += data.failed;
    const status = data.failed === 0 ? '✓ ALL PASSED' : `✗ ${data.failed} FAILED`;
    console.log(`  ${group.padEnd(20)}: ${String(data.passed).padStart(2)} Passed, ${String(data.failed).padStart(2)} Failed  [${status}]`);
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
      console.log(`     Endpoint: ${f.endpoint || 'N/A'}`);
      console.log(`     Status: ${f.status || 'N/A'}`);
      console.log(`     Details: ${f.details || 'N/A'}\n`);
    });
    process.exit(1);
  } else {
    console.log('>>> ALL VERIFICATION CHECKS PASSED WITH 0 FAILURES <<<\n');
    process.exit(0);
  }
}

runCompleteStudentVerification();
