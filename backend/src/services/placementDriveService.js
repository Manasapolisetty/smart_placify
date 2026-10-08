import { query } from '../config/database.js';

export const formatDriveRecord = (row) => ({
  id: row.id,
  companyId: row.company_id,
  company_id: row.company_id,
  companyName: row.company_name,
  company_name: row.company_name,
  companyLogo: row.company_logo,
  driveTitle: row.drive_title,
  drive_title: row.drive_title,
  title: row.drive_title,
  description: row.description,
  startDate: row.start_date,
  start_date: row.start_date,
  endDate: row.end_date,
  end_date: row.end_date,
  eligibilityCriteria: row.eligibility_criteria,
  eligibility_criteria: row.eligibility_criteria,
  status: row.status,
  createdBy: row.created_by,
  created_by: row.created_by,
  creatorName: row.creator_name,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  company: {
    id: row.company_id,
    name: row.company_name,
    companyName: row.company_name,
    logo: row.company_logo,
    industry: row.company_industry,
    location: row.company_location,
  },
});

/**
 * 8. GET /api/placement-officers/placement-drives
 * List all placement drives
 */
export const getPlacementDrives = async (params = {}) => {
  let queryText = `
    SELECT 
      pd.id,
      pd.company_id,
      pd.created_by,
      pd.drive_title,
      pd.description,
      to_char(pd.start_date, 'YYYY-MM-DD') as start_date,
      to_char(pd.end_date, 'YYYY-MM-DD') as end_date,
      pd.eligibility_criteria,
      pd.status,
      pd.created_at,
      pd.updated_at,
      c.company_name,
      c.logo_url as company_logo,
      c.industry as company_industry,
      c.location as company_location,
      u.name as creator_name
    FROM placement_drives pd
    JOIN companies c ON pd.company_id = c.id
    LEFT JOIN users u ON pd.created_by = u.id
    WHERE 1=1
  `;
  const queryParams = [];

  // Filter by company
  const compId = params.companyId || params.company_id;
  if (compId) {
    queryParams.push(compId);
    queryText += ` AND pd.company_id = $${queryParams.length}`;
  }

  // Filter by status
  if (params.status) {
    queryParams.push(params.status.toUpperCase());
    queryText += ` AND UPPER(pd.status) = $${queryParams.length}`;
  }

  // Search keyword (drive title, company name)
  if (params.search && params.search.trim()) {
    queryParams.push(`%${params.search.trim().toLowerCase()}%`);
    queryText += ` AND (
      LOWER(pd.drive_title) LIKE $${queryParams.length} OR
      LOWER(c.company_name) LIKE $${queryParams.length}
    )`;
  }

  // Total count
  const countQuery = `SELECT count(*) FROM (${queryText}) as count_sub`;
  const countRes = await query(countQuery, queryParams);
  const total = parseInt(countRes.rows[0].count, 10);

  queryText += ` ORDER BY pd.start_date DESC, pd.created_at DESC`;

  // Pagination
  const page = parseInt(params.page || 1, 10);
  const limit = parseInt(params.limit || 50, 10);
  const offset = (page - 1) * limit;

  queryParams.push(limit);
  queryText += ` LIMIT $${queryParams.length}`;
  queryParams.push(offset);
  queryText += ` OFFSET $${queryParams.length}`;

  const res = await query(queryText, queryParams);

  return {
    drives: res.rows.map(formatDriveRecord),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

/**
 * 10. GET /api/placement-officers/placement-drives/:id
 * Retrieve a single placement drive by ID
 */
export const getPlacementDriveById = async (id) => {
  const res = await query(
    `SELECT 
      pd.id,
      pd.company_id,
      pd.created_by,
      pd.drive_title,
      pd.description,
      to_char(pd.start_date, 'YYYY-MM-DD') as start_date,
      to_char(pd.end_date, 'YYYY-MM-DD') as end_date,
      pd.eligibility_criteria,
      pd.status,
      pd.created_at,
      pd.updated_at,
      c.company_name,
      c.logo_url as company_logo,
      c.industry as company_industry,
      c.location as company_location,
      u.name as creator_name
    FROM placement_drives pd
    JOIN companies c ON pd.company_id = c.id
    LEFT JOIN users u ON pd.created_by = u.id
    WHERE pd.id = $1`,
    [id]
  );

  if (res.rows.length === 0) {
    const err = new Error('Placement drive not found.');
    err.statusCode = 404;
    throw err;
  }

  return formatDriveRecord(res.rows[0]);
};

/**
 * 9. POST /api/placement-officers/placement-drives
 * Create a new placement drive
 */
export const createPlacementDrive = async (userId, data) => {
  const companyId = data.companyId || data.company_id;
  const driveTitle = data.driveTitle || data.drive_title || data.title;
  const description = data.description || null;
  const rawStartDate = data.startDate || data.start_date;
  const startDate = new Date(rawStartDate).toISOString().split('T')[0];
  const rawEndDate = data.endDate || data.end_date;
  const endDate = rawEndDate ? new Date(rawEndDate).toISOString().split('T')[0] : null;
  const eligibilityCriteria = data.eligibilityCriteria || data.eligibility_criteria || null;
  const status = (data.status || 'UPCOMING').toUpperCase();

  // Verify company exists
  const compCheck = await query('SELECT id FROM companies WHERE id = $1', [companyId]);
  if (compCheck.rows.length === 0) {
    const err = new Error('Company not found.');
    err.statusCode = 404;
    throw err;
  }

  const insertRes = await query(
    `INSERT INTO placement_drives (
       company_id, created_by, drive_title, description,
       start_date, end_date, eligibility_criteria, status
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id`,
    [companyId, userId, driveTitle, description, startDate, endDate, eligibilityCriteria, status]
  );
  const driveId = insertRes.rows[0].id;

  // Broadcast announcement notification to active students
  try {
    const students = await query('SELECT user_id FROM students WHERE user_id IS NOT NULL');
    for (const stu of students.rows) {
      await query(
        `INSERT INTO notifications (user_id, title, message, notification_type, is_read, created_at)
         VALUES ($1, 'Placement Drive Announcement', $2, 'ANNOUNCEMENT', FALSE, CURRENT_TIMESTAMP)`,
        [
          stu.user_id,
          `New placement drive announced: "${driveTitle}" starting on ${startDate}.`,
        ]
      ).catch(() => {});
    }
  } catch (err) {
    // Non-blocking notification dispatch
  }

  return getPlacementDriveById(driveId);
};

/**
 * 11. PUT /api/placement-officers/placement-drives/:id
 * Update an existing placement drive
 */
export const updatePlacementDrive = async (id, data) => {
  // Check existence
  const existingRes = await query('SELECT * FROM placement_drives WHERE id = $1', [id]);
  if (existingRes.rows.length === 0) {
    const err = new Error('Placement drive not found.');
    err.statusCode = 404;
    throw err;
  }
  const existing = existingRes.rows[0];

  const companyId = (data.companyId || data.company_id) || existing.company_id;
  if (companyId !== existing.company_id) {
    const compCheck = await query('SELECT id FROM companies WHERE id = $1', [companyId]);
    if (compCheck.rows.length === 0) {
      const err = new Error('Company not found.');
      err.statusCode = 404;
      throw err;
    }
  }

  const driveTitle = (data.driveTitle || data.drive_title || data.title) || existing.drive_title;
  const description = data.description !== undefined ? data.description : existing.description;
  const rawStartDate = data.startDate || data.start_date;
  const startDate = rawStartDate ? new Date(rawStartDate).toISOString().split('T')[0] : existing.start_date;
  const rawEndDate = data.endDate || data.end_date;
  const endDate = rawEndDate ? new Date(rawEndDate).toISOString().split('T')[0] : (data.endDate === null ? null : existing.end_date);
  const eligibilityCriteria = data.eligibilityCriteria !== undefined ? data.eligibilityCriteria : (data.eligibility_criteria !== undefined ? data.eligibility_criteria : existing.eligibility_criteria);
  const status = data.status ? data.status.toUpperCase() : existing.status;

  await query(
    `UPDATE placement_drives
     SET company_id = $1,
         drive_title = $2,
         description = $3,
         start_date = $4,
         end_date = $5,
         eligibility_criteria = $6,
         status = $7,
         updated_at = NOW()
     WHERE id = $8`,
    [companyId, driveTitle, description, startDate, endDate, eligibilityCriteria, status, id]
  );

  return getPlacementDriveById(id);
};

/**
 * 12. DELETE /api/placement-officers/placement-drives/:id
 * Delete a placement drive
 */
export const deletePlacementDrive = async (id) => {
  const existingRes = await query('SELECT id FROM placement_drives WHERE id = $1', [id]);
  if (existingRes.rows.length === 0) {
    const err = new Error('Placement drive not found.');
    err.statusCode = 404;
    throw err;
  }

  await query('DELETE FROM placement_drives WHERE id = $1', [id]);
  return { id, message: 'Placement drive deleted successfully' };
};
