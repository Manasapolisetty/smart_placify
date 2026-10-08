import * as jobService from '../services/jobService.js';
import { successResponse } from '../utils/response.js';

/**
 * 1. GET /api/jobs (Public / Student job listings)
 */
export const getJobs = async (req, res, next) => {
  try {
    const jobs = await jobService.getJobs(req.query, req.user);
    return successResponse(res, 'Jobs retrieved successfully', jobs);
  } catch (error) {
    next(error);
  }
};

/**
 * 2. GET /api/jobs/:id (Public / Student detailed job view)
 */
export const getJobById = async (req, res, next) => {
  try {
    const job = await jobService.getJobById(req.params.id, req.user);
    return successResponse(res, 'Job details retrieved successfully', job);
  } catch (error) {
    next(error);
  }
};

/**
 * 3. POST /api/jobs (Admin / Recruiter Job Creation)
 */
export const createJob = async (req, res, next) => {
  try {
    const job = await jobService.createJob(req.user.id, req.user.role, req.body);
    return successResponse(res, 'Job created successfully', job, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * 4. PUT /api/jobs/:id (Admin / Recruiter Job Update)
 */
export const updateJob = async (req, res, next) => {
  try {
    const job = await jobService.updateJob(req.params.id, req.user.id, req.user.role, req.body);
    return successResponse(res, 'Job updated successfully', job);
  } catch (error) {
    next(error);
  }
};

/**
 * 5. DELETE /api/jobs/:id (Admin / Recruiter Job Deletion)
 */
export const deleteJob = async (req, res, next) => {
  try {
    const result = await jobService.deleteJob(req.params.id, req.user.id, req.user.role);
    return successResponse(res, 'Job deleted successfully', result);
  } catch (error) {
    next(error);
  }
};
