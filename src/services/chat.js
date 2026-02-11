/**
 * Chat Service
 * Helper functions for chat route message processing
 */

import { memoryQueries } from '../database/queries.js';
import { orchestrator } from '../orchestrator/index.js';

/**
 * Parse idea selection from user message
 * Supports numeric (1-5) and word-based selections (first, second, etc.)
 *
 * @param {string} message - The user's message to parse
 * @returns {number|null} The selected idea number (1-5) or null if no selection found
 * @example
 * parseIdeaSelection("I like option 2") // returns 2
 * parseIdeaSelection("the first one") // returns 1
 * parseIdeaSelection("hello") // returns null
 */
export function parseIdeaSelection(message) {
  const lowerMessage = message.toLowerCase();
  const ideaMatch = message.match(/\b([1-5])\b/);
  const wordSelections = {
    first: 1,
    '1st': 1,
    second: 2,
    '2nd': 2,
    third: 3,
    '3rd': 3,
    fourth: 4,
    '4th': 4,
    fifth: 5,
    '5th': 5
  };

  if (ideaMatch) {
    return parseInt(ideaMatch[1]);
  }

  for (const [word, num] of Object.entries(wordSelections)) {
    if (lowerMessage.includes(word)) {
      return num;
    }
  }

  return null;
}

/**
 * Check if user wants to go back to ideas phase
 * Detects phrases indicating desire to explore different ideas
 *
 * @param {string} lowerMessage - The user's message in lowercase
 * @returns {boolean} True if user wants to return to idea selection
 * @example
 * isBackToIdeasRequest("show me different ideas") // returns true
 * isBackToIdeasRequest("i like this one") // returns false
 */
export function isBackToIdeasRequest(lowerMessage) {
  const backPhrases = ['different', 'another', 'other idea', 'go back', 'new idea', 'try again'];
  return backPhrases.some(phrase => lowerMessage.includes(phrase));
}

/**
 * Check if user wants to proceed to the building phase
 * Detects phrases indicating readiness to start building
 *
 * @param {string} lowerMessage - The user's message in lowercase
 * @returns {boolean} True if user wants to proceed to build phase
 * @example
 * isProceedToBuildRequest("let's build this") // returns true
 * isProceedToBuildRequest("tell me more") // returns false
 */
export function isProceedToBuildRequest(lowerMessage) {
  const buildPhrases = [
    'proceed',
    'next step',
    "let's build",
    'start building',
    'help me',
    'create',
    'make'
  ];
  return buildPhrases.some(phrase => lowerMessage.includes(phrase));
}

/**
 * Check if user indicates they launched and want to move into growth coaching.
 *
 * @param {string} lowerMessage - The user's message in lowercase
 * @returns {boolean}
 */
export function isLaunchCompleteRequest(lowerMessage) {
  const launchPhrases = [
    'we launched',
    "we're live",
    'we are live',
    'went live',
    'just launched',
    'product is live',
    'launch complete'
  ];
  return launchPhrases.some(phrase => lowerMessage.includes(phrase));
}

/**
 * Check if user is requesting an MVP build plan or prompts.
 *
 * @param {string} lowerMessage - The user's message in lowercase
 * @returns {boolean}
 */
export function isMVPPlanningRequest(lowerMessage) {
  const planningPhrases = [
    'mvp plan',
    'build plan',
    'roadmap',
    'prompt',
    'bolt',
    'cursor',
    'lovable',
    'v0',
    'tech stack',
    'start building'
  ];
  return planningPhrases.some(phrase => lowerMessage.includes(phrase));
}

/**
 * Check if user is requesting launch strategy artifacts.
 *
 * @param {string} lowerMessage - The user's message in lowercase
 * @returns {boolean}
 */
export function isLaunchPlanningRequest(lowerMessage) {
  const launchPhrases = [
    'launch plan',
    'go to market',
    'gtm',
    'marketing plan',
    'launch checklist',
    'announcement',
    'launch copy',
    'channels'
  ];
  return launchPhrases.some(phrase => lowerMessage.includes(phrase));
}

/**
 * Check if user is requesting a post-launch growth plan.
 *
 * @param {string} lowerMessage - The user's message in lowercase
 * @returns {boolean}
 */
export function isGrowthPlanningRequest(lowerMessage) {
  const growthPhrases = [
    'growth plan',
    'retention',
    'kpi',
    'metrics',
    'user feedback',
    'iterate',
    'experiment',
    'scale'
  ];
  return growthPhrases.some(phrase => lowerMessage.includes(phrase));
}

/**
 * Check if user indicates MVP is built and ready to launch.
 *
 * @param {string} lowerMessage - The user's message in lowercase
 * @returns {boolean}
 */
export function isMVPCompleteRequest(lowerMessage) {
  const completionPhrases = [
    'mvp is done',
    'mvp is complete',
    'finished the mvp',
    'built the mvp',
    "it's ready to launch",
    'ready to launch',
    'product is ready'
  ];
  return completionPhrases.some(phrase => lowerMessage.includes(phrase));
}

/**
 * Handle agent-specific response logic
 * Routes messages to appropriate agent methods based on agent type and context
 *
 * @param {Object} agent - The agent instance to handle the response
 * @param {string} sessionId - The current session ID
 * @param {string} message - The user's original message
 * @param {string} lowerMessage - The user's message in lowercase
 * @returns {Promise<string>} The agent's response
 * @example
 * const response = await handleAgentResponse(onboardingAgent, "session-123", "Hello!", "hello!");
 */
