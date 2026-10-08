import { Router } from 'express';
import * as applicationCtrl from '../controllers/applicationController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  validateUUIDParam,
  validateApplyJob,
  validateUpdateApplicationStatus,
  validateApplicationQuery,
} from '../validators/applicationValidator.js';

const router = Router();

// Student apply endpoints
router.post('/', authenticate, authorize('STUDENT'), validateApplyJob, applicationCtrl.applyForJob);
router.post('/:jobId/apply', authenticate, authorize('STUDENT'), validateUUIDParam('jobId'), validateApplyJob, applicationCtrl.applyForJob);

// Applications list & details
router.get('/', authenticate, validateApplicationQuery, applicationCtrl.getApplications);
router.get('/:id', authenticate, validateUUIDParam('id'), applicationCtrl.getApplicationById);

// Student withdraw
router.post('/:id/withdraw', authenticate, authorize('STUDENT'), validateUUIDParam('id'), applicationCtrl.withdrawApplication);

// Recruiter / Admin status updates
router.put(
  '/:id/status',
  authenticate,
  authorize('RECRUITER', 'PLACEMENT_OFFICER', 'ADMIN'),
  validateUpdateApplicationStatus,
  applicationCtrl.updateApplicationStatus
);
router.patch(
  '/:id/status',
  authenticate,
  authorize('RECRUITER', 'PLACEMENT_OFFICER', 'ADMIN'),
  validateUpdateApplicationStatus,
  applicationCtrl.updateApplicationStatus
);

export default router;
