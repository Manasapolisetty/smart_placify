import * as skillService from '../services/skillService.js';
import { successResponse } from '../utils/response.js';

export const getSkills = async (req, res, next) => {
  try {
    const skills = await skillService.getSkills(req.user.id);
    return successResponse(res, 'Skills retrieved successfully', skills);
  } catch (error) {
    next(error);
  }
};

export const addSkill = async (req, res, next) => {
  try {
    const skill = await skillService.addSkill(req.user.id, req.body);
    return successResponse(res, 'Skill added successfully', skill, 201);
  } catch (error) {
    next(error);
  }
};

export const deleteSkill = async (req, res, next) => {
  try {
    const result = await skillService.deleteSkill(req.user.id, req.params.id);
    return successResponse(res, result.message, null);
  } catch (error) {
    next(error);
  }
};
