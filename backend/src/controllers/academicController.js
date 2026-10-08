import * as academicService from '../services/academicService.js';
import { successResponse } from '../utils/response.js';

export const getAcademics = async (req, res, next) => {
  try {
    const data = await academicService.getAcademics(req.user.id);
    return successResponse(res, 'Academic records retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

export const createAcademicRecord = async (req, res, next) => {
  try {
    const record = await academicService.createAcademicRecord(req.user.id, req.body);
    return successResponse(res, 'Academic record added successfully', record, 201);
  } catch (error) {
    next(error);
  }
};

export const updateAcademicRecord = async (req, res, next) => {
  try {
    const record = await academicService.updateAcademicRecord(req.user.id, req.params.id, req.body);
    return successResponse(res, 'Academic record updated successfully', record);
  } catch (error) {
    next(error);
  }
};

export const deleteAcademicRecord = async (req, res, next) => {
  try {
    const result = await academicService.deleteAcademicRecord(req.user.id, req.params.id);
    return successResponse(res, result.message, null);
  } catch (error) {
    next(error);
  }
};
