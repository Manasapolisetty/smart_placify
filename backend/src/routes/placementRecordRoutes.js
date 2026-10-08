import { Router } from 'express';
import * as placementRecordCtrl from '../controllers/placementRecordController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  validateUUIDParam,
  validateCreatePlacement,
  validateUpdatePlacement,
  validatePlacementQuery,
} from '../validators/placementValidator.js';

const router = Router();

// 1. Get placements list (Role scoped: Student views own, Recruiter views company's, Officer/Admin views all)
router.get('/', authenticate, validatePlacementQuery, placementRecordCtrl.getPlacements);

// 2. Get placement details by ID (Strict ownership validation)
router.get('/:id', authenticate, validateUUIDParam('id'), placementRecordCtrl.getPlacementById);

// 3. Create placement offer (Officer, Admin, or authorized Recruiter for own company)
router.post(
  '/',
  authenticate,
  authorize('PLACEMENT_OFFICER', 'ADMIN', 'RECRUITER'),
  validateCreatePlacement,
  placementRecordCtrl.createPlacement
);

// 4. Update placement (Officer, Admin, Recruiter, or Student accepting/declining)
router.put('/:id', authenticate, validateUpdatePlacement, placementRecordCtrl.updatePlacement);
router.patch('/:id', authenticate, validateUpdatePlacement, placementRecordCtrl.updatePlacement);

// 5. Delete or cancel placement (Officer, Admin, or Recruiter for unaccepted company offer)
router.delete(
  '/:id',
  authenticate,
  authorize('PLACEMENT_OFFICER', 'ADMIN', 'RECRUITER'),
  validateUUIDParam('id'),
  placementRecordCtrl.deletePlacement
);

export default router;
