import { query } from '../config/database.js';
import { getStudentByUserId } from './studentService.js';

/**
 * 3. GET SKILLS
 * Returns all skills associated with the student profile
 */
export const getSkills = async (userId) => {
  const student = await getStudentByUserId(userId);

  const res = await query(
    `SELECT ss.id, ss.student_id as "studentId", ss.skill_id as "skillId",
            s.skill_name as "skillName", s.skill_name as name,
            s.skill_category as "skillCategory", s.skill_category as category,
            ss.proficiency_level as "proficiencyLevel", ss.proficiency_level as level,
            ss.created_at as "createdAt"
     FROM student_skills ss
     JOIN skills s ON ss.skill_id = s.id
     WHERE ss.student_id = $1
     ORDER BY ss.created_at DESC`,
    [student.id]
  );

  return res.rows;
};

/**
 * 3. POST SKILL
 * Adds a skill to student's profile. Reuses existing catalog skill or creates new normalized skill.
 */
export const addSkill = async (userId, data) => {
  const student = await getStudentByUserId(userId);

  const skillNameRaw = data.skill_name || data.name || '';
  const skillCategory = (data.skill_category || data.category || 'General').trim();
  const rawLevel = (data.proficiency_level || data.level || 'INTERMEDIATE').trim().toUpperCase();
  const allowedLevels = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'];
  const proficiencyLevel = allowedLevels.includes(rawLevel) ? rawLevel : 'INTERMEDIATE';

  let skillId = data.skill_id || null;
  let resolvedSkillName = skillNameRaw.trim();
  let resolvedSkillCategory = skillCategory;

  if (skillId) {
    const existingCatalog = await query('SELECT id, skill_name, skill_category FROM skills WHERE id = $1', [skillId]);
    if (existingCatalog.rows.length === 0) {
      const err = new Error('Specified skill catalog ID does not exist.');
      err.statusCode = 404;
      throw err;
    }
    resolvedSkillName = existingCatalog.rows[0].skill_name;
    resolvedSkillCategory = existingCatalog.rows[0].skill_category;
  } else {
    if (!resolvedSkillName) {
      const err = new Error('Skill name is required.');
      err.statusCode = 400;
      throw err;
    }

    // Check if skill already exists in catalog (case-insensitive)
    const findRes = await query(
      'SELECT id, skill_name, skill_category FROM skills WHERE LOWER(skill_name) = LOWER($1)',
      [resolvedSkillName]
    );

    if (findRes.rows.length > 0) {
      skillId = findRes.rows[0].id;
      resolvedSkillName = findRes.rows[0].skill_name;
      resolvedSkillCategory = findRes.rows[0].skill_category;
    } else {
      // Create new normalized skill entry
      const insertSkill = await query(
        'INSERT INTO skills (skill_name, skill_category) VALUES ($1, $2) RETURNING id, skill_name, skill_category',
        [resolvedSkillName, resolvedSkillCategory]
      );
      skillId = insertSkill.rows[0].id;
    }
  }

  // Check if student has already attached this skill
  const checkAttached = await query(
    'SELECT id FROM student_skills WHERE student_id = $1 AND skill_id = $2',
    [student.id, skillId]
  );

  if (checkAttached.rows.length > 0) {
    const err = new Error(`Skill "${resolvedSkillName}" has already been added to your profile.`);
    err.statusCode = 409;
    throw err;
  }

  // Insert student skill relationship
  const inserted = await query(
    `INSERT INTO student_skills (student_id, skill_id, proficiency_level)
     VALUES ($1, $2, $3)
     RETURNING id, student_id as "studentId", skill_id as "skillId",
               proficiency_level as "proficiencyLevel", created_at as "createdAt"`,
    [student.id, skillId, proficiencyLevel]
  );

  return {
    ...inserted.rows[0],
    skillName: resolvedSkillName,
    name: resolvedSkillName,
    skillCategory: resolvedSkillCategory,
    category: resolvedSkillCategory,
    level: proficiencyLevel,
  };
};

/**
 * 3. DELETE SKILL
 * Removes a skill from student's profile with ownership enforcement
 */
export const deleteSkill = async (userId, targetId) => {
  const student = await getStudentByUserId(userId);

  // Locate the student_skills entry by either student_skills.id or skill_id
  const checkRes = await query(
    'SELECT id, student_id FROM student_skills WHERE id = $1 OR (skill_id = $1 AND student_id = $2)',
    [targetId, student.id]
  );

  if (checkRes.rows.length === 0) {
    // Check if it exists for another student to provide proper 403 vs 404
    const anyOwner = await query('SELECT id FROM student_skills WHERE id = $1', [targetId]);
    if (anyOwner.rows.length > 0) {
      const err = new Error('Access denied: You do not have permission to delete this skill.');
      err.statusCode = 403;
      throw err;
    }
    const err = new Error('Skill not found on your profile.');
    err.statusCode = 404;
    throw err;
  }

  const record = checkRes.rows[0];
  if (record.student_id !== student.id) {
    const err = new Error('Access denied: You do not have permission to delete this skill.');
    err.statusCode = 403;
    throw err;
  }

  await query('DELETE FROM student_skills WHERE id = $1', [record.id]);

  return { message: 'Skill deleted successfully from profile.' };
};
