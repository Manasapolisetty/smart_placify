import { Router } from 'express';
import * as notifCtrl from '../controllers/notificationController.js';
import { authenticate } from '../middleware/auth.js';
import { validateUUIDParam } from '../validators/placementValidator.js';

const router = Router();

router.get('/', authenticate, notifCtrl.getNotifications);
router.put('/:id/read', authenticate, validateUUIDParam('id'), notifCtrl.markAsRead);
router.patch('/:id/read', authenticate, validateUUIDParam('id'), notifCtrl.markAsRead);
router.put('/read-all', authenticate, notifCtrl.markAllAsRead);
router.post('/mark-all-read', authenticate, notifCtrl.markAllAsRead);

export default router;
