import { Router } from 'express';
import * as interviewCtrl from '../controllers/interviewController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  validateUUIDParam,
  validateCreateInterview,
  validateUpdateInterview,
  validateInterviewQuery,
} from '../validators/interviewValidator.js';

const router = Router();

router.get('/', authenticate, validateInterviewQuery, interviewCtrl.getInterviews);
router.get('/:id', authenticate, validateUUIDParam('id'), interviewCtrl.getInterviewById);

// Scheduling and updates (Recruiter, Placement Officer, Admin)
router.post(
  '/',
  authenticate,
  authorize('RECRUITER', 'PLACEMENT_OFFICER', 'ADMIN'),
  validateCreateInterview,
  interviewCtrl.scheduleInterview
);
router.put(
  '/:id',
  authenticate,
  authorize('RECRUITER', 'PLACEMENT_OFFICER', 'ADMIN'),
  validateUpdateInterview,
  interviewCtrl.updateInterview
);
router.patch(
  '/:id/status',
  authenticate,
  authorize('RECRUITER', 'PLACEMENT_OFFICER', 'ADMIN'),
  validateUpdateInterview,
  interviewCtrl.updateInterviewStatus
);
router.delete(
  '/:id',
  authenticate,
  authorize('RECRUITER', 'PLACEMENT_OFFICER', 'ADMIN'),
  validateUUIDParam('id'),
  interviewCtrl.deleteInterview
);

export default router;
