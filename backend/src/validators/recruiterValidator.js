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
 * Validate Recruiter Profile Update
 */
export const validateRecruiterProfileUpdate = [
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
  body('designation')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 150 })
    .withMessage('Designation must not exceed 150 characters'),
  body('role')
    .optional()
    .custom((value, { req }) => {
      if (value && value !== req.user?.role) {
        throw new Error('Changing role is strictly prohibited');
      }
      return true;
    }),
  body('status')
    .optional()
    .custom((value, { req }) => {
      if (value && req.user?.role !== 'ADMIN') {
        throw new Error('Changing account status requires administrative privileges');
      }
      return true;
    }),
  validate,
];

/**
 * Validate Company Update
 */
export const validateCompanyUpdate = [
  body('company_name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Company name must be between 2 and 255 characters'),
  body('companyName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Company name must be between 2 and 255 characters'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Company name must be between 2 and 255 characters'),
  body('industry')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 150 })
    .withMessage('Industry must not exceed 150 characters'),
  body('description')
    .optional({ nullable: true })
    .trim(),
  body('website')
    .optional({ nullable: true })
    .trim()
    .custom((val) => {
      if (!val) return true;
      try {
        new URL(val);
        return true;
      } catch {
        throw new Error('Website must be a valid URL (e.g. https://company.com)');
      }
    }),
  body('email')
    .optional({ nullable: true })
    .trim()
    .isEmail()
    .withMessage('Email must be a valid email address'),
  body('phone')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 50 })
    .withMessage('Phone number must not exceed 50 characters'),
  body('location')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 255 })
    .withMessage('Location must not exceed 255 characters'),
  body('company_size')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage('Company size must not exceed 100 characters'),
  body('companySize')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage('Company size must not exceed 100 characters'),
  body('size')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage('Company size must not exceed 100 characters'),
  body('logo_url')
    .optional({ nullable: true })
    .trim()
    .custom((val) => {
      if (!val) return true;
      try {
        new URL(val);
        return true;
      } catch {
        throw new Error('Logo URL must be a valid URL');
      }
    }),
  body('logoUrl')
    .optional({ nullable: true })
    .trim()
    .custom((val) => {
      if (!val) return true;
      try {
        new URL(val);
        return true;
      } catch {
        throw new Error('Logo URL must be a valid URL');
      }
    }),
  validate,
];

/**
 * Validate Recruiter Jobs Query Parameters
 */
export const validateJobsQuery = [
  query('status')
    .optional()
    .trim()
    .toUpperCase()
    .isIn(['DRAFT', 'OPEN', 'CLOSED', 'EXPIRED', 'ALL'])
    .withMessage('Status must be one of: DRAFT, OPEN, CLOSED, EXPIRED, ALL'),
  query('jobType')
    .optional()
    .trim()
    .toUpperCase()
    .isIn(['FULL_TIME', 'PART_TIME', 'INTERNSHIP', 'CONTRACT'])
    .withMessage('jobType must be one of: FULL_TIME, PART_TIME, INTERNSHIP, CONTRACT'),
  validate,
];
