import { body, param } from 'express-validator';
import { validate } from './validate.js';

// PostgreSQL compatible UUID format matcher (handles RFC 4122 v1-v5 and custom seeded valid hex UUIDs)
const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

// Helper to validate UUID param
export const validateUUIDParam = (paramName = 'id') => [
  param(paramName)
    .trim()
    .matches(UUID_REGEX)
    .withMessage(`Invalid ${paramName}: must be a valid UUID`),
  validate,
];

// Profile update validation
export const validateProfileUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Name must be between 2 and 255 characters'),
  body('phone')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 50 })
    .withMessage('Phone number must not exceed 50 characters'),
  body('date_of_birth')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('date_of_birth must be a valid date (YYYY-MM-DD)'),
  body('dob')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('dob must be a valid date (YYYY-MM-DD)'),
  body('gender')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 20 })
    .withMessage('Gender must not exceed 20 characters'),
  body('graduation_year')
    .optional({ nullable: true })
    .isInt({ min: 1990, max: 2100 })
    .withMessage('graduation_year must be an integer between 1990 and 2100'),
  body('graduationYear')
    .optional({ nullable: true })
    .isInt({ min: 1990, max: 2100 })
    .withMessage('graduationYear must be an integer between 1990 and 2100'),
  body('address')
    .optional({ nullable: true })
    .trim(),
  body('profile_image')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage('profile_image URL must not exceed 500 characters'),
  body('avatar')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage('avatar URL must not exceed 500 characters'),
  body('department_id')
    .optional({ nullable: true })
    .matches(UUID_REGEX)
    .withMessage('department_id must be a valid UUID'),
  body('course_id')
    .optional({ nullable: true })
    .matches(UUID_REGEX)
    .withMessage('course_id must be a valid UUID'),
  validate,
];

// Academic record creation validation
export const validateAcademicRecord = [
  body('semester')
    .trim()
    .notEmpty()
    .withMessage('Semester is required')
    .isLength({ max: 50 })
    .withMessage('Semester must not exceed 50 characters'),
  body('academic_year')
    .trim()
    .notEmpty()
    .withMessage('Academic year is required')
    .isLength({ max: 50 })
    .withMessage('Academic year must not exceed 50 characters'),
  body('cgpa')
    .optional({ nullable: true })
    .isFloat({ min: 0.0, max: 10.0 })
    .withMessage('CGPA must be a decimal number between 0.00 and 10.00'),
  body('percentage')
    .optional({ nullable: true })
    .isFloat({ min: 0.0, max: 100.0 })
    .withMessage('Percentage must be a decimal number between 0.00 and 100.00'),
  body('backlogs')
    .optional({ nullable: true })
    .isInt({ min: 0 })
    .withMessage('Backlogs must be a non-negative integer'),
  validate,
];

// Academic record update validation
export const validateAcademicUpdate = [
  param('id')
    .trim()
    .matches(UUID_REGEX)
    .withMessage('Invalid academic record ID'),
  body('semester')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Semester cannot be empty')
    .isLength({ max: 50 })
    .withMessage('Semester must not exceed 50 characters'),
  body('academic_year')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Academic year cannot be empty')
    .isLength({ max: 50 })
    .withMessage('Academic year must not exceed 50 characters'),
  body('cgpa')
    .optional({ nullable: true })
    .isFloat({ min: 0.0, max: 10.0 })
    .withMessage('CGPA must be a decimal number between 0.00 and 10.00'),
  body('percentage')
    .optional({ nullable: true })
    .isFloat({ min: 0.0, max: 100.0 })
    .withMessage('Percentage must be a decimal number between 0.00 and 100.00'),
  body('backlogs')
    .optional({ nullable: true })
    .isInt({ min: 0 })
    .withMessage('Backlogs must be a non-negative integer'),
  validate,
];

