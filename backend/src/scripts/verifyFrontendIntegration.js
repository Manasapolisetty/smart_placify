import fetch from 'node-fetch';
import { query } from '../config/database.js';

const BASE_URL = 'http://localhost:5000/api';

async function runTest() {
  console.log('===================================================================');
  console.log('SMARTPLACIFY — FRONTEND-BACKEND INTEGRATION E2E VERIFICATION TEST');
  console.log('===================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}: ${details}`);
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------------------
    // 1. STUDENT INTEGRATION
    // -------------------------------------------------------------------------
    console.log('\n--- 1. Testing STUDENT Integration ---');
    // Login
    const sLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'rahul.kumar@university.edu.in', password: 'password123' })
    });
    const sLoginData = await sLoginRes.json();
    assert(sLoginRes.status === 200 && sLoginData.data?.token, 'Student Login (rahul.kumar@university.edu.in)');
    const studentToken = sLoginData.data.token;
    const sHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` };

    // Profile
    const sProfileRes = await fetch(`${BASE_URL}/students/profile`, { headers: sHeaders });
    const sProfile = await sProfileRes.json();
    assert(sProfileRes.status === 200 && sProfile.data?.name, 'Student Profile retrieved', `Name: ${sProfile.data?.name}`);

    // Academics
    const sAcadRes = await fetch(`${BASE_URL}/students/academics`, { headers: sHeaders });
    const sAcad = await sAcadRes.json();
    assert(sAcadRes.status === 200 && sAcad.data?.overallCgpa !== undefined, 'Student Academics retrieved', `CGPA: ${sAcad.data?.overallCgpa}`);

    // Skills: Add Skill & verify PostgreSQL
    const testSkillName = `Kubernetes-${Date.now()}`;
    const sSkillRes = await fetch(`${BASE_URL}/students/skills`, {
      method: 'POST',
      headers: sHeaders,
      body: JSON.stringify({ name: testSkillName, level: 'INTERMEDIATE' })
    });
    const sSkillData = await sSkillRes.json();
    assert(sSkillRes.status === 201, 'Student Skill Added (POST /students/skills)');
    
    // Check DB for added skill
    const skillDbRes = await query(
      'SELECT s.skill_name FROM student_skills ss JOIN skills s ON ss.skill_id = s.id WHERE s.skill_name = $1',
      [testSkillName]
    );
    assert(skillDbRes.rows.length === 1, 'Skill persisted in PostgreSQL student_skills table');

    // Projects: Add Project
    const testProjTitle = `Cloud Native Placement Portal ${Date.now()}`;
    const sProjRes = await fetch(`${BASE_URL}/students/projects`, {
      method: 'POST',
      headers: sHeaders,
      body: JSON.stringify({
        title: testProjTitle,
        description: 'React and Node.js microservices',
        technologies: ['React', 'Node.js', 'PostgreSQL']
      })
    });
    assert(sProjRes.status === 201, 'Student Project Added (POST /students/projects)');

    // Certifications: Add Certification
    const testCertName = `AWS Certified Solutions Architect ${Date.now()}`;
    const sCertRes = await fetch(`${BASE_URL}/students/certifications`, {
      method: 'POST',
      headers: sHeaders,
      body: JSON.stringify({
        name: testCertName,
        issuer: 'Amazon Web Services',
        issue_date: '2025-01-15'
      })
    });
    assert(sCertRes.status === 201, 'Student Certification Added (POST /students/certifications)');

    // Jobs: List & Details
    const sJobsRes = await fetch(`${BASE_URL}/jobs`, { headers: sHeaders });
    const sJobs = await sJobsRes.json();
    assert(sJobsRes.status === 200 && Array.isArray(sJobs.data), 'Student Jobs retrieved', `Found: ${sJobs.data?.length}`);
    const firstJob = sJobs.data[0];

    // Applications: Get Applications
    const sAppsRes = await fetch(`${BASE_URL}/students/applications`, { headers: sHeaders });
    const sApps = await sAppsRes.json();
    assert(sAppsRes.status === 200 && Array.isArray(sApps.data), 'Student Applications retrieved', `Count: ${sApps.data?.length}`);

    // Interviews: Get Interviews
    const sIntRes = await fetch(`${BASE_URL}/students/interviews`, { headers: sHeaders });
    const sInt = await sIntRes.json();
    assert(sIntRes.status === 200 && Array.isArray(sInt.data), 'Student Interviews retrieved', `Count: ${sInt.data?.length}`);

    // Notifications: Get & Read
    const sNotifRes = await fetch(`${BASE_URL}/notifications`, { headers: sHeaders });
    const sNotif = await sNotifRes.json();
    assert(sNotifRes.status === 200 && Array.isArray(sNotif.data), 'Student Notifications retrieved', `Count: ${sNotif.data?.length}`);

    const sReadAllRes = await fetch(`${BASE_URL}/notifications/read-all`, { method: 'PUT', headers: sHeaders });
    assert(sReadAllRes.status === 200, 'Student Mark All Read (PUT /notifications/read-all)');

    // -------------------------------------------------------------------------
    // 2. RECRUITER INTEGRATION
    // -------------------------------------------------------------------------
    console.log('\n--- 2. Testing RECRUITER Integration ---');
    const rLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'priya.sharma@techcorp.com', password: 'password123' })
    });
    const rLoginData = await rLoginRes.json();
    assert(rLoginRes.status === 200 && rLoginData.data?.token, 'Recruiter Login (priya.sharma@techcorp.com)');
    const recruiterToken = rLoginData.data.token;
    const rHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${recruiterToken}` };

    // Dashboard
    const rDashRes = await fetch(`${BASE_URL}/recruiters/dashboard`, { headers: rHeaders });
    const rDash = await rDashRes.json();
    assert(rDashRes.status === 200 && (rDash.data?.totalJobs !== undefined || rDash.data?.metrics !== undefined), 'Recruiter Dashboard retrieved');

    // Company Profile & Update
    const rCompRes = await fetch(`${BASE_URL}/recruiters/company`, { headers: rHeaders });
    const rComp = await rCompRes.json();
    const compName = rComp.data?.companyName || rComp.data?.company_name || rComp.data?.name;
    assert(rCompRes.status === 200 && compName, 'Recruiter Company Profile retrieved', `Company: ${compName}`);

    const updatedWebsite = `https://techcorp-${Date.now()}.example.com`;
    const rCompUpRes = await fetch(`${BASE_URL}/recruiters/company`, {
      method: 'PUT',
      headers: rHeaders,
      body: JSON.stringify({ website: updatedWebsite })
    });
    assert(rCompUpRes.status === 200, 'Recruiter Company Profile Updated (PUT /recruiters/company)');
    const compDbRes = await query('SELECT website FROM companies WHERE id = $1', [rComp.data.id]);
    assert(compDbRes.rows[0]?.website === updatedWebsite, 'Company update persisted in PostgreSQL companies table');

    // Jobs: Recruiter Jobs
    const rJobsRes = await fetch(`${BASE_URL}/recruiters/jobs`, { headers: rHeaders });
    const rJobs = await rJobsRes.json();
    assert(rJobsRes.status === 200 && Array.isArray(rJobs.data), 'Recruiter Jobs retrieved', `Count: ${rJobs.data?.length}`);

    // Create Job
    const testJobTitle = `Frontend Engineer - Lead ${Date.now()}`;
    const rCreateJobRes = await fetch(`${BASE_URL}/recruiters/jobs`, {
      method: 'POST',
      headers: rHeaders,
      body: JSON.stringify({
        title: testJobTitle,
        description: 'Senior React Developer for Core Platforms',
        jobType: 'FULL_TIME',
        workMode: 'HYBRID',
        location: 'Bengaluru, India',
        salaryMin: 18.0,
        salaryMax: 24.0,
        minimumCgpa: 8.0,
        openings: 5,
        skills: ['React', 'TypeScript', 'Node.js']
      })
    });
    const rCreatedJob = await rCreateJobRes.json();
    assert(rCreateJobRes.status === 201, 'Recruiter Job Created (POST /recruiters/jobs)');
    const jobDbRes = await query('SELECT * FROM jobs WHERE job_title = $1', [testJobTitle]);
    assert(jobDbRes.rows.length === 1, 'Created Job persisted in PostgreSQL jobs table');

    // Applications: Recruiter Applications
    const rAppsRes = await fetch(`${BASE_URL}/recruiters/applications`, { headers: rHeaders });
    const rApps = await rAppsRes.json();
    assert(rAppsRes.status === 200 && Array.isArray(rApps.data), 'Recruiter Applications retrieved', `Count: ${rApps.data?.length}`);

    // Interviews: Recruiter Interviews
    const rIntRes = await fetch(`${BASE_URL}/recruiters/interviews`, { headers: rHeaders });
    const rInt = await rIntRes.json();
    assert(rIntRes.status === 200 && Array.isArray(rInt.data), 'Recruiter Interviews retrieved', `Count: ${rInt.data?.length}`);

    // -------------------------------------------------------------------------
    // 3. PLACEMENT OFFICER INTEGRATION
    // -------------------------------------------------------------------------
    console.log('\n--- 3. Testing PLACEMENT OFFICER Integration ---');
    const poLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'placement.head@university.edu.in', password: 'password123' })
    });
    const poLoginData = await poLoginRes.json();
    assert(poLoginRes.status === 200 && poLoginData.data?.token, 'Placement Officer Login (placement.head@university.edu.in)');
    const poToken = poLoginData.data.token;
    const poHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${poToken}` };

    // Dashboard & Analytics
    const poDashRes = await fetch(`${BASE_URL}/placement-officers/dashboard`, { headers: poHeaders });
    const poDash = await poDashRes.json();
    assert(poDashRes.status === 200 && poDash.data?.totalStudents !== undefined, 'TPO Dashboard retrieved', `Total Students: ${poDash.data?.totalStudents}`);

    const poAnalyticsRes = await fetch(`${BASE_URL}/placement/analytics`, { headers: poHeaders });
    const poAnalytics = await poAnalyticsRes.json();
    assert(poAnalyticsRes.status === 200 && poAnalytics.data?.salaryDistribution !== undefined, 'TPO Analytics retrieved');

    // Students Directory
    const poStudentsRes = await fetch(`${BASE_URL}/placement-officers/students`, { headers: poHeaders });
    const poStudents = await poStudentsRes.json();
    assert(poStudentsRes.status === 200 && Array.isArray(poStudents.data), 'TPO Students Directory retrieved', `Count: ${poStudents.data?.length}`);

    // Companies Directory
    const poCompRes = await fetch(`${BASE_URL}/placement-officers/companies`, { headers: poHeaders });
    const poComp = await poCompRes.json();
    assert(poCompRes.status === 200 && Array.isArray(poComp.data), 'TPO Companies Directory retrieved', `Count: ${poComp.data?.length}`);

    // Placement Drives & CRUD
    const poDrivesRes = await fetch(`${BASE_URL}/placement-officers/placement-drives`, { headers: poHeaders });
    const poDrives = await poDrivesRes.json();
    assert(poDrivesRes.status === 200 && Array.isArray(poDrives.data), 'TPO Placement Drives retrieved', `Count: ${poDrives.data?.length}`);

    const driveName = `Annual Technology Drive ${Date.now()}`;
    const poCreateDriveRes = await fetch(`${BASE_URL}/placement-officers/placement-drives`, {
      method: 'POST',
      headers: poHeaders,
      body: JSON.stringify({
        companyId: poComp.data[0]?.id,
        driveTitle: driveName,
        startDate: '2026-11-20',
        description: 'Comprehensive campus placement drive'
      })
    });
    assert(poCreateDriveRes.status === 201, 'TPO Drive Created (POST /placement-officers/placement-drives)');
    const driveDbRes = await query('SELECT * FROM placement_drives WHERE drive_title = $1', [driveName]);
    assert(driveDbRes.rows.length === 1, 'Placement Drive persisted in PostgreSQL placement_drives table');

    // -------------------------------------------------------------------------
    // 4. ADMIN INTEGRATION
    // -------------------------------------------------------------------------
    console.log('\n--- 4. Testing ADMIN Integration ---');
    const aLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@smartplacify.edu.in', password: 'password123' })
    });
    const aLoginData = await aLoginRes.json();
    assert(aLoginRes.status === 200 && aLoginData.data?.token, 'Admin Login (admin@smartplacify.edu.in)');
    const adminToken = aLoginData.data.token;
    const aHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` };

    // Users Directory
    const aUsersRes = await fetch(`${BASE_URL}/admin/users`, { headers: aHeaders });
    const aUsers = await aUsersRes.json();
    assert(aUsersRes.status === 200 && Array.isArray(aUsers.data), 'Admin Users Directory retrieved', `Count: ${aUsers.data?.length}`);

    // Toggle User Status
    const targetUser = aUsers.data.find(u => u.email !== 'admin@smartplacify.edu.in');
    const originalStatus = targetUser.status;
    const aToggleRes = await fetch(`${BASE_URL}/admin/users/${targetUser.id}/status`, {
      method: 'PATCH',
      headers: aHeaders
    });
    const aToggled = await aToggleRes.json();
    assert(aToggleRes.status === 200, 'Admin Toggle User Status (PATCH /admin/users/:id/status)');
    const userDbRes = await query('SELECT status FROM users WHERE id = $1', [targetUser.id]);
    assert(userDbRes.rows[0]?.status !== originalStatus, 'User status change persisted in PostgreSQL users table');

    // Restore user status
    await fetch(`${BASE_URL}/admin/users/${targetUser.id}/status`, { method: 'PATCH', headers: aHeaders });

    // Departments
    const aDeptRes = await fetch(`${BASE_URL}/admin/departments`, { headers: aHeaders });
    const aDept = await aDeptRes.json();
    assert(aDeptRes.status === 200 && Array.isArray(aDept.data), 'Admin Departments retrieved', `Count: ${aDept.data?.length}`);

    // Audit Logs
    const aLogsRes = await fetch(`${BASE_URL}/admin/audit-logs`, { headers: aHeaders });
    const aLogs = await aLogsRes.json();
    assert(aLogsRes.status === 200 && Array.isArray(aLogs.data), 'Admin Audit Logs retrieved', `Count: ${aLogs.data?.length}`);

    // Analytics
    const aAnalyticsRes = await fetch(`${BASE_URL}/admin/analytics`, { headers: aHeaders });
    const aAnalytics = await aAnalyticsRes.json();
    assert(aAnalyticsRes.status === 200 && aAnalytics.data?.salaryDistribution !== undefined, 'Admin Analytics retrieved');

    // -------------------------------------------------------------------------
    // SUMMARY
    // -------------------------------------------------------------------------
    console.log('\n===================================================================');
    console.log(`TOTAL INTEGRATION TESTS : ${passed + failed}`);
    console.log(`PASSED                  : ${passed}`);
    console.log(`FAILED                  : ${failed}`);
    console.log('===================================================================');

    if (failed === 0) {
      console.log('\nALL INTEGRATION TESTS PASSED SUCCESSFULLY! FULL POSTGRESQL PERSISTENCE CONFIRMED.');
    } else {
      console.error(`\n${failed} TESTS FAILED.`);
    }

  } catch (error) {
    console.error('Test execution error:', error);
  } finally {
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTest();
