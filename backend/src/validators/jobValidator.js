import { body, param, query } from 'express-validator';
import { validate } from './validate.js';

// PostgreSQL compatible UUID format matcher
const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

/**
 * Validate UUID path parameter
 */
export const validateUUIDParam = (paramName = 'id') => [
  param(paramName)
    .trim()
    .matches(UUID_REGEX)
    .withMessage(`Invalid ${paramName}: must be a valid UUID`),
  validate,
];

/**
 * Validate Job Creation
 */
export const validateCreateJob = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 255 })
    .withMessage('Job title must be between 3 and 255 characters'),
  body('job_title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 255 })
    .withMessage('Job title must be between 3 and 255 characters'),
  body()
    .custom((val) => {
      const title = val.title || val.job_title || val.jobTitle;
      if (!title || title.trim().length < 3) {
        throw new Error('Job title is required and must be at least 3 characters');
      }
      return true;
    }),
  body('job_type')
    .optional()
    .trim()
    .toUpperCase()
    .isIn(['FULL_TIME', 'PART_TIME', 'INTERNSHIP', 'CONTRACT'])
    .withMessage('Job type must be one of: FULL_TIME, PART_TIME, INTERNSHIP, CONTRACT'),
  body('jobType')
    .optional()
    .trim()
    .toUpperCase()
    .isIn(['FULL_TIME', 'PART_TIME', 'INTERNSHIP', 'CONTRACT'])
    .withMessage('Job type must be one of: FULL_TIME, PART_TIME, INTERNSHIP, CONTRACT'),
  body('work_mode')
    .optional()
    .trim()
    .toUpperCase()
    .isIn(['ONSITE', 'REMOTE', 'HYBRID'])
    .withMessage('Work mode must be one of: ONSITE, REMOTE, HYBRID'),
  body('workMode')
    .optional()
    .trim()
    .toUpperCase()
    .isIn(['ONSITE', 'REMOTE', 'HYBRID'])
    .withMessage('Work mode must be one of: ONSITE, REMOTE, HYBRID'),
  body('salary_min')
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage('Minimum salary must be a positive number'),
  body('salaryMin')
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage('Minimum salary must be a positive number'),
  body('salary_max')
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage('Maximum salary must be a positive number'),
  body('salaryMax')
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage('Maximum salary must be a positive number'),
  body('minimum_cgpa')
    .optional({ nullable: true })
    .isFloat({ min: 0.0, max: 10.0 })
    .withMessage('Minimum CGPA must be between 0.00 and 10.00'),
  body('minCgpa')
    .optional({ nullable: true })
    .isFloat({ min: 0.0, max: 10.0 })
    .withMessage('Minimum CGPA must be between 0.00 and 10.00'),
  body('graduation_year')
    .optional({ nullable: true })
    .isInt({ min: 1990, max: 2100 })
    .withMessage('Graduation year must be between 1990 and 2100'),
  body('graduationYear')
    .optional({ nullable: true })
    .isInt({ min: 1990, max: 2100 })
    .withMessage('Graduation year must be between 1990 and 2100'),
  body('application_deadline')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('Application deadline must be a valid date (YYYY-MM-DD)')
    .custom((val, { req }) => {
      if (val) {
        const deadline = new Date(val);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const status = (req.body.status || 'OPEN').toUpperCase();
        if (status === 'OPEN' && deadline < today) {
          throw new Error('Application deadline cannot be in the past for an OPEN job');
        }
      }
      return true;
    }),
  body('applicationDeadline')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('Application deadline must be a valid date (YYYY-MM-DD)')
    .custom((val, { req }) => {
      if (val) {
        const deadline = new Date(val);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const status = (req.body.status || 'OPEN').toUpperCase();
        if (status === 'OPEN' && deadline < today) {
          throw new Error('Application deadline cannot be in the past for an OPEN job');
        }
      }
      return true;
    }),
  body('status')
    .optional()
    .trim()
    .toUpperCase()
    .isIn(['DRAFT', 'OPEN', 'CLOSED', 'EXPIRED'])
    .withMessage('Status must be one of: DRAFT, OPEN, CLOSED, EXPIRED'),
  body('skills')
    .optional()
    .isArray()
    .withMessage('Skills must be an array of skill names'),
  body('skillsRequired')
    .optional()
    .isArray()
    .withMessage('skillsRequired must be an array of skill names'),
  validate,
];

