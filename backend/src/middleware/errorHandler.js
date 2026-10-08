import { errorResponse } from '../utils/response.js';

export const errorHandler = (err, req, res, next) => {
  console.error('[Application Error]:', err.message || 'Unknown error');

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  // Do not expose stack trace or database internal details in responses
  let clientMessage = message;
  let clientErrors = [];

  // PostgreSQL specific error code handling
  if (err.code === '23505') {
    // Unique violation
    clientMessage = 'A duplicate record already exists.';
    clientErrors = [err.detail || 'Duplicate key constraint violated.'];
    return errorResponse(res, clientMessage, clientErrors, 409);
  }

  if (err.code === '23503') {
    // Foreign key violation
    clientMessage = 'Referenced resource does not exist.';
    clientErrors = [err.detail || 'Foreign key constraint violated.'];
    return errorResponse(res, clientMessage, clientErrors, 400);
  }

  if (err.code === '22P02') {
    // Invalid text representation (e.g. invalid UUID)
    clientMessage = 'Invalid identifier or data format provided.';
    return errorResponse(res, clientMessage, ['Invalid UUID syntax or type conversion failure.'], 400);
  }

  return errorResponse(res, clientMessage, clientErrors, statusCode);
};
