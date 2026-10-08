import { body, param, query } from 'express-validator';
import { validate } from './validate.js';

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const DRIVE_STATUSES = ['UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED'];

export const validateUUIDParam = (paramName = 'id') => [
  param(paramName)
    .trim()
    .matches(UUID_REGEX)
    .withMessage(`Invalid ${paramName}: must be a valid UUID`),
  validate,
];

/**
 * Validate Placement Drive Creation (POST /api/placement-officers/placement-drives)
 */
export const validateCreateDrive = [
  body()
    .custom((val) => {
      const companyId = val.companyId || val.company_id;
      if (!companyId || !UUID_REGEX.test(companyId)) {
        throw new Error('Valid companyId (UUID) is required');
      }
      return true;
    }),
  body()
    .custom((val) => {
      const title = val.driveTitle || val.drive_title || val.title;
      if (!title || typeof title !== 'string' || title.trim().length < 3) {
        throw new Error('Valid driveTitle is required (minimum 3 characters)');
      }
      return true;
    }),
  body()
    .custom((val) => {
      const date = val.startDate || val.start_date;
      if (!date || isNaN(Date.parse(date))) {
        throw new Error('Valid startDate is required (YYYY-MM-DD)');
      }
      return true;
    }),
  body()
    .custom((val) => {
      const endDate = val.endDate || val.end_date;
      if (endDate !== undefined && endDate !== null && isNaN(Date.parse(endDate))) {
        throw new Error('Invalid endDate format');
      }
      return true;
    }),
  body('status')
    .optional()
    .trim()
    .toUpperCase()
    .isIn(DRIVE_STATUSES)
    .withMessage(`Status must be one of: ${DRIVE_STATUSES.join(', ')}`),
  body('description')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Description must not exceed 5000 characters'),
  body('eligibilityCriteria')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Eligibility criteria must not exceed 5000 characters'),
  body('eligibility_criteria')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Eligibility criteria must not exceed 5000 characters'),
  validate,
];

/**
 * Validate Placement Drive Update (PUT /api/placement-officers/placement-drives/:id)
 */
export const validateUpdateDrive = [
  param('id')
    .trim()
    .matches(UUID_REGEX)
    .withMessage('Invalid drive id: must be a valid UUID'),
  body()
    .custom((val) => {
      const companyId = val.companyId || val.company_id;
      if (companyId !== undefined && !UUID_REGEX.test(companyId)) {
        throw new Error('companyId must be a valid UUID');
      }
      return true;
    }),
  body()
    .custom((val) => {
      const title = val.driveTitle || val.drive_title || val.title;
      if (title !== undefined && (typeof title !== 'string' || title.trim().length < 3)) {
        throw new Error('driveTitle must have at least 3 characters');
      }
      return true;
    }),
  body()
    .custom((val) => {
      const date = val.startDate || val.start_date;
      if (date !== undefined && isNaN(Date.parse(date))) {
        throw new Error('Invalid startDate format');
      }
      return true;
    }),
  body()
    .custom((val) => {
      const endDate = val.endDate || val.end_date;
      if (endDate !== undefined && endDate !== null && isNaN(Date.parse(endDate))) {
        throw new Error('Invalid endDate format');
      }
      return true;
    }),
  body('status')
    .optional()
    .trim()
    .toUpperCase()
    .isIn(DRIVE_STATUSES)
    .withMessage(`Status must be one of: ${DRIVE_STATUSES.join(', ')}`),
  body('description')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Description must not exceed 5000 characters'),
  body('eligibilityCriteria')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Eligibility criteria must not exceed 5000 characters'),
  body('eligibility_criteria')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Eligibility criteria must not exceed 5000 characters'),
  validate,
];

/**
 * Validate Query Parameters
 */
export const validateQueryFilter = [
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
