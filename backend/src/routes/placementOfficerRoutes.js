import { Router } from 'express';
import * as placementOfficerCtrl from '../controllers/placementOfficerController.js';
import * as notifCtrl from '../controllers/notificationController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  validateUUIDParam,
  validateCreateDrive,
  validateUpdateDrive,
  validateQueryFilter,
} from '../validators/placementOfficerValidator.js';

const router = Router();

// Protect all Placement Officer endpoints: Authentication required, PLACEMENT_OFFICER or ADMIN role
router.use(authenticate, authorize('PLACEMENT_OFFICER', 'ADMIN'));

// ============================================================================
// 1. DASHBOARD
// ============================================================================
router.get('/dashboard', placementOfficerCtrl.getDashboard);

// ============================================================================
// 2 & 3. STUDENTS
// ============================================================================
router.get('/students', validateQueryFilter, placementOfficerCtrl.getStudents);
router.get('/students/:id', validateUUIDParam('id'), placementOfficerCtrl.getStudentById);

// ============================================================================
// 4. COMPANIES
// ============================================================================
router.get('/companies', validateQueryFilter, placementOfficerCtrl.getCompanies);

// ============================================================================
// 5. JOBS
// ============================================================================
router.get('/jobs', validateQueryFilter, placementOfficerCtrl.getJobs);

// ============================================================================
// 6. APPLICATIONS
// ============================================================================
router.get('/applications', validateQueryFilter, placementOfficerCtrl.getApplications);

// ============================================================================
// 7. INTERVIEWS
// ============================================================================
router.get('/interviews', validateQueryFilter, placementOfficerCtrl.getInterviews);

// ============================================================================
// 8, 9, 10, 11, 12. PLACEMENT DRIVES
// ============================================================================
router.get('/placement-drives', validateQueryFilter, placementOfficerCtrl.getPlacementDrives);
router.post('/placement-drives', validateCreateDrive, placementOfficerCtrl.createPlacementDrive);
router.get('/placement-drives/:id', validateUUIDParam('id'), placementOfficerCtrl.getPlacementDriveById);
router.put('/placement-drives/:id', validateUpdateDrive, placementOfficerCtrl.updatePlacementDrive);
router.delete('/placement-drives/:id', validateUUIDParam('id'), placementOfficerCtrl.deletePlacementDrive);

// Compatibility aliases for /drives
router.get('/drives', validateQueryFilter, placementOfficerCtrl.getPlacementDrives);
router.post('/drives', validateCreateDrive, placementOfficerCtrl.createPlacementDrive);
router.get('/drives/:id', validateUUIDParam('id'), placementOfficerCtrl.getPlacementDriveById);
router.put('/drives/:id', validateUpdateDrive, placementOfficerCtrl.updatePlacementDrive);
router.delete('/drives/:id', validateUUIDParam('id'), placementOfficerCtrl.deletePlacementDrive);

// ============================================================================
// 13. PLACEMENT OFFICER NOTIFICATIONS
// ============================================================================
router.get('/notifications', notifCtrl.getNotifications);
router.put('/notifications/:id/read', validateUUIDParam('id'), notifCtrl.markAsRead);
router.put('/notifications/read-all', notifCtrl.markAllAsRead);

export default router;
