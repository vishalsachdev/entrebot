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

      // Calculate depth score to know if we should prompt for reflection
      // Note: depthScore was used for decision logic but now we use reflectionAsked/reflectionReceived flags
      const _depthScore = await this.calculateDepthScore(userPain);

      // Track turn numbers for proper reflection question/answer sequencing
      // reflectionAskedOnTurn: the turn when the agent asked the reflection
      // currentTurn: increments each user message
      const currentTurn = (userPain.turnCount || 0) + 1;
      userPain.turnCount = currentTurn;

      // Check if this is a response to the reflection question
      // Only mark reflectionReceived if:
      // 1. reflectionAsked is true
      // 2. This turn is AFTER the turn when reflection was asked
      // 3. reflectionReceived isn't already set
      if (
        userPain.reflectionAsked &&
        userPain.reflectionAskedOnTurn &&
        currentTurn > userPain.reflectionAskedOnTurn &&
        !userPain.reflectionReceived
      ) {
        userPain.reflectionReceived = true;
      }

      // Always save turnCount update
      await this.setMemory(sessionId, 'USER_PAIN', userPain);

      // Stream response if callback provided
      let response;
      if (onChunk) {
        response = await this.stream(messages, onChunk);
      } else {
        response = await this.send(messages);
      }

      // Check if the agent's response actually contains the reflection question
      // Only set reflectionAsked if the response includes the key phrase
      const reflectionPhrases = ['real reason', 'really bothers', 'deeper reason', 'root cause'];
      const responseContainsReflection = reflectionPhrases.some(phrase =>
        response.toLowerCase().includes(phrase)
      );

      if (responseContainsReflection && !userPain.reflectionAsked) {
        userPain.reflectionAsked = true;
        userPain.reflectionAskedOnTurn = currentTurn;
        // Save the updated flags
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
   * Classify message type for context-aware extraction
   * Returns: 'rating', 'affirmative', 'frequency', 'greeting', 'selection', or 'content'
   */
  classifyMessage(message) {
    const lower = message.toLowerCase().trim();

    // Is it just a number or rating format (likely a severity rating)?
    if (
      /^\d+$/.test(lower) ||
      /^(?:like\s+)?(?:a\s+)?\d+(?:\s*(?:out of|\/)\s*10)?$/i.test(lower)
    ) {
      return 'rating';
    }

    // Is it an idea selection? (#1, "the first one", etc.)
    if (
      /^#?\d$|^(?:the\s+)?(?:first|second|third|fourth|fifth|1st|2nd|3rd|4th|5th)\b/i.test(lower)
    ) {
      return 'selection';
    }

    // Is it a simple affirmative/negative?
    if (/^(yes|yeah|yep|sure|ok|okay|no|nope|nah)(\s*(please|thanks|!|,)?)?$/i.test(lower)) {
      return 'affirmative';
    }

    // Is it primarily a frequency response?
    if (
      /^(every|daily|weekly|monthly|once|twice|few times|sometimes|rarely|often|all the time)\b/i.test(
        lower
      )
    ) {
      return 'frequency';
    }

    // Is it a greeting?
    if (/^(hi|hello|hey|howdy|greetings)\b/i.test(lower) && lower.length < 30) {
      return 'greeting';
    }

    // Otherwise, it's likely substantive content (pain description, explanation, etc.)
    return 'content';
  }

  /**
   * Extract and store user information from messages
   * Uses semantic classification instead of hard-coded word counts
   */
  async extractAndStoreInfo(sessionId, userMessage, memory) {
    const message = userMessage.toLowerCase().trim();
    const originalMessage = userMessage.trim();
    const messageType = this.classifyMessage(originalMessage);

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
      // Strip punctuation from first word for greeting check
      const firstWordClean = words[0].toLowerCase().replace(/[^a-z]/g, '');

      if (words.length <= 2 && originalMessage.length > 1 && originalMessage.length < 30) {
        if (!greetings.includes(firstWordClean)) {
          // Also strip punctuation from the name
          const cleanName = words[0].replace(/[^a-zA-Z]/g, '');
          if (cleanName.length > 0) {
            const name = cleanName.charAt(0).toUpperCase() + cleanName.slice(1).toLowerCase();
            await this.setMemory(sessionId, 'USER_PROFILE', { name });
            return;
          }
        }
      }
    }

    // Enhanced pain point extraction with depth tracking
    // We now track multiple dimensions of the pain point as the conversation progresses
    if (memory.USER_PROFILE?.name) {
      const existingPain = memory.USER_PAIN || {};

      // Extract frequency if mentioned
      const frequencyPatterns = [
        { pattern: /every\s*day|daily|all the time|constantly/i, value: 'daily' },
        { pattern: /every\s*week|weekly|few times a week|multiple times a week/i, value: 'weekly' },
        { pattern: /every\s*(few\s*)?month|monthly|once a month|few months/i, value: 'monthly' },
        { pattern: /occasionally|sometimes|once in a while|rarely/i, value: 'occasionally' }
      ];

      for (const { pattern, value } of frequencyPatterns) {
        if (pattern.test(message)) {
          existingPain.frequency = value;
          break;
        }
      }

      // Extract severity if mentioned (scale of 1-10)
      // Use semantic classification: only extract from 'rating' type messages
      // This prevents "#1" idea selection or other numbers from being misinterpreted
      if (!existingPain.severity && messageType === 'rating') {
        const severityMatch =
          message.match(/(\d+)\s*(?:out of|\/)\s*10/i) ||
          message.match(/(?:like|about|maybe)\s+(?:a\s+)?(\d+)/i) ||
          message.match(/\b(\d+)\b/);
        if (severityMatch) {
          const severity = parseInt(severityMatch[1]);
          if (severity >= 1 && severity <= 10) {
            existingPain.severity = severity;
          }
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
      // Include "yes" and affirmative responses ONLY when standalone or with minimal additions
      // Avoid false positives like "Yes everyone" (answering a different question)
      const isStandaloneAffirmative =
        /^(yes|yeah|yep|sure|ok|okay)(\s*(please|thanks|!|,)?)?$/i.test(message);
      const hasReadyPhrases =
        /ready|show me|give me ideas|what ideas|generate|let'?s\s*(do|go|see)/i.test(message);

      if (isStandaloneAffirmative || hasReadyPhrases) {
        existingPain.readyForIdeas = true;
      }

      // Store initial pain description if not already stored
      // Use semantic classification: only 'content' type messages with meaningful length
      // This is more robust than hard-coded word counts
      if (!existingPain.description && messageType === 'content' && originalMessage.length >= 15) {
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

    // Need name and pain description
    if (!userProfile?.name || !userPain?.description) {
      return false;
    }

    // Description should be at least 20 characters (more substantial)
    if (userPain.description.length < 20) {
      return false;
    }

    // Count depth indicators - need at least 2 for completion
    const depthScore = this.calculateDepthScore(userPain);

    // When depth is sufficient (>=2), we require the reflection exchange to complete
    // This ensures the user has had a chance to reflect on their pain before moving on
    if (depthScore >= 2) {
      // Must have completed the reflection exchange
      // Either: reflectionReceived is true (normal flow)
      // OR: user explicitly said they're ready for ideas (shortcut)
      if (!userPain.reflectionReceived && !userPain.readyForIdeas) {
        return false;
      }
    }

    return depthScore >= 2;
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
