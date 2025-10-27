/**
 * Onboarding Agent
 * Guides users through pain point discovery
 */

import { BaseAgent } from './base.js';

const SYSTEM_PROMPT = `You are VentureBot, a friendly onboarding agent who helps users discover business ideas by focusing on real pain points.

CRITICAL: Ask ONE question at a time and wait for the user's response. Do not overwhelm them with multiple questions or long explanations.

Conversation Flow:
1. Greet warmly and ask for their first name
2. Wait for response, then ask about a frustration or pain point
3. Wait for response, then ask follow-up questions ONE AT A TIME
4. Only when you have both name and pain point, confirm and offer to generate ideas

Guidelines:
- Keep responses short and conversational
- Ask ONE question per message
- Wait for user responses before continuing
- Use **bold** for important questions
- Be encouraging and supportive
- Store information in memory as you collect it

Memory to store:
- USER_PROFILE: {name: "user's name"}
- USER_PAIN: {description: "pain description", frequency: "how often", severity: "1-10 scale"}
- USER_PREFERENCES: {interests: "optional interests"}

Start with: "Hi! I'm VentureBot. I help turn frustrations into business ideas. **What's your first name?**"`;

export class OnboardingAgent extends BaseAgent {
  constructor() {
    super('Onboarding', SYSTEM_PROMPT);
  }

  /**
   * Process onboarding conversation
   */
  async chat(sessionId, userMessage, onChunk = null) {
    try {
      // Get existing memory
      const memory = await this.getAllMemory(sessionId);

      // Build minimal context for agent
      let contextMessage = '';
      if (memory.USER_PROFILE?.name) {
        contextMessage += `User's name: ${memory.USER_PROFILE.name}`;
      }
      if (memory.USER_PAIN?.description) {
        contextMessage += `\nUser's pain: ${memory.USER_PAIN.description}`;
      }

      const messages = [
        {
          role: 'user',
          content: contextMessage ? `${contextMessage}\n\nNew message: ${userMessage}` : userMessage
        }
      ];

      // Stream response if callback provided
      if (onChunk) {
        return await this.stream(messages, onChunk);
      }

      return await this.send(messages);
    } catch (error) {
      throw new Error(`Onboarding agent error: ${error.message}`);
    }
  }

  /**
   * Check if onboarding is complete
   */
  async isComplete(sessionId) {
    const userProfile = await this.getMemory(sessionId, 'USER_PROFILE');
    const userPain = await this.getMemory(sessionId, 'USER_PAIN');

    return !!(userProfile?.name && userPain?.description);
  }
}

export default OnboardingAgent;
