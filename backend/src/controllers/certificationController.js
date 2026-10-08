import * as certificationService from '../services/certificationService.js';
import { successResponse } from '../utils/response.js';

export const getCertifications = async (req, res, next) => {
  try {
    const certs = await certificationService.getCertifications(req.user.id);
    return successResponse(res, 'Certifications retrieved successfully', certs);
  } catch (error) {
    next(error);
  }
};

export const createCertification = async (req, res, next) => {
  try {
    const cert = await certificationService.createCertification(req.user.id, req.body);
    return successResponse(res, 'Certification added successfully', cert, 201);
  } catch (error) {
    next(error);
  }
};

export const updateCertification = async (req, res, next) => {
  try {
    const cert = await certificationService.updateCertification(req.user.id, req.params.id, req.body);
    return successResponse(res, 'Certification updated successfully', cert);
  } catch (error) {
    next(error);
  }
};

export const deleteCertification = async (req, res, next) => {
  try {
    const result = await certificationService.deleteCertification(req.user.id, req.params.id);
    return successResponse(res, result.message, null);
  } catch (error) {
    next(error);
  }
};
