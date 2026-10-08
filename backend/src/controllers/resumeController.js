import * as resumeService from '../services/resumeService.js';
import { successResponse } from '../utils/response.js';

export const getResumes = async (req, res, next) => {
  try {
    const resumes = await resumeService.getResumes(req.user.id);
    return successResponse(res, 'Resumes retrieved successfully', resumes);
  } catch (error) {
    next(error);
  }
};

export const createResume = async (req, res, next) => {
  try {
    const resume = await resumeService.createResume(req.user.id, req.body);
    return successResponse(res, 'Resume uploaded successfully', resume, 201);
  } catch (error) {
    next(error);
  }
};

export const updateResume = async (req, res, next) => {
  try {
    const resume = await resumeService.updateResume(req.user.id, req.params.id, req.body);
    return successResponse(res, 'Resume updated successfully', resume);
  } catch (error) {
    next(error);
  }
};

export const deleteResume = async (req, res, next) => {
  try {
    const result = await resumeService.deleteResume(req.user.id, req.params.id);
    return successResponse(res, result.message, null);
  } catch (error) {
    next(error);
  }
};
