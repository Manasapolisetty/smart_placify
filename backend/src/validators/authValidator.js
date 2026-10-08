import { body } from 'express-validator';
import { validate } from './validate.js';

export const validateRegister = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('A valid email address is required')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('phone')
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Phone number must be a valid 10-digit Indian mobile number'),
  body('role')
    .optional()
    .trim()
    .custom((val) => {
      const normalized = val ? val.toUpperCase() : 'STUDENT';
      if (normalized === 'ADMIN' || normalized === 'PLACEMENT_OFFICER') {
        throw new Error('Public registration is not permitted for Placement Officer or Administrator roles');
      }
      if (!['STUDENT', 'RECRUITER'].includes(normalized)) {
        throw new Error('Role must be either STUDENT or RECRUITER');
      }
      return true;
    }),
  validate,
];

export const validateLogin = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('A valid email address is required')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  validate,
];
