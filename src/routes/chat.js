/**
 * Chat Routes
 * Main conversation endpoints
 */

import express from 'express';
import { asyncHandler } from '../middleware/error.js';
import { validateBody, schemas } from '../middleware/validation.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { conversationQueries, sessionQueries, memoryQueries } from '../database/queries.js';
import { getAgent } from '../agents/index.js';
import { orchestrator, PHASES } from '../orchestrator/index.js';
import { logger } from '../config/logger.js';
import {
  parseIdeaSelection,
  isBackToIdeasRequest,
  isProceedToBuildRequest,
  handleAgentResponse
} from '../services/chat.js';

const router = express.Router();

/**
 * Create new chat session
 * POST /api/chat/sessions
 */
router.post(
  '/sessions',
  authenticate,
  asyncHandler(async (req, res) => {
    const { userId } = req;

    const result = await sessionQueries.create(userId);

    if (!result.success) {
      throw new Error(result.error);
    }

    res.json({
      success: true,
      session: result.session
    });
  })
);

/**
 * Get session details
 * GET /api/chat/sessions/:sessionId
 */
router.get(
  '/sessions/:sessionId',
  authenticate,
  asyncHandler(async (req, res) => {
    const { sessionId } = req.params;

    const result = await sessionQueries.getById(sessionId);

    if (!result.success) {
      throw new Error(result.error);
    }

    res.json({
      success: true,
      session: result.session
    });
  })
);

/**
 * Send message to agent (orchestrated)
 * POST /api/chat/message
 */
router.post(
  '/message',
  optionalAuth,
  validateBody(schemas.sendMessage),
  asyncHandler(async (req, res) => {
    const { userId: _userId } = req;
    const { sessionId, message, agent: requestedAgent } = req.body;
    const lowerMessage = message.toLowerCase();

    // Store user message
    await conversationQueries.create(sessionId, 'user', message);

    // Use orchestrator to determine routing
    const routing = await orchestrator.route(sessionId, message);
    let { agent, phase, phaseChanged } = routing;

    // Allow explicit agent override (for backward compatibility)
    if (requestedAgent) {
      try {
        agent = getAgent(requestedAgent);
      } catch (e) {
        // Fall back to orchestrator's choice
      }
    }

    logger.info(`Orchestrator: phase=${phase}, agent=${agent.name}, phaseChanged=${phaseChanged}`);

    // Response flags for frontend
    let response;
    let ideaSelected = false;
    let backToIdeas = false;
    let proceedToBuild = false;
    let onboardingComplete = false;

    // Handle idea selection (works across phases)
    const existingIdeas = await memoryQueries.get(sessionId, 'GeneratedIdeas');
    if (existingIdeas?.value?.generated) {
      const selectedNumber = parseIdeaSelection(message);
      if (selectedNumber) {
        const ideaGenerator = getAgent('ideaGenerator');
        await ideaGenerator.selectIdea(sessionId, selectedNumber, message);
        await memoryQueries.set(sessionId, 'Validator', null);
        await orchestrator.updateState(sessionId, { currentPhase: 'validation' });
        await orchestrator.addMilestone(sessionId, 'idea_selected');
        ideaSelected = true;
        response = `Great choice! You've selected idea #${selectedNumber}. Let me validate this idea and see how it stacks up in the market...`;

        await conversationQueries.create(sessionId, 'assistant', response, {
          agent: 'IdeaGenerator'
        });
        const progress = await orchestrator.getProgress(sessionId);
        return res.json({
          success: true,
          response,
          ideaSelected,
          phase: 'validation',
          phaseChanged: true,
          progress,
          agent: 'IdeaGenerator'
        });
      }
    }

    // Handle back-to-ideas request
    if (isBackToIdeasRequest(lowerMessage)) {
      await memoryQueries.set(sessionId, 'SelectedIdea', null);
      await memoryQueries.set(sessionId, 'Validator', null);
      await memoryQueries.set(sessionId, 'GeneratedIdeas', null);
      await orchestrator.updateState(sessionId, { currentPhase: 'ideation' });
      backToIdeas = true;
      response = "No problem! Let's go back and explore other ideas for your pain point...";

      await conversationQueries.create(sessionId, 'assistant', response, {
        agent: 'IdeaGenerator'
      });
      const progress = await orchestrator.getProgress(sessionId);
      return res.json({
        success: true,
        response,
        backToIdeas,
        phase: 'ideation',
        phaseChanged: true,
        progress,
        agent: 'IdeaGenerator'
      });
    }

    // Route to appropriate agent handler
    response = await handleAgentResponse(agent, sessionId, message, lowerMessage);

    // Store agent response
    await conversationQueries.create(sessionId, 'assistant', response, { agent: agent.name });

    // Check for phase transitions based on agent state
    if (agent.name === 'Onboarding') {
      onboardingComplete = await agent.isComplete(sessionId);
      if (onboardingComplete) {
        await orchestrator.updateState(sessionId, { currentPhase: 'ideation' });
        await orchestrator.addMilestone(sessionId, 'pain_articulated');
        phaseChanged = true;
        phase = 'ideation';
      }
    }

    if (agent.name === 'Validator') {
      const validationDone = await memoryQueries.get(sessionId, 'Validator');
      if (validationDone?.value?.validated && isProceedToBuildRequest(lowerMessage)) {
        await orchestrator.updateState(sessionId, { currentPhase: 'strategy' });
        await orchestrator.addMilestone(sessionId, 'validation_complete');
        proceedToBuild = true;
        phaseChanged = true;
        phase = 'strategy';
      }
    }

    // Get updated progress
    const progress = await orchestrator.getProgress(sessionId);

    res.json({
      success: true,
      response,
      phase,
      phaseChanged,
      onboardingComplete,
      ideaSelected,
      backToIdeas,
      proceedToBuild,
      progress,
      agent: agent.name
    });
  })
);

