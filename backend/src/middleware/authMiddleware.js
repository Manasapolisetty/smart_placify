import { verifyToken } from '../utils/jwt.js';
import { query } from '../config/database.js';
import { errorResponse } from '../utils/response.js';

/**
 * Authentication Middleware: Validates JWT Bearer Token
 * Attaches authenticated user object to req.user
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 'Authentication required. No token provided.', [], 401);
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return errorResponse(res, 'Authentication token missing.', [], 401);
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return errorResponse(res, 'Authentication token expired. Please log in again.', [], 401);
      }
      return errorResponse(res, 'Invalid authentication token.', [], 401);
    }

    const userId = decoded.userId || decoded.id;
    if (!userId) {
      return errorResponse(res, 'Invalid authentication token payload.', [], 401);
    }

    // Verify user exists and is active in PostgreSQL users table
    const userRes = await query(
      'SELECT id, name, email, role, phone, status FROM users WHERE id = $1',
      [userId]
    );

    if (userRes.rows.length === 0) {
      return errorResponse(res, 'User account not found.', [], 401);
    }

    const user = userRes.rows[0];

    // Enforce account status check
    const normalizedStatus = (user.status || '').toUpperCase();
    if (normalizedStatus !== 'ACTIVE') {
      return errorResponse(
        res,
        'Account is inactive or suspended. Please contact administrator.',
        [],
        403
      );
    }

    // Attach authenticated user to request
    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      status: user.status,
    };

    next();
  } catch (error) {
    return errorResponse(res, 'Authentication verification failed.', [error.message], 401);
  }
};
