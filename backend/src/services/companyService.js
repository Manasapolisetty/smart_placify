import { query } from '../config/database.js';

/**
 * Format raw database row to normalized company object
 */
const formatCompany = (row) => ({
  id: row.id,
  companyName: row.company_name,
  name: row.company_name, // compatibility alias
  industry: row.industry || '',
  description: row.description || '',
  website: row.website || '',
  email: row.email || '',
  phone: row.phone || '',
  location: row.location || '',
  companySize: row.company_size || '',
  size: row.company_size || '', // compatibility alias
  logoUrl: row.logo_url || '',
  logo: row.logo_url || '', // compatibility alias
  status: row.status,
  totalJobs: parseInt(row.total_jobs || 0, 10),
  activeJobs: parseInt(row.active_jobs || 0, 10),
  totalPlacements: parseInt(row.total_placements || 0, 10),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

/**
 * Get all registered companies with metrics
 */
export const getCompanies = async (filters = {}) => {
  let queryText = `
    SELECT 
      c.id,
      c.company_name,
      c.industry,
      c.description,
      c.website,
      c.email,
      c.phone,
      c.location,
      c.company_size,
      c.logo_url,
      c.status,
      c.created_at,
      c.updated_at,
      COUNT(DISTINCT j.id) as total_jobs,
      COUNT(DISTINCT j.id) FILTER (WHERE j.status = 'OPEN') as active_jobs,
      COUNT(DISTINCT p.id) as total_placements
    FROM companies c
    LEFT JOIN jobs j ON c.id = j.company_id
    LEFT JOIN placements p ON c.id = p.company_id
    WHERE 1=1
  `;
  const params = [];

  if (filters.search) {
    params.push(`%${filters.search.toLowerCase()}%`);
    queryText += ` AND (LOWER(c.company_name) LIKE $${params.length} OR LOWER(c.industry) LIKE $${params.length})`;
  }

  if (filters.status) {
    params.push(filters.status.toUpperCase());
    queryText += ` AND c.status = $${params.length}`;
  }

  queryText += `
    GROUP BY c.id
    ORDER BY c.company_name ASC
  `;

  const res = await query(queryText, params);
  return res.rows.map(formatCompany);
};

/**
 * Get company by UUID
 */
export const getCompanyById = async (companyId) => {
  const res = await query(
    `SELECT 
       c.id,
       c.company_name,
       c.industry,
       c.description,
       c.website,
       c.email,
       c.phone,
       c.location,
       c.company_size,
       c.logo_url,
       c.status,
       c.created_at,
       c.updated_at,
       COUNT(DISTINCT j.id) as total_jobs,
       COUNT(DISTINCT j.id) FILTER (WHERE j.status = 'OPEN') as active_jobs,
       COUNT(DISTINCT p.id) as total_placements
     FROM companies c
     LEFT JOIN jobs j ON c.id = j.company_id
     LEFT JOIN placements p ON c.id = p.company_id
     WHERE c.id = $1
     GROUP BY c.id`,
    [companyId]
  );

  if (res.rows.length === 0) {
    const error = new Error('Company not found');
    error.statusCode = 404;
    throw error;
  }

  return formatCompany(res.rows[0]);
};

/**
 * Update company profile with authorization enforcement
 */
export const updateCompany = async (companyId, data, user = null) => {
  // Verify company exists
  const check = await query('SELECT id, status FROM companies WHERE id = $1', [companyId]);
  if (check.rows.length === 0) {
    const error = new Error('Company not found');
    error.statusCode = 404;
    throw error;
  }

  // Security: Check role authorization
  if (user) {
    if (user.role === 'RECRUITER') {
      const recCheck = await query('SELECT company_id FROM recruiters WHERE user_id = $1', [user.id]);
      const recruiterCompanyId = recCheck.rows[0]?.company_id;
      if (!recruiterCompanyId || recruiterCompanyId !== companyId) {
        const error = new Error('Access denied: You cannot modify another recruiter\'s company');
        error.statusCode = 403;
        throw error;
      }
    } else if (user.role === 'STUDENT') {
      const error = new Error('Access denied: Students cannot update company profiles');
      error.statusCode = 403;
      throw error;
    }
  }

  const companyName = data.companyName ?? data.company_name ?? data.name;
  const companySize = data.companySize ?? data.company_size ?? data.size;
  const logoUrl = data.logoUrl ?? data.logo_url ?? data.logo;

  // Build parameterized update dynamically based on provided fields
  const updates = [];
  const values = [];

  if (companyName !== undefined) {
    values.push(companyName);
    updates.push(`company_name = $${values.length}`);
  }
  if (data.industry !== undefined) {
    values.push(data.industry);
    updates.push(`industry = $${values.length}`);
  }
  if (data.description !== undefined) {
    values.push(data.description);
    updates.push(`description = $${values.length}`);
  }
  if (data.website !== undefined) {
    values.push(data.website);
    updates.push(`website = $${values.length}`);
  }
  if (data.email !== undefined) {
    values.push(data.email);
    updates.push(`email = $${values.length}`);
  }
  if (data.phone !== undefined) {
    values.push(data.phone);
    updates.push(`phone = $${values.length}`);
  }
  if (data.location !== undefined) {
    values.push(data.location);
    updates.push(`location = $${values.length}`);
  }
  if (companySize !== undefined) {
    values.push(companySize);
    updates.push(`company_size = $${values.length}`);
  }
  if (logoUrl !== undefined) {
    values.push(logoUrl);
    updates.push(`logo_url = $${values.length}`);
  }
  // Only ADMIN or PLACEMENT_OFFICER can change company verification status
  if (data.status !== undefined && user && (user.role === 'ADMIN' || user.role === 'PLACEMENT_OFFICER')) {
    values.push(data.status.toUpperCase());
    updates.push(`status = $${values.length}`);
  }

  if (updates.length > 0) {
    updates.push('updated_at = NOW()');
    values.push(companyId);
    await query(
      `UPDATE companies SET ${updates.join(', ')} WHERE id = $${values.length}`,
      values
    );
  }

  return getCompanyById(companyId);
};
