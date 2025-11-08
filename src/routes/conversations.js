/**
 * Conversation Routes
 * REST API endpoints for message operations
 */

import express from 'express';
import { asyncHandler } from '../middleware/error.js';
import { authenticate } from '../middleware/auth.js';
import { conversationQueries } from '../database/queries.js';
import { logger } from '../config/logger.js';
import Joi from 'joi';
import { validateBody } from '../middleware/validation.js';

const router = express.Router();

// Validation schemas
const createMessageSchema = Joi.object({
  sessionId: Joi.string().required(),
  role: Joi.string().valid('user', 'assistant', 'system').required(),
  content: Joi.string().required().min(1),
  metadata: Joi.object().optional()
});

/**
 * POST /api/conversations
 * Add message to session
 */
router.post('/', validateBody(createMessageSchema), asyncHandler(async (req, res) => {
  const { sessionId, role, content, metadata = {} } = req.body;

  logger.info(`Adding message to session ${sessionId} with role: ${role}`);

  const result = await conversationQueries.create(sessionId, role, content, metadata);

  if (!result.success) {
    logger.error(`Failed to create message: ${result.error}`);
    throw new Error(result.error);
  }

  logger.info(`Message created successfully: ${result.message.id}`);

  res.status(201).json({
    success: true,
    data: result.message
  });
}));

/**
 * GET /api/conversations/:sessionId
 * Get conversation history
 */
router.get('/:sessionId', authenticate, asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const limit = Math.min(parseInt(req.query.limit) || 50, 200);

  logger.info(`Fetching conversation history for session: ${sessionId} (limit: ${limit})`);

  const result = await conversationQueries.getHistory(sessionId, limit);

  if (!result.success) {
    logger.error(`Failed to fetch conversation: ${result.error}`);
    throw new Error(result.error);
  }

  logger.info(`Retrieved ${result.messages.length} messages for session: ${sessionId}`);

  res.status(200).json({
    success: true,
    data: result.messages,
    count: result.messages.length
  });
}));

/**
 * GET /api/conversations/:sessionId/summary
 * Get conversation summary
 */
router.get('/:sessionId/summary', authenticate, asyncHandler(async (req, res) => {
  const { sessionId } = req.params;

  logger.info(`Generating conversation summary for session: ${sessionId}`);

  const result = await conversationQueries.getHistory(sessionId, 200);

  if (!result.success) {
    logger.error(`Failed to fetch conversation for summary: ${result.error}`);
    throw new Error(result.error);
  }

  const messages = result.messages;

  // Generate summary statistics
  const summary = {
    sessionId,
    totalMessages: messages.length,
    messagesByRole: {
      user: messages.filter(m => m.role === 'user').length,
      assistant: messages.filter(m => m.role === 'assistant').length,
      system: messages.filter(m => m.role === 'system').length
    },
    firstMessage: messages[0] || null,
    lastMessage: messages[messages.length - 1] || null,
    conversationStarted: messages[0]?.created_at || null,
    lastActivity: messages[messages.length - 1]?.created_at || null,
    totalCharacters: messages.reduce((sum, m) => sum + (m.content?.length || 0), 0),
    averageMessageLength: messages.length > 0
      ? Math.round(messages.reduce((sum, m) => sum + (m.content?.length || 0), 0) / messages.length)
      : 0
  };

  logger.info(`Summary generated for session ${sessionId}: ${summary.totalMessages} messages`);

  res.status(200).json({
    success: true,
    data: summary
  });
}));

export default router;
