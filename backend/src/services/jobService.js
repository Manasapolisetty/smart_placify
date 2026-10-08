import { query, pool } from '../config/database.js';

// Universal hex UUID regex for detecting company UUID filters
const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

/**
 * 1. GET /api/jobs (Public / Student job catalog with eligibility calculations)
 */
export const getJobs = async (filters = {}, user = null) => {
  let queryText = `
    SELECT 
      j.id,
      j.company_id as "companyId",
      j.recruiter_id as "recruiterId",
      j.job_title as "title",
      j.job_title as "jobTitle",
      j.job_description as "description",
      j.job_description as "jobDescription",
      j.job_description as "overview",
      j.job_type as "jobType",
      j.job_type as "employmentType",
      j.location,
      j.work_mode as "workMode",
      j.salary_min as "salaryMin",
      j.salary_max as "salaryMax",
      j.salary_min as "minSalary",
      j.salary_max as "maxSalary",
      CONCAT(
        COALESCE(j.salary_min::text, '0'),
        ' - ',
        COALESCE(j.salary_max::text, '0')
      ) as "salary",
      j.experience_required as "experienceRequired",
      j.minimum_cgpa as "minimumCgpa",
      j.minimum_cgpa as "minCgpa",
      j.graduation_year as "graduationYear",
      j.graduation_year as "eligibleBatch",
      to_char(j.application_deadline, 'YYYY-MM-DD') as "applicationDeadline",
      to_char(j.application_deadline, 'DD Mon YYYY') as "deadlineFormatted",
      to_char(j.created_at, 'DD Mon YYYY') as "postedDate",
      j.status,
      j.created_at as "createdAt",
      j.updated_at as "updatedAt",
      c.company_name as "companyName",
      c.logo_url as "companyLogo",
      c.industry as "companyIndustry",
      c.website as "companyWebsite",
      c.location as "companyLocation",
      COUNT(DISTINCT a.id) as "appliedCount",
      COALESCE(
        ARRAY_AGG(DISTINCT s.skill_name) FILTER (WHERE s.skill_name IS NOT NULL),
        '{}'
      ) as "skillsRequired"
    FROM jobs j
    JOIN companies c ON j.company_id = c.id
    LEFT JOIN applications a ON j.id = a.job_id
    LEFT JOIN job_skills js ON j.id = js.job_id
    LEFT JOIN skills s ON js.skill_id = s.id
    WHERE 1=1
  `;
  const params = [];

  // Default Status Filter:
  // Public/Student callers only see OPEN and unexpired jobs by default.
  // Recruiter/Admin can pass explicit status or see all for their company.
  if (filters.status && filters.status !== 'ALL') {
    params.push(filters.status.toUpperCase());
    queryText += ` AND j.status = $${params.length}`;
  } else if (!user || user.role === 'STUDENT') {
    queryText += ` AND j.status = 'OPEN' AND (j.application_deadline IS NULL OR j.application_deadline >= CURRENT_DATE)`;
  }

  // Search keyword (searches title, company, description, location)
  if (filters.search) {
    params.push(`%${filters.search.toLowerCase()}%`);
    queryText += ` AND (
      LOWER(j.job_title) LIKE $${params.length} OR 
      LOWER(c.company_name) LIKE $${params.length} OR 
      LOWER(j.job_description) LIKE $${params.length} OR 
      LOWER(j.location) LIKE $${params.length}
    )`;
  }

  // Filter by company
  if (filters.company) {
    if (UUID_REGEX.test(filters.company)) {
      params.push(filters.company);
      queryText += ` AND j.company_id = $${params.length}`;
    } else {
      params.push(`%${filters.company.toLowerCase()}%`);
      queryText += ` AND LOWER(c.company_name) LIKE $${params.length}`;
    }
  }

  // Filter by location
  if (filters.location) {
    params.push(`%${filters.location.toLowerCase()}%`);
    queryText += ` AND LOWER(j.location) LIKE $${params.length}`;
  }

  // Filter by job type
  if (filters.jobType) {
    params.push(filters.jobType.toUpperCase());
    queryText += ` AND j.job_type = $${params.length}`;
  }

  // Filter by work mode
  if (filters.workMode) {
    params.push(filters.workMode.toUpperCase());
    queryText += ` AND j.work_mode = $${params.length}`;
  }

  // Filter by minimum CGPA (jobs where student's CGPA is >= minimum_cgpa, or minimum_cgpa <= filter)
  if (filters.minCgpa !== undefined && filters.minCgpa !== '') {
    params.push(parseFloat(filters.minCgpa));
    queryText += ` AND j.minimum_cgpa <= $${params.length}`;
  }

  // Filter by graduation year
  if (filters.graduationYear) {
    params.push(parseInt(filters.graduationYear, 10));
    queryText += ` AND (j.graduation_year IS NULL OR j.graduation_year = $${params.length})`;
  }

  // Filter by required skill
  if (filters.skill) {
    params.push(`%${filters.skill.toLowerCase()}%`);
    queryText += ` AND EXISTS (
      SELECT 1 FROM job_skills js2
      JOIN skills s2 ON js2.skill_id = s2.id
      WHERE js2.job_id = j.id AND LOWER(s2.skill_name) LIKE $${params.length}
    )`;
  }

  queryText += `
    GROUP BY j.id, c.id
    ORDER BY j.created_at DESC
  `;

  // Pagination support
  if (filters.limit) {
    const limit = Math.min(Math.max(parseInt(filters.limit, 10) || 20, 1), 100);
    const page = Math.max(parseInt(filters.page, 10) || 1, 1);
    const offset = (page - 1) * limit;
    params.push(limit);
    queryText += ` LIMIT $${params.length}`;
    params.push(offset);
    queryText += ` OFFSET $${params.length}`;
  }

  const res = await query(queryText, params);
  let jobs = res.rows.map((row) => ({
    ...row,
    salaryMin: row.salaryMin ? parseFloat(row.salaryMin) : null,
    salaryMax: row.salaryMax ? parseFloat(row.salaryMax) : null,
    minSalary: row.minSalary ? parseFloat(row.minSalary) : null,
    maxSalary: row.maxSalary ? parseFloat(row.maxSalary) : null,
    minimumCgpa: row.minimumCgpa ? parseFloat(row.minimumCgpa) : 0,
    minCgpa: row.minCgpa ? parseFloat(row.minCgpa) : 0,
    appliedCount: parseInt(row.appliedCount || 0, 10),
    company: {
      id: row.companyId,
      companyName: row.companyName,
      name: row.companyName,
      industry: row.companyIndustry || '',
      location: row.companyLocation || '',
      logoUrl: row.companyLogo || '',
      website: row.companyWebsite || '',
    },
  }));

  // If authenticated user is a STUDENT, calculate personalized eligibility & application status
  if (user && user.role === 'STUDENT') {
    // Fetch student profile details
    const stuRes = await query(
      `SELECT s.id, s.cgpa, s.graduation_year, d.department_name, c.course_name
       FROM students s
       LEFT JOIN departments d ON s.department_id = d.id
       LEFT JOIN courses c ON s.course_id = c.id
       WHERE s.user_id = $1`,
      [user.id]
    );

    if (stuRes.rows.length > 0) {
      const student = stuRes.rows[0];
      const studentCgpa = parseFloat(student.cgpa || 0);
      const studentGradYear = student.graduation_year;
      const studentDept = student.department_name || 'Engineering';

      // Fetch student's applications
      const appsRes = await query(
        `SELECT id, job_id, status FROM applications WHERE student_id = $1`,
        [student.id]
      );
      const studentAppsMap = new Map();
      appsRes.rows.forEach((app) => studentAppsMap.set(app.job_id, app));

      // Fetch student's skills
      const skillsRes = await query(
        `SELECT s.skill_name FROM student_skills ss
         JOIN skills s ON ss.skill_id = s.id
         WHERE ss.student_id = $1`,
        [student.id]
      );
      const studentSkills = new Set(skillsRes.rows.map((r) => r.skill_name.toLowerCase()));

      jobs = jobs.map((job) => {
        const userApp = studentAppsMap.get(job.id);
        const hasApplied = Boolean(userApp);
        const applicationStatus = userApp ? userApp.status : null;
        const applicationId = userApp ? userApp.id : null;

        // Eligibility Rules
        const cgpaOk = studentCgpa >= (job.minimumCgpa || 0);
        const yearOk = !job.graduationYear || studentGradYear === job.graduationYear;
        const isNotExpired = !job.applicationDeadline || new Date(job.applicationDeadline) >= new Date().setHours(0, 0, 0, 0);
        const isOpen = job.status === 'OPEN';

        // Matching skills calculation
        const matchingSkills = job.skillsRequired.filter((s) => studentSkills.has(s.toLowerCase()));
        const matchPercentage = job.skillsRequired.length > 0
          ? Math.round((matchingSkills.length / job.skillsRequired.length) * 100)
          : 100;

        const isEligible = cgpaOk && yearOk && isNotExpired && isOpen;

        return {
          ...job,
          hasApplied,
          applicationStatus,
          applicationId,
          isEligible,
          matchPercentage,
          matchingSkills,
          eligibilityBreakdown: [
            {
              rule: `Minimum CGPA (Req: ${job.minimumCgpa.toFixed(2)})`,
              satisfied: cgpaOk,
              studentValue: studentCgpa.toFixed(2),
              requiredValue: job.minimumCgpa.toFixed(2),
            },
            {
              rule: `Graduation Batch (Req: ${job.graduationYear || 'All'})`,
              satisfied: yearOk,
              studentValue: studentGradYear ? String(studentGradYear) : 'N/A',
              requiredValue: job.graduationYear ? String(job.graduationYear) : 'All Batches',
            },
            {
              rule: 'Application Deadline',
              satisfied: isNotExpired,
              studentValue: 'Active',
              requiredValue: job.applicationDeadline || 'No Deadline',
            },
            {
              rule: 'Department / Discipline',
              satisfied: true,
              studentValue: studentDept,
              requiredValue: 'All Eligible Disciplines',
            },
          ],
        };
      });
    }
  }

  return jobs;
};

