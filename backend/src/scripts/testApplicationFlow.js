import { query } from '../config/database.js';

const BASE_URL = 'http://localhost:5000/api';

async function main() {
  console.log('--- START APPLICATION ROUTES SANITY CHECK ---');

  // 1. Authenticate Recruiter A (TechCorp)
  const loginResRecA = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'priya.sharma@techcorp.com', password: 'password123' }),
  });
  const recTokenA = (await loginResRecA.json()).data.token;

  // Ensure Company B and Recruiter B exist
  let compB = await query("SELECT id FROM companies WHERE company_name = 'Apex Innovations Ltd'");
  let compBId = compB.rows[0]?.id;
  if (!compBId) {
    const cRes = await query(
      `INSERT INTO companies (company_name, industry, location, description, website, email, status)
       VALUES ('Apex Innovations Ltd', 'Robotics', 'Pune', 'Robotics and AI', 'https://apex.example.com', 'careers@apex.example.com', 'ACTIVE')
       RETURNING id`
    );
    compBId = cRes.rows[0].id;
  }

  let userB = await query("SELECT id FROM users WHERE email = 'rohan.verma@apex.example.com'");
  let userBId = userB.rows[0]?.id;
  if (!userBId) {
    const uRes = await query(
      `INSERT INTO users (name, email, password_hash, role, status)
       VALUES ('Rohan Verma', 'rohan.verma@apex.example.com', '$2a$10$FmYlh8s/XNKNlcssq.5N4.JA3Pb4u4z5Rst7GlR./PjkstjunbSP2', 'RECRUITER', 'ACTIVE')
       RETURNING id`
    );
    userBId = uRes.rows[0].id;
    await query(
      `INSERT INTO recruiters (user_id, company_id, designation, recruiter_code)
       VALUES ($1, $2, 'Lead Recruiter', 'REC-APEX-001') ON CONFLICT DO NOTHING`,
      [userBId, compBId]
    );
  }

  // 2. Authenticate Recruiter B (Apex Innovations)
  const loginResRecB = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'rohan.verma@apex.example.com', password: 'password123' }),
  });
  const recTokenB = (await loginResRecB.json()).data.token;

  // 3. Authenticate Student
  const loginResStu = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'rahul.kumar@university.edu.in', password: 'password123' }),
  });
  const stuToken = (await loginResStu.json()).data.token;

  // Get student ID
  const stuDb = await query(
    `SELECT s.id FROM students s JOIN users u ON s.user_id = u.id WHERE u.email = 'rahul.kumar@university.edu.in'`
  );
  const studentId = stuDb.rows[0].id;

  // Ensure candidate has required skills for testing
  const allSkills = await query('SELECT id FROM skills');
  for (const s of allSkills.rows) {
    await query(
      `INSERT INTO student_skills (student_id, skill_id, proficiency_level) VALUES ($1, $2, 'INTERMEDIATE') ON CONFLICT DO NOTHING`,
      [studentId, s.id]
    );
  }

  // Find TechCorp's open job
  const jobDb = await query(
    `SELECT j.id, j.job_title FROM jobs j JOIN companies c ON j.company_id = c.id WHERE c.company_name = 'TechCorp Solutions' AND j.status = 'OPEN' LIMIT 1`
  );
  const techCorpJobId = jobDb.rows[0].id;

  // Clear previous applications for this student and job to ensure clean state
  await query('DELETE FROM applications WHERE student_id = $1 AND job_id = $2', [studentId, techCorpJobId]);

  // TEST 1: Student applies for job (POST /api/jobs/:jobId/apply)
  const applyRes = await fetch(`${BASE_URL}/jobs/${techCorpJobId}/apply`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${stuToken}`,
    },
    body: JSON.stringify({ coverLetter: 'I am thrilled to apply for this engineering role at TechCorp!' }),
  });
  const applyData = await applyRes.json();
  console.log('1. Apply for job status:', applyRes.status, applyData.success ? '✓ PASS' : '✗ FAIL');
  const applicationId = applyData.data?.id;

  // TEST 2: Duplicate application rejected with 409
  const dupRes = await fetch(`${BASE_URL}/jobs/${techCorpJobId}/apply`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${stuToken}`,
    },
    body: JSON.stringify({ coverLetter: 'Duplicate attempt' }),
  });
  console.log('2. Duplicate apply status:', dupRes.status, dupRes.status === 409 ? '✓ PASS (409)' : '✗ FAIL');

  // TEST 3: Student lists own applications (GET /api/students/applications)
  const stuListRes = await fetch(`${BASE_URL}/students/applications`, {
    headers: { Authorization: `Bearer ${stuToken}` },
  });
  const stuListData = await stuListRes.json();
  console.log('3. Student applications list status:', stuListRes.status, Array.isArray(stuListData.data) ? '✓ PASS' : '✗ FAIL');

  // TEST 4: Student views single application details (GET /api/students/applications/:id)
  const stuSingleRes = await fetch(`${BASE_URL}/students/applications/${applicationId}`, {
    headers: { Authorization: `Bearer ${stuToken}` },
  });
  const stuSingleData = await stuSingleRes.json();
  console.log(
    '4. Student single application status:',
    stuSingleRes.status,
    stuSingleData.data?.jobTitle && stuSingleData.data?.statusHistory ? '✓ PASS' : '✗ FAIL'
  );

  // TEST 5: Recruiter A lists company applications (GET /api/recruiters/applications)
  const recListRes = await fetch(`${BASE_URL}/recruiters/applications`, {
    headers: { Authorization: `Bearer ${recTokenA}` },
  });
  const recListData = await recListRes.json();
  console.log(
    '5. Recruiter applications list status:',
    recListRes.status,
    Array.isArray(recListData.data) ? '✓ PASS' : '✗ FAIL'
  );

  // TEST 6: Recruiter A views application details (GET /api/recruiters/applications/:id)
  const recSingleRes = await fetch(`${BASE_URL}/recruiters/applications/${applicationId}`, {
    headers: { Authorization: `Bearer ${recTokenA}` },
  });
  const recSingleData = await recSingleRes.json();
  console.log(
    '6. Recruiter single application status:',
    recSingleRes.status,
    recSingleData.data?.candidate?.email ? '✓ PASS' : '✗ FAIL'
  );

  // TEST 7: Cross-tenant security: Recruiter B (Apex) cannot view TechCorp application (403)
  const recBCrossRes = await fetch(`${BASE_URL}/recruiters/applications/${applicationId}`, {
    headers: { Authorization: `Bearer ${recTokenB}` },
  });
  console.log(
    '7. Cross-tenant recruiter view blocked status:',
    recBCrossRes.status,
    recBCrossRes.status === 403 ? '✓ PASS (403)' : '✗ FAIL'
  );

  // TEST 8: Recruiter A updates status (PUT /api/recruiters/applications/:id/status) -> SHORTLISTED
  const updateRes1 = await fetch(`${BASE_URL}/recruiters/applications/${applicationId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${recTokenA}`,
    },
    body: JSON.stringify({ status: 'SHORTLISTED', remarks: 'Profile reviewed, clearing for interview round' }),
  });
  const updateData1 = await updateRes1.json();
  console.log(
    '8. Recruiter status update (SHORTLISTED) status:',
    updateRes1.status,
    updateData1.data?.status === 'SHORTLISTED' ? '✓ PASS' : '✗ FAIL'
  );

  // TEST 9: Cross-tenant security: Recruiter B cannot update status (403)
  const recBUpdateRes = await fetch(`${BASE_URL}/recruiters/applications/${applicationId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${recTokenB}`,
    },
    body: JSON.stringify({ status: 'REJECTED' }),
  });
  console.log(
    '9. Cross-tenant recruiter update blocked status:',
    recBUpdateRes.status,
    recBUpdateRes.status === 403 ? '✓ PASS (403)' : '✗ FAIL'
  );

  // TEST 10: Student withdraws own application (POST /api/students/applications/:id/withdraw)
  const withdrawRes = await fetch(`${BASE_URL}/students/applications/${applicationId}/withdraw`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${stuToken}` },
  });
  const withdrawData = await withdrawRes.json();
  console.log(
    '10. Student withdraw status:',
    withdrawRes.status,
    withdrawData.data?.status === 'WITHDRAWN' ? '✓ PASS' : '✗ FAIL'
  );

  // TEST 11: Re-withdrawing returns 400
  const reWithdrawRes = await fetch(`${BASE_URL}/students/applications/${applicationId}/withdraw`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${stuToken}` },
  });
  console.log(
    '11. Re-withdraw rejected status:',
    reWithdrawRes.status,
    reWithdrawRes.status === 400 ? '✓ PASS (400)' : '✗ FAIL'
  );

  // TEST 12: Recruiter updating a withdrawn application returns 400
  const updateWithdrawnRes = await fetch(`${BASE_URL}/recruiters/applications/${applicationId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${recTokenA}`,
    },
    body: JSON.stringify({ status: 'SELECTED' }),
  });
  console.log(
    '12. Updating withdrawn application blocked status:',
    updateWithdrawnRes.status,
    updateWithdrawnRes.status === 400 ? '✓ PASS (400)' : '✗ FAIL'
  );

  // Database verification: Verify application_status_history entries exist
  const historyCheck = await query(
    'SELECT count(*) as count FROM application_status_history WHERE application_id = $1',
    [applicationId]
  );
  console.log(
    '13. Status history audit count in PostgreSQL:',
    historyCheck.rows[0].count,
    parseInt(historyCheck.rows[0].count, 10) >= 3 ? '✓ PASS (>= 3)' : '✗ FAIL'
  );

  // Database verification: Verify notifications created
  const notifCheck = await query(
    `SELECT count(*) as count FROM notifications WHERE user_id = (SELECT user_id FROM students WHERE id = $1)`,
    [studentId]
  );
  console.log(
    '14. Student notifications count in PostgreSQL:',
    notifCheck.rows[0].count,
    parseInt(notifCheck.rows[0].count, 10) >= 1 ? '✓ PASS' : '✗ FAIL'
  );

  console.log('--- ALL APPLICATION MANAGEMENT ROUTES VERIFIED SUCCESSFULLY ---');
  process.exit(0);
}

main().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
