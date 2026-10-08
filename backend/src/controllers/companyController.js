import * as companyService from '../services/companyService.js';
import { successResponse } from '../utils/response.js';

/**
 * GET /api/companies
 */
export const getCompanies = async (req, res, next) => {
  try {
    const list = await companyService.getCompanies(req.query);
    return successResponse(res, 'Companies retrieved successfully', list);
  } catch (error) {
    next(error);
  }
};

/**
 * 5. GET /api/companies/:id
 */
export const getCompanyById = async (req, res, next) => {
  try {
    const company = await companyService.getCompanyById(req.params.id);
    return successResponse(res, 'Company retrieved successfully', company);
  } catch (error) {
    next(error);
  }
};

/**
 * 6. PUT /api/companies/:id
 */
export const updateCompany = async (req, res, next) => {
  try {
    const updated = await companyService.updateCompany(req.params.id, req.body, req.user);
    return successResponse(res, 'Company updated successfully', updated);
  } catch (error) {
    next(error);
  }
};