/**
 * 2. GET /api/jobs/:id (Public / Student detailed job view)
 */
export const getJobById = async (jobId, user = null) => {
  const jobsRes = await query(
    `SELECT 
       j.id,
       j.company_id as "companyId",
       j.recruiter_id as "recruiterId",
       j.job_title as "title",
       j.job_title as "jobTitle",
       j.job_description as "description",
       j.job_description as "jobDescription",
       j.job_description as "overview",
       j.job_type as "jobType",
       j.job_type as "employmentType",
       j.location,
       j.work_mode as "workMode",
       j.salary_min as "salaryMin",
       j.salary_max as "salaryMax",
       j.salary_min as "minSalary",
       j.salary_max as "maxSalary",
       CONCAT(
         COALESCE(j.salary_min::text, '0'),
         ' - ',
         COALESCE(j.salary_max::text, '0')
       ) as "salary",
       j.experience_required as "experienceRequired",
       j.minimum_cgpa as "minimumCgpa",
       j.minimum_cgpa as "minCgpa",
       j.graduation_year as "graduationYear",
       j.graduation_year as "eligibleBatch",
       to_char(j.application_deadline, 'YYYY-MM-DD') as "applicationDeadline",
       to_char(j.application_deadline, 'DD Mon YYYY') as "deadlineFormatted",
       to_char(j.created_at, 'DD Mon YYYY') as "postedDate",
       j.status,
       j.created_at as "createdAt",
       j.updated_at as "updatedAt",
       c.company_name as "companyName",
       c.logo_url as "companyLogo",
       c.industry as "companyIndustry",
       c.website as "companyWebsite",
       c.email as "companyEmail",
       c.location as "companyLocation",
       c.description as "companyDescription",
       COUNT(DISTINCT a.id) as "appliedCount",
       COALESCE(
         ARRAY_AGG(DISTINCT s.skill_name) FILTER (WHERE s.skill_name IS NOT NULL),
         '{}'
       ) as "skillsRequired"
     FROM jobs j
     JOIN companies c ON j.company_id = c.id
     LEFT JOIN applications a ON j.id = a.job_id
     LEFT JOIN job_skills js ON j.id = js.job_id
     LEFT JOIN skills s ON js.skill_id = s.id
     WHERE j.id = $1
     GROUP BY j.id, c.id`,
    [jobId]
  );

  if (jobsRes.rows.length === 0) {
    const error = new Error('Job listing not found');
    error.statusCode = 404;
    throw error;
  }

  const row = jobsRes.rows[0];
  const job = {
    ...row,
    salaryMin: row.salaryMin ? parseFloat(row.salaryMin) : null,
    salaryMax: row.salaryMax ? parseFloat(row.salaryMax) : null,
    minSalary: row.minSalary ? parseFloat(row.minSalary) : null,
    maxSalary: row.maxSalary ? parseFloat(row.maxSalary) : null,
    minimumCgpa: row.minimumCgpa ? parseFloat(row.minimumCgpa) : 0,
    minCgpa: row.minCgpa ? parseFloat(row.minCgpa) : 0,
    appliedCount: parseInt(row.appliedCount || 0, 10),
    company: {
      id: row.companyId,
      companyName: row.companyName,
      name: row.companyName,
      industry: row.companyIndustry || '',
      location: row.companyLocation || row.location || '',
      logoUrl: row.companyLogo || '',
      website: row.companyWebsite || '',
      email: row.companyEmail || '',
      description: row.companyDescription || '',
    },
    eligibilityCriteria: {
      minimumCgpa: row.minimumCgpa ? parseFloat(row.minimumCgpa) : 0,
      graduationYear: row.graduationYear || null,
      applicationDeadline: row.applicationDeadline || null,
      allowedBacklogs: 0,
    },
  };

  // Student personalized evaluation
  if (user && user.role === 'STUDENT') {
    const stuRes = await query(
      `SELECT s.id, s.cgpa, s.graduation_year, d.department_name
       FROM students s
       LEFT JOIN departments d ON s.department_id = d.id
       WHERE s.user_id = $1`,
      [user.id]
    );

    if (stuRes.rows.length > 0) {
      const student = stuRes.rows[0];
      const studentCgpa = parseFloat(student.cgpa || 0);

      const appCheck = await query(
        `SELECT id, status FROM applications WHERE job_id = $1 AND student_id = $2`,
        [jobId, student.id]
      );

      const cgpaOk = studentCgpa >= job.minimumCgpa;
      const yearOk = !job.graduationYear || student.graduation_year === job.graduationYear;
      const isNotExpired = !job.applicationDeadline || new Date(job.applicationDeadline) >= new Date().setHours(0, 0, 0, 0);

      job.hasApplied = appCheck.rows.length > 0;
      job.applicationId = appCheck.rows[0]?.id || null;
      job.applicationStatus = appCheck.rows[0]?.status || null;
      job.isEligible = cgpaOk && yearOk && isNotExpired && job.status === 'OPEN';
      job.eligibilityBreakdown = [
        {
          rule: `CGPA Requirement (Min ${job.minimumCgpa.toFixed(2)})`,
          satisfied: cgpaOk,
          studentValue: studentCgpa.toFixed(2),
          requiredValue: job.minimumCgpa.toFixed(2),
        },
        {
          rule: 'Graduation Year',
          satisfied: yearOk,
          studentValue: student.graduation_year ? String(student.graduation_year) : 'N/A',
          requiredValue: job.graduationYear ? String(job.graduationYear) : 'All Batches',
        },
        {
          rule: 'Deadline Status',
          satisfied: isNotExpired,
          studentValue: 'Active',
          requiredValue: job.applicationDeadline || 'No Deadline',
        },
      ];
    }
  }

  return job;
};

