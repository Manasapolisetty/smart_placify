import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import app from '../app.js';
import { pool, query } from '../config/database.js';

async function runStudentTests() {
  console.log('====================================================');
  console.log('SMARTPLACIFY — COMPLETE STUDENT API MODULE TEST SUITE');
  console.log('====================================================\n');

  // Start server on an ephemeral port to prevent EADDRINUSE conflicts
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

  try {
    // -------------------------------------------------------------------------
    // Setup test accounts: Student A, Student B, Recruiter, Admin
    // -------------------------------------------------------------------------
    console.log('--- SETUP: Authenticating Test Users ---');
    
    // Login Student A (Rahul Kumar)
    const loginResA = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'rahul.kumar@university.edu.in',
        password: 'password123',
      }),
    });
    const loginDataA = await loginResA.json();
    const tokenA = loginDataA.token;
    assert('Setup: Student A logged in successfully', Boolean(tokenA), `Status: ${loginResA.status}`);

    // Login Student B (Demo Student)
    const loginResB = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'student.demo@smartplacify.edu',
        password: 'password123',
      }),
    });
    const loginDataB = await loginResB.json();
    const tokenB = loginDataB.token;
    assert('Setup: Student B logged in successfully', Boolean(tokenB), `Status: ${loginResB.status}`);

    // Login Recruiter
    const loginResRecruiter = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'priya.sharma@techcorp.com',
        password: 'password123',
      }),
    });
    const loginDataRecruiter = await loginResRecruiter.json();
    const tokenRecruiter = loginDataRecruiter.token;

    // Login Admin
    const loginResAdmin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@smartplacify.edu.in',
        password: 'password123',
      }),
    });
    const loginDataAdmin = await loginResAdmin.json();
    const tokenAdmin = loginDataAdmin.token;

    // =========================================================================
    // 1. STUDENT PROFILE GET & PUT
    // =========================================================================
    console.log('\n--- 1. STUDENT PROFILE ---');
    const profileRes = await fetch(`${baseUrl}/api/students/profile`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const profileData = await profileRes.json();
    assert(
      '1.1 GET /api/students/profile returns HTTP 200 with complete profile',
      profileRes.status === 200 && profileData.success === true && profileData.data.email === 'rahul.kumar@university.edu.in',
      `Status: ${profileRes.status}`
    );
    assert(
      '1.2 Profile contains department, course, roll number, and stats',
      Boolean(profileData.data.department && profileData.data.rollNumber && profileData.data.stats),
      `Dept: ${profileData.data.department}`
    );

    // Update safe profile fields
    const newAddress = `Campus Tower ${Date.now()}`;
    const updateProfileRes = await fetch(`${baseUrl}/api/students/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        name: 'Rahul Kumar Updated',
        address: newAddress,
        gender: 'Male',
        phone: '+91 99999 88888',
      }),
    });
    const updateProfileData = await updateProfileRes.json();
    assert(
      '1.3 PUT /api/students/profile updates safe fields successfully (HTTP 200)',
      updateProfileRes.status === 200 && updateProfileData.data.address === newAddress,
      `Status: ${updateProfileRes.status}`
    );

    // Attempt tampering with role / account status
    const tamperRes = await fetch(`${baseUrl}/api/students/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        role: 'ADMIN',
        status: 'SUSPENDED',
      }),
    });
    const tamperData = await tamperRes.json();
    assert(
      '1.4 Student CANNOT modify role or account status via profile update',
      tamperData.data?.role === 'STUDENT' && tamperData.data?.status === 'ACTIVE',
      `Role returned: ${tamperData.data?.role}`
    );

    // =========================================================================
    // 2. ACADEMIC RECORDS
    // =========================================================================
    console.log('\n--- 2. ACADEMIC RECORDS ---');
    const getAcadRes = await fetch(`${baseUrl}/api/students/academics`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const getAcadData = await getAcadRes.json();
    assert(
      '2.1 GET /api/students/academics returns HTTP 200',
      getAcadRes.status === 200 && Array.isArray(getAcadData.data.records),
      `Status: ${getAcadRes.status}`
    );

    const testSemester = `Semester ${Date.now().toString().slice(-4)}`;
    const postAcadRes = await fetch(`${baseUrl}/api/students/academics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        semester: testSemester,
        academic_year: '2025-2026',
        cgpa: 8.85,
        percentage: 88.5,
        backlogs: 0,
      }),
    });
    const postAcadData = await postAcadRes.json();
    assert(
      '2.2 POST /api/students/academics creates record (HTTP 201)',
      postAcadRes.status === 201 && postAcadData.data.semester === testSemester,
      `Status: ${postAcadRes.status}`
    );
    const createdAcadId = postAcadData.data.id;

    // Duplicate semester prevention
    const dupAcadRes = await fetch(`${baseUrl}/api/students/academics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        semester: testSemester,
        academic_year: '2025-2026',
        cgpa: 8.90,
      }),
    });
    assert(
      '2.3 Duplicate semester academic record returns HTTP 409 Conflict',
      dupAcadRes.status === 409,
      `Status: ${dupAcadRes.status}`
    );

    // Update academic record
    const putAcadRes = await fetch(`${baseUrl}/api/students/academics/${createdAcadId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        cgpa: 9.10,
        percentage: 91.0,
      }),
    });
    const putAcadData = await putAcadRes.json();
    assert(
      '2.4 PUT /api/students/academics/:id updates record (HTTP 200)',
      putAcadRes.status === 200 && parseFloat(putAcadData.data.cgpa) === 9.10,
      `Status: ${putAcadRes.status}`
    );

    // Delete academic record
    const delAcadRes = await fetch(`${baseUrl}/api/students/academics/${createdAcadId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(
      '2.5 DELETE /api/students/academics/:id deletes record (HTTP 200)',
      delAcadRes.status === 200,
      `Status: ${delAcadRes.status}`
    );

    // =========================================================================
    // 3. SKILLS
    // =========================================================================
    console.log('\n--- 3. SKILLS ---');
    const getSkillsRes = await fetch(`${baseUrl}/api/students/skills`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const getSkillsData = await getSkillsRes.json();
    assert(
      '3.1 GET /api/students/skills returns HTTP 200 and list',
      getSkillsRes.status === 200 && Array.isArray(getSkillsData.data),
      `Status: ${getSkillsRes.status}`
    );

    const testSkillName = `Skill_${Date.now().toString().slice(-5)}`;
    const postSkillRes = await fetch(`${baseUrl}/api/students/skills`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        skill_name: testSkillName,
        skill_category: 'Automated Testing',
        proficiency_level: 'ADVANCED',
      }),
    });
    const postSkillData = await postSkillRes.json();
    assert(
      '3.2 POST /api/students/skills adds new skill (HTTP 201)',
      postSkillRes.status === 201 && postSkillData.data.skillName === testSkillName,
      `Status: ${postSkillRes.status}`
    );
    const addedSkillRecordId = postSkillData.data.id;

    // Prevent duplicate skill addition
    const dupSkillRes = await fetch(`${baseUrl}/api/students/skills`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        skill_name: testSkillName,
        proficiency_level: 'EXPERT',
      }),
    });
    assert(
      '3.3 Duplicate skill addition returns HTTP 409 Conflict',
      dupSkillRes.status === 409,
      `Status: ${dupSkillRes.status}`
    );

    // Delete skill
    const delSkillRes = await fetch(`${baseUrl}/api/students/skills/${addedSkillRecordId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(
      '3.4 DELETE /api/students/skills/:id removes skill (HTTP 200)',
      delSkillRes.status === 200,
      `Status: ${delSkillRes.status}`
    );

    // =========================================================================
    // 4. PROJECTS
    // =========================================================================
    console.log('\n--- 4. PROJECTS ---');
    const getProjRes = await fetch(`${baseUrl}/api/students/projects`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const getProjData = await getProjRes.json();
    assert(
      '4.1 GET /api/students/projects returns HTTP 200',
      getProjRes.status === 200 && Array.isArray(getProjData.data),
      `Status: ${getProjRes.status}`
    );

    const postProjRes = await fetch(`${baseUrl}/api/students/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        project_title: 'Automated Microservices Architecture',
        description: 'End-to-end distributed system using Node.js and Postgres.',
        technologies: 'Node.js, Express, PostgreSQL, Redis',
        github_url: 'https://github.com/rahul/microservices',
        live_url: 'https://microservices.demo.app',
        start_date: '2025-01-01',
        end_date: '2025-04-01',
      }),
    });
    const postProjData = await postProjRes.json();
    assert(
      '4.2 POST /api/students/projects creates project (HTTP 201)',
      postProjRes.status === 201 && postProjData.data.projectTitle === 'Automated Microservices Architecture',
      `Status: ${postProjRes.status}`
    );
    const createdProjId = postProjData.data.id;

    // Update project
    const putProjRes = await fetch(`${baseUrl}/api/students/projects/${createdProjId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        project_title: 'Automated Microservices Architecture (Production)',
      }),
    });
    const putProjData = await putProjRes.json();
    assert(
      '4.3 PUT /api/students/projects/:id updates project (HTTP 200)',
      putProjRes.status === 200 && putProjData.data.projectTitle.includes('(Production)'),
      `Status: ${putProjRes.status}`
    );

    // Delete project
    const delProjRes = await fetch(`${baseUrl}/api/students/projects/${createdProjId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(
      '4.4 DELETE /api/students/projects/:id deletes project (HTTP 200)',
      delProjRes.status === 200,
      `Status: ${delProjRes.status}`
    );

    // =========================================================================
    // 5. CERTIFICATIONS
    // =========================================================================
    console.log('\n--- 5. CERTIFICATIONS ---');
    const getCertsRes = await fetch(`${baseUrl}/api/students/certifications`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const getCertsData = await getCertsRes.json();
    assert(
      '5.1 GET /api/students/certifications returns HTTP 200',
      getCertsRes.status === 200 && Array.isArray(getCertsData.data),
      `Status: ${getCertsRes.status}`
    );

    const postCertRes = await fetch(`${baseUrl}/api/students/certifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        certification_name: 'Certified Kubernetes Administrator',
        issuing_organization: 'Linux Foundation / CNCF',
        issue_date: '2025-02-15',
        expiry_date: '2028-02-15',
        credential_id: 'CKA-998877',
        credential_url: 'https://cncf.io/verify/CKA-998877',
      }),
    });
    const postCertData = await postCertRes.json();
    assert(
      '5.2 POST /api/students/certifications adds certification (HTTP 201)',
      postCertRes.status === 201 && postCertData.data.certificationName === 'Certified Kubernetes Administrator',
      `Status: ${postCertRes.status}`
    );
    const createdCertId = postCertData.data.id;

    // Update certification
    const putCertRes = await fetch(`${baseUrl}/api/students/certifications/${createdCertId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        credential_id: 'CKA-998877-UPDATED',
      }),
    });
    const putCertData = await putCertRes.json();
    assert(
      '5.3 PUT /api/students/certifications/:id updates certification (HTTP 200)',
      putCertRes.status === 200 && putCertData.data.credentialId === 'CKA-998877-UPDATED',
      `Status: ${putCertRes.status}`
    );

    // Delete certification
    const delCertRes = await fetch(`${baseUrl}/api/students/certifications/${createdCertId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(
      '5.4 DELETE /api/students/certifications/:id deletes certification (HTTP 200)',
      delCertRes.status === 200,
      `Status: ${delCertRes.status}`
    );

    // =========================================================================
    // 6. RESUMES
    // =========================================================================
    console.log('\n--- 6. RESUMES ---');
    const getResumesRes = await fetch(`${baseUrl}/api/students/resumes`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const getResumesData = await getResumesRes.json();
    assert(
      '6.1 GET /api/students/resumes returns HTTP 200',
      getResumesRes.status === 200 && Array.isArray(getResumesData.data),
      `Status: ${getResumesRes.status}`
    );

    const postResumeRes = await fetch(`${baseUrl}/api/students/resumes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        file_name: 'Rahul_Kumar_Resume_Latest.pdf',
        file_url: 'https://storage.smartplacify.edu/resumes/rahul_kumar_latest.pdf',
        is_active: true,
      }),
    });
    const postResumeData = await postResumeRes.json();
    assert(
      '6.2 POST /api/students/resumes saves resume metadata (HTTP 201)',
      postResumeRes.status === 201 && postResumeData.data.fileName === 'Rahul_Kumar_Resume_Latest.pdf',
      `Status: ${postResumeRes.status}`
    );
    const createdResumeId = postResumeData.data.id;
    assert('6.3 Active flag is marked true', postResumeData.data.isActive === true);

    // Update resume
    const putResumeRes = await fetch(`${baseUrl}/api/students/resumes/${createdResumeId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        file_name: 'Rahul_Kumar_Final.pdf',
      }),
    });
    const putResumeData = await putResumeRes.json();
    assert(
      '6.4 PUT /api/students/resumes/:id updates resume (HTTP 200)',
      putResumeRes.status === 200 && putResumeData.data.fileName === 'Rahul_Kumar_Final.pdf',
      `Status: ${putResumeRes.status}`
    );

    // Delete resume
    const delResumeRes = await fetch(`${baseUrl}/api/students/resumes/${createdResumeId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(
      '6.5 DELETE /api/students/resumes/:id deletes resume (HTTP 200)',
      delResumeRes.status === 200,
      `Status: ${delResumeRes.status}`
    );

    // =========================================================================
    // 7. ELIGIBLE JOBS
    // =========================================================================
    console.log('\n--- 7. ELIGIBLE JOBS ---');

    // Add required skills (AWS Cloud, Docker) so Student A qualifies for Job 2
    await fetch(`${baseUrl}/api/students/skills`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ skill_name: 'AWS Cloud', skill_category: 'Cloud Infrastructure', proficiency_level: 'ADVANCED' }),
    });
    await fetch(`${baseUrl}/api/students/skills`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ skill_name: 'Docker', skill_category: 'DevOps & Containers', proficiency_level: 'ADVANCED' }),
    });

    const eligibleRes = await fetch(`${baseUrl}/api/students/eligible-jobs`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const eligibleData = await eligibleRes.json();
    assert(
      '7.1 GET /api/students/eligible-jobs returns HTTP 200',
      eligibleRes.status === 200 && Array.isArray(eligibleData.data),
      `Status: ${eligibleRes.status}`
    );
    assert(
      '7.2 Returned jobs are all OPEN status and unexpired',
      eligibleData.data.every((j) => j.status === 'OPEN'),
      `Total eligible jobs: ${eligibleData.data.length}`
    );

    // =========================================================================
    // 8. APPLICATIONS (APPLY, DUPLICATE PREVENTION, LIST, WITHDRAW)
    // =========================================================================
    console.log('\n--- 8. APPLICATIONS ---');
    
    // Pick an eligible job that Student A has not yet applied to
    // In seed, Demo Student applied to Job 1 ('e3000000-0000-0000-0000-000000000001')
    // Job 2 is 'e3000000-0000-0000-0000-000000000002'
    const targetJobId = 'e3000000-0000-0000-0000-000000000002';

    // Apply for Job 2
    const applyRes = await fetch(`${baseUrl}/api/jobs/${targetJobId}/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        cover_letter: 'Excited to apply for Associate Cloud Engineer role.',
      }),
    });
    const applyData = await applyRes.json();
    assert(
      '8.1 POST /api/jobs/:jobId/apply creates application (HTTP 201)',
      applyRes.status === 201 && applyData.data.jobId === targetJobId && applyData.data.status === 'APPLIED',
      `Status: ${applyRes.status}`
    );
    const newApplicationId = applyData.data.id;

    // Verify 9-step atomic creation in DB (Application status history & Notification)
    const historyDb = await query(
      'SELECT id, old_status, new_status FROM application_status_history WHERE application_id = $1',
      [newApplicationId]
    );
    assert(
      '8.2 Application status history record generated with status APPLIED',
      historyDb.rows.length >= 1 && historyDb.rows[0].new_status === 'APPLIED',
      `Found history rows: ${historyDb.rows.length}`
    );

    // Duplicate Application Prevention
    const dupApplyRes = await fetch(`${baseUrl}/api/jobs/${targetJobId}/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({}),
    });
    assert(
      '8.3 Duplicate application is strictly prevented with HTTP 409 Conflict',
      dupApplyRes.status === 409,
      `Status: ${dupApplyRes.status}`
    );

    // List student applications
    const listAppsRes = await fetch(`${baseUrl}/api/students/applications`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const listAppsData = await listAppsRes.json();
    assert(
      '8.4 GET /api/students/applications returns candidate applications list (HTTP 200)',
      listAppsRes.status === 200 && Array.isArray(listAppsData.data) && listAppsData.data.some((a) => a.id === newApplicationId),
      `Count: ${listAppsData.data?.length}`
    );

    // Single application by ID
    const singleAppRes = await fetch(`${baseUrl}/api/students/applications/${newApplicationId}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const singleAppData = await singleAppRes.json();
    assert(
      '8.5 GET /api/students/applications/:id returns application with status history',
      singleAppRes.status === 200 && Array.isArray(singleAppData.data.statusHistory),
      `Status: ${singleAppRes.status}`
    );

    // Withdraw application
    const withdrawRes = await fetch(`${baseUrl}/api/students/applications/${newApplicationId}/withdraw`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const withdrawData = await withdrawRes.json();
    assert(
      '8.6 POST /api/students/applications/:id/withdraw updates status to WITHDRAWN (HTTP 200)',
      withdrawRes.status === 200 && withdrawData.data.status === 'WITHDRAWN',
      `Status: ${withdrawRes.status}`
    );

    // Attempting to withdraw again returns 400
    const reWithdrawRes = await fetch(`${baseUrl}/api/students/applications/${newApplicationId}/withdraw`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(
      '8.7 Attempting to withdraw already withdrawn application returns HTTP 400',
      reWithdrawRes.status === 400,
      `Status: ${reWithdrawRes.status}`
    );

    // =========================================================================
    // 9. INTERVIEWS
    // =========================================================================
    console.log('\n--- 9. INTERVIEWS ---');
    // Using Student B who has seeded interview 'e5000000-0000-0000-0000-000000000001'
    const getInterviewsRes = await fetch(`${baseUrl}/api/students/interviews`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const getInterviewsData = await getInterviewsRes.json();
    assert(
      '9.1 GET /api/students/interviews returns student interviews (HTTP 200)',
      getInterviewsRes.status === 200 && Array.isArray(getInterviewsData.data),
      `Count: ${getInterviewsData.data?.length}`
    );

    if (getInterviewsData.data.length > 0) {
      const interviewId = getInterviewsData.data[0].id;
      const singleIntRes = await fetch(`${baseUrl}/api/students/interviews/${interviewId}`, {
        headers: { Authorization: `Bearer ${tokenB}` },
      });
      const singleIntData = await singleIntRes.json();
      assert(
        '9.2 GET /api/students/interviews/:id returns interview details',
        singleIntRes.status === 200 && Boolean(singleIntData.data.company && singleIntData.data.date),
        `Company: ${singleIntData.data?.company}`
      );
    }

    // =========================================================================
    // 10. NOTIFICATIONS
    // =========================================================================
    console.log('\n--- 10. NOTIFICATIONS ---');
    const getNotifsRes = await fetch(`${baseUrl}/api/students/notifications`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const getNotifsData = await getNotifsRes.json();
    assert(
      '10.1 GET /api/students/notifications returns student notifications (HTTP 200)',
      getNotifsRes.status === 200 && Array.isArray(getNotifsData.data),
      `Count: ${getNotifsData.data?.length}`
    );

    if (getNotifsData.data.length > 0) {
      const notifId = getNotifsData.data[0].id;
      const readRes = await fetch(`${baseUrl}/api/students/notifications/${notifId}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      const readData = await readRes.json();
      assert(
        '10.2 PUT /api/students/notifications/:id/read marks notification as read (HTTP 200)',
        readRes.status === 200 && readData.data.isRead === true,
        `Status: ${readRes.status}`
      );
    }

    const readAllRes = await fetch(`${baseUrl}/api/students/notifications/read-all`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(
      '10.3 PUT /api/students/notifications/read-all marks all notifications read (HTTP 200)',
      readAllRes.status === 200,
      `Status: ${readAllRes.status}`
    );

    // =========================================================================
    // 11. PLACEMENT STATUS
    // =========================================================================
    console.log('\n--- 11. PLACEMENT STATUS ---');
    // Student B has seeded placement offer
    const placeStatusRes = await fetch(`${baseUrl}/api/students/placement-status`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const placeStatusData = await placeStatusRes.json();
    assert(
      '11.1 GET /api/students/placement-status returns HTTP 200 with placement metrics',
      placeStatusRes.status === 200 && placeStatusData.data.placementStatus !== undefined,
      `Status: ${placeStatusRes.status}`
    );
    assert(
      '11.2 Placement status contains package, company, and joining date',
      Boolean(placeStatusData.data.package || placeStatusData.data.company),
      `Company: ${placeStatusData.data.company}, Package: ${placeStatusData.data.package}`
    );

    // =========================================================================
    // 12. SECURITY & AUTHORIZATION TESTS
    // =========================================================================
    console.log('\n--- 12. SECURITY & AUTHORIZATION TESTS ---');

    // Cross-student data isolation: Student B attempting to access Student A's application
    const crossAppRes = await fetch(`${baseUrl}/api/students/applications/${newApplicationId}`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert(
      '12.1 Student B cannot access Student A\'s application (returns HTTP 403)',
      crossAppRes.status === 403,
      `Status: ${crossAppRes.status}`
    );

    // Student B attempting to withdraw Student A's application
    const crossWithdrawRes = await fetch(`${baseUrl}/api/students/applications/${newApplicationId}/withdraw`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert(
      '12.2 Student B cannot withdraw Student A\'s application (returns HTTP 403)',
      crossWithdrawRes.status === 403,
      `Status: ${crossWithdrawRes.status}`
    );

    // Student cannot access Recruiter APIs
    const studentRecruiterAccess = await fetch(`${baseUrl}/api/recruiters/candidates`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(
      '12.3 Student cannot access recruiter APIs (returns HTTP 403)',
      studentRecruiterAccess.status === 403,
      `Status: ${studentRecruiterAccess.status}`
    );

    // Student cannot access Admin APIs
    const studentAdminAccess = await fetch(`${baseUrl}/api/admin/users`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(
      '12.4 Student cannot access admin APIs (returns HTTP 403)',
      studentAdminAccess.status === 403,
      `Status: ${studentAdminAccess.status}`
    );

    // Student cannot modify placement records
    const studentPlacementMutate = await fetch(`${baseUrl}/api/placements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ package: '50 LPA' }),
    });
    assert(
      '12.5 Student cannot create or modify placement records (returns HTTP 403)',
      studentPlacementMutate.status === 403,
      `Status: ${studentPlacementMutate.status}`
    );

    // Unauthenticated requests return 401
    const unauthProfile = await fetch(`${baseUrl}/api/students/profile`);
    assert(
      '12.6 Unauthenticated request to /api/students/profile returns HTTP 401',
      unauthProfile.status === 401,
      `Status: ${unauthProfile.status}`
    );

    const unauthAcademics = await fetch(`${baseUrl}/api/students/academics`);
    assert(
      '12.7 Unauthenticated request to /api/students/academics returns HTTP 401',
      unauthAcademics.status === 401,
      `Status: ${unauthAcademics.status}`
    );

    const unauthJobs = await fetch(`${baseUrl}/api/students/eligible-jobs`);
    assert(
      '12.8 Unauthenticated request to /api/students/eligible-jobs returns HTTP 401',
      unauthJobs.status === 401,
      `Status: ${unauthJobs.status}`
    );

    // 12.9 Cross-student Academic Record tampering
    const createAcadForA = await fetch(`${baseUrl}/api/students/academics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ semester: `SecSem_${Date.now()}`, academic_year: '2025-2026', cgpa: 9.0 }),
    });
    const acadAData = await createAcadForA.json();
    const acadAId = acadAData.data.id;

    const crossAcadPut = await fetch(`${baseUrl}/api/students/academics/${acadAId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenB}` },
      body: JSON.stringify({ cgpa: 5.0 }),
    });
    assert('12.9 Student B cannot modify Student A\'s academic record (returns HTTP 403)', crossAcadPut.status === 403, `Status: ${crossAcadPut.status}`);

    const crossAcadDel = await fetch(`${baseUrl}/api/students/academics/${acadAId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert('12.10 Student B cannot delete Student A\'s academic record (returns HTTP 403)', crossAcadDel.status === 403, `Status: ${crossAcadDel.status}`);
    await fetch(`${baseUrl}/api/students/academics/${acadAId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${tokenA}` } });

    // 12.11 Cross-student Project tampering
    const createProjForA = await fetch(`${baseUrl}/api/students/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ project_title: 'Student A Security Project' }),
    });
    const projAData = await createProjForA.json();
    const projAId = projAData.data.id;

    const crossProjPut = await fetch(`${baseUrl}/api/students/projects/${projAId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenB}` },
      body: JSON.stringify({ project_title: 'Hacked Project' }),
    });
    assert('12.11 Student B cannot modify Student A\'s project (returns HTTP 403)', crossProjPut.status === 403, `Status: ${crossProjPut.status}`);

    const crossProjDel = await fetch(`${baseUrl}/api/students/projects/${projAId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert('12.12 Student B cannot delete Student A\'s project (returns HTTP 403)', crossProjDel.status === 403, `Status: ${crossProjDel.status}`);
    await fetch(`${baseUrl}/api/students/projects/${projAId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${tokenA}` } });

    // 12.13 Cross-student Certification tampering
    const createCertForA = await fetch(`${baseUrl}/api/students/certifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ certification_name: 'Student A Cert', issuing_organization: 'Org A' }),
    });
    const certAData = await createCertForA.json();
    const certAId = certAData.data.id;

    const crossCertPut = await fetch(`${baseUrl}/api/students/certifications/${certAId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenB}` },
      body: JSON.stringify({ certification_name: 'Hacked Cert' }),
    });
    assert('12.13 Student B cannot modify Student A\'s certification (returns HTTP 403)', crossCertPut.status === 403, `Status: ${crossCertPut.status}`);

    const crossCertDel = await fetch(`${baseUrl}/api/students/certifications/${certAId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert('12.14 Student B cannot delete Student A\'s certification (returns HTTP 403)', crossCertDel.status === 403, `Status: ${crossCertDel.status}`);
    await fetch(`${baseUrl}/api/students/certifications/${certAId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${tokenA}` } });

    // 12.15 Cross-student Resume tampering
    const createResumeForA = await fetch(`${baseUrl}/api/students/resumes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ file_name: 'SecResume.pdf', file_url: 'https://sec.pdf' }),
    });
    const resAData = await createResumeForA.json();
    const resAId = resAData.data.id;

    const crossResumeDel = await fetch(`${baseUrl}/api/students/resumes/${resAId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert('12.15 Student B cannot delete Student A\'s resume (returns HTTP 403)', crossResumeDel.status === 403, `Status: ${crossResumeDel.status}`);
    await fetch(`${baseUrl}/api/students/resumes/${resAId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${tokenA}` } });

    // 12.16 Cross-student Notification tampering
    const getNotifForA = await fetch(`${baseUrl}/api/students/notifications`, { headers: { Authorization: `Bearer ${tokenA}` } });
    const notifAData = await getNotifForA.json();
    if (notifAData.data?.length > 0) {
      const notifAId = notifAData.data[0].id;
      const crossNotifPut = await fetch(`${baseUrl}/api/students/notifications/${notifAId}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${tokenB}` },
      });
      assert('12.16 Student B cannot mark Student A\'s notification as read (returns HTTP 403)', crossNotifPut.status === 403, `Status: ${crossNotifPut.status}`);
    }

    // 12.17 Cross-student Interview access
    // Student B has interview 'e5000000-0000-0000-0000-000000000001'
    const crossIntGet = await fetch(`${baseUrl}/api/students/interviews/e5000000-0000-0000-0000-000000000001`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert('12.17 Student A cannot view Student B\'s interview details (returns HTTP 403)', crossIntGet.status === 403, `Status: ${crossIntGet.status}`);

    // 12.18 Input Validation Failures return HTTP 400
    const badCgpaRes = await fetch(`${baseUrl}/api/students/academics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ semester: 'InvalidSem', academic_year: '2025', cgpa: 15.5 }), // CGPA > 10
    });
    assert('12.18 Invalid CGPA (> 10.0) is rejected with HTTP 400 validation error', badCgpaRes.status === 400, `Status: ${badCgpaRes.status}`);

    // Clean up created application in test
    await query('DELETE FROM applications WHERE id = $1', [newApplicationId]);

  } catch (error) {
    console.error('Fatal error during student tests:', error);
    failedCount++;
  } finally {
    console.log('\n====================================================');
    console.log(`TOTAL STUDENT MODULE CHECKS: ${passedCount + failedCount}`);
    console.log(`PASSED: ${passedCount}`);
    console.log(`FAILED: ${failedCount}`);
    console.log('====================================================\n');

    server.close();
    await pool.end();

    if (failedCount > 0) {
      process.exit(1);
    }
  }
}

runStudentTests();