// Skill addition validation
export const validateSkill = [
  body().custom((value) => {
    const hasName = Boolean(value.skill_name || value.name);
    const hasId = Boolean(value.skill_id);
    if (!hasName && !hasId) {
      throw new Error('Either skill_name or skill_id is required');
    }
    return true;
  }),
  body('skill_name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Skill name must be between 1 and 100 characters'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Skill name must be between 1 and 100 characters'),
  body('skill_id')
    .optional({ nullable: true })
    .matches(UUID_REGEX)
    .withMessage('skill_id must be a valid UUID'),
  body('skill_category')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage('Skill category must not exceed 100 characters'),
  body('category')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage('Skill category must not exceed 100 characters'),
  body('proficiency_level')
    .optional({ nullable: true })
    .trim()
    .toUpperCase()
    .isIn(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'])
    .withMessage('Proficiency level must be one of: BEGINNER, INTERMEDIATE, ADVANCED, EXPERT'),
  body('level')
    .optional({ nullable: true })
    .trim()
    .toUpperCase()
    .isIn(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'])
    .withMessage('Proficiency level must be one of: BEGINNER, INTERMEDIATE, ADVANCED, EXPERT'),
  validate,
];

// Project creation validation
export const validateProject = [
  body('project_title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Project title must be between 1 and 255 characters'),
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Project title must be between 1 and 255 characters'),
  body().custom((value) => {
    if (!value.project_title && !value.title) {
      throw new Error('Project title is required');
    }
    return true;
  }),
  body('github_url')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isURL({ require_tld: false })
    .withMessage('GitHub URL must be a valid URL'),
  body('githubUrl')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isURL({ require_tld: false })
    .withMessage('GitHub URL must be a valid URL'),
  body('live_url')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isURL({ require_tld: false })
    .withMessage('Live URL must be a valid URL'),
  body('liveUrl')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isURL({ require_tld: false })
    .withMessage('Live URL must be a valid URL'),
  body('start_date')
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601()
    .withMessage('start_date must be a valid date (YYYY-MM-DD)'),
  body('end_date')
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601()
    .withMessage('end_date must be a valid date (YYYY-MM-DD)')
    .custom((endDate, { req }) => {
      const startDate = req.body.start_date || req.body.startDate;
      if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
        throw new Error('start_date cannot be after end_date');
      }
      return true;
    }),
  validate,
];

// Project update validation
export const validateProjectUpdate = [
  param('id')
    .trim()
    .matches(UUID_REGEX)
    .withMessage('Invalid project ID'),
  body('project_title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Project title must be between 1 and 255 characters'),
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Project title must be between 1 and 255 characters'),
  body('github_url')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isURL({ require_tld: false })
    .withMessage('GitHub URL must be a valid URL'),
  body('live_url')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isURL({ require_tld: false })
    .withMessage('Live URL must be a valid URL'),
  body('start_date')
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601()
    .withMessage('start_date must be a valid date (YYYY-MM-DD)'),
  body('end_date')
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601()
    .withMessage('end_date must be a valid date (YYYY-MM-DD)'),
  validate,
];

// Certification creation validation
export const validateCertification = [
  body('certification_name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Certification name must be between 1 and 255 characters'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Certification name must be between 1 and 255 characters'),
  body().custom((value) => {
    if (!value.certification_name && !value.name) {
      throw new Error('Certification name is required');
    }
    return true;
  }),
  body('issuing_organization')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Issuing organization must be between 1 and 255 characters'),
  body('issuer')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Issuing organization must be between 1 and 255 characters'),
  body().custom((value) => {
    if (!value.issuing_organization && !value.issuer) {
      throw new Error('Issuing organization is required');
    }
    return true;
  }),
  body('issue_date')
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601()
    .withMessage('issue_date must be a valid date (YYYY-MM-DD)'),
  body('expiry_date')
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601()
    .withMessage('expiry_date must be a valid date (YYYY-MM-DD)'),
  body('credential_url')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isURL({ require_tld: false })
    .withMessage('credential_url must be a valid URL'),
  validate,
];

// Certification update validation
export const validateCertificationUpdate = [
  param('id')
    .trim()
    .matches(UUID_REGEX)
    .withMessage('Invalid certification ID'),
  body('certification_name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Certification name must be between 1 and 255 characters'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Certification name must be between 1 and 255 characters'),
  body('issuing_organization')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Issuing organization must be between 1 and 255 characters'),
  body('issue_date')
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601()
    .withMessage('issue_date must be a valid date (YYYY-MM-DD)'),
  body('expiry_date')
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601()
    .withMessage('expiry_date must be a valid date (YYYY-MM-DD)'),
  body('credential_url')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isURL({ require_tld: false })
    .withMessage('credential_url must be a valid URL'),
  validate,
];

// Resume creation validation
export const validateResume = [
  body('file_name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('File name must be between 1 and 255 characters'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('File name must be between 1 and 255 characters'),
  body().custom((value) => {
    if (!value.file_name && !value.name) {
      throw new Error('file_name is required');
    }
    return true;
  }),
  body('file_url')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('file_url cannot be empty'),
  body('filePath')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('filePath cannot be empty'),
  body().custom((value) => {
    if (!value.file_url && !value.filePath) {
      throw new Error('file_url is required');
    }
    return true;
  }),
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean'),
  validate,
];

// Resume update validation
export const validateResumeUpdate = [
  param('id')
    .trim()
    .matches(UUID_REGEX)
    .withMessage('Invalid resume ID'),
  body('file_name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('File name must be between 1 and 255 characters'),
  body('file_url')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('file_url cannot be empty'),
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean'),
  validate,
];

// Job application validation
export const validateApplyJob = [
  param('jobId')
    .optional()
    .trim()
    .matches(UUID_REGEX)
    .withMessage('jobId in route parameter must be a valid UUID'),
  body('jobId')
    .optional()
    .trim()
    .matches(UUID_REGEX)
    .withMessage('jobId in body must be a valid UUID'),
  body().custom((value, { req }) => {
    if (!req.params.jobId && !value.jobId) {
      throw new Error('jobId is required either in route parameter or request body');
    }
    return true;
  }),
  body('resume_id')
    .optional({ nullable: true })
    .matches(UUID_REGEX)
    .withMessage('resume_id must be a valid UUID'),
  body('resumeId')
    .optional({ nullable: true })
    .matches(UUID_REGEX)
    .withMessage('resumeId must be a valid UUID'),
  body('cover_letter')
    .optional({ nullable: true })
    .trim(),
  validate,
];
