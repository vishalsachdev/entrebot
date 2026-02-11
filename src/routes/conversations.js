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
import { requireSessionOwnership, resolveAuthenticatedAppUserId } from '../utils/authz.js';

const router = express.Router();

// Validation schemas
const createMessageSchema = Joi.object({
  sessionId: Joi.string().required(),
  role: Joi.string().valid('user', 'assistant', 'system').required(),
  content: Joi.string().required().min(1),
  metadata: Joi.object().optional()
});

const updateMessageSchema = Joi.object({
  content: Joi.string().min(1).optional(),
  metadata: Joi.object().optional()
}).or('content', 'metadata');

async function ensureSessionAccess(req, sessionId, actionVerb = 'access') {
  const userId = await resolveAuthenticatedAppUserId(req);
  await requireSessionOwnership(sessionId, userId, actionVerb);
  return userId;
}

async function ensureMessageAccess(req, messageId, actionVerb = 'access') {
  const userId = await resolveAuthenticatedAppUserId(req);
  const messageResult = await conversationQueries.getById(messageId);
  if (!messageResult.success) {
    throw new Error(messageResult.error);
  }
  if (!messageResult.message) {
    const error = new Error('Message not found');
    error.statusCode = 404;
    throw error;
  }
  await requireSessionOwnership(messageResult.message.session_id, userId, actionVerb);
  return messageResult.message;
}

/**
 * POST /api/conversations
 * Add message to session
 */
router.post(
  '/',
  authenticate,
  validateBody(createMessageSchema),
  asyncHandler(async (req, res) => {
    const { sessionId, role, content, metadata = {} } = req.body;
    await ensureSessionAccess(req, sessionId, 'update');

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
  })
);

/**
 * PATCH /api/conversations/:messageId
 * Update a single message
 */
router.patch(
  '/:messageId',
  authenticate,
  validateBody(updateMessageSchema),
  asyncHandler(async (req, res) => {
    const { messageId } = req.params;
    const { content, metadata } = req.body;
    await ensureMessageAccess(req, messageId, 'update');

    logger.info(`Updating message: ${messageId}`);

    const result = await conversationQueries.update(messageId, { content, metadata });

    if (!result.success) {
      logger.error(`Failed to update message: ${result.error}`);
      throw new Error(result.error);
    }

    if (!result.message) {
      const error = new Error('Message not found');
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      success: true,
      data: result.message
    });
  })
);

/**
 * DELETE /api/conversations/:messageId
 * Delete a single message
 */
router.delete(
  '/:messageId',
  authenticate,
  asyncHandler(async (req, res) => {
    const { messageId } = req.params;
    await ensureMessageAccess(req, messageId, 'delete');

    logger.info(`Deleting message: ${messageId}`);

    const result = await conversationQueries.delete(messageId);

    if (!result.success) {
      logger.error(`Failed to delete message: ${result.error}`);
      throw new Error(result.error);
    }

    if (!result.deleted) {
      const error = new Error('Message not found');
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      success: true,
      data: {
        id: messageId,
        deleted: true
      }
    });
  })
);

/**
 * GET /api/conversations/message/:messageId
 * Get a single message by ID
 */
router.get(
  '/message/:messageId',
  authenticate,
  asyncHandler(async (req, res) => {
    const { messageId } = req.params;
    const message = await ensureMessageAccess(req, messageId, 'access');

    res.status(200).json({
      success: true,
      data: message
    });
  })
);

/**
 * GET /api/conversations/:sessionId
 * Get conversation history
 */
router.get(
  '/:sessionId',
  authenticate,
  asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const offset = Math.max(parseInt(req.query.offset) || 0, 0);
    await ensureSessionAccess(req, sessionId, 'access');

    logger.info(
      `Fetching conversation history for session: ${sessionId} (limit: ${limit}, offset: ${offset})`
    );

    const result = await conversationQueries.getHistory(sessionId, limit, offset);

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
  })
);

/**
 * GET /api/conversations/:sessionId/search
 * Search messages in a session by content.
 */
router.get(
  '/:sessionId/search',
  authenticate,
  asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const query = String(req.query.q || '').trim();
    const limit = Math.min(parseInt(req.query.limit) || 20, 200);
    await ensureSessionAccess(req, sessionId, 'access');

    if (!query) {
      const error = new Error('Query parameter q is required');
      error.statusCode = 400;
      throw error;
    }

    const history = await conversationQueries.getHistory(sessionId, 1000, 0);
    if (!history.success) {
      throw new Error(history.error);
    }

    const qLower = query.toLowerCase();
    const matches = (history.messages || [])
      .filter(message => (message.content || '').toLowerCase().includes(qLower))
      .slice(0, limit);

    res.status(200).json({
      success: true,
      data: matches,
      count: matches.length
    });
  })
);

/**
 * GET /api/conversations/:sessionId/summary
 * Get conversation summary
 */
router.get(
  '/:sessionId/summary',
  authenticate,
  asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const firstN = Math.min(parseInt(req.query.first) || 5, 50);
    const lastN = Math.min(parseInt(req.query.last) || 10, 50);
    await ensureSessionAccess(req, sessionId, 'access');

    logger.info(`Generating conversation summary for session: ${sessionId}`);

    const result = await conversationQueries.getHistory(sessionId, 200);

    if (!result.success) {
      logger.error(`Failed to fetch conversation for summary: ${result.error}`);
      throw new Error(result.error);
    }

    const messages = result.messages;

    // Calculate summary statistics
    const totalChars = messages.reduce((sum, m) => sum + (m.content?.length || 0), 0);
    const avgLength = messages.length > 0 ? Math.round(totalChars / messages.length) : 0;

    const summary = {
      sessionId,
      totalMessages: messages.length,
      first: messages.slice(0, firstN),
      last: messages.slice(Math.max(messages.length - lastN, 0)),
      total: messages.length,
      messagesByRole: {
        user: messages.filter(m => m.role === 'user').length,
        assistant: messages.filter(m => m.role === 'assistant').length,
        system: messages.filter(m => m.role === 'system').length
      },
      firstMessage: messages[0] || null,
      lastMessage: messages[messages.length - 1] || null,
      conversationStarted: messages[0]?.created_at || null,
      lastActivity: messages[messages.length - 1]?.created_at || null,
      totalCharacters: totalChars,
      averageMessageLength: avgLength
    };

    logger.info(`Summary generated for session ${sessionId}: ${summary.totalMessages} messages`);

    res.status(200).json({
      success: true,
      data: summary
    });
  })
);

export default router;
