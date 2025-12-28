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
export async function handleAgentResponse(agent, sessionId, message, lowerMessage) {
  switch (agent.name) {
    case 'Onboarding':
      return await agent.chat(sessionId, message);

    case 'IdeaGenerator': {
      const existingIdeas = await memoryQueries.get(sessionId, 'GeneratedIdeas');
      if (existingIdeas?.generated) {
        return await agent.chat(sessionId, message);
      } else {
        const response = await agent.generate(sessionId);
        await memoryQueries.set(sessionId, 'GeneratedIdeas', { generated: true });
        await orchestrator.addMilestone(sessionId, 'ideas_generated');
        return response;
      }
    }

    case 'Validator': {
      const validationDone = await agent.getMemory(sessionId, 'Validator');
      if (!validationDone?.validated) {
        return await agent.validate(sessionId);
      } else {
        return await agent.chat(sessionId, message);
      }
    }

    case 'Builder': {
      if (lowerMessage.includes('prd') || lowerMessage.includes('requirements')) {
        const response = await agent.generatePRD(sessionId);
        await orchestrator.addMilestone(sessionId, 'prd_created');
        return response;
      } else if (lowerMessage.includes('landing') || lowerMessage.includes('page')) {
        return await agent.generateLandingPage(sessionId);
      } else {
        return await agent.chat(sessionId, message);
      }
    }

    default:
      return await agent.chat(sessionId, message);
  }
}
