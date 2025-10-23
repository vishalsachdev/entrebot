/**
 * Authentication Middleware
 * Simple JWT-based authentication for MVP
 */

import { logger } from '../config/logger.js';

/**
 * Verify authentication token
 * Note: This is a simplified version for MVP
 * Production should use proper JWT validation
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: 'No authorization header provided'
      });
    }

    const token = authHeader.replace('Bearer ', '');

    // For MVP, we'll use a simple user ID as token
    // In production, this should validate JWT and extract user info
    req.userId = token;

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(401).json({
      success: false,
      error: 'Authentication failed'
    });
  }
};

/**
 * Optional authentication
 * Continues even if auth fails
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      req.userId = token;
    }

    next();
  } catch (error) {
    next();
  }
};

export default { authenticate, optionalAuth };