/**
 * Stream message to agent with SSE
 * POST /api/chat/stream
 */
router.post(
  '/stream',
  optionalAuth,
  validateBody(schemas.sendMessage),
  asyncHandler(async (req, res) => {
    const { userId: _userId } = req;
    const { sessionId, message, agent: agentName } = req.body;

    // Set up SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Store user message
    await conversationQueries.create(sessionId, 'user', message);
    const lowerMessage = message.toLowerCase();

    // --- Pre-routing: handle idea selection before agent processes message ---
    const existingIdeas = await memoryQueries.get(sessionId, 'GeneratedIdeas');
    if (existingIdeas?.value?.generated) {
      const selectedNumber = parseIdeaSelection(message);
      if (selectedNumber) {
        const ideaGenerator = getAgent('ideaGenerator');
        await ideaGenerator.selectIdea(sessionId, selectedNumber, message);
        await memoryQueries.set(sessionId, 'Validator', null);
        await orchestrator.updateState(sessionId, { currentPhase: 'validation' });
        await orchestrator.addMilestone(sessionId, 'idea_selected');

        const selectionResponse = `Great choice! You've selected idea #${selectedNumber}. Let me validate this idea and see how it stacks up in the market...`;
        res.write(
          `data: ${JSON.stringify({ chunk: selectionResponse, agent: 'IdeaGenerator' })}\n\n`
        );

        await conversationQueries.create(sessionId, 'assistant', selectionResponse, {
          agent: 'IdeaGenerator'
        });

        res.write(
          `data: ${JSON.stringify({
            done: true,
            agent: 'IdeaGenerator',
            ideaSelected: true,
            phase: 'validation',
            phaseChanged: true,
            nextAgent: 'validator'
          })}\n\n`
        );
        return res.end();
      }
    }

    // --- Pre-routing: handle back-to-ideas request ---
    if (isBackToIdeasRequest(lowerMessage)) {
      await memoryQueries.set(sessionId, 'SelectedIdea', null);
      await memoryQueries.set(sessionId, 'Validator', null);
      await memoryQueries.set(sessionId, 'GeneratedIdeas', null);
      await orchestrator.updateState(sessionId, { currentPhase: 'ideation' });

      const backResponse =
        "No problem! Let's go back and explore other ideas for your pain point...";
      res.write(`data: ${JSON.stringify({ chunk: backResponse, agent: 'IdeaGenerator' })}\n\n`);

      await conversationQueries.create(sessionId, 'assistant', backResponse, {
        agent: 'IdeaGenerator'
      });

      res.write(
        `data: ${JSON.stringify({
          done: true,
          agent: 'IdeaGenerator',
          backToIdeas: true,
          phase: 'ideation',
          phaseChanged: true,
          nextAgent: 'ideaGenerator'
        })}\n\n`
      );
      return res.end();
    }

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
    const onChunk = chunk => {
      fullResponse += chunk;
      res.write(`data: ${JSON.stringify({ chunk, agent: agent.name })}\n\n`);
    };

    try {
      if (agent.name === 'Onboarding') {
        await agent.chat(sessionId, message, onChunk);
      } else if (agent.name === 'IdeaGenerator') {
        // Check if ideas already generated
        const genIdeas = await memoryQueries.get(sessionId, 'GeneratedIdeas');
        if (genIdeas?.value?.generated) {
          await agent.chat(sessionId, message, onChunk);
        } else {
          await agent.generate(sessionId, onChunk);
          await memoryQueries.set(sessionId, 'GeneratedIdeas', { generated: true });
        }
      } else if (agent.name === 'Validator') {
        const validationDone = await memoryQueries.get(sessionId, 'Validator');
        if (validationDone?.value?.validated) {
          await agent.chat(sessionId, message, onChunk);
        } else {
          await agent.validate(sessionId, onChunk);
        }
      } else if (agent.name === 'Builder') {
        await agent.chat(sessionId, message, onChunk);
      }

      // Store full response
      await conversationQueries.create(sessionId, 'assistant', fullResponse, {
        agent: agent.name
      });

      // Check for phase transitions
      const donePayload = { done: true, agent: agent.name };

      if (agent.name === 'Onboarding') {
        const onboardingComplete = await agent.isComplete(sessionId);
        if (onboardingComplete) {
          await orchestrator.updateState(sessionId, { currentPhase: 'ideation' });
          await orchestrator.addMilestone(sessionId, 'pain_articulated');
          donePayload.onboardingComplete = true;
          donePayload.phase = 'ideation';
          donePayload.phaseChanged = true;
          donePayload.nextAgent = 'ideaGenerator';
        }
      }

      if (agent.name === 'Validator') {
        const validationDone = await memoryQueries.get(sessionId, 'Validator');
        if (validationDone?.value?.validated && isProceedToBuildRequest(lowerMessage)) {
          await orchestrator.updateState(sessionId, { currentPhase: 'strategy' });
          await orchestrator.addMilestone(sessionId, 'validation_complete');
          donePayload.proceedToBuild = true;
          donePayload.phase = 'strategy';
          donePayload.phaseChanged = true;
          donePayload.nextAgent = 'builder';
        }
      }

      res.write(`data: ${JSON.stringify(donePayload)}\n\n`);
      res.end();
    } catch (error) {
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    }
  })
);

