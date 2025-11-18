/**
 * Onboarding Agent
 * Guides users through pain point discovery
 */

import { BaseAgent } from './base.js';
import { conversationQueries } from '../database/queries.js';

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
- NEVER repeat the welcome message unless starting a completely new session

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
      // Get conversation history
      const historyResult = await conversationQueries.getHistory(sessionId, 10);
      const conversationHistory = historyResult.success ? historyResult.messages : [];
      
      // Get existing memory
      const memory = await this.getAllMemory(sessionId);

      // Build conversation messages for AI (include history)
      const messages = [];
      
      // Add conversation history (exclude system messages and limit to last few exchanges)
      const recentHistory = conversationHistory.slice(-6); // Last 3 exchanges
      for (const msg of recentHistory) {
        if (msg.role === 'user' || msg.role === 'assistant') {
          messages.push({
            role: msg.role,
            content: msg.content
          });
        }
      }
      
      // Add current user message if not already in history
      const lastMessage = recentHistory[recentHistory.length - 1];
      if (!lastMessage || lastMessage.role !== 'user' || lastMessage.content !== userMessage) {
        messages.push({
          role: 'user',
          content: userMessage
        });
      }

      // Add memory context as a system message if needed
      if (memory.USER_PROFILE?.name || memory.USER_PAIN?.description) {
        let memoryContext = 'Context from previous conversations:';
        if (memory.USER_PROFILE?.name) {
          memoryContext += `\n- User name: ${memory.USER_PROFILE.name}`;
        }
        if (memory.USER_PAIN?.description) {
          memoryContext += `\n- User pain point: ${memory.USER_PAIN.description}`;
        }
        
        // Insert memory context before the last few messages
        if (messages.length > 2) {
          messages.splice(-2, 0, {
            role: 'system',
            content: memoryContext
          });
        }
      }

      // Extract and store information from user messages
      await this.extractAndStoreInfo(sessionId, userMessage, memory);

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
   * Extract and store user information from messages
   */
  async extractAndStoreInfo(sessionId, userMessage, memory) {
    const message = userMessage.toLowerCase().trim();
    
    // Extract name if not already stored
    if (!memory.USER_PROFILE?.name) {
      // Simple name extraction - look for patterns like "my name is X" or just single words that could be names
      const namePatterns = [
        /my name is (\w+)/i,
        /i'm (\w+)/i,
        /i am (\w+)/i,
        /call me (\w+)/i
      ];
      
      for (const pattern of namePatterns) {
        const match = message.match(pattern);
        if (match && match[1]) {
          await this.setMemory(sessionId, 'USER_PROFILE', { name: match[1] });
          break;
        }
      }
      
      // If no pattern matched, check if it's a single word (likely a name)
      if (!memory.USER_PROFILE?.name && message.split(' ').length === 1 && message.length > 1) {
        await this.setMemory(sessionId, 'USER_PROFILE', { name: userMessage.trim() });
      }
    }
    
    // Extract pain points if not already stored
    if (!memory.USER_PAIN?.description && memory.USER_PROFILE?.name) {
      // Look for pain indicators after we have the name
      const painIndicators = [
        'frustrated', 'annoying', 'problem', 'issue', 'struggle', 
        'difficult', 'hard', 'hate', 'don\'t like', 'wish', 'pain'
      ];
      
      if (painIndicators.some(indicator => message.includes(indicator))) {
        await this.setMemory(sessionId, 'USER_PAIN', { 
          description: userMessage.trim(),
          frequency: 'unknown',
          severity: 5
        });
      }
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