/**
 * 3. POST /api/recruiters/jobs (Recruiter Job Creation)
 */
export const createJob = async (userId, userRole, jobData) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let companyId = jobData.companyId;
    let recruiterId = null;

    if (userRole === 'RECRUITER') {
      const recRes = await client.query(
        'SELECT id, company_id FROM recruiters WHERE user_id = $1',
        [userId]
      );
      if (recRes.rows.length === 0 || !recRes.rows[0].company_id) {
        const error = new Error('No corporate company associated with this recruiter profile');
        error.statusCode = 403;
        throw error;
      }
      recruiterId = recRes.rows[0].id;
      companyId = recRes.rows[0].company_id;
    } else if (userRole === 'ADMIN' || userRole === 'PLACEMENT_OFFICER') {
      if (!companyId) {
        const firstComp = await client.query('SELECT id FROM companies ORDER BY created_at ASC LIMIT 1');
        companyId = firstComp.rows[0]?.id;
      }
    }

    const title = jobData.title || jobData.job_title || jobData.jobTitle;
    const description = jobData.description || jobData.job_description || jobData.overview || '';
    const jobType = (jobData.jobType || jobData.job_type || 'FULL_TIME').toUpperCase();
    const workMode = (jobData.workMode || jobData.work_mode || 'HYBRID').toUpperCase();
    const location = jobData.location || 'Bengaluru, India';
    const salaryMin = jobData.salaryMin ?? jobData.salary_min ?? null;
    const salaryMax = jobData.salaryMax ?? jobData.salary_max ?? null;
    const experienceRequired = jobData.experienceRequired || jobData.experience_required || 'Fresh Graduate';
    const minCgpa = jobData.minCgpa ?? jobData.minimum_cgpa ?? 0.0;
    const graduationYear = jobData.graduationYear ?? jobData.graduation_year ?? 2026;
    const deadline = jobData.applicationDeadline || jobData.application_deadline
      ? new Date(jobData.applicationDeadline || jobData.application_deadline)
      : new Date(Date.now() + 30 * 24 * 3600 * 1000);
    const status = (jobData.status || 'OPEN').toUpperCase();

    // Prevent invalid deadlines for OPEN jobs
    if (status === 'OPEN' && deadline < new Date().setHours(0, 0, 0, 0)) {
      const error = new Error('Application deadline cannot be in the past for an OPEN job');
      error.statusCode = 400;
      throw error;
    }

    const jobRes = await client.query(
      `INSERT INTO jobs (
         company_id, recruiter_id, job_title, job_description,
         job_type, location, work_mode, salary_min, salary_max,
         experience_required, minimum_cgpa, graduation_year,
         application_deadline, status
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING id`,
      [
        companyId,
        recruiterId,
        title,
        description,
        jobType,
        location,
        workMode,
        salaryMin ? parseFloat(salaryMin) : null,
        salaryMax ? parseFloat(salaryMax) : null,
        experienceRequired,
        parseFloat(minCgpa),
        graduationYear ? parseInt(graduationYear, 10) : null,
        deadline,
        status,
      ]
    );

    const newJobId = jobRes.rows[0].id;

    // Attach required skills
    const rawSkills = jobData.skills || jobData.skillsRequired || [];
    if (Array.isArray(rawSkills) && rawSkills.length > 0) {
      for (const skillItem of rawSkills) {
        const skillName = typeof skillItem === 'string' ? skillItem.trim() : skillItem.name;
        if (!skillName) continue;

        let skillLookup = await client.query(
          'SELECT id FROM skills WHERE LOWER(skill_name) = LOWER($1)',
          [skillName]
        );
        let skillId = skillLookup.rows[0]?.id;

        if (!skillId) {
          const insertSkill = await client.query(
            'INSERT INTO skills (skill_name) VALUES ($1) RETURNING id',
            [skillName]
          );
          skillId = insertSkill.rows[0].id;
        }

        await client.query(
          'INSERT INTO job_skills (job_id, skill_id, is_required) VALUES ($1, $2, TRUE) ON CONFLICT DO NOTHING',
          [newJobId, skillId]
        );
      }
    }

    await client.query('COMMIT');
    return getJobById(newJobId);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * 6. PUT /api/recruiters/jobs/:id (Update Job with Ownership & Status Lifecycle Check)
 */
