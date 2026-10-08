import * as projectService from '../services/projectService.js';
import { successResponse } from '../utils/response.js';

export const getProjects = async (req, res, next) => {
  try {
    const projects = await projectService.getProjects(req.user.id);
    return successResponse(res, 'Projects retrieved successfully', projects);
  } catch (error) {
    next(error);
  }
};

export const createProject = async (req, res, next) => {
  try {
    const project = await projectService.createProject(req.user.id, req.body);
    return successResponse(res, 'Project added successfully', project, 201);
  } catch (error) {
    next(error);
  }
};

export const updateProject = async (req, res, next) => {
  try {
    const project = await projectService.updateProject(req.user.id, req.params.id, req.body);
    return successResponse(res, 'Project updated successfully', project);
  } catch (error) {
    next(error);
  }
};

export const deleteProject = async (req, res, next) => {
  try {
    const result = await projectService.deleteProject(req.user.id, req.params.id);
    return successResponse(res, result.message, null);
  } catch (error) {
    next(error);
  }
};
