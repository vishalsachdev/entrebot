/**
 * Error Handling Middleware
 */

import { logger } from '../config/logger.js';

/**
 * Global error handler
 */
export const errorHandler = (err, req, res, next) => {
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

/**
 * 404 handler
 */
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
};

/**
 * Async error wrapper
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default { errorHandler, notFoundHandler, asyncHandler };