export async function handleAgentResponse(
  agent,
  sessionId,
  message,
  lowerMessage,
  onChunk = null,
  phase = null
) {
  switch (agent.name) {
    case 'Onboarding':
      return await agent.chat(sessionId, message, onChunk);

    case 'IdeaGenerator': {
      // Check if ideas have already been generated to avoid duplicate "Before I share ideas..." messages
      const existingIdeas = await memoryQueries.get(sessionId, 'GeneratedIdeas');

      // Also check conversation history as a fallback - if we've asked this before, use chat()
      const { conversationQueries } = await import('../database/queries.js');
      const history = await conversationQueries.getHistory(sessionId, 10);
      const hasAskedForIdeas =
        history.success &&
        history.messages?.some(
          m => m.role === 'assistant' && m.content?.includes('Before I share ideas')
        );

      if (existingIdeas?.value?.generated || hasAskedForIdeas) {
        // Set the flag if it wasn't set (recovery from interrupted flow)
        if (!existingIdeas?.value?.generated && hasAskedForIdeas) {
          await memoryQueries.set(sessionId, 'GeneratedIdeas', { generated: true });
        }
        return await agent.chat(sessionId, message, onChunk);
      } else {
        // Check if user is ready to go (skip coaching question for "yes", "let's explore", etc.)
        const readyToGoPatterns = [
          /^yes\b/i,
          /let'?s/i,
          /go ahead/i,
          /proceed/i,
          /ready/i,
          /show me/i,
          /generate/i,
          /explore/i,
          /^please\b/i,
          /^sure\b/i,
          /^ok\b/i,
          /^okay\b/i
        ];
        const userIsReady = readyToGoPatterns.some(p => p.test(lowerMessage));

        if (userIsReady) {
          // Skip coaching question - user already confirmed they want ideas
          const response = await agent.generateIdeas(sessionId, 'User ready for ideas', onChunk);
          await memoryQueries.set(sessionId, 'GeneratedIdeas', { generated: true });
          await orchestrator.addMilestone(sessionId, 'ideas_generated');
          return response;
        } else {
          // Ask coaching question first
          const response = await agent.generate(sessionId, onChunk);
          await memoryQueries.set(sessionId, 'GeneratedIdeas', { generated: true });
          await orchestrator.addMilestone(sessionId, 'ideas_generated');
          return response;
        }
      }
    }

    case 'Validator': {
      const validationDone = await agent.getMemory(sessionId, 'Validator');
      if (!validationDone?.validated) {
        return await agent.validate(sessionId, onChunk);
      } else {
        return await agent.chat(sessionId, message, onChunk);
      }
    }

    case 'PromptEngineer': {
      const promptPack = await memoryQueries.get(sessionId, 'PROMPT_PACK');
      const shouldGeneratePrompts = !promptPack?.value || isMVPPlanningRequest(lowerMessage);

      if (shouldGeneratePrompts) {
        return await agent.generateBuildPrompts(sessionId, onChunk);
      }

      return await agent.chat(sessionId, message, onChunk);
    }

    case 'Builder': {
      const activePhase = phase || 'strategy';
      const existingPrd = await memoryQueries.get(sessionId, 'PRD');
      const hasPrd = Boolean(existingPrd?.value?.content);
      const explicitPrdRequest =
        lowerMessage.includes('prd') || lowerMessage.includes('requirements');

      if ((activePhase === 'strategy' && !hasPrd) || explicitPrdRequest) {
        const response = await agent.generatePRD(sessionId, onChunk);
        await orchestrator.addMilestone(sessionId, 'prd_created');
        return response;
      }

      if (activePhase === 'building' && isMVPPlanningRequest(lowerMessage)) {
        const response = await agent.generateMVPPlan(sessionId, onChunk);
        await orchestrator.addMilestone(sessionId, 'prompts_generated');
        await agent.markMVPStarted(sessionId);
        return response;
      }

      if (lowerMessage.includes('landing') || lowerMessage.includes('page')) {
        return await agent.generateLandingPage(sessionId, onChunk);
      }

      return await agent.chat(sessionId, message, onChunk);
    }

    case 'GoToMarket': {
      const launchPlan = await memoryQueries.get(sessionId, 'LAUNCH_PLAN');
      const shouldGeneratePlan = !launchPlan?.value || isLaunchPlanningRequest(lowerMessage);

      if (shouldGeneratePlan) {
        const response = await agent.generateLaunchPlan(sessionId, onChunk);
        await orchestrator.addMilestone(sessionId, 'launch_plan_created');
        return response;
      }

      return await agent.chat(sessionId, message, onChunk);
    }

    case 'GrowthCoach': {
      const growthPlan = await memoryQueries.get(sessionId, 'GROWTH_PLAN');
      const shouldGeneratePlan = !growthPlan?.value || isGrowthPlanningRequest(lowerMessage);

      if (shouldGeneratePlan) {
        return await agent.generateGrowthPlan(sessionId, onChunk);
      }

      return await agent.chat(sessionId, message, onChunk);
    }

    default:
      return await agent.chat(sessionId, message, onChunk);
  }
}
