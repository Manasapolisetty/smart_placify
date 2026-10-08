import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import { successResponse } from '../utils/response.js';

const router = Router();

// Test Student Authorization
router.get('/student', authenticate, authorize('STUDENT'), (req, res) => {
  return successResponse(res, 'Student authorization verified successfully', {
    user: req.user,
    role: req.user.role,
  });
});

// Test Recruiter Authorization
router.get('/recruiter', authenticate, authorize('RECRUITER'), (req, res) => {
  return successResponse(res, 'Recruiter authorization verified successfully', {
    user: req.user,
    role: req.user.role,
  });
});

// Test Placement Officer Authorization
router.get('/placement-officer', authenticate, authorize('PLACEMENT_OFFICER'), (req, res) => {
  return successResponse(res, 'Placement Officer authorization verified successfully', {
    user: req.user,
    role: req.user.role,
  });
});

// Test Admin Authorization
router.get('/admin', authenticate, authorize('ADMIN'), (req, res) => {
  return successResponse(res, 'Admin authorization verified successfully', {
    user: req.user,
    role: req.user.role,
  });
});

export default router;
