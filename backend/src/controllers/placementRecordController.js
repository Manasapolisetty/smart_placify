import * as placementService from '../services/placementService.js';
import { successResponse } from '../utils/response.js';

export const getPlacements = async (req, res, next) => {
  try {
    const list = await placementService.getPlacements(req.user, req.query);
    return successResponse(res, 'Placements retrieved successfully', list);
  } catch (error) {
    next(error);
  }
};

export const getPlacementById = async (req, res, next) => {
  try {
    const item = await placementService.getPlacementById(req.params.id, req.user);
    return successResponse(res, 'Placement record retrieved', item);
  } catch (error) {
    next(error);
  }
};

export const createPlacement = async (req, res, next) => {
  try {
    const created = await placementService.createPlacement(req.body, req.user);
    return successResponse(res, 'Placement recorded successfully', created, 201);
  } catch (error) {
    next(error);
  }
};

export const updatePlacement = async (req, res, next) => {
  try {
    const updated = await placementService.updatePlacement(req.params.id, req.body, req.user);
    return successResponse(res, 'Placement updated successfully', updated);
  } catch (error) {
    next(error);
  }
};

export const deletePlacement = async (req, res, next) => {
  try {
    const result = await placementService.deletePlacement(req.params.id, req.user);
    return successResponse(res, 'Placement record deleted successfully', result);
  } catch (error) {
    next(error);
  }
};
