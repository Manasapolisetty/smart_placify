import { query } from '../config/database.js';
import { getStudentByUserId } from './studentService.js';

const formatProject = (r) => ({
  id: r.id,
  studentId: r.student_id,
  projectTitle: r.project_title,
  title: r.project_title,
  description: r.description,
  technologies: r.technologies,
  githubUrl: r.github_url,
  githubLink: r.github_url,
  liveUrl: r.live_url,
  liveLink: r.live_url,
  startDate: r.start_date,
  endDate: r.end_date,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

/**
 * 4. GET PROJECTS
 * Returns all portfolio projects belonging to the authenticated student
 */
export const getProjects = async (userId) => {
  const student = await getStudentByUserId(userId);

  const res = await query(
    `SELECT * FROM student_projects
     WHERE student_id = $1
     ORDER BY start_date DESC NULLS LAST, created_at DESC`,
    [student.id]
  );

  return res.rows.map(formatProject);
};

/**
 * 4. POST PROJECT
 * Adds a new portfolio project for the student
 */
export const createProject = async (userId, data) => {
  const student = await getStudentByUserId(userId);

  const title = (data.project_title || data.title || '').trim();
  const description = data.description !== undefined ? data.description : null;
  const tech = Array.isArray(data.technologies)
    ? data.technologies.join(', ')
    : data.technologies !== undefined ? data.technologies : null;
  const githubUrl = data.github_url || data.githubUrl || null;
  const liveUrl = data.live_url || data.liveUrl || null;
  const startDate = data.start_date || data.startDate || null;
  const endDate = data.end_date || data.endDate || null;

  const insertRes = await query(
    `INSERT INTO student_projects
     (student_id, project_title, description, technologies, github_url, live_url, start_date, end_date)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [student.id, title, description, tech, githubUrl, liveUrl, startDate, endDate]
  );

  return formatProject(insertRes.rows[0]);
};

/**
 * 4. PUT PROJECT
 * Updates a portfolio project with strict ownership enforcement
 */
export const updateProject = async (userId, projectId, data) => {
  const student = await getStudentByUserId(userId);

  const check = await query('SELECT id, student_id FROM student_projects WHERE id = $1', [projectId]);

  if (check.rows.length === 0) {
    const err = new Error('Project not found.');
    err.statusCode = 404;
    throw err;
  }

  if (check.rows[0].student_id !== student.id) {
    const err = new Error('Access denied: You do not have permission to modify this project.');
    err.statusCode = 403;
    throw err;
  }

  const title = data.project_title !== undefined ? data.project_title.trim() : (data.title !== undefined ? data.title.trim() : null);
  const description = data.description !== undefined ? data.description : null;
  const tech = Array.isArray(data.technologies)
    ? data.technologies.join(', ')
    : data.technologies !== undefined ? data.technologies : null;
  const githubUrl = data.github_url !== undefined ? data.github_url : (data.githubUrl !== undefined ? data.githubUrl : null);
  const liveUrl = data.live_url !== undefined ? data.live_url : (data.liveUrl !== undefined ? data.liveUrl : null);
  const startDate = data.start_date !== undefined ? data.start_date : (data.startDate !== undefined ? data.startDate : null);
  const endDate = data.end_date !== undefined ? data.end_date : (data.endDate !== undefined ? data.endDate : null);

  const updateRes = await query(
    `UPDATE student_projects
     SET project_title = COALESCE($1, project_title),
         description = COALESCE($2, description),
         technologies = COALESCE($3, technologies),
         github_url = COALESCE($4, github_url),
         live_url = COALESCE($5, live_url),
         start_date = COALESCE($6, start_date),
         end_date = COALESCE($7, end_date),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $8
     RETURNING *`,
    [title, description, tech, githubUrl, liveUrl, startDate, endDate, projectId]
  );

  return formatProject(updateRes.rows[0]);
};

/**
 * 4. DELETE PROJECT
 * Deletes a portfolio project with strict ownership enforcement
 */
export const deleteProject = async (userId, projectId) => {
  const student = await getStudentByUserId(userId);

  const check = await query('SELECT id, student_id FROM student_projects WHERE id = $1', [projectId]);

  if (check.rows.length === 0) {
    const err = new Error('Project not found.');
    err.statusCode = 404;
    throw err;
  }

  if (check.rows[0].student_id !== student.id) {
    const err = new Error('Access denied: You do not have permission to delete this project.');
    err.statusCode = 403;
    throw err;
  }

  await query('DELETE FROM student_projects WHERE id = $1', [projectId]);

  return { message: 'Project deleted successfully.' };
};
