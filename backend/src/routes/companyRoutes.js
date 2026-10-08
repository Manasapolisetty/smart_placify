import { Router } from 'express';
import * as companyCtrl from '../controllers/companyController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateUUIDParam, validateCompanyUpdate } from '../validators/recruiterValidator.js';

const router = Router();

// ============================================================================
// COMPANY DIRECTORY & DETAILS
// ============================================================================
router.get('/', companyCtrl.getCompanies);
router.get('/:id', validateUUIDParam('id'), companyCtrl.getCompanyById);

// ============================================================================
// 6. PUT /api/companies/:id
// Protected: Only company's recruiter, ADMIN, or PLACEMENT_OFFICER can update
// ============================================================================
router.put(
  '/:id',
  authenticate,
  authorize('RECRUITER', 'ADMIN', 'PLACEMENT_OFFICER'),
  validateUUIDParam('id'),
  validateCompanyUpdate,
  companyCtrl.updateCompany
);

export default router;
