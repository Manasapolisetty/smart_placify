import jwt from 'jsonwebtoken';

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET environment variable is missing in production');
  }
  return secret || 'smartplacify_dev_jwt_secret_key_2026';
};

const getJwtExpiresIn = () => {
  return process.env.JWT_EXPIRES_IN || '1d';
};

/**
 * Generate a signed JWT token
 * @param {Object} payload - Token payload (userId, role, etc.)
 */
export const generateToken = (payload) => {
  const secret = getJwtSecret();
  const expiresIn = getJwtExpiresIn();

  const tokenPayload = {
    userId: payload.userId || payload.id,
    id: payload.id || payload.userId,
    role: payload.role,
  };

  return jwt.sign(tokenPayload, secret, { expiresIn });
};

/**
 * Verify and decode a JWT token
 * @param {string} token - Bearer JWT token
 */
export const verifyToken = (token) => {
  const secret = getJwtSecret();
  return jwt.verify(token, secret);
};
