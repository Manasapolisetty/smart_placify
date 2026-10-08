import { Router } from 'express';
import * as jobCtrl from '../controllers/jobController.js';
import { applyForJob } from '../controllers/applicationController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  validateUUIDParam,
  validateCreateJob,
  validateUpdateJob,
  validatePublicJobsQuery,
} from '../validators/jobValidator.js';
import { validateApplyJob } from '../validators/applicationValidator.js';

const router = Router();

// ============================================================================
// 1. GET /api/jobs (Public / Student job listings)
// ============================================================================
router.get('/', validatePublicJobsQuery, (req, res, next) => {
  // Allow optional token attachment to compute personalized student eligibility
  if (req.headers.authorization) {
    return authenticate(req, res, () => jobCtrl.getJobs(req, res, next));
  }
  return jobCtrl.getJobs(req, res, next);
});

// ============================================================================
// 2. GET /api/jobs/:id (Public / Student job details)
// ============================================================================
router.get('/:id', validateUUIDParam('id'), (req, res, next) => {
  if (req.headers.authorization) {
    return authenticate(req, res, () => jobCtrl.getJobById(req, res, next));
  }
  return jobCtrl.getJobById(req, res, next);
});

// ============================================================================
// Student Job Application: POST /api/jobs/:jobId/apply
// ============================================================================
router.post(
  '/:jobId/apply',
  authenticate,
  authorize('STUDENT'),
  validateUUIDParam('jobId'),
  validateApplyJob,
  applyForJob
);

// ============================================================================
// Recruiter / Admin / Placement Officer Job Management
// ============================================================================
router.post(
  '/',
  authenticate,
  authorize('RECRUITER', 'ADMIN', 'PLACEMENT_OFFICER'),
  validateCreateJob,
  jobCtrl.createJob
);

router.put(
  '/:id',
  authenticate,
  authorize('RECRUITER', 'ADMIN', 'PLACEMENT_OFFICER'),
  validateUpdateJob,
  jobCtrl.updateJob
);

router.delete(
  '/:id',
  authenticate,
  authorize('RECRUITER', 'ADMIN', 'PLACEMENT_OFFICER'),
  validateUUIDParam('id'),
  jobCtrl.deleteJob
);

export default router;