export const updateJob = async (jobId, userId, userRole, jobData) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check job existence
    const checkRes = await client.query(
      'SELECT id, company_id, recruiter_id, status FROM jobs WHERE id = $1',
      [jobId]
    );

    if (checkRes.rows.length === 0) {
      const error = new Error('Job listing not found');
      error.statusCode = 404;
      throw error;
    }

    const job = checkRes.rows[0];

    // Ownership Enforcement: Recruiter can only modify jobs for their own company
    if (userRole === 'RECRUITER') {
      const recRes = await client.query(
        'SELECT company_id FROM recruiters WHERE user_id = $1',
        [userId]
      );
      const recruiterCompanyId = recRes.rows[0]?.company_id;
      if (!recruiterCompanyId || recruiterCompanyId !== job.company_id) {
        const error = new Error('Access denied: You cannot modify a job belonging to another company');
        error.statusCode = 403;
        throw error;
      }
    }

    const title = jobData.title ?? jobData.job_title ?? jobData.jobTitle;
    const description = jobData.description ?? jobData.job_description ?? jobData.overview;
    const jobType = jobData.jobType ?? jobData.job_type;
    const workMode = jobData.workMode ?? jobData.work_mode;
    const location = jobData.location;
    const salaryMin = jobData.salaryMin ?? jobData.salary_min;
    const salaryMax = jobData.salaryMax ?? jobData.salary_max;
    const experienceRequired = jobData.experienceRequired ?? jobData.experience_required;
    const minCgpa = jobData.minCgpa ?? jobData.minimum_cgpa;
    const graduationYear = jobData.graduationYear ?? jobData.graduation_year;
    const deadline = jobData.applicationDeadline ?? jobData.application_deadline;
    const status = jobData.status ? jobData.status.toUpperCase() : undefined;

    // Validate deadline if updated and job is OPEN
    if (deadline && (status === 'OPEN' || (!status && job.status === 'OPEN'))) {
      const dlDate = new Date(deadline);
      if (dlDate < new Date().setHours(0, 0, 0, 0)) {
        const error = new Error('Application deadline cannot be in the past for an OPEN job');
        error.statusCode = 400;
        throw error;
      }
    }

    // Dynamic parameterized update
    const updates = [];
    const values = [];

    if (title !== undefined) {
      values.push(title);
      updates.push(`job_title = $${values.length}`);
    }
    if (description !== undefined) {
      values.push(description);
      updates.push(`job_description = $${values.length}`);
    }
    if (jobType !== undefined) {
      values.push(jobType.toUpperCase());
      updates.push(`job_type = $${values.length}`);
    }
    if (workMode !== undefined) {
      values.push(workMode.toUpperCase());
      updates.push(`work_mode = $${values.length}`);
    }
    if (location !== undefined) {
      values.push(location);
      updates.push(`location = $${values.length}`);
    }
    if (salaryMin !== undefined) {
      values.push(salaryMin !== null ? parseFloat(salaryMin) : null);
      updates.push(`salary_min = $${values.length}`);
    }
    if (salaryMax !== undefined) {
      values.push(salaryMax !== null ? parseFloat(salaryMax) : null);
      updates.push(`salary_max = $${values.length}`);
    }
    if (experienceRequired !== undefined) {
      values.push(experienceRequired);
      updates.push(`experience_required = $${values.length}`);
    }
    if (minCgpa !== undefined) {
      values.push(minCgpa !== null ? parseFloat(minCgpa) : 0.0);
      updates.push(`minimum_cgpa = $${values.length}`);
    }
    if (graduationYear !== undefined) {
      values.push(graduationYear !== null ? parseInt(graduationYear, 10) : null);
      updates.push(`graduation_year = $${values.length}`);
    }
    if (deadline !== undefined) {
      values.push(deadline ? new Date(deadline) : null);
      updates.push(`application_deadline = $${values.length}`);
    }
    if (status !== undefined) {
      values.push(status);
      updates.push(`status = $${values.length}`);
    }

    if (updates.length > 0) {
      updates.push('updated_at = NOW()');
      values.push(jobId);
      await client.query(
        `UPDATE jobs SET ${updates.join(', ')} WHERE id = $${values.length}`,
        values
      );
    }

    // Update skills if provided
    const rawSkills = jobData.skills ?? jobData.skillsRequired;
    if (rawSkills !== undefined && Array.isArray(rawSkills)) {
      await client.query('DELETE FROM job_skills WHERE job_id = $1', [jobId]);

      for (const skillItem of rawSkills) {
        const skillName = typeof skillItem === 'string' ? skillItem.trim() : skillItem.name;
        if (!skillName) continue;

        let skillLookup = await client.query(
          'SELECT id FROM skills WHERE LOWER(skill_name) = LOWER($1)',
          [skillName]
        );
        let skillId = skillLookup.rows[0]?.id;

        if (!skillId) {
          const insertSkill = await client.query(
            'INSERT INTO skills (skill_name) VALUES ($1) RETURNING id',
            [skillName]
          );
          skillId = insertSkill.rows[0].id;
        }

        await client.query(
          'INSERT INTO job_skills (job_id, skill_id, is_required) VALUES ($1, $2, TRUE) ON CONFLICT DO NOTHING',
          [jobId, skillId]
        );
      }
    }

    await client.query('COMMIT');
    return getJobById(jobId);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * 7. DELETE /api/recruiters/jobs/:id (Delete Job with Ownership Enforcement)
 */
export const deleteJob = async (jobId, userId, userRole) => {
  const checkRes = await query(
    'SELECT id, company_id, recruiter_id FROM jobs WHERE id = $1',
    [jobId]
  );

  if (checkRes.rows.length === 0) {
    const error = new Error('Job listing not found');
    error.statusCode = 404;
    throw error;
  }

  const job = checkRes.rows[0];

  // Ownership Enforcement: Recruiter can only delete jobs for their own company
  if (userRole === 'RECRUITER') {
    const recRes = await query(
      'SELECT company_id FROM recruiters WHERE user_id = $1',
      [userId]
    );
    const recruiterCompanyId = recRes.rows[0]?.company_id;
    if (!recruiterCompanyId || recruiterCompanyId !== job.company_id) {
      const error = new Error('Access denied: You cannot delete a job belonging to another company');
      error.statusCode = 403;
      throw error;
    }
  }

  await query('DELETE FROM jobs WHERE id = $1', [jobId]);
  return { id: jobId, deleted: true };
};
