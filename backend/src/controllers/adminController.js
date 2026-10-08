import * as adminService from '../services/adminService.js';
import { successResponse } from '../utils/response.js';

export const getUsers = async (req, res, next) => {
  try {
    const list = await adminService.getUsers(req.query);
    return successResponse(res, 'Users retrieved successfully', list);
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const user = await adminService.getUserById(req.params.id);
    return successResponse(res, 'User retrieved successfully', user);
  } catch (error) {
    next(error);
  }
};

export const createUser = async (req, res, next) => {
  try {
    const user = await adminService.createUser(req.body);
    return successResponse(res, 'User created successfully', user, 201);
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const user = await adminService.updateUser(req.params.id, req.body);
    return successResponse(res, 'User updated successfully', user);
  } catch (error) {
    next(error);
  }
};

export const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const user = await adminService.updateUserRole(req.params.id, role);
    return successResponse(res, 'User role updated successfully', user);
  } catch (error) {
    next(error);
  }
};

export const toggleUserStatus = async (req, res, next) => {
  try {
    const user = await adminService.toggleUserStatus(req.params.id);
    return successResponse(res, 'User status toggled successfully', user);
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    await adminService.deleteUser(req.params.id);
    return successResponse(res, 'User deleted successfully', null);
  } catch (error) {
    next(error);
  }
};

export const getDepartments = async (req, res, next) => {
  try {
    const list = await adminService.getDepartments();
    return successResponse(res, 'Departments retrieved successfully', list);
  } catch (error) {
    next(error);
  }
};

export const getCourses = async (req, res, next) => {
  try {
    const list = await adminService.getCourses();
    return successResponse(res, 'Courses retrieved successfully', list);
  } catch (error) {
    next(error);
  }
};

export const getAuditLogs = async (req, res, next) => {
  try {
    const logs = await adminService.getAuditLogs(req.query);
    return successResponse(res, 'Audit logs retrieved', logs);
  } catch (error) {
    next(error);
  }
};

export const getAnalytics = async (req, res, next) => {
  try {
    const data = await adminService.getAnalytics();
    return successResponse(res, 'Platform analytics retrieved', data);
  } catch (error) {
    next(error);
  }
};
