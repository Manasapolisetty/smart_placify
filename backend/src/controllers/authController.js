import * as authService from '../services/authService.js';
import { successResponse } from '../utils/response.js';

/**
 * Handle user registration
 * POST /api/auth/register
 */
export const register = async (req, res, next) => {
  try {
    const { name, email, password, phone, role } = req.body;
    const { token, user } = await authService.registerUser({
      name,
      email,
      password,
      phone,
      role,
    });

    return successResponse(
      res,
      'User registered successfully',
      { token, user },
      201,
      { token, user } // Compatibility top-level fields for existing frontend axios interceptors
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Handle user login
 * POST /api/auth/login
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { token, user } = await authService.loginUser({ email, password });

    return successResponse(
      res,
      'Login successful',
      { token, user },
      200,
      { token, user } // Compatibility top-level fields
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieve authenticated user profile
 * GET /api/auth/me
 */
export const getCurrentUser = async (req, res, next) => {
  try {
    const user = await authService.getUserById(req.user.id);
    return successResponse(
      res,
      'Profile retrieved successfully',
      user,
      200,
      { user }
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Handle stateless logout
 * POST /api/auth/logout
 */
export const logout = (req, res) => {
  return successResponse(
    res,
    'Logout successful',
    null,
    200
  );
};