/**
 * Get conversation history
 * GET /api/chat/history/:sessionId
 */
router.get(
  '/history/:sessionId',
  asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const limit = parseInt(req.query.limit || '50', 10);
    const countOnly = req.query.countOnly === 'true';

    const result = await conversationQueries.getHistory(sessionId, countOnly ? 1000 : limit);

    if (!result.success) {
      throw new Error(result.error);
    }

    res.json({
      success: true,
      messages: countOnly ? [] : result.messages,
      count: result.messages?.length || 0
    });
  })
);

/**
 * Select idea for validation
 * POST /api/chat/select-idea
 */
router.post(
  '/select-idea',
  authenticate,
  validateBody(schemas.selectIdea),
  asyncHandler(async (req, res) => {
    const { userId: _userId } = req;
    const { sessionId, ideaNumber, ideaText } = req.body;

    const agent = getAgent('ideaGenerator');
    const result = await agent.selectIdea(sessionId, ideaNumber, ideaText);

    res.json(result);
  })
);

/**
 * Get journey progress
 * GET /api/chat/progress/:sessionId
 */
router.get(
  '/progress/:sessionId',
  asyncHandler(async (req, res) => {
    const { sessionId } = req.params;

    const progress = await orchestrator.getProgress(sessionId);

    res.json({
      success: true,
      ...progress
    });
  })
);

/**
 * Get available phases
 * GET /api/chat/phases
 */
router.get(
  '/phases',
  asyncHandler(async (req, res) => {
    const phases = Object.entries(PHASES).map(([id, phase]) => ({
      id,
      name: phase.name,
      description: phase.description,
      agents: phase.agents,
      milestones: phase.milestones,
      learningObjectives: phase.learningObjectives || []
    }));

    res.json({
      success: true,
      phases
    });
  })
);

export default router;
