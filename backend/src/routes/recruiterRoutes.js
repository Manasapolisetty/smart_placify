import { Router } from 'express';
import * as recruiterCtrl from '../controllers/recruiterController.js';
import * as interviewCtrl from '../controllers/interviewController.js';
import * as notifCtrl from '../controllers/notificationController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  validateUUIDParam,
  validateRecruiterProfileUpdate,
  validateCompanyUpdate,
  validateJobsQuery,
} from '../validators/recruiterValidator.js';
import {
  validateCreateJob,
  validateUpdateJob,
} from '../validators/jobValidator.js';
import {
  validateUpdateApplicationStatus,
  validateApplicationQuery,
} from '../validators/applicationValidator.js';
import {
  validateCreateInterview,
  validateUpdateInterview,
  validateInterviewQuery,
} from '../validators/interviewValidator.js';

const router = Router();

// Protect all recruiter endpoints: Authentication required, STUDENT receives 403 Forbidden
router.use(authenticate, authorize('RECRUITER', 'ADMIN', 'PLACEMENT_OFFICER'));

// ============================================================================
// 1 & 2. RECRUITER PROFILE
// ============================================================================
router.get('/profile', recruiterCtrl.getProfile);
router.put('/profile', validateRecruiterProfileUpdate, recruiterCtrl.updateProfile);

// ============================================================================
// 3 & 4. RECRUITER COMPANY
// ============================================================================
router.get('/company', recruiterCtrl.getCompany);
router.get('/company/:id', validateUUIDParam('id'), recruiterCtrl.getCompany);
router.put('/company', validateCompanyUpdate, recruiterCtrl.updateCompany);
router.put('/company/:id', validateUUIDParam('id'), validateCompanyUpdate, recruiterCtrl.updateCompany);

// ============================================================================
// 7. RECRUITER DASHBOARD
// ============================================================================
router.get('/dashboard', recruiterCtrl.getDashboard);

// ============================================================================
// 3, 4, 5, 6, 7. RECRUITER JOBS MANAGEMENT (DRAFT, OPEN, CLOSED, EXPIRED)
// ============================================================================
router.post('/jobs', validateCreateJob, recruiterCtrl.createJob);
router.get('/jobs', validateJobsQuery, recruiterCtrl.getJobs);
router.get('/jobs/:id', validateUUIDParam('id'), recruiterCtrl.getJobById);
router.put('/jobs/:id', validateUpdateJob, recruiterCtrl.updateJob);
router.delete('/jobs/:id', validateUUIDParam('id'), recruiterCtrl.deleteJob);

// ============================================================================
// 5, 6, 7. RECRUITER APPLICATIONS MANAGEMENT (Multi-tenant company scoped)
// ============================================================================
router.get('/applications', validateApplicationQuery, recruiterCtrl.getApplications);
router.get('/applications/:id', validateUUIDParam('id'), recruiterCtrl.getApplicationById);
router.put('/applications/:id/status', validateUpdateApplicationStatus, recruiterCtrl.updateApplicationStatus);
router.patch('/applications/:id/status', validateUpdateApplicationStatus, recruiterCtrl.updateApplicationStatus);

// ============================================================================
// 3, 4, 5, 6, 7. RECRUITER INTERVIEWS MANAGEMENT (Multi-tenant company scoped)
// ============================================================================
router.post('/interviews', validateCreateInterview, interviewCtrl.scheduleInterview);
router.get('/interviews', validateInterviewQuery, interviewCtrl.getInterviews);
router.get('/interviews/:id', validateUUIDParam('id'), interviewCtrl.getInterviewById);
router.put('/interviews/:id', validateUpdateInterview, interviewCtrl.updateInterview);
router.delete('/interviews/:id', validateUUIDParam('id'), interviewCtrl.deleteInterview);

// Candidates Pipeline compatibility aliases
router.get('/candidates', validateApplicationQuery, recruiterCtrl.getApplications);
router.get('/candidates/:id', validateUUIDParam('id'), recruiterCtrl.getApplicationById);
router.post('/candidates/:id/shortlist', validateUUIDParam('id'), recruiterCtrl.shortlistCandidate);
router.post('/candidates/:id/reject', validateUUIDParam('id'), recruiterCtrl.rejectCandidate);

// ============================================================================
// 8. RECRUITER NOTIFICATIONS
// ============================================================================
router.get('/notifications', notifCtrl.getNotifications);
router.put('/notifications/:id/read', validateUUIDParam('id'), notifCtrl.markAsRead);
router.put('/notifications/read-all', notifCtrl.markAllAsRead);

export default router;
