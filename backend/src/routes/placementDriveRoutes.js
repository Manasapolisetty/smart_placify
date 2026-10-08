import { Router } from 'express';
import * as driveCtrl from '../controllers/placementDriveController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.get('/', driveCtrl.getDrives);
router.get('/:id', driveCtrl.getDriveById);
router.post('/', authenticate, authorize('PLACEMENT_OFFICER', 'ADMIN'), driveCtrl.createDrive);
router.put('/:id', authenticate, authorize('PLACEMENT_OFFICER', 'ADMIN'), driveCtrl.updateDrive);
router.delete('/:id', authenticate, authorize('PLACEMENT_OFFICER', 'ADMIN'), driveCtrl.deleteDrive);

export default router;
