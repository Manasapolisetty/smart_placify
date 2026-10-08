import { errorResponse } from '../utils/response.js';

// Normalizer to align roles across uppercase DB enum and potential variants
const normalizeRole = (role) => {
  if (!role) return '';
  const r = role.toString().trim().toUpperCase();
  if (r === 'PLACEMENT' || r === 'PLACEMENT_OFFICER') return 'PLACEMENT_OFFICER';
  return r;
};

/**
 * Role-Based Authorization Middleware
 * Verifies if the authenticated user possesses one of the allowed roles
 * @param {...string} allowedRoles - Allowed roles (e.g. 'STUDENT', 'ADMIN', 'RECRUITER', 'PLACEMENT_OFFICER')
 */
export const authorize = (...allowedRoles) => {
  const normalizedAllowed = allowedRoles.map((role) => normalizeRole(role));

  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'Authentication required.', [], 401);
    }

    const userRole = normalizeRole(req.user.role);

    // If allowed roles includes user role, proceed
    if (normalizedAllowed.includes(userRole)) {
      return next();
    }

    return errorResponse(
      res,
      'Access denied: You do not have permission to access this resource.',
      [],
      403
    );
  };
};
