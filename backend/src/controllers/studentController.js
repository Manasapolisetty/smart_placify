import * as studentService from '../services/studentService.js';
import { successResponse } from '../utils/response.js';

// Backward compatibility imports for existing routes if referenced
import * as academicService from '../services/academicService.js';
import * as skillService from '../services/skillService.js';
import * as projectService from '../services/projectService.js';
import * as certificationService from '../services/certificationService.js';
import * as resumeService from '../services/resumeService.js';
import * as studentApplicationService from '../services/studentApplicationService.js';
import * as studentInterviewService from '../services/studentInterviewService.js';
import * as studentNotificationService from '../services/studentNotificationService.js';

/**
 * 1. STUDENT PROFILE
 */
export const getProfile = async (req, res, next) => {
  try {
    const profile = await studentService.getStudentProfile(req.user.id);
    return successResponse(res, 'Student profile retrieved successfully', profile);
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const profile = await studentService.updateStudentProfile(req.user.id, req.body);
    return successResponse(res, 'Student profile updated successfully', profile);
  } catch (error) {
    next(error);
  }
};

/**
 * 7. ELIGIBLE JOBS
 */
export const getEligibleJobs = async (req, res, next) => {
  try {
    const jobs = await studentService.getEligibleJobs(req.user.id);
    return successResponse(res, 'Eligible jobs retrieved successfully', jobs);
  } catch (error) {
    next(error);
  }
};

/**
 * 11. PLACEMENT STATUS
 */
export const getPlacementStatus = async (req, res, next) => {
  try {
    const status = await studentService.getPlacementStatus(req.user.id);
    return successResponse(res, 'Placement status retrieved successfully', status);
  } catch (error) {
    next(error);
  }
};

// Delegations for backward compatibility
export const getAcademics = async (req, res, next) => {
  try {
    const academics = await academicService.getAcademics(req.user.id);
    return successResponse(res, 'Academic records retrieved', academics);
  } catch (error) {
    next(error);
  }
};

export const updateAcademics = async (req, res, next) => {
  try {
    const record = await academicService.createAcademicRecord(req.user.id, req.body);
    return successResponse(res, 'Academic records saved', record);
  } catch (error) {
    next(error);
  }
};

export const getSkills = async (req, res, next) => {
  try {
    const skills = await skillService.getSkills(req.user.id);
    return successResponse(res, 'Skills retrieved', skills);
  } catch (error) {
    next(error);
  }
};

export const addSkill = async (req, res, next) => {
  try {
    const skill = await skillService.addSkill(req.user.id, req.body);
    return successResponse(res, 'Skill added', skill, 201);
  } catch (error) {
    next(error);
  }
};

export const deleteSkill = async (req, res, next) => {
  try {
    await skillService.deleteSkill(req.user.id, req.params.id);
    return successResponse(res, 'Skill deleted', null);
  } catch (error) {
    next(error);
  }
};

export const getProjects = async (req, res, next) => {
  try {
    const projects = await projectService.getProjects(req.user.id);
    return successResponse(res, 'Projects retrieved', projects);
  } catch (error) {
    next(error);
  }
};

export const addProject = async (req, res, next) => {
  try {
    const project = await projectService.createProject(req.user.id, req.body);
    return successResponse(res, 'Project added', project, 201);
  } catch (error) {
    next(error);
  }
};

export const updateProject = async (req, res, next) => {
  try {
    const project = await projectService.updateProject(req.user.id, req.params.id, req.body);
    return successResponse(res, 'Project updated', project);
  } catch (error) {
    next(error);
  }
};

export const deleteProject = async (req, res, next) => {
  try {
    await projectService.deleteProject(req.user.id, req.params.id);
    return successResponse(res, 'Project deleted', null);
  } catch (error) {
    next(error);
  }
};

export const getCertifications = async (req, res, next) => {
  try {
    const certs = await certificationService.getCertifications(req.user.id);
    return successResponse(res, 'Certifications retrieved', certs);
  } catch (error) {
    next(error);
  }
};

export const addCertification = async (req, res, next) => {
  try {
    const cert = await certificationService.createCertification(req.user.id, req.body);
    return successResponse(res, 'Certification added', cert, 201);
  } catch (error) {
    next(error);
  }
};

export const updateCertification = async (req, res, next) => {
  try {
    const cert = await certificationService.updateCertification(req.user.id, req.params.id, req.body);
    return successResponse(res, 'Certification updated', cert);
  } catch (error) {
    next(error);
  }
};

export const deleteCertification = async (req, res, next) => {
  try {
    await certificationService.deleteCertification(req.user.id, req.params.id);
    return successResponse(res, 'Certification deleted', null);
  } catch (error) {
    next(error);
  }
};

export const getResumes = async (req, res, next) => {
  try {
    const resumes = await resumeService.getResumes(req.user.id);
    return successResponse(res, 'Resumes retrieved', resumes);
  } catch (error) {
    next(error);
  }
};

export const uploadResume = async (req, res, next) => {
  try {
    const resume = await resumeService.createResume(req.user.id, req.body);
    return successResponse(res, 'Resume uploaded successfully', resume, 201);
  } catch (error) {
    next(error);
  }
};

export const getApplications = async (req, res, next) => {
  try {
    const applications = await studentApplicationService.getApplications(req.user.id);
    return successResponse(res, 'Applications retrieved', applications);
  } catch (error) {
    next(error);
  }
};

export const getInterviews = async (req, res, next) => {
  try {
    const interviews = await studentInterviewService.getInterviews(req.user.id);
    return successResponse(res, 'Interviews retrieved', interviews);
  } catch (error) {
    next(error);
  }
};

export const getNotifications = async (req, res, next) => {
  try {
    const notifications = await studentNotificationService.getNotifications(req.user.id);
    return successResponse(res, 'Notifications retrieved', notifications);
  } catch (error) {
    next(error);
  }
};
