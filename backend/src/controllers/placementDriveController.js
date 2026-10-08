import * as placementDriveService from '../services/placementDriveService.js';
import { successResponse } from '../utils/response.js';

export const getDrives = async (req, res, next) => {
  try {
    const drives = await placementDriveService.getPlacementDrives(req.query);
    return successResponse(res, 'Placement drives retrieved', drives);
  } catch (error) {
    next(error);
  }
};

export const getDriveById = async (req, res, next) => {
  try {
    const drive = await placementDriveService.getPlacementDriveById(req.params.id);
    return successResponse(res, 'Placement drive retrieved', drive);
  } catch (error) {
    next(error);
  }
};

export const createDrive = async (req, res, next) => {
  try {
    const drive = await placementDriveService.createPlacementDrive(req.user.id, req.body);
    return successResponse(res, 'Placement drive created successfully', drive, 201);
  } catch (error) {
    next(error);
  }
};

export const updateDrive = async (req, res, next) => {
  try {
    const drive = await placementDriveService.updatePlacementDrive(req.params.id, req.body);
    return successResponse(res, 'Placement drive updated successfully', drive);
  } catch (error) {
    next(error);
  }
};

export const deleteDrive = async (req, res, next) => {
  try {
    await placementDriveService.deletePlacementDrive(req.params.id);
    return successResponse(res, 'Placement drive deleted successfully', null);
  } catch (error) {
    next(error);
  }
};
