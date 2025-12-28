/**
 * Session Routes
 * REST API endpoints for session management
 */

import express from 'express';
import { asyncHandler } from '../middleware/error.js';
import { authenticate } from '../middleware/auth.js';
import { sessionQueries } from '../database/queries.js';
import { getSupabase } from '../database/supabase.js';
import { logger } from '../config/logger.js';
import Joi from 'joi';
import { validateBody } from '../middleware/validation.js';

const router = express.Router();

// Validation schemas
const createSessionSchema = Joi.object({
  userId: Joi.string().required(),
  projectId: Joi.string().uuid().optional().allow(null),
  metadata: Joi.object().optional()
});

/**
 * GET /api/sessions
 * List sessions for a user by email
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { email } = req.query;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);

    if (!email) {
      const error = new Error('Email query parameter is required');
      error.statusCode = 400;
      throw error;
    }

    logger.info(`Fetching sessions for email: ${email}`);

    const supabase = getSupabase();

    // First get user by email
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (userError || !user) {
      // No user found, return empty array
      return res.status(200).json({
        success: true,
        data: [],
        count: 0
      });
    }

    // Get sessions for this user
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (sessionsError) {
      logger.error(`Failed to fetch sessions: ${sessionsError.message}`);
      throw new Error(sessionsError.message);
    }

    logger.info(`Retrieved ${sessions?.length || 0} sessions for email: ${email}`);

    res.status(200).json({
      success: true,
      data: sessions || [],
      count: sessions?.length || 0
    });
  })
);

/**
 * POST /api/sessions
 * Create new session
 */
router.post(
  '/',
  validateBody(createSessionSchema),
  asyncHandler(async (req, res) => {
    const { userId, projectId = null, metadata = {} } = req.body;

    logger.info(
      `Creating session for user: ${userId}${projectId ? `, project: ${projectId}` : ''}`
    );

    const result = await sessionQueries.create(userId, projectId, metadata);

    if (!result.success) {
      logger.error(`Failed to create session: ${result.error}`);
      throw new Error(result.error);
    }

    logger.info(`Session created successfully: ${result.session.id}`);

    res.status(201).json({
      success: true,
      data: result.session
    });
  })
);

/**
 * GET /api/sessions/:id
 * Get session details
 */
router.get(
  '/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    logger.info(`Fetching session: ${id}`);

    const result = await sessionQueries.getById(id);

    if (!result.success) {
      logger.error(`Failed to fetch session: ${result.error}`);
      throw new Error(result.error);
    }

    if (!result.session) {
      logger.info(`Session not found: ${id}`);
      const error = new Error('Session not found');
      error.statusCode = 404;
      throw error;
    }

    logger.info(`Session retrieved successfully: ${id}`);

    res.status(200).json({
      success: true,
      data: result.session
    });
  })
);

/**
 * GET /api/users/:userId/sessions
 * Get all sessions for a user
 */
router.get(
  '/users/:userId/sessions',
  authenticate,
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);

    logger.info(`Fetching sessions for user: ${userId} (limit: ${limit})`);

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error(`Failed to fetch user sessions: ${error.message}`);
      throw new Error(error.message);
    }

    logger.info(`Retrieved ${data?.length || 0} sessions for user: ${userId}`);

    res.status(200).json({
      success: true,
      data: data || [],
      count: data?.length || 0
    });
  })
);

export default router;
