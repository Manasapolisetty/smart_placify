import * as applicationService from '../services/applicationService.js';
import { successResponse } from '../utils/response.js';

/**
 * 1. POST /api/jobs/:jobId/apply
 * Apply for job
 */
export const applyForJob = async (req, res, next) => {
  try {
    const jobId = req.params.jobId || req.body.jobId;
    const app = await applicationService.applyForJob(req.user.id, jobId, req.body);
    return successResponse(res, 'Application submitted successfully', app, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * 2 / 5. GET /api/applications or role-specific lists
 */
export const getApplications = async (req, res, next) => {
  try {
    if (req.user?.role === 'STUDENT') {
      const apps = await applicationService.getStudentApplications(req.user.id);
      return successResponse(res, 'Applications retrieved successfully', apps);
    }
    const result = await applicationService.getRecruiterApplications(req.user.id, req.user.role, req.query);
    return successResponse(res, 'Applications retrieved successfully', result.applications, 200, {
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 3 / 6. GET /api/applications/:id
 */
export const getApplicationById = async (req, res, next) => {
  try {
    if (req.user?.role === 'STUDENT') {
      const app = await applicationService.getStudentApplicationById(req.user.id, req.params.id);
      return successResponse(res, 'Application retrieved successfully', app);
    }
    const app = await applicationService.getRecruiterApplicationById(req.user.id, req.user.role, req.params.id);
    return successResponse(res, 'Application retrieved successfully', app);
  } catch (error) {
    next(error);
  }
};

/**
 * 4. POST /api/applications/:id/withdraw or /api/students/applications/:id/withdraw
 */
export const withdrawApplication = async (req, res, next) => {
  try {
    const app = await applicationService.withdrawStudentApplication(req.user.id, req.params.id);
    return successResponse(res, 'Application withdrawn successfully', app);
  } catch (error) {
    next(error);
  }
};

/**
 * 7. PUT /api/applications/:id/status
 */
export const updateApplicationStatus = async (req, res, next) => {
  try {
    const { status, remarks, notes } = req.body;
    const updated = await applicationService.updateRecruiterApplicationStatus(
      req.user.id,
      req.user.role,
      req.params.id,
      status,
      remarks || notes || ''
    );
    return successResponse(res, 'Application status updated successfully', updated);
  } catch (error) {
    next(error);
  }
};
