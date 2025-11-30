/**
 * Chat Routes
 * Main conversation endpoints
 */

import express from 'express';
import { asyncHandler } from '../middleware/error.js';
import { validateBody, schemas } from '../middleware/validation.js';
import { authenticate } from '../middleware/auth.js';
import { conversationQueries, sessionQueries, memoryQueries } from '../database/queries.js';
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
  let ideaSelected = false;
  let backToIdeas = false;
  const lowerMessage = message.toLowerCase();
  
  // Check for idea selection FIRST (regardless of current agent)
  // This handles cases where ideas were generated but agent state is out of sync
  const existingIdeas = await memoryQueries.get(sessionId, 'GeneratedIdeas');
  if (existingIdeas?.generated) {
    const ideaMatch = message.match(/\b([1-5])\b/);
    const wordSelections = {
      'first': 1, '1st': 1,
      'second': 2, '2nd': 2,
      'third': 3, '3rd': 3,
      'fourth': 4, '4th': 4,
      'fifth': 5, '5th': 5
    };
    
    let selectedNumber = null;
    if (ideaMatch) {
      selectedNumber = parseInt(ideaMatch[1]);
    } else {
      for (const [word, num] of Object.entries(wordSelections)) {
        if (lowerMessage.includes(word)) {
          selectedNumber = num;
          break;
        }
      }
    }
    
    if (selectedNumber) {
      const ideaGenerator = getAgent('ideaGenerator');
      await ideaGenerator.selectIdea(sessionId, selectedNumber, message);
      await memoryQueries.set(sessionId, 'Validator', null);
      ideaSelected = true;
      response = `Great choice! You've selected idea #${selectedNumber}. Let me validate this idea and see how it stacks up in the market...`;
      
      // Store response and return early
      await conversationQueries.create(sessionId, 'assistant', response, { agent: 'IdeaGenerator' });
      return res.json({ success: true, response, onboardingComplete: false, ideaSelected, backToIdeas, agent: 'IdeaGenerator' });
    }
  }
  
  if (agent.name === 'Onboarding') {
    response = await agent.chat(sessionId, message);
  } else if (agent.name === 'IdeaGenerator') {
    // Check if user is selecting an idea
    const ideaMatch = message.match(/\b([1-5])\b/);
    const wordSelections = {
      'first': 1, '1st': 1,
      'second': 2, '2nd': 2,
      'third': 3, '3rd': 3,
      'fourth': 4, '4th': 4,
      'fifth': 5, '5th': 5
    };
    
    let selectedNumber = null;
    
    // Check for digit match
    if (ideaMatch) {
      selectedNumber = parseInt(ideaMatch[1]);
    } else {
      // Check for word matches like "first one", "the second", etc.
      for (const [word, num] of Object.entries(wordSelections)) {
        if (lowerMessage.includes(word)) {
          selectedNumber = num;
          break;
        }
      }
    }
    
    if (selectedNumber) {
      await agent.selectIdea(sessionId, selectedNumber, message);
      // Clear any previous validation when selecting a new idea
      await memoryQueries.set(sessionId, 'Validator', null);
      ideaSelected = true;
      response = `Great choice! You've selected idea #${selectedNumber}. Let me validate this idea and see how it stacks up in the market...`;
    } else {
      // Check if ideas have already been generated - if so, use chat for follow-up
      const existingIdeas = await memoryQueries.get(sessionId, 'GeneratedIdeas');
      if (existingIdeas) {
        response = await agent.chat(sessionId, message);
      } else {
        response = await agent.generate(sessionId);
        // Mark that ideas have been generated
        await memoryQueries.set(sessionId, 'GeneratedIdeas', { generated: true });
      }
    }
  } else if (agent.name === 'Validator') {
    // Check if user wants to go back to ideas
    const wantsNewIdeas = lowerMessage.includes('different') || 
                          lowerMessage.includes('another') || 
                          lowerMessage.includes('other idea') ||
                          lowerMessage.includes('go back') ||
                          lowerMessage.includes('new idea') ||
                          lowerMessage.includes('try again');
    
    if (wantsNewIdeas) {
      // Clear the selected idea AND validation data, then go back to idea generator
      await memoryQueries.set(sessionId, 'SelectedIdea', null);
      await memoryQueries.set(sessionId, 'Validator', null);
      await memoryQueries.set(sessionId, 'GeneratedIdeas', null);
      backToIdeas = true;
      response = "No problem! Let's go back and explore other ideas for your pain point...";
    } else {
      // Check if validation has been done
      const validationDone = await agent.getMemory(sessionId, 'Validator');
      
      if (!validationDone || !validationDone.validated) {
        // First time - do validation
        response = await agent.validate(sessionId);
      } else {
        // Follow-up conversation - use chat with history
        response = await agent.chat(sessionId, message);
      }
    }
  } else if (agent.name === 'Builder') {
    // Builder agent handles PRD, landing pages, MVP planning
    const wantsPRD = lowerMessage.includes('prd') || 
                     lowerMessage.includes('requirements') ||
                     lowerMessage.includes('product doc');
    const wantsLandingPage = lowerMessage.includes('landing') || 
                              lowerMessage.includes('page') ||
                              lowerMessage.includes('website');
    
    if (wantsPRD) {
      response = await agent.generatePRD(sessionId);
    } else if (wantsLandingPage) {
      response = await agent.generateLandingPage(sessionId);
    } else {
      response = await agent.chat(sessionId, message);
    }
  }

  // Store agent response
  await conversationQueries.create(sessionId, 'assistant', response, {
    agent: agent.name
  });

  // Check if onboarding just completed
  let onboardingComplete = false;
  if (agent.name === 'Onboarding') {
    // Check if onboarding is complete based on memory (name + pain point collected)
    const isComplete = await agent.isComplete(sessionId);
    
    // Also look for trigger phrases in the AI's response
    const readyPhrases = [
      'generate some business ideas',
      'generate ideas for you',
      'going to generate',
      'create some business ideas',
      'ready to generate',
      'let me generate',
      'explore some ideas',
      'explore ideas',
      'ready to explore',
      'business ideas around this',
      'ideas for you now',
      'here are some ideas',
      'here are a few',
      'essential features',
      'few ideas'
    ];
    const lowerResponse = response.toLowerCase();
    const hasReadyPhrase = readyPhrases.some(phrase => lowerResponse.includes(phrase));
    
    // Transition if memory says complete (we have name + pain point)
    // This ensures we transition even if the AI doesn't say the magic words
    onboardingComplete = isComplete;
    
    logger.info(`Onboarding check: isComplete=${isComplete}, hasReadyPhrase=${hasReadyPhrase}, onboardingComplete=${onboardingComplete}`);
  }

  // Check if user wants to proceed to building (from Validator)
  let proceedToBuild = false;
  if (agent.name === 'Validator') {
    const buildPhrases = ['proceed', 'next step', 'let\'s build', 'start building', 'help me', 'create', 'make'];
    const wantsToBuild = buildPhrases.some(phrase => lowerMessage.includes(phrase));
    const validationDone = await memoryQueries.get(sessionId, 'Validator');
    
    if (wantsToBuild && validationDone?.value) {
      proceedToBuild = true;
    }
  }

  res.json({
    success: true,
    response,
    onboardingComplete,
    ideaSelected,
    backToIdeas,
    proceedToBuild,
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
      // Check if ideas already generated
      const existingIdeas = await memoryQueries.get(sessionId, 'GeneratedIdeas');
      if (existingIdeas) {
        await agent.chat(sessionId, message, onChunk);
      } else {
        await agent.generate(sessionId, onChunk);
        await memoryQueries.set(sessionId, 'GeneratedIdeas', { generated: true });
      }
    } else if (agent.name === 'Validator') {
      const validationDone = await memoryQueries.get(sessionId, 'Validator');
      if (validationDone?.validated) {
        await agent.chat(sessionId, message, onChunk);
      } else {
        await agent.validate(sessionId, onChunk);
      }
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
router.get('/history/:sessionId', asyncHandler(async (req, res) => {
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
