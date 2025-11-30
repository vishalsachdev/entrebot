/**
 * Onboarding Agent
 * Guides users through pain point discovery
 */

import { BaseAgent } from './base.js';
import { conversationQueries } from '../database/queries.js';

const SYSTEM_PROMPT = `You are VentureBot, a warm and encouraging coach who helps aspiring entrepreneurs discover business opportunities hidden in everyday frustrations.

Your personality:
- Friendly and conversational, like chatting with a supportive mentor
- Curious and genuinely interested in their experiences  
- Patient but efficient - don't repeat questions they've already answered
- Keep responses concise (2-3 sentences max)

CRITICAL RULES:
- Ask only ONE question per message
- Never use markdown formatting (no asterisks, no bold, no bullets)
- Write in plain, natural language
- NEVER repeat a question the user has already answered
- NEVER ask about workarounds more than once
- Move forward once you have enough information

STREAMLINED CONVERSATION FLOW:

1. GREETING (already shown): "Hey there! I'm VentureBot..."

2. AFTER NAME: Ask about a frustration.
   "Nice to meet you, [Name]! What's something that frustrates you in your daily life?"

3. AFTER FRUSTRATION MENTIONED: Ask for frequency OR severity (pick one).
   "How often does this happen to you?"

4. AFTER FREQUENCY/SEVERITY: Ask ONE workaround question, then MOVE ON.
   "What do you do now to deal with this?"

5. AFTER ANY WORKAROUND ANSWER (even brief ones like "go to a bar"): 
   DO NOT ask about workarounds again. Move to confirmation.
   "Got it! Let me make sure I understand: You're frustrated by [problem], it happens [frequency], and currently you [workaround]. Ready to explore some business ideas around this?"

6. AFTER CONFIRMATION: Transition immediately.
   "Great! Let me generate some ideas for you now."

IMPORTANT - AVOID LOOPS:
- If user gives ANY answer to a workaround question, accept it and move on
- Short answers are fine ("go to a bar", "nothing", "I just deal with it")
- Don't ask for "other" workarounds or "more" strategies
- 3-4 exchanges after the pain point is mentioned is enough
- When in doubt, summarize what you know and move to ideas

Remember: Better to move forward with a good-enough understanding than to frustrate the user with repetitive questions.`;

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
      const historyResult = await conversationQueries.getHistory(sessionId, 20);
      const conversationHistory = historyResult.success ? historyResult.messages : [];
      
      // Get existing memory
      const memory = await this.getAllMemory(sessionId);

      // Build conversation messages for AI (include history)
      const messages = [];
      
      // Add conversation history (exclude system messages)
      // Send more history so LLM can see what's already been asked
      const recentHistory = conversationHistory.slice(-12); // Last 6 exchanges
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
    const originalMessage = userMessage.trim();
    
    // Extract name if not already stored
    if (!memory.USER_PROFILE?.name) {
      const namePatterns = [
        /my name is (\w+)/i,
        /i'm (\w+)/i,
        /i am (\w+)/i,
        /call me (\w+)/i,
        /it's (\w+)/i,
        /^(\w+) here/i
      ];
      
      for (const pattern of namePatterns) {
        const match = originalMessage.match(pattern);
        if (match && match[1]) {
          const name = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
          await this.setMemory(sessionId, 'USER_PROFILE', { name });
          return;
        }
      }
      
      // If short response (1-2 words), likely just a name
      // But filter out common greetings and filler words
      const greetings = ['hi', 'hello', 'hey', 'yo', 'sup', 'hiya', 'howdy', 'greetings', 
                         'yes', 'no', 'yeah', 'yep', 'nope', 'ok', 'okay', 'sure', 'thanks',
                         'good', 'great', 'fine', 'cool', 'nice', 'awesome'];
      const words = originalMessage.split(/\s+/);
      const firstWord = words[0].toLowerCase();
      
      if (words.length <= 2 && originalMessage.length > 1 && originalMessage.length < 30) {
        if (!greetings.includes(firstWord)) {
          const name = words[0].charAt(0).toUpperCase() + words[0].slice(1).toLowerCase();
          await this.setMemory(sessionId, 'USER_PROFILE', { name });
          return;
        }
      }
    }
    
    // Enhanced pain point extraction with depth tracking
    // We now track multiple dimensions of the pain point as the conversation progresses
    if (memory.USER_PROFILE?.name) {
      const existingPain = memory.USER_PAIN || {};
      const words = message.split(/\s+/);
      
      // Extract frequency if mentioned
      const frequencyPatterns = [
        { pattern: /every\s*day|daily|all the time|constantly/i, value: 'daily' },
        { pattern: /every\s*week|weekly|few times a week/i, value: 'weekly' },
        { pattern: /every\s*month|monthly|once a month/i, value: 'monthly' },
        { pattern: /occasionally|sometimes|once in a while|rarely/i, value: 'occasionally' }
      ];
      
      console.log('[extractAndStoreInfo] Checking frequency in message:', message);
      for (const { pattern, value } of frequencyPatterns) {
        if (pattern.test(message)) {
          console.log('[extractAndStoreInfo] Found frequency:', value);
          existingPain.frequency = value;
          break;
        }
      }
      
      // Extract severity if mentioned (scale of 1-10)
      const severityMatch = message.match(/(\d+)\s*(?:out of|\/)\s*10/i) || 
                           message.match(/(?:like a|about a|maybe)\s*(\d+)/i);
      if (severityMatch) {
        const severity = parseInt(severityMatch[1]);
        if (severity >= 1 && severity <= 10) {
          existingPain.severity = severity;
        }
      }
      
      // Track if user mentions others having the problem
      if (/friends?|colleagues?|coworkers?|family|everyone|people|others?/i.test(message)) {
        existingPain.affectsOthers = true;
      }
      
      // Track willingness to pay signals
      if (/paid|pay|spend|bought|purchase|subscribe/i.test(message)) {
        existingPain.willingnessSignal = true;
      }
      
      // Store initial pain description if not already stored and response is substantial
      if (!existingPain.description && words.length >= 5) {
        existingPain.description = originalMessage;
        existingPain.category = 'unknown'; // Will be refined by the agent
      }
      
      // Update pain memory if we have any data
      if (Object.keys(existingPain).length > 0) {
        await this.setMemory(sessionId, 'USER_PAIN', existingPain);
      }
    }
  }

  /**
   * Check if onboarding is complete
   * Need name, pain point, AND at least one follow-up answered
   */
  async isComplete(sessionId) {
    const userProfile = await this.getMemory(sessionId, 'USER_PROFILE');
    const userPain = await this.getMemory(sessionId, 'USER_PAIN');

    console.log('[isComplete] userProfile:', userProfile);
    console.log('[isComplete] userPain:', userPain);

    // Need name and pain description
    if (!userProfile?.name || !userPain?.description) {
      console.log('[isComplete] Missing name or description, returning false');
      return false;
    }

    // Description should be at least 10 characters
    if (userPain.description.length < 10) {
      console.log('[isComplete] Description too short, returning false');
      return false;
    }

    // Need at least one depth indicator (frequency, severity, etc.)
    // This ensures we've had at least one follow-up exchange
    const hasDepth = userPain.frequency || 
                     userPain.severity || 
                     userPain.affectsOthers || 
                     userPain.willingnessSignal;
    
    console.log('[isComplete] hasDepth:', hasDepth, '- returning', !!hasDepth);
    return !!hasDepth;
  }

  /**
   * Get pain point depth score for coaching quality metrics
   */
  async getPainPointDepth(sessionId) {
    const userPain = await this.getMemory(sessionId, 'USER_PAIN');
    if (!userPain) return 0;

    let score = 0;
    if (userPain.description) score += 1;
    if (userPain.frequency && userPain.frequency !== 'unknown') score += 1;
    if (userPain.severity) score += 1;
    if (userPain.affectsOthers) score += 1;
    if (userPain.willingnessSignal) score += 1;
    
    return score; // Max score of 5
  }
}

export default OnboardingAgent;
