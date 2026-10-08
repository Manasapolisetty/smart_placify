import { body, param, query } from 'express-validator';
import { validate } from './validate.js';

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const ALLOWED_TYPES = ['TECHNICAL', 'HR', 'MANAGERIAL', 'OTHER'];
const ALLOWED_STATUSES = ['SCHEDULED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED'];

export const validateUUIDParam = (paramName = 'id') => [
  param(paramName)
    .trim()
    .matches(UUID_REGEX)
    .withMessage(`Invalid ${paramName}: must be a valid UUID`),
  validate,
];

/**
 * Validate Interview Scheduling (POST /api/recruiters/interviews)
 */
export const validateCreateInterview = [
  body()
    .custom((val) => {
      const appId = val.applicationId || val.application_id;
      if (!appId || !UUID_REGEX.test(appId)) {
        throw new Error('Valid applicationId is required');
      }
      return true;
    }),
  body()
    .custom((val) => {
      const date = val.interviewDate || val.interview_date || val.date;
      if (!date || isNaN(Date.parse(date))) {
        throw new Error('Valid interviewDate is required (YYYY-MM-DD)');
      }
      return true;
    }),
  body('interviewType')
    .optional()
    .trim()
    .toUpperCase()
    .isIn(ALLOWED_TYPES)
    .withMessage(`Interview type must be one of: ${ALLOWED_TYPES.join(', ')}`),
  body('interview_type')
    .optional()
    .trim()
    .toUpperCase()
    .isIn(ALLOWED_TYPES)
    .withMessage(`Interview type must be one of: ${ALLOWED_TYPES.join(', ')}`),
  body('type')
    .optional()
    .trim()
    .toUpperCase()
    .isIn(ALLOWED_TYPES)
    .withMessage(`Interview type must be one of: ${ALLOWED_TYPES.join(', ')}`),
  body('status')
    .optional()
    .trim()
    .toUpperCase()
    .isIn(ALLOWED_STATUSES)
    .withMessage(`Status must be one of: ${ALLOWED_STATUSES.join(', ')}`),
  body('meetingLink')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage('Meeting link must not exceed 500 characters'),
  body('meeting_link')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage('Meeting link must not exceed 500 characters'),
  body('location')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 255 })
    .withMessage('Location must not exceed 255 characters'),
  body('mode')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 255 })
    .withMessage('Mode must not exceed 255 characters'),
  body('feedback')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 3000 })
    .withMessage('Feedback must not exceed 3000 characters'),
  body('result')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 3000 })
    .withMessage('Result must not exceed 3000 characters'),
  validate,
];

/**
 * Validate Interview Update (PUT /api/recruiters/interviews/:id)
 */
export const validateUpdateInterview = [
  param('id')
    .trim()
    .matches(UUID_REGEX)
    .withMessage('Invalid interview id: must be a valid UUID'),
  body('interviewType')
    .optional()
    .trim()
    .toUpperCase()
    .isIn(ALLOWED_TYPES)
    .withMessage(`Interview type must be one of: ${ALLOWED_TYPES.join(', ')}`),
  body('interview_type')
    .optional()
    .trim()
    .toUpperCase()
    .isIn(ALLOWED_TYPES)
    .withMessage(`Interview type must be one of: ${ALLOWED_TYPES.join(', ')}`),
  body('type')
    .optional()
    .trim()
    .toUpperCase()
    .isIn(ALLOWED_TYPES)
    .withMessage(`Interview type must be one of: ${ALLOWED_TYPES.join(', ')}`),
  body('status')
    .optional()
    .trim()
    .toUpperCase()
    .isIn(ALLOWED_STATUSES)
    .withMessage(`Status must be one of: ${ALLOWED_STATUSES.join(', ')}`),
  body()
    .custom((val) => {
      const date = val.interviewDate || val.interview_date || val.date;
      if (date !== undefined && isNaN(Date.parse(date))) {
        throw new Error('Invalid interviewDate format');
      }
      return true;
    }),
  body('meetingLink')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage('Meeting link must not exceed 500 characters'),
  body('meeting_link')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage('Meeting link must not exceed 500 characters'),
  body('location')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 255 })
    .withMessage('Location must not exceed 255 characters'),
  body('mode')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 255 })
    .withMessage('Mode must not exceed 255 characters'),
  body('feedback')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 3000 })
    .withMessage('Feedback must not exceed 3000 characters'),
  body('result')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 3000 })
    .withMessage('Result must not exceed 3000 characters'),
  validate,
];

/**
 * Validate Interview Query
 */
export const validateInterviewQuery = [
  query('applicationId')
    .optional()
    .trim()
    .matches(UUID_REGEX)
    .withMessage('Invalid applicationId: must be a valid UUID'),
  query('application_id')
    .optional()
    .trim()
    .matches(UUID_REGEX)
    .withMessage('Invalid application_id: must be a valid UUID'),
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
