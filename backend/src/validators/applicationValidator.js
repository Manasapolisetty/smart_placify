import { body, param, query } from 'express-validator';
import { validate } from './validate.js';

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

const ALLOWED_STATUSES = ['APPLIED', 'SHORTLISTED', 'REJECTED', 'SELECTED', 'WITHDRAWN', 'INTERVIEW', 'SCREENING'];

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
 * Validate Application Submission (POST /api/jobs/:jobId/apply)
 */
export const validateApplyJob = [
  param('jobId')
    .optional()
    .trim()
    .matches(UUID_REGEX)
    .withMessage('Invalid jobId: must be a valid UUID'),
  body('resumeId')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .matches(UUID_REGEX)
    .withMessage('Invalid resumeId: must be a valid UUID'),
  body('resume_id')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .matches(UUID_REGEX)
    .withMessage('Invalid resume_id: must be a valid UUID'),
  body('coverLetter')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 3000 })
    .withMessage('Cover letter must not exceed 3000 characters'),
  body('cover_letter')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 3000 })
    .withMessage('Cover letter must not exceed 3000 characters'),
  validate,
];

/**
 * Validate Application Status Update (PUT /api/recruiters/applications/:id/status)
 */
export const validateUpdateApplicationStatus = [
  param('id')
    .trim()
    .matches(UUID_REGEX)
    .withMessage('Invalid application id: must be a valid UUID'),
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .bail()
    .trim()
    .toUpperCase()
    .isIn(ALLOWED_STATUSES)
    .withMessage(`Invalid status. Supported statuses: ${ALLOWED_STATUSES.join(', ')}`),
  body('notes')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes must not exceed 1000 characters'),
  body('remarks')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Remarks must not exceed 1000 characters'),
  validate,
];

/**
 * Validate Application Query Filters
 */
export const validateApplicationQuery = [
  query('jobId')
    .optional()
    .trim()
    .matches(UUID_REGEX)
    .withMessage('Invalid jobId: must be a valid UUID'),
  query('status')
    .optional()
    .trim()
    .toUpperCase()
    .isIn(ALLOWED_STATUSES)
    .withMessage(`Invalid status filter. Allowed values: ${ALLOWED_STATUSES.join(', ')}`),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  validate,
];
