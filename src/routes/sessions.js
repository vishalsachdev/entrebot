/**
 * Session Routes
 * REST API endpoints for session management
 */

import express from 'express';
import { asyncHandler } from '../middleware/error.js';
import { authenticate } from '../middleware/auth.js';
import { conversationQueries, memoryQueries, sessionQueries } from '../database/queries.js';
import { getSupabase } from '../database/supabase.js';
import { logger } from '../config/logger.js';
import Joi from 'joi';
import { validateBody } from '../middleware/validation.js';
import { requireSessionOwnership, resolveAuthenticatedAppUserId } from '../utils/authz.js';

const router = express.Router();

// Validation schemas
const createSessionSchema = Joi.object({
  userId: Joi.string().required(),
  projectId: Joi.string().uuid().optional().allow(null),
  metadata: Joi.object().optional()
});

const updateSessionSchema = Joi.object({
  metadata: Joi.object().optional(),
  projectId: Joi.string().uuid().optional().allow(null)
}).or('metadata', 'projectId');

const listMineSchema = Joi.object({
  limit: Joi.number().integer().min(1).max(100).optional(),
  offset: Joi.number().integer().min(0).optional(),
  q: Joi.string().allow('').optional(),
  from: Joi.date().iso().optional(),
  to: Joi.date().iso().optional(),
  includeSummary: Joi.boolean().optional()
});

/**
 * GET /api/sessions/mine
 * Authenticated session history endpoint with optional search/filter.
 */
router.get(
  '/mine',
  authenticate,
  asyncHandler(async (req, res) => {
    const { error, value } = listMineSchema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true
    });
    if (error) {
      const validationError = new Error(error.details.map(d => d.message).join(', '));
      validationError.statusCode = 400;
      throw validationError;
    }

    const limit = value.limit ? parseInt(value.limit, 10) : 50;
    const offset = value.offset ? parseInt(value.offset, 10) : 0;
    const searchQuery = (value.q || '').trim();
    const includeSummary = value.includeSummary !== false;
    const fromDate = value.from;
    const toDate = value.to;

    const userId = await resolveAuthenticatedAppUserId(req);
    const supabase = getSupabase();

    let query = supabase
      .from('sessions')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (fromDate) {
      query = query.gte('updated_at', new Date(fromDate).toISOString());
    }
    if (toDate) {
      query = query.lte('updated_at', new Date(toDate).toISOString());
    }

    const { data: sessions, error: sessionsError } = await query;
    if (sessionsError) {
      logger.error(`Failed to fetch sessions for /mine: ${sessionsError.message}`);
      throw new Error(sessionsError.message);
    }

    let filteredSessions = sessions || [];

    if (searchQuery) {
      const sessionIds = filteredSessions.map(s => s.id);
      if (sessionIds.length > 0) {
        const { data: matches, error: matchError } = await supabase
          .from('conversations')
          .select('session_id, content')
          .in('session_id', sessionIds)
          .ilike('content', `%${searchQuery}%`)
          .limit(5000);

        if (matchError) {
          logger.warn(`Session search fallback (no message filter): ${matchError.message}`);
        } else {
          const matchedIds = new Set((matches || []).map(m => m.session_id));
          filteredSessions = filteredSessions.filter(session => {
            if (matchedIds.has(session.id)) {
              return true;
            }
            if (session.id.toLowerCase().includes(searchQuery.toLowerCase())) {
              return true;
            }
            const sessionAgent = String(session.metadata?.agent || '').toLowerCase();
            return sessionAgent.includes(searchQuery.toLowerCase());
          });
        }
      }
    }

    if (includeSummary && filteredSessions.length > 0) {
      const summarized = await Promise.all(
        filteredSessions.map(async session => {
          const [latestConversation, journeyState] = await Promise.all([
            supabase
              .from('conversations')
              .select('content, created_at', { count: 'exact' })
              .eq('session_id', session.id)
              .order('created_at', { ascending: false })
              .limit(1),
            memoryQueries.get(session.id, 'JOURNEY_STATE')
          ]);

          if (latestConversation.error) {
            logger.warn(
              `Failed to summarize conversation for session ${session.id}: ${latestConversation.error.message}`
            );
          }

          const lastMessage = latestConversation.data?.[0] || null;
          const messageCount = latestConversation.count || 0;

          const currentPhase = journeyState?.success ? journeyState.value?.currentPhase : null;

          return {
            ...session,
            message_count: messageCount || 0,
            last_message: lastMessage?.content || null,
            last_message_at: lastMessage?.created_at || null,
            current_phase: currentPhase || null
          };
        })
      );

      return res.status(200).json({
        success: true,
        data: summarized,
        count: summarized.length
      });
    }

    res.status(200).json({
      success: true,
      data: filteredSessions,
      count: filteredSessions.length
    });
  })
);

/**
 * GET /api/sessions
 * List sessions for authenticated user (legacy endpoint).
 */
router.get(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    const { email } = req.query;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const authenticatedEmail = req.user?.email || '';

    if (email && String(email).toLowerCase() !== authenticatedEmail.toLowerCase()) {
      const error = new Error('You can only access your own sessions');
      error.statusCode = 403;
      throw error;
    }

    const userId = await resolveAuthenticatedAppUserId(req);
    logger.info(`Fetching sessions for authenticated user: ${userId}`);

    const supabase = getSupabase();

    // Get sessions for this user
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (sessionsError) {
      logger.error(`Failed to fetch sessions: ${sessionsError.message}`);
      throw new Error(sessionsError.message);
    }

    logger.info(`Retrieved ${sessions?.length || 0} sessions for user: ${userId}`);

    res.status(200).json({
      success: true,
      data: sessions || [],
      count: sessions?.length || 0
    });
  })
);

