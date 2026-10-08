import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';

// Controllers
import * as studentCtrl from '../controllers/studentController.js';
import * as academicCtrl from '../controllers/academicController.js';
import * as skillCtrl from '../controllers/skillController.js';
import * as projectCtrl from '../controllers/projectController.js';
import * as certificationCtrl from '../controllers/certificationController.js';
import * as resumeCtrl from '../controllers/resumeController.js';
import * as studentAppCtrl from '../controllers/studentApplicationController.js';
import * as studentInterviewCtrl from '../controllers/studentInterviewController.js';
import * as studentNotifCtrl from '../controllers/studentNotificationController.js';

// Validators
import {
  validateUUIDParam,
  validateProfileUpdate,
  validateAcademicRecord,
  validateAcademicUpdate,
  validateSkill,
  validateProject,
  validateProjectUpdate,
  validateCertification,
  validateCertificationUpdate,
  validateResume,
  validateResumeUpdate,
} from '../validators/studentValidator.js';

const router = Router();

// Enforce authentication & STUDENT role authorization across all student endpoints
router.use(authenticate, authorize('STUDENT'));

// ============================================================================
// 1. STUDENT PROFILE
// ============================================================================
router.get('/profile', studentCtrl.getProfile);
router.get('/profile/:id', studentCtrl.getProfile); // Compatibility alias
router.put('/profile', validateProfileUpdate, studentCtrl.updateProfile);

// ============================================================================
// 2. ACADEMIC RECORDS
// ============================================================================
router.get('/academics', academicCtrl.getAcademics);
router.post('/academics', validateAcademicRecord, academicCtrl.createAcademicRecord);
router.put('/academics/:id', validateAcademicUpdate, academicCtrl.updateAcademicRecord);
router.delete('/academics/:id', validateUUIDParam('id'), academicCtrl.deleteAcademicRecord);

// ============================================================================
// 3. SKILLS
// ============================================================================
router.get('/skills', skillCtrl.getSkills);
router.post('/skills', validateSkill, skillCtrl.addSkill);
router.delete('/skills/:id', validateUUIDParam('id'), skillCtrl.deleteSkill);

// ============================================================================
// 4. PROJECTS
// ============================================================================
router.get('/projects', projectCtrl.getProjects);
router.post('/projects', validateProject, projectCtrl.createProject);
router.put('/projects/:id', validateProjectUpdate, projectCtrl.updateProject);
router.delete('/projects/:id', validateUUIDParam('id'), projectCtrl.deleteProject);

// ============================================================================
// 5. CERTIFICATIONS
// ============================================================================
router.get('/certifications', certificationCtrl.getCertifications);
router.post('/certifications', validateCertification, certificationCtrl.createCertification);
router.put('/certifications/:id', validateCertificationUpdate, certificationCtrl.updateCertification);
router.delete('/certifications/:id', validateUUIDParam('id'), certificationCtrl.deleteCertification);

// ============================================================================
// 6. RESUMES
// ============================================================================
router.get('/resumes', resumeCtrl.getResumes);
router.post('/resumes', validateResume, resumeCtrl.createResume);
router.post('/resumes/upload', validateResume, resumeCtrl.createResume); // Compatibility alias
router.put('/resumes/:id', validateResumeUpdate, resumeCtrl.updateResume);
router.delete('/resumes/:id', validateUUIDParam('id'), resumeCtrl.deleteResume);

// ============================================================================
// 7. ELIGIBLE JOBS
// ============================================================================
router.get('/eligible-jobs', studentCtrl.getEligibleJobs);

// ============================================================================
// 8. APPLICATIONS
// ============================================================================
router.get('/applications', studentAppCtrl.getApplications);
router.get('/applications/:id', validateUUIDParam('id'), studentAppCtrl.getApplicationById);
router.post('/applications/:id/withdraw', validateUUIDParam('id'), studentAppCtrl.withdrawApplication);

// ============================================================================
// 9. INTERVIEWS
// ============================================================================
router.get('/interviews', studentInterviewCtrl.getInterviews);
router.get('/interviews/:id', validateUUIDParam('id'), studentInterviewCtrl.getInterviewById);

// ============================================================================
// 10. NOTIFICATIONS
// ============================================================================
router.get('/notifications', studentNotifCtrl.getNotifications);
router.put('/notifications/:id/read', validateUUIDParam('id'), studentNotifCtrl.markNotificationAsRead);
router.put('/notifications/read-all', studentNotifCtrl.markAllNotificationsAsRead);

// ============================================================================
// 11. PLACEMENT STATUS
// ============================================================================
router.get('/placement-status', studentCtrl.getPlacementStatus);

export default router;
