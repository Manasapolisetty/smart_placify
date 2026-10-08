import { query, pool } from '../config/database.js';

/**
 * Resolve student record by authenticated user ID (from users table)
 * Guarantees a student row exists in students table
 */
export const getStudentByUserId = async (userId) => {
  const res = await query(
    `SELECT s.*, u.name, u.email, u.phone as user_phone, u.role, u.status as user_status
     FROM students s
     JOIN users u ON s.user_id = u.id
     WHERE u.id = $1`,
    [userId]
  );

  if (res.rows.length === 0) {
    // Check if user exists in users table with role 'STUDENT'
    const userRes = await query(
      `SELECT id, name, email, phone, role FROM users WHERE id = $1 AND role = 'STUDENT'`,
      [userId]
    );

    if (userRes.rows.length === 0) {
      const err = new Error('Student profile not found');
      err.statusCode = 404;
      throw err;
    }

    const user = userRes.rows[0];
    const rollNumber = `ROLL-${Date.now().toString().slice(-6)}`;
    const studentIdStr = `STU-${Date.now().toString().slice(-6)}`;

    const created = await query(
      `INSERT INTO students (user_id, student_id, roll_number, phone)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [user.id, studentIdStr, rollNumber, user.phone]
    );

    return {
      ...created.rows[0],
      name: user.name,
      email: user.email,
      role: user.role,
      user_status: 'ACTIVE',
    };
  }

  return res.rows[0];
};

/**
 * 1. GET STUDENT PROFILE
 * Fetches profile combining users, students, departments, and courses
 */
export const getStudentProfile = async (userId) => {
  // Always derive student by authenticated user id
  const student = await getStudentByUserId(userId);

  const profileRes = await query(
    `SELECT s.id as student_id_uuid, s.student_id, s.roll_number, s.date_of_birth, s.gender,
            s.graduation_year, s.cgpa, s.phone as student_phone, s.address, s.profile_image,
            s.department_id, s.course_id, s.created_at, s.updated_at,
            u.id as user_id, u.name, u.email, u.phone as user_phone, u.role, u.status, u.last_login,
            d.department_name, d.department_code, d.description as department_description,
            c.course_name, c.course_code, c.duration as course_duration
     FROM students s
     JOIN users u ON s.user_id = u.id
     LEFT JOIN departments d ON s.department_id = d.id
     LEFT JOIN courses c ON s.course_id = c.id
     WHERE s.id = $1`,
    [student.id]
  );

  const row = profileRes.rows[0];

  // Academics records
  const acadRes = await query(
    `SELECT id, semester, academic_year as "academicYear", cgpa, percentage, backlogs, created_at as "createdAt"
     FROM academic_records WHERE student_id = $1 ORDER BY semester ASC, created_at ASC`,
    [student.id]
  );

  // Student skills
  const skillsRes = await query(
    `SELECT ss.id, ss.skill_id as "skillId", s.skill_name as "skillName", s.skill_name as name,
            s.skill_category as "skillCategory", s.skill_category as category,
            ss.proficiency_level as "proficiencyLevel", ss.proficiency_level as level,
            ss.created_at as "createdAt"
     FROM student_skills ss
     JOIN skills s ON ss.skill_id = s.id
     WHERE ss.student_id = $1
     ORDER BY ss.created_at DESC`,
    [student.id]
  );

  // Student projects
  const projectsRes = await query(
    `SELECT id, project_title as "projectTitle", project_title as title, description,
            technologies, github_url as "githubUrl", live_url as "liveUrl",
            start_date as "startDate", end_date as "endDate", created_at as "createdAt"
     FROM student_projects WHERE student_id = $1 ORDER BY start_date DESC NULLS LAST, created_at DESC`,
    [student.id]
  );

  // Student certifications
  const certsRes = await query(
    `SELECT id, certification_name as "certificationName", certification_name as name,
            issuing_organization as "issuingOrganization", issuing_organization as issuer,
            issue_date as "issueDate", expiry_date as "expiryDate",
            credential_id as "credentialId", credential_url as "credentialUrl",
            created_at as "createdAt"
     FROM certifications WHERE student_id = $1 ORDER BY issue_date DESC NULLS LAST, created_at DESC`,
    [student.id]
  );

  // Student resumes
  const resumesRes = await query(
    `SELECT id, file_name as "fileName", file_name as name, file_url as "fileUrl",
            is_active as "isActive", uploaded_at as "uploadedAt", updated_at as "updatedAt"
     FROM resumes WHERE student_id = $1 ORDER BY is_active DESC, uploaded_at DESC`,
    [student.id]
  );

  // Placement info
  const placementRes = await query(
    `SELECT p.id, p.status as "placementStatus", p.package, p.placement_date as "placementDate",
            p.joining_date as "joiningDate", p.offer_details as "offerDetails",
            c.company_name as "companyName", j.job_title as "jobTitle"
     FROM placements p
     JOIN companies c ON p.company_id = c.id
     LEFT JOIN jobs j ON p.job_id = j.id
     WHERE p.student_id = $1
     ORDER BY p.placement_date DESC, p.created_at DESC
     LIMIT 1`,
    [student.id]
  );

  // Compute profile statistics
  const appCount = await query('SELECT count(*) FROM applications WHERE student_id = $1', [student.id]);
  const shortlistedCount = await query(
    "SELECT count(*) FROM applications WHERE student_id = $1 AND status IN ('SHORTLISTED', 'INTERVIEW', 'SELECTED')",
    [student.id]
  );
  const interviewCount = await query(
    `SELECT count(*) FROM interviews i
     JOIN applications a ON i.application_id = a.id
     WHERE a.student_id = $1`,
    [student.id]
  );
  const offerCount = await query('SELECT count(*) FROM placements WHERE student_id = $1', [student.id]);

  const studentCgpa = parseFloat(row.cgpa || 0);
  const eligibleJobCount = await query(
    `SELECT count(*) FROM jobs
     WHERE status = 'OPEN'
       AND (application_deadline IS NULL OR application_deadline >= CURRENT_DATE)
       AND (minimum_cgpa IS NULL OR minimum_cgpa <= $1)`,
    [studentCgpa]
  );

  const placementRecord = placementRes.rows[0] || null;

  return {
    id: row.student_id_uuid,
    studentId: row.student_id,
    userId: row.user_id,
    rollNumber: row.roll_number,
    enrollmentNo: row.roll_number, // Frontend compatibility
    name: row.name,
    email: row.email,
    phone: row.student_phone || row.user_phone || '',
    role: row.role,
    status: row.status,
    dateOfBirth: row.date_of_birth,
    dob: row.date_of_birth,
    gender: row.gender,
    graduationYear: row.graduation_year,
    cgpa: studentCgpa,
    address: row.address,
    profileImage: row.profile_image,
    avatar: row.profile_image, // Frontend compatibility
    departmentId: row.department_id,
    department: row.department_name,
    departmentName: row.department_name,
    departmentCode: row.department_code,
    courseId: row.course_id,
    course: row.course_name,
    courseName: row.course_name,
    courseCode: row.course_code,
    courseDuration: row.course_duration,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    placementStatus: placementRecord ? placementRecord.placementStatus : 'NOT_PLACED',
    placedCompany: placementRecord ? placementRecord.companyName : null,
    placedPackage: placementRecord ? placementRecord.package : null,
    academics: acadRes.rows,
    skills: skillsRes.rows,
    projects: projectsRes.rows,
    certifications: certsRes.rows,
    resumes: resumesRes.rows,
    stats: {
      eligibleJobsCount: parseInt(eligibleJobCount.rows[0].count, 10),
      totalApplications: parseInt(appCount.rows[0].count, 10),
      shortlistedCount: parseInt(shortlistedCount.rows[0].count, 10),
      interviewsCount: parseInt(interviewCount.rows[0].count, 10),
      offersCount: parseInt(offerCount.rows[0].count, 10),
    },
  };
};

/**
 * 1. PUT STUDENT PROFILE
 * Updates safe student profile fields only.
 * Disallows modifying: role, status, password_hash, id, user_id, internal admin fields
 */
export const updateStudentProfile = async (userId, data) => {
  const student = await getStudentByUserId(userId);
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Extract safe fields for users table
    const safeName = data.name !== undefined ? data.name.trim() : null;
    const safePhone = data.phone !== undefined ? (data.phone ? data.phone.trim() : null) : null;

    if (safeName !== null || safePhone !== null) {
      await client.query(
        `UPDATE users
         SET name = COALESCE($1, name),
             phone = COALESCE($2, phone),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        [safeName, safePhone, userId]
      );
    }

    // Extract safe fields for students table
    const safeDob = data.date_of_birth || data.dob || null;
    const safeGender = data.gender !== undefined ? data.gender : null;
    const safeGradYear = data.graduation_year || data.graduationYear || null;
    const safeAddress = data.address !== undefined ? data.address : null;
    const safeProfileImg = data.profile_image || data.avatar || null;
    const safeDeptId = data.department_id || data.departmentId || null;
    const safeCourseId = data.course_id || data.courseId || null;

    await client.query(
      `UPDATE students
       SET phone = COALESCE($1, phone),
           date_of_birth = COALESCE($2, date_of_birth),
           gender = COALESCE($3, gender),
           graduation_year = COALESCE($4, graduation_year),
           address = COALESCE($5, address),
           profile_image = COALESCE($6, profile_image),
           department_id = COALESCE($7, department_id),
           course_id = COALESCE($8, course_id),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $9`,
      [
        safePhone,
        safeDob,
        safeGender,
        safeGradYear,
        safeAddress,
        safeProfileImg,
        safeDeptId,
        safeCourseId,
        student.id,
      ]
    );

    await client.query('COMMIT');

    return getStudentProfile(userId);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * 7. GET ELIGIBLE JOBS
 * Returns OPEN, non-expired jobs that the authenticated student qualifies for
 * Evaluates: minimum CGPA, graduation year, application deadline, and required skills
 */
export const getEligibleJobs = async (userId) => {
  const student = await getStudentByUserId(userId);
  const studentCgpa = parseFloat(student.cgpa || 0);
  const studentGradYear = student.graduation_year ? parseInt(student.graduation_year, 10) : null;

  // Retrieve student's acquired skill IDs
  const studentSkillsRes = await query(
    'SELECT skill_id FROM student_skills WHERE student_id = $1',
    [student.id]
  );
  const studentSkillIds = new Set(studentSkillsRes.rows.map((r) => r.skill_id));

  // Retrieve OPEN and non-expired jobs
  const jobsRes = await query(
    `SELECT j.id, j.job_title, j.job_description, j.job_type, j.location, j.work_mode,
            j.salary_min, j.salary_max, j.experience_required, j.minimum_cgpa,
            j.graduation_year, j.application_deadline, j.status, j.created_at,
            c.id as company_id, c.company_name, c.logo_url as company_logo, c.industry, c.location as company_location
     FROM jobs j
     JOIN companies c ON j.company_id = c.id
     WHERE j.status = 'OPEN'
       AND (j.application_deadline IS NULL OR j.application_deadline >= CURRENT_DATE)
     ORDER BY j.created_at DESC`
  );

  // Retrieve applications already submitted by this student
  const appliedRes = await query(
    'SELECT job_id, status FROM applications WHERE student_id = $1',
    [student.id]
  );
  const appliedJobMap = new Map();
  appliedRes.rows.forEach((r) => appliedJobMap.set(r.job_id, r.status));

  // Evaluate eligibility for each job
  const eligibleJobs = [];

  for (const job of jobsRes.rows) {
    const minCgpa = job.minimum_cgpa ? parseFloat(job.minimum_cgpa) : 0;
    const cgpaEligible = minCgpa === 0 || studentCgpa >= minCgpa;

    const jobGradYear = job.graduation_year ? parseInt(job.graduation_year, 10) : null;
    const gradYearEligible = !jobGradYear || !studentGradYear || studentGradYear === jobGradYear;

    // Fetch required skills for this job
    const reqSkillsRes = await query(
      `SELECT js.skill_id, js.is_required, s.skill_name
       FROM job_skills js
       JOIN skills s ON js.skill_id = s.id
       WHERE js.job_id = $1`,
      [job.id]
    );

    const requiredSkills = reqSkillsRes.rows.filter((s) => s.is_required);
    let skillsEligible = true;
    if (requiredSkills.length > 0) {
      skillsEligible = requiredSkills.every((s) => studentSkillIds.has(s.skill_id));
    }

    // Only include jobs where student satisfies all criteria
    if (cgpaEligible && gradYearEligible && skillsEligible) {
      eligibleJobs.push({
        id: job.id,
        jobTitle: job.job_title,
        title: job.job_title,
        jobDescription: job.job_description,
        description: job.job_description,
        jobType: job.job_type,
        location: job.location,
        workMode: job.work_mode,
        salaryMin: job.salary_min ? parseFloat(job.salary_min) : null,
        salaryMax: job.salary_max ? parseFloat(job.salary_max) : null,
        salary: job.salary_max ? `${(parseFloat(job.salary_max) / 100000).toFixed(1)} LPA` : null,
        experienceRequired: job.experience_required,
        minimumCgpa: minCgpa,
        graduationYear: jobGradYear,
        applicationDeadline: job.application_deadline,
        deadline: job.application_deadline,
        status: job.status,
        createdAt: job.created_at,
        company: {
          id: job.company_id,
          name: job.company_name,
          logo: job.company_logo,
          industry: job.industry,
          location: job.company_location,
        },
        skills: reqSkillsRes.rows.map((s) => ({
          id: s.skill_id,
          name: s.skill_name,
          isRequired: s.is_required,
        })),
        isApplied: appliedJobMap.has(job.id),
        applicationStatus: appliedJobMap.get(job.id) || null,
        eligibilityMet: true,
      });
    }
  }

  return eligibleJobs;
};

/**
 * 11. GET PLACEMENT STATUS
 * Returns placement offers and verified placement records for authenticated student
 */
export const getPlacementStatus = async (userId) => {
  const student = await getStudentByUserId(userId);

  const res = await query(
    `SELECT p.id, p.status as "placementStatus", p.package, p.placement_date as "placementDate",
            p.joining_date as "joiningDate", p.offer_details as "offerDetails", p.created_at as "createdAt",
            c.id as "companyId", c.company_name as "companyName", c.logo_url as "companyLogo", c.industry,
            j.id as "jobId", j.job_title as "jobTitle", j.location as "jobLocation"
     FROM placements p
     JOIN companies c ON p.company_id = c.id
     LEFT JOIN jobs j ON p.job_id = j.id
     WHERE p.student_id = $1
     ORDER BY p.placement_date DESC, p.created_at DESC`,
    [student.id]
  );

  const records = res.rows;
  const primaryOffer = records[0] || null;
  const isPlaced = records.some((r) => ['ACCEPTED', 'OFFERED', 'JOINED'].includes(r.placementStatus));

  return {
    placed: isPlaced,
    isPlaced: isPlaced,
    placementStatus: primaryOffer ? primaryOffer.placementStatus : 'NOT_PLACED',
    company: primaryOffer ? primaryOffer.companyName : null,
    placedCompany: primaryOffer ? primaryOffer.companyName : null,
    job: primaryOffer ? primaryOffer.jobTitle : null,
    placedJob: primaryOffer ? primaryOffer.jobTitle : null,
    package: primaryOffer ? primaryOffer.package : null,
    placementDate: primaryOffer ? primaryOffer.placementDate : null,
    joiningDate: primaryOffer ? primaryOffer.joiningDate : null,
    offerDetails: primaryOffer ? primaryOffer.offerDetails : null,
    offersCount: records.length,
    offerCount: records.length,
    placements: records,
  };
};
