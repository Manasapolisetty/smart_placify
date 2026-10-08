import * as interviewService from './interviewService.js';

/**
 * 1. GET /api/students/interviews
 * List candidate's interviews
 */
export const getInterviews = async (userId) => {
  return interviewService.getStudentInterviews(userId);
};

/**
 * 2. GET /api/students/interviews/:id
 * Retrieve candidate's interview by ID with ownership verification
 */
export const getInterviewById = async (userId, interviewId) => {
  return interviewService.getStudentInterviewById(userId, interviewId);
};
