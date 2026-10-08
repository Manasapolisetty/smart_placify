import * as placementOfficerService from '../services/placementOfficerService.js';
import * as placementDriveService from '../services/placementDriveService.js';
import * as companyService from '../services/companyService.js';
import * as jobService from '../services/jobService.js';
import * as applicationService from '../services/applicationService.js';
import * as interviewService from '../services/interviewService.js';
import { query } from '../config/database.js';
import { successResponse } from '../utils/response.js';

export const getStudents = async (req, res, next) => {
  try {
    const list = await placementOfficerService.getStudentsList(req.query);
    return successResponse(res, 'Students retrieved successfully', list);
  } catch (error) {
    next(error);
  }
};

export const getCompanies = async (req, res, next) => {
  try {
    const list = await companyService.getCompanies();
    return successResponse(res, 'Companies retrieved successfully', list);
  } catch (error) {
    next(error);
  }
};

export const getJobs = async (req, res, next) => {
  try {
    const list = await jobService.getJobs(req.query);
    return successResponse(res, 'Jobs retrieved successfully', list);
  } catch (error) {
    next(error);
  }
};

export const getApplications = async (req, res, next) => {
  try {
    const list = await applicationService.getApplications(req.query);
    return successResponse(res, 'Applications retrieved successfully', list);
  } catch (error) {
    next(error);
  }
};

export const getInterviews = async (req, res, next) => {
  try {
    const list = await interviewService.getInterviews(req.query);
    return successResponse(res, 'Interviews retrieved successfully', list);
  } catch (error) {
    next(error);
  }
};

export const getPlacements = async (req, res, next) => {
  try {
    const data = await placementOfficerService.getPlacementsList ? await placementOfficerService.getPlacementsList(req.query) : await query(
      `SELECT p.id, p.student_id as "studentId", u.name as "studentName",
              p.company_id as "companyId", c.company_name as "companyName",
              p.job_id as "jobId", j.job_title as "jobTitle",
              p.package,
              to_char(p.placement_date, 'DD Mon YYYY') as "placementDate",
              p.status as "placementStatus"
       FROM placements p
       JOIN students s ON p.student_id = s.id
       JOIN users u ON s.user_id = u.id
       JOIN companies c ON p.company_id = c.id
       LEFT JOIN jobs j ON p.job_id = j.id
       ORDER BY p.placement_date DESC`
    ).then((r) => r.rows);
    return successResponse(res, 'Placements retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

export const getAnalytics = async (req, res, next) => {
  try {
    const data = await placementOfficerService.getPlacementAnalytics();
    return successResponse(res, 'Analytics data retrieved', data);
  } catch (error) {
    next(error);
  }
};

export const getDrives = async (req, res, next) => {
  try {
    const list = await placementDriveService.getPlacementDrives(req.query);
    return successResponse(res, 'Placement drives retrieved', list);
  } catch (error) {
    next(error);
  }
};

export const createDrive = async (req, res, next) => {
  try {
    const drive = await placementDriveService.createPlacementDrive(req.user.id, req.body);
    return successResponse(res, 'Placement drive created', drive, 201);
  } catch (error) {
    next(error);
  }
};

export const exportReport = async (req, res, next) => {
  try {
    const type = req.query.type || 'summary';
    const analytics = await placementOfficerService.getPlacementAnalytics();
    const reportData = {
      type,
      generatedAt: new Date().toISOString(),
      summary: analytics,
      downloadUrl: `/api/placement/reports/download?type=${type}`,
    };
    return successResponse(res, 'Report generated successfully', reportData);
  } catch (error) {
    next(error);
  }
};
