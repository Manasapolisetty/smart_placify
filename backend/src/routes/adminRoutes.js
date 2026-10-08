import { Router } from 'express';
import * as adminCtrl from '../controllers/adminController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// User management endpoints
router.get('/users', authenticate, authorize('ADMIN'), adminCtrl.getUsers);
router.get('/users/:id', authenticate, authorize('ADMIN'), adminCtrl.getUserById);
router.post('/users', authenticate, authorize('ADMIN'), adminCtrl.createUser);
router.put('/users/:id', authenticate, authorize('ADMIN'), adminCtrl.updateUser);
router.patch('/users/:id/role', authenticate, authorize('ADMIN'), adminCtrl.updateUserRole);
router.patch('/users/:id/status', authenticate, authorize('ADMIN'), adminCtrl.toggleUserStatus);
router.delete('/users/:id', authenticate, authorize('ADMIN'), adminCtrl.deleteUser);

// Academic structures
router.get('/departments', authenticate, authorize('ADMIN'), adminCtrl.getDepartments);
router.get('/courses', authenticate, authorize('ADMIN'), adminCtrl.getCourses);

// System analytics & audit logs
router.get('/analytics', authenticate, authorize('ADMIN'), adminCtrl.getAnalytics);
router.get('/audit-logs', authenticate, authorize('ADMIN'), adminCtrl.getAuditLogs);

export default router;
