import * as interviewService from '../services/interviewService.js';
import { successResponse } from '../utils/response.js';

/**
 * 1 / 4. List Interviews (Role-sensitive)
 */
export const getInterviews = async (req, res, next) => {
  try {
    if (req.user?.role === 'STUDENT') {
      const interviews = await interviewService.getStudentInterviews(req.user.id);
      return successResponse(res, 'Interviews retrieved successfully', interviews);
    }
    const result = await interviewService.getRecruiterInterviews(req.user.id, req.user.role, req.query);
    return successResponse(res, 'Interviews retrieved successfully', result.interviews, 200, {
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 2 / 5. Retrieve Interview by ID (Role-sensitive)
 */
export const getInterviewById = async (req, res, next) => {
  try {
    if (req.user?.role === 'STUDENT') {
      const interview = await interviewService.getStudentInterviewById(req.user.id, req.params.id);
      return successResponse(res, 'Interview retrieved successfully', interview);
    }
    const interview = await interviewService.getRecruiterInterviewById(req.user.id, req.user.role, req.params.id);
    return successResponse(res, 'Interview retrieved successfully', interview);
  } catch (error) {
    next(error);
  }
};

/**
 * 3. Schedule Interview
 */
export const scheduleInterview = async (req, res, next) => {
  try {
    const interview = await interviewService.scheduleInterview(req.user.id, req.user.role, req.body);
    return successResponse(res, 'Interview scheduled successfully', interview, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * 6. Update Interview
 */
export const updateInterview = async (req, res, next) => {
  try {
    const interview = await interviewService.updateRecruiterInterview(req.user.id, req.user.role, req.params.id, req.body);
    return successResponse(res, 'Interview updated successfully', interview);
  } catch (error) {
    next(error);
  }
};

/**
 * Update Interview Status
 */
export const updateInterviewStatus = async (req, res, next) => {
  try {
    const { status, feedback } = req.body;
    const interview = await interviewService.updateRecruiterInterview(req.user.id, req.user.role, req.params.id, {
      status,
      feedback,
    });
    return successResponse(res, 'Interview status updated successfully', interview);
  } catch (error) {
    next(error);
  }
};

/**
 * 7. Delete Interview
 */
export const deleteInterview = async (req, res, next) => {
  try {
    const result = await interviewService.deleteRecruiterInterview(req.user.id, req.user.role, req.params.id);
    return successResponse(res, 'Interview deleted successfully', result);
  } catch (error) {
    next(error);
  }
};
