/**
 * Memory Routes
 * REST API endpoints for memory persistence
 */

import express from 'express';
import { asyncHandler } from '../middleware/error.js';
import { authenticate } from '../middleware/auth.js';
import { memoryQueries } from '../database/queries.js';
import { getSupabase } from '../database/supabase.js';
import { logger } from '../config/logger.js';
import Joi from 'joi';
import { validateBody } from '../middleware/validation.js';

const router = express.Router();

// Validation schemas
const setMemorySchema = Joi.object({
  sessionId: Joi.string().required(),
  key: Joi.string().pattern(/^[a-zA-Z0-9._-]+$/).required(),
  value: Joi.any().required()
});

/**
 * POST /api/memory
 * Store memory key-value pair
 */
router.post('/', validateBody(setMemorySchema), asyncHandler(async (req, res) => {
  const { sessionId, key, value } = req.body;

  logger.info(`Storing memory for session ${sessionId}, key: ${key}`);

  const result = await memoryQueries.set(sessionId, key, value);

  if (!result.success) {
    logger.error(`Failed to store memory: ${result.error}`);
    throw new Error(result.error);
  }

  logger.info(`Memory stored successfully for session ${sessionId}, key: ${key}`);

  res.status(201).json({
    success: true,
    data: {
      sessionId,
      key,
      stored: true
    }
  });
}));

/**
 * GET /api/memory/:sessionId/:key
 * Get specific memory value
 */
router.get('/:sessionId/:key', authenticate, asyncHandler(async (req, res) => {
  const { sessionId, key } = req.params;

  logger.info(`Fetching memory for session ${sessionId}, key: ${key}`);

  const result = await memoryQueries.get(sessionId, key);

  if (!result.success) {
    logger.error(`Failed to fetch memory: ${result.error}`);
    throw new Error(result.error);
  }

  if (result.value === null) {
    logger.info(`Memory not found for session ${sessionId}, key: ${key}`);
    const error = new Error('Memory key not found');
    error.statusCode = 404;
    throw error;
  }

  logger.info(`Memory retrieved successfully for session ${sessionId}, key: ${key}`);

  res.status(200).json({
    success: true,
    data: {
      sessionId,
      key,
      value: result.value
    }
  });
}));

/**
 * GET /api/memory/:sessionId
 * Get all memory for a session
 */
router.get('/:sessionId', authenticate, asyncHandler(async (req, res) => {
  const { sessionId } = req.params;

  logger.info(`Fetching all memory for session: ${sessionId}`);

  const result = await memoryQueries.getAll(sessionId);

  if (!result.success) {
    logger.error(`Failed to fetch session memory: ${result.error}`);
    throw new Error(result.error);
  }

  const memoryCount = Object.keys(result.memory).length;
  logger.info(`Retrieved ${memoryCount} memory items for session: ${sessionId}`);

  res.status(200).json({
    success: true,
    data: {
      sessionId,
      memory: result.memory,
      count: memoryCount
    }
  });
}));

/**
 * DELETE /api/memory/:sessionId/:key
 * Delete specific memory key
 */
router.delete('/:sessionId/:key', authenticate, asyncHandler(async (req, res) => {
  const { sessionId, key } = req.params;

  logger.info(`Deleting memory for session ${sessionId}, key: ${key}`);

  const supabase = getSupabase();
  const { error } = await supabase
    .from('memory')
    .delete()
    .eq('session_id', sessionId)
    .eq('key', key);

  if (error) {
    logger.error(`Failed to delete memory: ${error.message}`);
    throw new Error(error.message);
  }

  logger.info(`Memory deleted successfully for session ${sessionId}, key: ${key}`);

  res.status(200).json({
    success: true,
    data: {
      sessionId,
      key,
      deleted: true
    }
  });
}));

export default router;
