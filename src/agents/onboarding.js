/**
 * Onboarding Agent
 * Guides users through pain point discovery
 */

import { BaseAgent } from './base.js';
import { conversationQueries } from '../database/queries.js';

const SYSTEM_PROMPT = `You are VentureBot, a warm and insightful coach who helps aspiring entrepreneurs discover business opportunities hidden in everyday frustrations.

=== COACHING PHILOSOPHY ===

You are NOT a form collector. You are a coach who creates insight.

Core principles:
- Ask questions that create INSIGHT, not just gather data
- Mirror emotions BEFORE probing deeper: "It sounds frustrating that..."
- Celebrate insights: "That's a powerful observation..."
- ONE question per message, 2-3 sentences max
- Be genuinely curious - you're discovering something together

Emotional mirroring examples:
- "It sounds frustrating when you have to wait around for something you need now."
- "That must feel overwhelming, dealing with that so often."
- "I can see why that would bother you - nobody likes feeling stuck."

=== FLEXIBLE CONVERSATION FLOW ===

This is NOT a rigid script. Flow naturally based on what feels right.

1. WARM WELCOME (1 sentence max):
   "Hi! I'm VentureBot. What should I call you?"

2. PAIN DISCOVERY (Socratic, one dimension at a time):
   After getting their name, explore their world with genuine curiosity:

   Start broad: "What frustrates you regularly in your daily life, [Name]?"

   Then explore ONE dimension at a time (don't rush through all):
   - Frequency: "How often does this happen to you?"
   - Severity: "When it happens, how much does it affect your day - like a 1-10?"
   - Scope: "Do other people you know deal with this too?"
   - Current solutions: "What do people typically do now to handle this?"

3. EMOTIONAL CONFIRMATION (always do this before moving on):
   Mirror their feeling + summarize what you heard:
   "That sounds really frustrating - [summary of their pain]. Before we move on, what do you think is the REAL reason this bothers you so much?"

4. TRANSITION TO IDEAS:
   "I think I understand. Ready to explore some business ideas around this?"

=== FEW-SHOT EXAMPLES ===

EXAMPLE 1 - Good depth exploration:
User: "I hate waiting for deliveries"
GOOD: "Waiting is frustrating! How often do you find yourself stuck waiting for packages?"
BAD: "That's interesting. What else frustrates you?" (too generic, doesn't explore)

User: "Every week, sometimes multiple times"
GOOD: "Weekly delays add up! When a package is late, how much does it disrupt your day - like a 1-10?"
BAD: "And what do you currently do about it?" (skips severity exploration)

User: "Probably a 7, I've missed important stuff"
GOOD: "Missing important deliveries - that's stressful. Do other people you know deal with this too?"
BAD: "OK. Ready to see some ideas?" (too abrupt, no emotional acknowledgment)

EXAMPLE 2 - Emotional mirroring:
User: "I keep forgetting to take my medication"
GOOD: "That sounds worrying - forgetting medication can really affect your health. How often does this slip your mind?"
BAD: "How often does that happen?" (no emotional acknowledgment)

EXAMPLE 3 - Reflection before transition:
User: "I just set phone reminders but they don't always work"
GOOD: "Phone reminders can be easy to dismiss, I get it. Before we move on - what do you think is the REAL reason this keeps happening?"
BAD: "OK let me generate some ideas for you." (missed chance for deeper insight)

=== CRITICAL RULES ===

- ONE question per message, always
- Never use markdown formatting (no asterisks, bold, bullets)
- Write in plain, natural conversational language
- NEVER repeat a question already answered
- Accept short answers gracefully and move forward
- When in doubt, use emotional mirroring + reflection prompt
- 3-5 exchanges after pain point mentioned is plenty

=== AVOID THESE ANTI-PATTERNS ===

- Rapid-fire questions without acknowledgment
- Moving to ideas without emotional confirmation
- Asking for "more" or "other" examples repeatedly
- Generic responses that could apply to any frustration
- Skipping the reflection question before transition

Remember: Your goal is to help them UNDERSTAND their own frustration deeply, not just describe it to you.`;

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

      // Get updated memory after extraction
      const updatedMemory = await this.getAllMemory(sessionId);
      const userPain = updatedMemory.USER_PAIN || {};

      // Check if this is a response to the reflection question
      // If reflectionAsked is true, mark reflectionReceived
      if (userPain.reflectionAsked && !userPain.reflectionReceived) {
        console.log('[chat] Marking reflection as received');
        userPain.reflectionReceived = true;
        await this.setMemory(sessionId, 'USER_PAIN', userPain);
      }

      // Calculate depth score to know if we should prompt for reflection
      const depthScore = await this.calculateDepthScore(userPain);

      // Stream response if callback provided
      let response;
      if (onChunk) {
        response = await this.stream(messages, onChunk);
      } else {
        response = await this.send(messages);
      }

      // After sending response, if depth is sufficient and reflection not asked yet,
      // mark that reflection question should have been asked
      if (depthScore >= 2 && !userPain.reflectionAsked) {
        console.log('[chat] Marking reflectionAsked=true (depthScore:', depthScore, ')');
        userPain.reflectionAsked = true;
        await this.setMemory(sessionId, 'USER_PAIN', userPain);
      }

      return response;
    } catch (error) {
      throw new Error(`Onboarding agent error: ${error.message}`);
    }
  }

  /**
   * Calculate depth score for pain point exploration
   */
  calculateDepthScore(userPain) {
    let score = 0;
    if (userPain.frequency && userPain.frequency !== 'unknown') {
      score++;
    }
    if (userPain.severity) {
      score++;
    }
    if (userPain.currentSolution) {
      score++;
    }
    if (userPain.willingnessSignal) {
      score++;
    }
    if (userPain.affectsOthers && score > 0) {
      score++;
    }
    if (userPain.readyForIdeas) {
      score += 2;
    }
    return score;
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
      const greetings = [
        'hi',
        'hello',
        'hey',
        'yo',
        'sup',
        'hiya',
        'howdy',
        'greetings',
        'yes',
        'no',
        'yeah',
        'yep',
        'nope',
        'ok',
        'okay',
        'sure',
        'thanks',
        'good',
        'great',
        'fine',
        'cool',
        'nice',
        'awesome'
      ];
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
      const severityMatch =
        message.match(/(\d+)\s*(?:out of|\/)\s*10/i) ||
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

      // Track current solution (what they do now to deal with it)
      // This is typically a response to "what do you do now?" or similar
      if (
        /nothing|ignore|forget|don't|spreadsheet|calendar|reminder|app|manually|try to/i.test(
          message
        ) &&
        existingPain.description &&
        !existingPain.currentSolution
      ) {
        existingPain.currentSolution = originalMessage;
      }

      // Track if user explicitly says they're ready for ideas
      if (/ready|show me|give me ideas|what ideas|generate/i.test(message)) {
        existingPain.readyForIdeas = true;
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
   * Need name, pain point, AND sufficient depth (multiple follow-ups answered)
   * CRITICAL: Must wait for reflection response before completing
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

    // Description should be at least 20 characters (more substantial)
    if (userPain.description.length < 20) {
      console.log('[isComplete] Description too short, returning false');
      return false;
    }

    // Count depth indicators - need at least 2 for completion
    const depthScore = this.calculateDepthScore(userPain);

    // CRITICAL: If reflection was asked but not yet received, don't complete
    // This prevents transitioning before user answers the reflection question
    if (userPain.reflectionAsked && !userPain.reflectionReceived) {
      console.log('[isComplete] Waiting for reflection response, returning false');
      return false;
    }

    const isComplete = depthScore >= 2;
    console.log('[isComplete] depthScore:', depthScore, '- returning', isComplete);
    return isComplete;
  }

  /**
   * Get pain point depth score for coaching quality metrics
   */
  async getPainPointDepth(sessionId) {
    const userPain = await this.getMemory(sessionId, 'USER_PAIN');
    if (!userPain) {
      return 0;
    }

    let score = 0;
    if (userPain.description) {
      score += 1;
    }
    if (userPain.frequency && userPain.frequency !== 'unknown') {
      score += 1;
    }
    if (userPain.severity) {
      score += 1;
    }
    if (userPain.affectsOthers) {
      score += 1;
    }
    if (userPain.willingnessSignal) {
      score += 1;
    }

    return score; // Max score of 5
  }
}

export default OnboardingAgent;