/**
 * Validate Job Update
 */
export const validateUpdateJob = [
  param('id')
    .trim()
    .matches(UUID_REGEX)
    .withMessage('Invalid id: must be a valid UUID'),
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 255 })
    .withMessage('Job title must be between 3 and 255 characters'),
  body('job_title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 255 })
    .withMessage('Job title must be between 3 and 255 characters'),
  body('job_type')
    .optional()
    .trim()
    .toUpperCase()
    .isIn(['FULL_TIME', 'PART_TIME', 'INTERNSHIP', 'CONTRACT'])
    .withMessage('Job type must be one of: FULL_TIME, PART_TIME, INTERNSHIP, CONTRACT'),
  body('jobType')
    .optional()
    .trim()
    .toUpperCase()
    .isIn(['FULL_TIME', 'PART_TIME', 'INTERNSHIP', 'CONTRACT'])
    .withMessage('Job type must be one of: FULL_TIME, PART_TIME, INTERNSHIP, CONTRACT'),
  body('work_mode')
    .optional()
    .trim()
    .toUpperCase()
    .isIn(['ONSITE', 'REMOTE', 'HYBRID'])
    .withMessage('Work mode must be one of: ONSITE, REMOTE, HYBRID'),
  body('workMode')
    .optional()
    .trim()
    .toUpperCase()
    .isIn(['ONSITE', 'REMOTE', 'HYBRID'])
    .withMessage('Work mode must be one of: ONSITE, REMOTE, HYBRID'),
  body('salary_min')
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage('Minimum salary must be a positive number'),
  body('salaryMin')
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage('Minimum salary must be a positive number'),
  body('salary_max')
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage('Maximum salary must be a positive number'),
  body('salaryMax')
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage('Maximum salary must be a positive number'),
  body('minimum_cgpa')
    .optional({ nullable: true })
    .isFloat({ min: 0.0, max: 10.0 })
    .withMessage('Minimum CGPA must be between 0.00 and 10.00'),
  body('minCgpa')
    .optional({ nullable: true })
    .isFloat({ min: 0.0, max: 10.0 })
    .withMessage('Minimum CGPA must be between 0.00 and 10.00'),
  body('graduation_year')
    .optional({ nullable: true })
    .isInt({ min: 1990, max: 2100 })
    .withMessage('Graduation year must be between 1990 and 2100'),
  body('graduationYear')
    .optional({ nullable: true })
    .isInt({ min: 1990, max: 2100 })
    .withMessage('Graduation year must be between 1990 and 2100'),
  body('application_deadline')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('Application deadline must be a valid date (YYYY-MM-DD)'),
  body('applicationDeadline')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('Application deadline must be a valid date (YYYY-MM-DD)'),
  body('status')
    .optional()
    .trim()
    .toUpperCase()
    .isIn(['DRAFT', 'OPEN', 'CLOSED', 'EXPIRED'])
    .withMessage('Status must be one of: DRAFT, OPEN, CLOSED, EXPIRED'),
  body('skills')
    .optional()
    .isArray()
    .withMessage('Skills must be an array of skill names'),
  body('skillsRequired')
    .optional()
    .isArray()
    .withMessage('skillsRequired must be an array of skill names'),
  validate,
];

/**
 * Validate Public Job Query Parameters
 */
export const validatePublicJobsQuery = [
  query('jobType')
    .optional()
    .trim()
    .toUpperCase()
    .isIn(['FULL_TIME', 'PART_TIME', 'INTERNSHIP', 'CONTRACT'])
    .withMessage('jobType must be one of: FULL_TIME, PART_TIME, INTERNSHIP, CONTRACT'),
  query('workMode')
    .optional()
    .trim()
    .toUpperCase()
    .isIn(['ONSITE', 'REMOTE', 'HYBRID'])
    .withMessage('workMode must be one of: ONSITE, REMOTE, HYBRID'),
  query('minCgpa')
    .optional()
    .isFloat({ min: 0.0, max: 10.0 })
    .withMessage('minCgpa must be between 0.00 and 10.00'),
  query('graduationYear')
    .optional()
    .isInt({ min: 1990, max: 2100 })
    .withMessage('graduationYear must be between 1990 and 2100'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('page must be an integer >= 1'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('limit must be an integer between 1 and 100'),
  validate,
];
