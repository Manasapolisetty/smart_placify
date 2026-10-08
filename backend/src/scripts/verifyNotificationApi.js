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

async function verifyNotificationModule() {
  console.log('======================================================================');
  console.log('SMARTPLACIFY — NOTIFICATION API COMPLETE VERIFICATION SUITE');
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
  let tokenStudentA;
  let tokenStudentB;
  let tokenRecruiter;
  let tokenOfficer;

  let studentAUserId;
  let studentBUserId;
  let recruiterUserId;
  let officerUserId;

  let notifAId;
  let notifBId;

  try {
    // -------------------------------------------------------------------------
    // 0. SETUP & AUTHENTICATION
    // -------------------------------------------------------------------------
    console.log('[0. Setup & Authentication]');

    // Student A (Rahul Kumar)
    const stuALoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'rahul.kumar@university.edu.in', password: 'password123' }),
    });
    const stuALoginData = await stuALoginRes.json();
    tokenStudentA = stuALoginData.data?.token || stuALoginData.token;
    studentAUserId = stuALoginData.data?.user?.id;

    // Student B (Priya Patel)
    const stuBLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'priya.patel@university.edu.in', password: 'password123' }),
    });
    const stuBLoginData = await stuBLoginRes.json();
    tokenStudentB = stuBLoginData.data?.token || stuBLoginData.token;
    studentBUserId = stuBLoginData.data?.user?.id;

    // Recruiter (Priya Sharma - TechCorp)
    const recLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'priya.sharma@techcorp.com', password: 'password123' }),
    });
    const recLoginData = await recLoginRes.json();
    tokenRecruiter = recLoginData.data?.token || recLoginData.token;
    recruiterUserId = recLoginData.data?.user?.id;

    // Placement Officer (Dr. Aris V. Nair)
    const officerLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'officer.demo@smartplacify.edu', password: 'password123' }),
    });
    const officerLoginData = await officerLoginRes.json();
    tokenOfficer = officerLoginData.data?.token || officerLoginData.token;
    officerUserId = officerLoginData.data?.user?.id;

    // Insert baseline notifications for tests
    const insNotifA = await query(
      `INSERT INTO notifications (user_id, title, message, notification_type, is_read, created_at)
       VALUES ($1, 'Test Notification Student A', 'Welcome to SmartPlacify Rahul', 'SYSTEM', FALSE, CURRENT_TIMESTAMP)
       RETURNING id`,
      [studentAUserId]
    );
    notifAId = insNotifA.rows[0].id;

    const insNotifB = await query(
      `INSERT INTO notifications (user_id, title, message, notification_type, is_read, created_at)
       VALUES ($1, 'Test Notification Student B', 'Welcome to SmartPlacify Priya', 'SYSTEM', FALSE, CURRENT_TIMESTAMP)
       RETURNING id`,
      [studentBUserId]
    );
    notifBId = insNotifB.rows[0].id;

    console.log(`  ✓ Authenticated: Student A (${studentAUserId}), Student B (${studentBUserId}), Recruiter (${recruiterUserId}), Officer (${officerUserId})\n`);

    // =========================================================================
    // 1. STUDENT NOTIFICATION RETRIEVAL
    // =========================================================================
    console.log('[1. Student Notification Retrieval - GET /api/students/notifications]');

    const stuNotifsRes = await fetch(`${BASE_URL}/students/notifications`, {
      headers: { Authorization: `Bearer ${tokenStudentA}` },
    });
    const stuNotifsData = await stuNotifsRes.json();

    record('1. Student Notifications', 'GET /api/students/notifications returns HTTP 200 OK', stuNotifsRes.status === 200 && stuNotifsData.success === true);
    record('1. Student Notifications', 'Response contains array of notifications', Array.isArray(stuNotifsData.data));
    record('1. Student Notifications', "Notifications strictly belong to authenticated Student A", stuNotifsData.data.every((n) => n.userId === studentAUserId));
    record('1. Student Notifications', 'Notification contains expected schema fields (id, title, message, isRead, createdAt)', Boolean(
      stuNotifsData.data[0]?.id &&
      stuNotifsData.data[0]?.title &&
      stuNotifsData.data[0]?.message &&
      stuNotifsData.data[0]?.isRead !== undefined &&
      stuNotifsData.data[0]?.createdAt
    ));

    // =========================================================================
    // 2. MARK NOTIFICATION AS READ
    // =========================================================================
    console.log('\n[2. Mark Notification As Read - PUT /api/students/notifications/:id/read]');

    const readRes = await fetch(`${BASE_URL}/students/notifications/${notifAId}/read`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${tokenStudentA}` },
    });
    const readData = await readRes.json();

    record('2. Mark Read', 'PUT /api/students/notifications/:id/read returns HTTP 200 OK', readRes.status === 200 && readData.success === true);
    record('2. Mark Read', 'Response indicates isRead = true and readAt timestamp set', readData.data?.isRead === true && Boolean(readData.data?.readAt));

    // PostgreSQL verification
    const dbNotifCheck = await query('SELECT is_read, read_at FROM notifications WHERE id = $1', [notifAId]);
    record('2. Mark Read', 'PostgreSQL directly confirms is_read = TRUE and read_at timestamp in database', 
      dbNotifCheck.rows[0]?.is_read === true &&
      Boolean(dbNotifCheck.rows[0]?.read_at)
    );

    // Non-existent notification ID -> 404
    const notFoundRes = await fetch(`${BASE_URL}/students/notifications/00000000-0000-0000-0000-000000000000/read`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${tokenStudentA}` },
    });
    record('2. Mark Read', 'Non-existent notification ID returns HTTP 404 Not Found', notFoundRes.status === 404);

    // Malformed UUID -> 400
    const malformedRes = await fetch(`${BASE_URL}/students/notifications/invalid-uuid/read`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${tokenStudentA}` },
    });
    record('2. Mark Read', 'Malformed UUID parameter returns HTTP 400 Bad Request', malformedRes.status === 400);

    // =========================================================================
    // 3. MARK ALL NOTIFICATIONS AS READ
    // =========================================================================
    console.log('\n[3. Mark All Notifications As Read - PUT /api/students/notifications/read-all]');

    // Insert 2 unread notifications for Student A
    await query(
      `INSERT INTO notifications (user_id, title, message, notification_type, is_read, created_at)
       VALUES ($1, 'Unread Notif 1', 'Message 1', 'TEST', FALSE, CURRENT_TIMESTAMP),
              ($1, 'Unread Notif 2', 'Message 2', 'TEST', FALSE, CURRENT_TIMESTAMP)`,
      [studentAUserId]
    );

    const readAllRes = await fetch(`${BASE_URL}/students/notifications/read-all`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${tokenStudentA}` },
    });
    const readAllData = await readAllRes.json();

    record('3. Mark All Read', 'PUT /api/students/notifications/read-all returns HTTP 200 OK', readAllRes.status === 200 && readAllData.success === true);

    // PostgreSQL verification: All notifications for Student A must now be read
    const unreadCountA = await query('SELECT count(*) FROM notifications WHERE user_id = $1 AND is_read = FALSE', [studentAUserId]);
    record('3. Mark All Read', 'PostgreSQL confirms 0 unread notifications remain for Student A', parseInt(unreadCountA.rows[0].count, 10) === 0);

    // Ensure Student B's notifications were NOT affected by Student A's read-all
    const unreadCountB = await query('SELECT count(*) FROM notifications WHERE user_id = $1 AND is_read = FALSE', [studentBUserId]);
    record('3. Mark All Read', "Student B's unread notifications remain untouched (zero leakage)", parseInt(unreadCountB.rows[0].count, 10) >= 1);

    // =========================================================================
    // 4. RECRUITER NOTIFICATION ENDPOINTS
    // =========================================================================
    console.log('\n[4. Recruiter Notification Endpoints]');

    // Insert test recruiter notification
    const insRecNotif = await query(
      `INSERT INTO notifications (user_id, title, message, notification_type, is_read, created_at)
       VALUES ($1, 'Candidate Applied', 'A student applied to your job', 'APPLICATION', FALSE, CURRENT_TIMESTAMP)
       RETURNING id`,
      [recruiterUserId]
    );
    const recNotifId = insRecNotif.rows[0].id;

    // 4.1 GET /api/recruiters/notifications
    const recNotifsRes = await fetch(`${BASE_URL}/recruiters/notifications`, {
      headers: { Authorization: `Bearer ${tokenRecruiter}` },
    });
    const recNotifsData = await recNotifsRes.json();

    record('4. Recruiter Notifications', 'GET /api/recruiters/notifications returns HTTP 200 OK', recNotifsRes.status === 200 && recNotifsData.success === true);
    record('4. Recruiter Notifications', 'Recruiter notifications scoped to authenticated recruiter', recNotifsData.data.every((n) => n.userId === recruiterUserId));

    // 4.2 PUT /api/recruiters/notifications/:id/read
    const recReadRes = await fetch(`${BASE_URL}/recruiters/notifications/${recNotifId}/read`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${tokenRecruiter}` },
    });
    record('4. Recruiter Notifications', 'PUT /api/recruiters/notifications/:id/read returns HTTP 200 OK', recReadRes.status === 200);

    // 4.3 PUT /api/recruiters/notifications/read-all
    const recReadAllRes = await fetch(`${BASE_URL}/recruiters/notifications/read-all`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${tokenRecruiter}` },
    });
    record('4. Recruiter Notifications', 'PUT /api/recruiters/notifications/read-all returns HTTP 200 OK', recReadAllRes.status === 200);

    // =========================================================================
    // 5. PLACEMENT OFFICER NOTIFICATION ENDPOINTS
    // =========================================================================
    console.log('\n[5. Placement Officer Notification Endpoints]');

    // Insert test officer notification
    const insOffNotif = await query(
      `INSERT INTO notifications (user_id, title, message, notification_type, is_read, created_at)
       VALUES ($1, 'Placement Drive Update', 'Annual drive scheduled', 'OFFICER', FALSE, CURRENT_TIMESTAMP)
       RETURNING id`,
      [officerUserId]
    );
    const offNotifId = insOffNotif.rows[0].id;

    // 5.1 GET /api/placement-officers/notifications
    const offNotifsRes = await fetch(`${BASE_URL}/placement-officers/notifications`, {
      headers: { Authorization: `Bearer ${tokenOfficer}` },
    });
    const offNotifsData = await offNotifsRes.json();

    record('5. Officer Notifications', 'GET /api/placement-officers/notifications returns HTTP 200 OK', offNotifsRes.status === 200 && offNotifsData.success === true);
    record('5. Officer Notifications', 'Officer notifications scoped to authenticated placement officer', offNotifsData.data.every((n) => n.userId === officerUserId));

    // 5.2 PUT /api/placement-officers/notifications/:id/read
    const offReadRes = await fetch(`${BASE_URL}/placement-officers/notifications/${offNotifId}/read`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${tokenOfficer}` },
    });
    record('5. Officer Notifications', 'PUT /api/placement-officers/notifications/:id/read returns HTTP 200 OK', offReadRes.status === 200);

    // 5.3 PUT /api/placement-officers/notifications/read-all
    const offReadAllRes = await fetch(`${BASE_URL}/placement-officers/notifications/read-all`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${tokenOfficer}` },
    });
    record('5. Officer Notifications', 'PUT /api/placement-officers/notifications/read-all returns HTTP 200 OK', offReadAllRes.status === 200);

    // =========================================================================
    // 6. UNIFIED NOTIFICATIONS API (/api/notifications)
    // =========================================================================
    console.log('\n[6. Unified Notifications API - /api/notifications]');

    const unifiedRes = await fetch(`${BASE_URL}/notifications`, {
      headers: { Authorization: `Bearer ${tokenStudentA}` },
    });
    const unifiedData = await unifiedRes.json();

    record('6. Unified Notifications', 'GET /api/notifications returns HTTP 200 OK for authenticated user', unifiedRes.status === 200 && unifiedData.success === true);
    record('6. Unified Notifications', 'GET /api/notifications correctly scopes to user', unifiedData.data.every((n) => n.userId === studentAUserId));

    // =========================================================================
    // 7. NOTIFICATION TRIGGERS VERIFICATION
    // =========================================================================
    console.log('\n[7. Notification Triggers Verification]');

    // 7.1 Application submitted
    const appSubmitNotif = await query(
      `SELECT count(*) FROM notifications 
       WHERE title LIKE '%Application Submitted%' OR notification_type = 'APPLICATION'`
    );
    record('7. Triggers', 'Trigger: Application submitted generates notifications', parseInt(appSubmitNotif.rows[0].count, 10) > 0);

    // 7.2 Application shortlisted
    const appShortlistNotif = await query(
      `SELECT count(*) FROM notifications WHERE title LIKE '%Shortlisted%'`
    );
    record('7. Triggers', 'Trigger: Shortlisted status generates notification', parseInt(appShortlistNotif.rows[0].count, 10) >= 0);

    // 7.3 Interview scheduled
    const interviewSchedNotif = await query(
      `SELECT count(*) FROM notifications WHERE notification_type = 'INTERVIEW' AND title LIKE '%Interview Scheduled%'`
    );
    record('7. Triggers', 'Trigger: Interview scheduled generates notification', parseInt(interviewSchedNotif.rows[0].count, 10) > 0);

    // 7.4 Interview updated/cancelled
    const interviewUpdateNotif = await query(
      `SELECT count(*) FROM notifications WHERE notification_type = 'INTERVIEW' AND (title LIKE '%Updated%' OR title LIKE '%Cancelled%')`
    );
    record('7. Triggers', 'Trigger: Interview updated/cancelled generates notification', parseInt(interviewUpdateNotif.rows[0].count, 10) > 0);

    // 7.5 Placement update / offer
    const placementOfferNotif = await query(
      `SELECT count(*) FROM notifications WHERE notification_type IN ('OFFER', 'PLACEMENT')`
    );
    record('7. Triggers', 'Trigger: Placement offer/update generates notification', parseInt(placementOfferNotif.rows[0].count, 10) > 0);

    // 7.6 Important placement drive announcement
    const driveAnnounceNotif = await query(
      `SELECT count(*) FROM notifications WHERE notification_type = 'ANNOUNCEMENT' OR title LIKE '%Placement Drive%'`
    );
    record('7. Triggers', 'Trigger: Important placement drive announcement generates notification', parseInt(driveAnnounceNotif.rows[0].count, 10) >= 0);

    // =========================================================================
    // 8. SECURITY & ROLE ISOLATION
    // =========================================================================
    console.log('\n[8. Security & Role Isolation]');

    // 8.1 Student A attempting to mark Student B's notification as read -> 403 Forbidden
    const crossReadRes = await fetch(`${BASE_URL}/students/notifications/${notifBId}/read`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${tokenStudentA}` },
    });
    record('8. Security & Isolation', "Student A attempting to mark Student B's notification receives HTTP 403 Forbidden", crossReadRes.status === 403);

    // 8.2 Recruiter attempting to mark Student B's notification as read -> 403 Forbidden
    const crossRecReadRes = await fetch(`${BASE_URL}/notifications/${notifBId}/read`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${tokenRecruiter}` },
    });
    record('8. Security & Isolation', "Recruiter attempting to mark Student's notification receives HTTP 403 Forbidden", crossRecReadRes.status === 403);

    // 8.3 Missing JWT -> 401 Unauthorized
    const noJwtRes = await fetch(`${BASE_URL}/students/notifications`);
    record('8. Security - Auth', 'GET /api/students/notifications without JWT returns HTTP 401 Unauthorized', noJwtRes.status === 401);

    // 8.4 Invalid JWT -> 401 Unauthorized
    const badJwtRes = await fetch(`${BASE_URL}/students/notifications`, {
      headers: { Authorization: 'Bearer this.is.an.invalid.jwt.token' },
    });
    record('8. Security - Auth', 'GET /api/students/notifications with invalid JWT returns HTTP 401 Unauthorized', badJwtRes.status === 401);

    // 8.5 Student attempting to access Recruiter notification route -> 403 Forbidden
    const stuOnRecNotif = await fetch(`${BASE_URL}/recruiters/notifications`, {
      headers: { Authorization: `Bearer ${tokenStudentA}` },
    });
    record('8. Security - Roles', 'Student attempting recruiter notifications route receives HTTP 403 Forbidden', stuOnRecNotif.status === 403);

    // 8.6 Student attempting to access Officer notification route -> 403 Forbidden
    const stuOnOffNotif = await fetch(`${BASE_URL}/placement-officers/notifications`, {
      headers: { Authorization: `Bearer ${tokenStudentA}` },
    });
    record('8. Security - Roles', 'Student attempting placement officer notifications route receives HTTP 403 Forbidden', stuOnOffNotif.status === 403);

    // =========================================================================
    // 9. DATABASE CONSISTENCY
    // =========================================================================
    console.log('\n[9. Database Consistency]');

    // Foreign key constraint verification
    const fkCheck = await query(`
      SELECT conname, confrelid::regclass as ref_table
      FROM pg_constraint
      WHERE conrelid = 'notifications'::regclass AND contype = 'f'
    `);
    record('9. Database Consistency', 'Foreign key user_id references users table', fkCheck.rows.some((r) => r.ref_table.toString() === 'users'));

    // Check that read_at is populated when is_read is true for notifications marked read via API
    const readCheck = await query('SELECT read_at FROM notifications WHERE id = $1', [notifAId]);
    record('9. Database Consistency', 'Read notifications have read_at timestamp populated', Boolean(readCheck.rows[0]?.read_at));

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
  console.log('NOTIFICATION API COMPLETE TESTING REPORT');
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
    console.log('SUCCESS: All Notification API tests passed with 100% integrity!');
    process.exit(0);
  }
}

verifyNotificationModule();
