import * as studentApplicationService from '../services/studentApplicationService.js';
import { successResponse } from '../utils/response.js';

export const getApplications = async (req, res, next) => {
  try {
    const apps = await studentApplicationService.getApplications(req.user.id);
    return successResponse(res, 'Applications retrieved successfully', apps);
  } catch (error) {
    next(error);
  }
};

export const getApplicationById = async (req, res, next) => {
  try {
    const app = await studentApplicationService.getApplicationById(req.user.id, req.params.id);
    return successResponse(res, 'Application retrieved successfully', app);
  } catch (error) {
    next(error);
  }
};

export const applyForJob = async (req, res, next) => {
  try {
    const jobId = req.params.jobId || req.body.jobId;
    const application = await studentApplicationService.applyForJob(req.user.id, jobId, req.body);
    return successResponse(res, 'Application submitted successfully', application, 201);
  } catch (error) {
    next(error);
  }
};

export const withdrawApplication = async (req, res, next) => {
  try {
    const app = await studentApplicationService.withdrawApplication(req.user.id, req.params.id);
    return successResponse(res, 'Application withdrawn successfully', app);
  } catch (error) {
    next(error);
  }
};
