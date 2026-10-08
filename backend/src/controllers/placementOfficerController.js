import * as placementOfficerService from '../services/placementOfficerService.js';
import * as placementDriveService from '../services/placementDriveService.js';
import * as interviewService from '../services/interviewService.js';
import { successResponse } from '../utils/response.js';

/**
 * 1. GET /api/placement-officers/dashboard
 */
export const getDashboard = async (req, res, next) => {
  try {
    const stats = await placementOfficerService.getDashboardStats();
    return successResponse(res, 'Dashboard statistics retrieved successfully', stats);
  } catch (error) {
    next(error);
  }
};

/**
 * 2. GET /api/placement-officers/students
 */
export const getStudents = async (req, res, next) => {
  try {
    const result = await placementOfficerService.getStudentsList(req.query);
    return successResponse(res, 'Students retrieved successfully', result.students, 200, {
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 3. GET /api/placement-officers/students/:id
 */
export const getStudentById = async (req, res, next) => {
  try {
    const student = await placementOfficerService.getStudentDetailsById(req.params.id);
    return successResponse(res, 'Student details retrieved successfully', student);
  } catch (error) {
    next(error);
  }
};

/**
 * 4. GET /api/placement-officers/companies
 */
export const getCompanies = async (req, res, next) => {
  try {
    const result = await placementOfficerService.getCompaniesList(req.query);
    return successResponse(res, 'Companies retrieved successfully', result.companies, 200, {
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 5. GET /api/placement-officers/jobs
 */
export const getJobs = async (req, res, next) => {
  try {
    const result = await placementOfficerService.getJobsList(req.query);
    return successResponse(res, 'Jobs retrieved successfully', result.jobs, 200, {
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 6. GET /api/placement-officers/applications
 */
export const getApplications = async (req, res, next) => {
  try {
    const result = await placementOfficerService.getApplicationsList(req.query);
    return successResponse(res, 'Applications retrieved successfully', result.applications, 200, {
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 7. GET /api/placement-officers/interviews
 */
export const getInterviews = async (req, res, next) => {
  try {
    const result = await interviewService.getRecruiterInterviews(null, 'ADMIN', req.query);
    return successResponse(res, 'Interviews retrieved successfully', result.interviews, 200, {
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 8. GET /api/placement-officers/placement-drives
 */
export const getPlacementDrives = async (req, res, next) => {
  try {
    const result = await placementDriveService.getPlacementDrives(req.query);
    return successResponse(res, 'Placement drives retrieved successfully', result.drives, 200, {
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 9. POST /api/placement-officers/placement-drives
 */
export const createPlacementDrive = async (req, res, next) => {
  try {
    const drive = await placementDriveService.createPlacementDrive(req.user.id, req.body);
    return successResponse(res, 'Placement drive created successfully', drive, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * 10. GET /api/placement-officers/placement-drives/:id
 */
export const getPlacementDriveById = async (req, res, next) => {
  try {
    const drive = await placementDriveService.getPlacementDriveById(req.params.id);
    return successResponse(res, 'Placement drive retrieved successfully', drive);
  } catch (error) {
    next(error);
  }
};

/**
 * 11. PUT /api/placement-officers/placement-drives/:id
 */
export const updatePlacementDrive = async (req, res, next) => {
  try {
    const drive = await placementDriveService.updatePlacementDrive(req.params.id, req.body);
    return successResponse(res, 'Placement drive updated successfully', drive);
  } catch (error) {
    next(error);
  }
};

/**
 * 12. DELETE /api/placement-officers/placement-drives/:id
 */
export const deletePlacementDrive = async (req, res, next) => {
  try {
    const result = await placementDriveService.deletePlacementDrive(req.params.id);
    return successResponse(res, 'Placement drive deleted successfully', result);
  } catch (error) {
    next(error);
  }
};