/**
 * GET /api/sessions/:id/export
 * Export session history and memory in JSON or text format.
 */
router.get(
  '/:id/export',
  authenticate,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const format = String(req.query.format || 'json').toLowerCase();
    const allowed = new Set(['json', 'text']);
    if (!allowed.has(format)) {
      const error = new Error('format must be one of: json, text');
      error.statusCode = 400;
      throw error;
    }

    const userId = await resolveAuthenticatedAppUserId(req);
    const session = await requireSessionOwnership(id, userId, 'export');

    const [history, memory] = await Promise.all([
      conversationQueries.getHistory(id, 1000),
      memoryQueries.getAll(id)
    ]);

    if (!history.success) {
      throw new Error(history.error);
    }
    if (!memory.success) {
      throw new Error(memory.error);
    }

    const exportPayload = {
      session,
      messages: history.messages || [],
      memory: memory.memory || {}
    };

    if (format === 'text') {
      const lines = [
        '=== VentureBot Session Export ===',
        `Session: ${id}`,
        `Exported: ${new Date().toISOString()}`,
        `Messages: ${(history.messages || []).length}`,
        ''
      ];

      for (const msg of history.messages || []) {
        const ts = msg.created_at ? new Date(msg.created_at).toISOString() : '';
        const role = msg.role || 'unknown';
        lines.push(`[${ts}] ${role.toUpperCase()}`);
        lines.push(msg.content || '');
        lines.push('');
      }

      lines.push('=== Memory Snapshot ===');
      lines.push(JSON.stringify(memory.memory || {}, null, 2));

      return res.status(200).json({
        success: true,
        data: {
          format: 'text',
          filename: `venturebot-session-${id}.txt`,
          content: lines.join('\n')
        }
      });
    }

    res.status(200).json({
      success: true,
      data: {
        format: 'json',
        filename: `venturebot-session-${id}.json`,
        content: JSON.stringify(exportPayload, null, 2)
      }
    });
  })
);

/**
 * POST /api/sessions
 * Create new session
 */
router.post(
  '/',
  authenticate,
  validateBody(createSessionSchema),
  asyncHandler(async (req, res) => {
    const { userId, projectId = null, metadata = {} } = req.body;
    const authenticatedUserId = await resolveAuthenticatedAppUserId(req);
    if (userId !== authenticatedUserId) {
      const error = new Error('You can only create sessions for your own account');
      error.statusCode = 403;
      throw error;
    }

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
 * PATCH /api/sessions/:id
 * Update session metadata/project link
 */
router.patch(
  '/:id',
  authenticate,
  validateBody(updateSessionSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { metadata, projectId } = req.body;
    const userId = await resolveAuthenticatedAppUserId(req);
    await requireSessionOwnership(id, userId, 'update');

    const updates = {};
    if (metadata !== undefined) {
      updates.metadata = metadata;
    }
    if (projectId !== undefined) {
      updates.project_id = projectId;
    }

    const updated = await sessionQueries.update(id, updates);
    if (!updated.success) {
      throw new Error(updated.error);
    }

    res.status(200).json({
      success: true,
      data: updated.session
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
    const userId = await resolveAuthenticatedAppUserId(req);

    logger.info(`Fetching session: ${id}`);

    const session = await requireSessionOwnership(id, userId, 'access');

    logger.info(`Session retrieved successfully: ${id}`);

    res.status(200).json({
      success: true,
      data: session
    });
  })
);

/**
 * GET /api/sessions/:id/full
 * Get session with optional messages and memory bundle.
 */
router.get(
  '/:id/full',
  authenticate,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const includeMessages = req.query.messages !== 'false';
    const includeMemory = req.query.memory !== 'false';
    const userId = await resolveAuthenticatedAppUserId(req);
    const session = await requireSessionOwnership(id, userId, 'access');

    const responseData = {
      session
    };

    if (includeMessages) {
      const history = await conversationQueries.getHistory(id, 1000);
      if (!history.success) {
        throw new Error(history.error);
      }
      responseData.messages = history.messages || [];
    }

    if (includeMemory) {
      const memory = await memoryQueries.getAll(id);
      if (!memory.success) {
        throw new Error(memory.error);
      }

      responseData.memory = Object.entries(memory.memory || {}).map(([key, value]) => ({
        key,
        value
      }));
    }

    res.status(200).json({
      success: true,
      data: responseData
    });
  })
);

/**
 * DELETE /api/sessions/:id
 * Delete a session owned by the authenticated user.
 */
router.delete(
  '/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = await resolveAuthenticatedAppUserId(req);
    await requireSessionOwnership(id, userId, 'delete');

    const deleted = await sessionQueries.delete(id);
    if (!deleted.success) {
      throw new Error(deleted.error);
    }
    if (!deleted.deleted) {
      const error = new Error('Session not found');
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      success: true,
      data: {
        id,
        deleted: true
      }
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
    const authenticatedUserId = await resolveAuthenticatedAppUserId(req);
    if (userId !== authenticatedUserId) {
      const error = new Error('You can only access your own sessions');
      error.statusCode = 403;
      throw error;
    }

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
