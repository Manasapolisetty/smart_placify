/**
 * Standardized API Response Utilities
 */

export const successResponse = (res, message = 'Operation successful', data = {}, statusCode = 200, extra = {}) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    ...extra,
  });
};

export const errorResponse = (res, message = 'An error occurred', errors = [], statusCode = 500) => {
  const formattedErrors = Array.isArray(errors) ? errors : [errors];
  return res.status(statusCode).json({
    success: false,
    message,
    errors: formattedErrors,
  });
};
