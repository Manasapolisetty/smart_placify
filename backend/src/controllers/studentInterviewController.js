import * as studentInterviewService from '../services/studentInterviewService.js';
import { successResponse } from '../utils/response.js';

export const getInterviews = async (req, res, next) => {
  try {
    const interviews = await studentInterviewService.getInterviews(req.user.id);
    return successResponse(res, 'Interviews retrieved successfully', interviews);
  } catch (error) {
    next(error);
  }
};

export const getInterviewById = async (req, res, next) => {
  try {
    const interview = await studentInterviewService.getInterviewById(req.user.id, req.params.id);
    return successResponse(res, 'Interview retrieved successfully', interview);
  } catch (error) {
    next(error);
  }
};
