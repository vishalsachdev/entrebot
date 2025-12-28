/**
 * Authentication Middleware
 * Validates JWT tokens using Supabase Auth
 */

import { logger } from '../config/logger.js';
import { getSupabase } from '../database/supabase.js';

/**
 * Verify authentication token using Supabase Auth
 * Validates the JWT and extracts user information
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

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    // Validate token with Supabase Auth
    const supabase = getSupabase();
    const {
      data: { user },
      error
    } = await supabase.auth.getUser(token);

    if (error) {
      logger.warn('Token validation failed:', error.message);
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    // Attach validated user info to request
    req.userId = user.id;
    req.user = {
      id: user.id,
      email: user.email,
      emailConfirmed: user.email_confirmed_at !== null,
      createdAt: user.created_at,
      lastSignIn: user.last_sign_in_at
    };

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
 * Validates token if present, continues either way
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');

      if (token) {
        // Validate token with Supabase Auth
        const supabase = getSupabase();
        const {
          data: { user },
          error
        } = await supabase.auth.getUser(token);

        if (!error && user) {
          req.userId = user.id;
          req.user = {
            id: user.id,
            email: user.email,
            emailConfirmed: user.email_confirmed_at !== null,
            createdAt: user.created_at,
            lastSignIn: user.last_sign_in_at
          };
        }
      }
    }

    next();
  } catch (error) {
    // For optional auth, continue even if validation fails
    logger.debug('Optional auth failed, continuing without user:', error.message);
    next();
  }
};

export default { authenticate, optionalAuth };
