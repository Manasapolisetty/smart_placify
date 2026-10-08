import { Router } from 'express';
import * as placementCtrl from '../controllers/placementController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// Placement Officer endpoints
router.get('/students', authenticate, authorize('PLACEMENT_OFFICER', 'ADMIN'), placementCtrl.getStudents);
router.get('/companies', authenticate, authorize('PLACEMENT_OFFICER', 'ADMIN'), placementCtrl.getCompanies);
router.get('/jobs', authenticate, authorize('PLACEMENT_OFFICER', 'ADMIN'), placementCtrl.getJobs);
router.get('/applications', authenticate, authorize('PLACEMENT_OFFICER', 'ADMIN'), placementCtrl.getApplications);
router.get('/interviews', authenticate, authorize('PLACEMENT_OFFICER', 'ADMIN'), placementCtrl.getInterviews);
router.get('/placements', authenticate, authorize('PLACEMENT_OFFICER', 'ADMIN'), placementCtrl.getPlacements);
router.get('/analytics', authenticate, authorize('PLACEMENT_OFFICER', 'ADMIN'), placementCtrl.getAnalytics);
router.get('/drives', authenticate, authorize('PLACEMENT_OFFICER', 'ADMIN'), placementCtrl.getDrives);
router.post('/drives', authenticate, authorize('PLACEMENT_OFFICER', 'ADMIN'), placementCtrl.createDrive);
router.get('/reports/export', authenticate, authorize('PLACEMENT_OFFICER', 'ADMIN'), placementCtrl.exportReport);

export default router;
