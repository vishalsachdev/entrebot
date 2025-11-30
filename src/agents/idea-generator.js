/**
 * Idea Generator Agent
 * Generates business ideas from pain points
 */

import { BaseAgent } from './base.js';

import { conversationQueries } from '../database/queries.js';

const SYSTEM_PROMPT = `You are VentureBot, helping users choose a business idea to pursue.

IMPORTANT RULES:
- Never use markdown formatting (no asterisks, no bold, no bullets)
- Write in plain, conversational language
- Keep responses concise

YOUR JOB:
1. When ideas have been presented, help user pick one
2. When user picks an idea (says "first one", "number 1", "I like the app idea", etc.), CONFIRM their choice and move to validation
3. DO NOT regenerate or rephrase ideas they've already seen

WHEN USER SELECTS AN IDEA:
If user says something like "first one", "I like #1", "the app sounds good", etc.:
- Confirm: "Great choice! You're going with [brief description of their pick]."
- Then say: "Let me validate this idea and see how it stacks up in the market. Moving to validation now!"
- DO NOT ask more questions or present more ideas

WHEN USER WANTS DIFFERENT IDEAS:
If user says "none of these", "something else", "different ideas":
- Generate 3 NEW and DIFFERENT ideas
- Don't repeat previous suggestions

WHEN USER IS UNSURE:
If user seems uncertain, ask ONE clarifying question, then help them decide.

Remember: Once they pick, CONFIRM and MOVE ON. Don't loop.`;

export class IdeaGeneratorAgent extends BaseAgent {
  constructor() {
    super('IdeaGenerator', SYSTEM_PROMPT);
  }

  /**
   * Generate ideas based on pain point
   */
  async generate(sessionId, onChunk = null) {
    try {
      // Get pain point from memory
      const userPain = await this.getMemory(sessionId, 'USER_PAIN');
      const userProfile = await this.getMemory(sessionId, 'USER_PROFILE');

      if (!userPain?.description) {
        throw new Error('No pain point found. Please complete onboarding first.');
      }

      const messages = [
        {
          role: 'user',
          content: `Pain point: ${userPain.description}\nUser name: ${userProfile?.name || 'User'}\n\nPlease generate 5 innovative ideas to solve this pain point.`
        }
      ];

      // Stream response if callback provided
      if (onChunk) {
        return await this.stream(messages, onChunk);
      }

      return await this.send(messages);
    } catch (error) {
      throw new Error(`Idea generator error: ${error.message}`);
    }
  }

  /**
   * Chat method for handling conversation flow (selection, clarification, etc.)
   */
  async chat(sessionId, userMessage, onChunk = null) {
    try {
      // Get conversation history
      const historyResult = await conversationQueries.getHistory(sessionId, 20);
      const conversationHistory = historyResult.success ? historyResult.messages : [];
      
      // Get context from memory
      const userPain = await this.getMemory(sessionId, 'USER_PAIN');
      const userProfile = await this.getMemory(sessionId, 'USER_PROFILE');

      // Build messages with history
      const messages = [];
      
      // Add context
      messages.push({
        role: 'system',
        content: `Context: User "${userProfile?.name || 'User'}" has pain point: "${userPain?.description || 'unknown'}"`
      });
      
      // Add conversation history
      const recentHistory = conversationHistory.slice(-12);
      for (const msg of recentHistory) {
        if (msg.role === 'user' || msg.role === 'assistant') {
          messages.push({ role: msg.role, content: msg.content });
        }
      }
      
      // Add current message if not in history
      const lastMessage = recentHistory[recentHistory.length - 1];
      if (!lastMessage || lastMessage.role !== 'user' || lastMessage.content !== userMessage) {
        messages.push({ role: 'user', content: userMessage });
      }

      // Check if user is selecting an idea
      const selectionPatterns = [
        /first|1st|number 1|#1|one\b/i,
        /second|2nd|number 2|#2|two\b/i,
        /third|3rd|number 3|#3|three\b/i,
        /fourth|4th|number 4|#4|four\b/i,
        /fifth|5th|number 5|#5|five\b/i
      ];
      
      const lowerMessage = userMessage.toLowerCase();
      for (let i = 0; i < selectionPatterns.length; i++) {
        if (selectionPatterns[i].test(lowerMessage) || lowerMessage.includes(`${i + 1}`)) {
          // User selected an idea - store it and signal completion
          await this.setMemory(sessionId, 'SelectedIdea', {
            id: i + 1,
            idea: `Idea ${i + 1} selected from conversation`,
            userSelection: userMessage
          });
          break;
        }
      }

      // Stream response
      if (onChunk) {
        return await this.stream(messages, onChunk);
      }
      return await this.send(messages);
    } catch (error) {
      throw new Error(`Idea generator chat error: ${error.message}`);
    }
  }

  /**
   * Handle user selection of an idea
   */
  async selectIdea(sessionId, ideaNumber, ideaText) {
    try {
      // Store selected idea in memory
      await this.setMemory(sessionId, 'SelectedIdea', {
        id: ideaNumber,
        idea: ideaText
      });

      return {
        success: true,
        message: `Idea ${ideaNumber} selected for validation.`
      };
    } catch (error) {
      throw new Error(`Error selecting idea: ${error.message}`);
    }
  }
}

export default IdeaGeneratorAgent;
