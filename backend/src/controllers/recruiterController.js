import * as recruiterService from '../services/recruiterService.js';
import * as jobService from '../services/jobService.js';
import * as applicationService from '../services/applicationService.js';
import { successResponse } from '../utils/response.js';

/**
 * 1. GET /api/recruiters/profile
 */
export const getProfile = async (req, res, next) => {
  try {
    const profile = await recruiterService.getRecruiterProfile(req.user.id);
    return successResponse(res, 'Recruiter profile retrieved successfully', profile);
  } catch (error) {
    next(error);
  }
};

/**
 * 2. PUT /api/recruiters/profile
 */
export const updateProfile = async (req, res, next) => {
  try {
    const profile = await recruiterService.updateRecruiterProfile(req.user.id, req.body);
    return successResponse(res, 'Recruiter profile updated successfully', profile);
  } catch (error) {
    next(error);
  }
};

/**
 * 3. GET /api/recruiters/company
 */
export const getCompany = async (req, res, next) => {
  try {
    const company = await recruiterService.getRecruiterCompany(req.user.id);
    return successResponse(res, 'Company retrieved successfully', company);
  } catch (error) {
    next(error);
  }
};

/**
 * 4. PUT /api/recruiters/company
 */
export const updateCompany = async (req, res, next) => {
  try {
    const company = await recruiterService.updateRecruiterCompany(req.user.id, req.body);
    return successResponse(res, 'Company updated successfully', company);
  } catch (error) {
    next(error);
  }
};

// Aliases for compatibility
export const getCompanyProfile = getCompany;
export const updateCompanyProfile = updateCompany;

/**
 * 7. GET /api/recruiters/dashboard
 */
export const getDashboard = async (req, res, next) => {
  try {
    const dashboardStats = await recruiterService.getRecruiterDashboard(req.user.id);
    return successResponse(res, 'Recruiter dashboard statistics retrieved successfully', dashboardStats);
  } catch (error) {
    next(error);
  }
};

/**
 * 8. GET /api/recruiters/jobs
 */
export const getJobs = async (req, res, next) => {
  try {
    const jobs = await recruiterService.getRecruiterJobs(req.user.id, req.user.role, req.query);
    return successResponse(res, 'Recruiter jobs retrieved successfully', jobs);
  } catch (error) {
    next(error);
  }
};

/**
 * 9. GET /api/recruiters/jobs/:id
 */
export const getJobById = async (req, res, next) => {
  try {
    const job = await recruiterService.getRecruiterJobById(req.user.id, req.user.role, req.params.id);
    return successResponse(res, 'Job details retrieved successfully', job);
  } catch (error) {
    next(error);
  }
};

/**
 * 3. POST /api/recruiters/jobs
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
 * 6. PUT /api/recruiters/jobs/:id
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
 * 7. DELETE /api/recruiters/jobs/:id
 */
export const deleteJob = async (req, res, next) => {
  try {
    const result = await jobService.deleteJob(req.params.id, req.user.id, req.user.role);
    return successResponse(res, 'Job deleted successfully', result);
  } catch (error) {
    next(error);
  }
};

/**
 * Applications / Candidate pipeline management
 */
export const getApplications = async (req, res, next) => {
  try {
    const result = await applicationService.getRecruiterApplications(req.user.id, req.user.role, req.query);
    return successResponse(res, 'Applications retrieved successfully', result.applications, 200, {
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

export const getApplicationById = async (req, res, next) => {
  try {
    const app = await applicationService.getRecruiterApplicationById(req.user.id, req.user.role, req.params.id);
    return successResponse(res, 'Application retrieved successfully', app);
  } catch (error) {
    next(error);
  }
};

export const updateApplicationStatus = async (req, res, next) => {
  try {
    const status = req.body.status;
    const remarks = req.body.remarks || req.body.notes || '';
    const updated = await applicationService.updateRecruiterApplicationStatus(
      req.user.id,
      req.user.role,
      req.params.id,
      status,
      remarks
    );
    return successResponse(res, 'Application status updated successfully', updated);
  } catch (error) {
    next(error);
  }
};

export const getCandidates = async (req, res, next) => {
  try {
    const candidates = await recruiterService.getCandidates(req.user.id, req.user.role, req.query);
    return successResponse(res, 'Candidates retrieved successfully', candidates);
  } catch (error) {
    next(error);
  }
};

export const shortlistCandidate = async (req, res, next) => {
  try {
    const updated = await recruiterService.shortlistCandidate(req.params.id, req.user.id, req.user.role);
    return successResponse(res, 'Candidate shortlisted successfully', updated);
  } catch (error) {
    next(error);
  }
};

export const rejectCandidate = async (req, res, next) => {
  try {
    const updated = await recruiterService.rejectCandidate(req.params.id, req.user.id, req.user.role);
    return successResponse(res, 'Candidate rejected successfully', updated);
  } catch (error) {
    next(error);
  }
};

/**
 * Recruiter Interview Handlers
 */
export {
  scheduleInterview,
  getInterviews,
  getInterviewById,
  updateInterview,
  deleteInterview,
} from './interviewController.js';
