import { body, param, query } from 'express-validator';
import { validate } from './validate.js';

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export const validateUUIDParam = (paramName = 'id') => [
  param(paramName)
    .trim()
    .matches(UUID_REGEX)
    .withMessage(`Invalid ${paramName} format: must be a valid UUID`),
  validate,
];

export const validateCreatePlacement = [
  body('studentId')
    .notEmpty()
    .withMessage('studentId is required')
    .trim()
    .matches(UUID_REGEX)
    .withMessage('studentId must be a valid UUID'),
  body('companyId')
    .notEmpty()
    .withMessage('companyId is required')
    .trim()
    .matches(UUID_REGEX)
    .withMessage('companyId must be a valid UUID'),
  body('package')
    .notEmpty()
    .withMessage('package is required')
    .isString()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('package must be between 2 and 100 characters'),
  body('jobId')
    .optional({ nullable: true })
    .trim()
    .matches(UUID_REGEX)
    .withMessage('jobId must be a valid UUID'),
  body('applicationId')
    .optional({ nullable: true })
    .trim()
    .matches(UUID_REGEX)
    .withMessage('applicationId must be a valid UUID'),
  body('status')
    .optional()
    .isIn(['OFFERED', 'ACCEPTED', 'DECLINED', 'JOINED'])
    .withMessage('status must be one of: OFFERED, ACCEPTED, DECLINED, JOINED'),
  body('placementDate')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('placementDate must be a valid ISO 8601 date'),
  body('joiningDate')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('joiningDate must be a valid ISO 8601 date'),
  body('offerDetails')
    .optional({ nullable: true })
    .isString()
    .trim(),
  validate,
];

export const validateUpdatePlacement = [
  param('id')
    .trim()
    .matches(UUID_REGEX)
    .withMessage('id must be a valid UUID'),
  body('status')
    .optional()
    .isIn(['OFFERED', 'ACCEPTED', 'DECLINED', 'JOINED'])
    .withMessage('status must be one of: OFFERED, ACCEPTED, DECLINED, JOINED'),
  body('package')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('package must be between 2 and 100 characters'),
  body('joiningDate')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('joiningDate must be a valid ISO 8601 date'),
  body('offerDetails')
    .optional({ nullable: true })
    .isString()
    .trim(),
  validate,
];

export const validatePlacementQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('status')
    .optional()
    .isIn(['OFFERED', 'ACCEPTED', 'DECLINED', 'JOINED'])
    .withMessage('status filter must be one of: OFFERED, ACCEPTED, DECLINED, JOINED'),
  query('studentId')
    .optional()
    .trim()
    .matches(UUID_REGEX)
    .withMessage('studentId filter must be a valid UUID'),
  query('companyId')
    .optional()
    .trim()
    .matches(UUID_REGEX)
    .withMessage('companyId filter must be a valid UUID'),
  query('jobId')
    .optional()
    .trim()
    .matches(UUID_REGEX)
    .withMessage('jobId filter must be a valid UUID'),
  validate,
];
