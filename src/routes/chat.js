/**
 * Chat Routes
 * Main conversation endpoints
 */

import express from 'express';
import { asyncHandler } from '../middleware/error.js';
import { validateBody, schemas } from '../middleware/validation.js';
import { authenticate } from '../middleware/auth.js';
import { conversationQueries, sessionQueries } from '../database/queries.js';
import { getAgent } from '../agents/index.js';
import { logger } from '../config/logger.js';

const router = express.Router();

/**
 * Create new chat session
 * POST /api/chat/sessions
 */
router.post('/sessions', authenticate, asyncHandler(async (req, res) => {
  const { userId } = req;

  const result = await sessionQueries.create(userId);

  if (!result.success) {
    throw new Error(result.error);
  }

  res.json({
    success: true,
    session: result.session
  });
}));

/**
 * Get session details
 * GET /api/chat/sessions/:sessionId
 */
router.get('/sessions/:sessionId', authenticate, asyncHandler(async (req, res) => {
  const { sessionId } = req.params;

  const result = await sessionQueries.getById(sessionId);

  if (!result.success) {
    throw new Error(result.error);
  }

  res.json({
    success: true,
    session: result.session
  });
}));

/**
 * Send message to agent
 * POST /api/chat/message
 */
router.post('/message', validateBody(schemas.sendMessage), asyncHandler(async (req, res) => {
  const { sessionId, message, agent: agentName } = req.body;

  // Store user message
  await conversationQueries.create(sessionId, 'user', message);

  // Determine which agent to use
  let agent;
  if (agentName) {
    agent = getAgent(agentName);
  } else {
    // Auto-select agent based on conversation state
    const onboarding = getAgent('onboarding');
    const isOnboardingComplete = await onboarding.isComplete(sessionId);

    if (!isOnboardingComplete) {
      agent = onboarding;
    } else {
      // Default to idea generator if onboarding is complete
      agent = getAgent('ideaGenerator');
    }
  }

  logger.info(`Using agent: ${agent.name}`);

  // Get response from agent
  let response;
  if (agent.name === 'Onboarding') {
    response = await agent.chat(sessionId, message);
  } else if (agent.name === 'IdeaGenerator') {
    response = await agent.generate(sessionId);
  } else if (agent.name === 'Validator') {
    response = await agent.validate(sessionId);
  }

  // Store agent response
  await conversationQueries.create(sessionId, 'assistant', response, {
    agent: agent.name
  });

  res.json({
    success: true,
    response,
    agent: agent.name
  });
}));

/**
 * Stream message to agent with SSE
 * POST /api/chat/stream
 */
router.post('/stream', validateBody(schemas.sendMessage), asyncHandler(async (req, res) => {
  const { sessionId, message, agent: agentName } = req.body;

  // Set up SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Store user message
  await conversationQueries.create(sessionId, 'user', message);

  // Determine which agent to use
  let agent;
  if (agentName) {
    agent = getAgent(agentName);
  } else {
    const onboarding = getAgent('onboarding');
    const isOnboardingComplete = await onboarding.isComplete(sessionId);

    if (!isOnboardingComplete) {
      agent = onboarding;
    } else {
      agent = getAgent('ideaGenerator');
    }
  }

  let fullResponse = '';

  // Stream response
  const onChunk = (chunk) => {
    fullResponse += chunk;
    res.write(`data: ${JSON.stringify({ chunk, agent: agent.name })}\n\n`);
  };

  try {
    if (agent.name === 'Onboarding') {
      await agent.chat(sessionId, message, onChunk);
    } else if (agent.name === 'IdeaGenerator') {
      await agent.generate(sessionId, onChunk);
    } else if (agent.name === 'Validator') {
      await agent.validate(sessionId, onChunk);
    }

    // Store full response
    await conversationQueries.create(sessionId, 'assistant', fullResponse, {
      agent: agent.name
    });

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (error) {
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
}));

/**
 * Get conversation history
 * GET /api/chat/history/:sessionId
 */
router.get('/history/:sessionId', authenticate, asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const limit = parseInt(req.query.limit || '50', 10);

  const result = await conversationQueries.getHistory(sessionId, limit);

  if (!result.success) {
    throw new Error(result.error);
  }

  res.json({
    success: true,
    messages: result.messages
  });
}));

/**
 * Select idea for validation
 * POST /api/chat/select-idea
 */
router.post('/select-idea', validateBody(schemas.selectIdea), asyncHandler(async (req, res) => {
  const { sessionId, ideaNumber, ideaText } = req.body;

  const agent = getAgent('ideaGenerator');
  const result = await agent.selectIdea(sessionId, ideaNumber, ideaText);

  res.json(result);
}));

export default router;
