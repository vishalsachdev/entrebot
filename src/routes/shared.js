/**
 * Shared Conversation Routes
 * Create public conversation links and allow forking into new sessions.
 */

import crypto from 'crypto';
import express from 'express';
import Joi from 'joi';
import { asyncHandler } from '../middleware/error.js';
import { validateBody } from '../middleware/validation.js';
import { authenticate } from '../middleware/auth.js';
import {
  conversationQueries,
  sessionQueries,
  sharedConversationQueries,
  userQueries
} from '../database/queries.js';
import { logger } from '../config/logger.js';
import { config } from '../config/env.js';

const router = express.Router();

const createShareSchema = Joi.object({
  sessionId: Joi.string().required(),
  title: Joi.string().max(200).optional(),
  description: Joi.string().max(1000).optional().allow(''),
  public: Joi.boolean().optional(),
  allowForking: Joi.boolean().optional()
});

const forkSchema = Joi.object({
  projectId: Joi.string().optional().allow(null)
});

function makeShareId() {
  return crypto.randomBytes(8).toString('hex').slice(0, 12);
}

async function resolveAuthenticatedAppUserId(req) {
  const email = req.user?.email;
  if (!email) {
    const error = new Error('Authentication required');
    error.statusCode = 401;
    throw error;
  }

  const existing = await userQueries.getByEmail(email);
  if (existing.success && existing.user?.id) {
    return existing.user.id;
  }

  const created = await userQueries.create(email, {
    name: email.split('@')[0]
  });
  if (!created.success || !created.user?.id) {
    throw new Error(created.error || 'Failed to resolve authenticated user');
  }
  return created.user.id;
}

/**
 * POST /api/v1/shared
 * Create a public share link for a session.
 */
router.post(
  '/',
  authenticate,
  validateBody(createShareSchema),
  asyncHandler(async (req, res) => {
    const {
      sessionId,
      title = null,
      description = null,
      public: isPublic = true,
      allowForking = true
    } = req.body;
    const userId = await resolveAuthenticatedAppUserId(req);

    const sessionResult = await sessionQueries.getById(sessionId);
    if (!sessionResult.success) {
      throw new Error(sessionResult.error);
    }
    if (!sessionResult.session) {
      const error = new Error('Session not found');
      error.statusCode = 404;
      throw error;
    }
    if (sessionResult.session.user_id !== userId) {
      const error = new Error('You can only share your own sessions');
      error.statusCode = 403;
      throw error;
    }

    const historyResult = await conversationQueries.getHistory(sessionId, 1000);
    if (!historyResult.success) {
      throw new Error(historyResult.error);
    }

    const sharePayload = {
      share_id: makeShareId(),
      session_id: sessionId,
      owner_user_id: userId,
      title,
      description,
      public: isPublic,
      allow_forking: allowForking,
      messages: historyResult.messages || []
    };

    const created = await sharedConversationQueries.create(sharePayload);
    if (!created.success) {
      throw new Error(created.error);
    }

    const frontendBase = (config.app.frontendUrl || `${req.protocol}://${req.get('host')}`).replace(
      /\/$/,
      ''
    );
    const url = `${frontendBase}/shared/${created.share.share_id}`;
    const apiUrl = `${req.protocol}://${req.get('host')}/api/v1/shared/${created.share.share_id}`;
    logger.info(`Shared conversation created: ${created.share.share_id}`);

    res.status(201).json({
      success: true,
      data: {
        share_id: created.share.share_id,
        url,
        api_url: apiUrl,
        public: created.share.public,
        allow_forking: created.share.allow_forking
      }
    });
  })
);

/**
 * GET /api/v1/shared/:shareId
 * Retrieve a public shared conversation.
 */
router.get(
  '/:shareId',
  asyncHandler(async (req, res) => {
    const { shareId } = req.params;

    const found = await sharedConversationQueries.getByShareId(shareId, { publicOnly: true });
    if (!found.success) {
      throw new Error(found.error);
    }
    if (!found.share) {
      const error = new Error('Shared conversation not found');
      error.statusCode = 404;
      throw error;
    }

    // Best-effort view increment.
    await sharedConversationQueries.incrementCounter(shareId, 'view_count');

    res.status(200).json({
      success: true,
      data: {
        share_id: found.share.share_id,
        title: found.share.title,
        description: found.share.description,
        created_at: found.share.created_at,
        view_count: found.share.view_count || 0,
        fork_count: found.share.fork_count || 0,
        allow_forking: found.share.allow_forking,
        messages: found.share.messages || []
      }
    });
  })
);

/**
 * DELETE /api/v1/shared/:shareId
 * Revoke a previously shared conversation.
 */
router.delete(
  '/:shareId',
  authenticate,
  asyncHandler(async (req, res) => {
    const { shareId } = req.params;
    const userId = await resolveAuthenticatedAppUserId(req);

    const revoked = await sharedConversationQueries.revoke(shareId, userId);
    if (!revoked.success) {
      throw new Error(revoked.error);
    }
    if (!revoked.share) {
      const error = new Error('Shared conversation not found or not owned by user');
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      success: true,
      data: {
        share_id: shareId,
        revoked: true
      }
    });
  })
);

/**
 * POST /api/v1/shared/:shareId/fork
 * Create a new session from a shared conversation snapshot.
 */
router.post(
  '/:shareId/fork',
  authenticate,
  validateBody(forkSchema),
  asyncHandler(async (req, res) => {
    const { shareId } = req.params;
    const { projectId = null } = req.body;
    const userId = await resolveAuthenticatedAppUserId(req);

    const found = await sharedConversationQueries.getByShareId(shareId, { publicOnly: true });
    if (!found.success) {
      throw new Error(found.error);
    }
    if (!found.share) {
      const error = new Error('Shared conversation not found');
      error.statusCode = 404;
      throw error;
    }
    if (!found.share.allow_forking) {
      const error = new Error('Forking is disabled for this shared conversation');
      error.statusCode = 403;
      throw error;
    }

    const sessionResult = await sessionQueries.create(userId, projectId, { forkedFrom: shareId });
    if (!sessionResult.success || !sessionResult.session) {
      throw new Error(sessionResult.error || 'Failed to create forked session');
    }

    const snapshotMessages = Array.isArray(found.share.messages) ? found.share.messages : [];
    const copyResult = await conversationQueries.createMany(
      sessionResult.session.id,
      snapshotMessages.map(message => ({
        role: message.role,
        content: message.content,
        metadata: {
          ...(message.metadata || {}),
          forked_from_share_id: shareId
        }
      }))
    );
    if (!copyResult.success) {
      throw new Error(copyResult.error);
    }

    await sharedConversationQueries.incrementCounter(shareId, 'fork_count');

    res.status(201).json({
      success: true,
      data: {
        session_id: sessionResult.session.id,
        forked_message_count: copyResult.messages.length,
        source_share_id: shareId
      }
    });
  })
);

export default router;
