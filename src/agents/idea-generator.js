/**
 * Idea Generator Agent
 * Generates business ideas from pain points
 */

import { BaseAgent } from './base.js';

import { conversationQueries } from '../database/queries.js';

const SYSTEM_PROMPT = `You are VentureBot, a business idea coach helping users discover and choose a business idea to pursue.

IMPORTANT RULES:
- Never use markdown formatting (no asterisks, no bold, no bullets)
- Write in plain, conversational language
- Keep responses concise

COACHING APPROACH (Critical):
When first presented with a pain point, ask for the user's ideas first - BUT ONLY ONCE:
1. Start with: "Before I share ideas, what solutions have YOU already thought about for this?"
2. IMPORTANT: If you already asked this question in the conversation history, DO NOT ask again. Move on to generating ideas.
3. If they share an idea, explore it: "Interesting! What stopped you from pursuing that?"
4. Only AFTER understanding their thinking, offer: "Here are 3 more angles you might not have considered..."
5. If they say "none", "no ideas", "haven't thought of anything", etc. - acknowledge that's fine and IMMEDIATELY generate 3 ideas using the structured format below. Do NOT ask the coaching question again.

IDEA QUALITY CRITERIA (internal checklist - every idea MUST meet these):
- Directly addresses the stated pain point
- Buildable by one person in 2-4 weeks using AI tools
- Has clear differentiation from the other ideas presented
- Includes a specific monetization angle

STRUCTURED IDEA FORMAT:
For each idea you generate, provide in this exact format:

[Number]. [Catchy Name] - [One-liner description, 15 words max]
   How it solves your pain: [1 sentence connecting directly to their frustration]
   Build with: [specific tool - Bolt.new, Cursor, v0.dev, Lovable, Replit, etc.]
   Business model: [SaaS, marketplace, data, affiliate, etc. with price point if SaaS]

EXAMPLE OUTPUT (for pain: "I hate losing track of receipts for expenses"):

1. SnapReceipt - Photo-to-spreadsheet receipt tracker
   How it solves your pain: Snap a photo, never manually enter receipt data again
   Build with: Bolt.new + GPT-4 Vision API
   Business model: SaaS ($5/mo)

2. ExpenseBuddy - Shared expense tracker for roommates
   How it solves your pain: Split receipts instantly without awkward calculations
   Build with: Cursor + Supabase
   Business model: Freemium with premium features ($3/mo)

3. TaxFolder - Auto-categorize receipts by tax deduction type
   How it solves your pain: No more scrambling at tax time to find business expenses
   Build with: v0.dev + Claude API
   Business model: SaaS ($8/mo, launches as seasonal)

WHEN USER SELECTS AN IDEA:
If user says something like "first one", "I like #1", "the app sounds good", etc.:
- Confirm: "Great choice! You're going with [brief description of their pick]."
- Then say: "Let me validate this idea and see how it stacks up in the market. Moving to validation now!"
- DO NOT ask more questions or present more ideas

WHEN USER WANTS DIFFERENT IDEAS:
If user says "none of these", "something else", "different ideas":
- Generate 3 NEW and DIFFERENT ideas
- Don't repeat previous suggestions
- Maintain the structured format

WHEN USER IS UNSURE:
If user seems uncertain, ask ONE clarifying question, then help them decide.

Remember: Coach first, generate second. Once they pick, CONFIRM and MOVE ON. Don't loop.`;

export class IdeaGeneratorAgent extends BaseAgent {
  constructor() {
    super('IdeaGenerator', SYSTEM_PROMPT);
  }

  /**
   * Start idea generation with coaching approach - asks user for their ideas first
   */
  async generate(sessionId, onChunk = null) {
    try {
      // Get pain point from memory
      const userPain = await this.getMemory(sessionId, 'USER_PAIN');
      const userProfile = await this.getMemory(sessionId, 'USER_PROFILE');

      if (!userPain?.description) {
        throw new Error('No pain point found. Please complete onboarding first.');
      }

      // Coaching approach: Ask for user's ideas first instead of immediately generating
      const messages = [
        {
          role: 'user',
          content: `My pain point is: "${userPain.description}"

My name is ${userProfile?.name || 'there'}.

Help me brainstorm business ideas to solve this problem. Remember to ask me about my own ideas first before generating yours.`
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
   * Generate ideas directly (used when user has no ideas or wants fresh suggestions)
   */
  async generateIdeas(sessionId, userContext = '', onChunk = null) {
    try {
      const userPain = await this.getMemory(sessionId, 'USER_PAIN');
      const userProfile = await this.getMemory(sessionId, 'USER_PROFILE');

      if (!userPain?.description) {
        throw new Error('No pain point found. Please complete onboarding first.');
      }

      const contextNote = userContext ? `\n\nContext from user: ${userContext}` : '';

      const messages = [
        {
          role: 'user',
          content: `Pain point: "${userPain.description}"
User: ${userProfile?.name || 'User'}${contextNote}

The user is ready for business ideas. Generate 3 distinct ideas using the structured format. Each idea must:
- Directly solve their specific pain point
- Be buildable by one person in 2-4 weeks with AI tools
- Have a clear business model with pricing
- Be meaningfully different from the others`
        }
      ];

      if (onChunk) {
        return await this.stream(messages, onChunk);
      }

      return await this.send(messages);
    } catch (error) {
      throw new Error(`Idea generation error: ${error.message}`);
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

      // Check if we already asked the coaching question
      const alreadyAskedForIdeas = conversationHistory.some(
        m => m.role === 'assistant' && m.content?.includes('Before I share ideas')
      );

      // Detect "no ideas" type responses - bypass LLM and generate directly
      const lowerMessage = userMessage.toLowerCase();
      const noIdeasPatterns = [
        /no ideas?/i,
        /none/i,
        /haven'?t thought/i,
        /don'?t have any/i,
        /nothing/i,
        /not really/i,
        /just been dealing/i,
        /no clue/i,
        /not sure/i,
        /can'?t think/i
      ];
      const userHasNoIdeas = noIdeasPatterns.some(p => p.test(lowerMessage));

      // If coaching question was asked AND user has no ideas, generate directly
      if (alreadyAskedForIdeas && userHasNoIdeas) {
        return await this.generateIdeas(sessionId, 'User has no existing ideas', onChunk);
      }

      // Build messages with history
      const messages = [];

      // Add context - if coaching question was asked, tell LLM not to repeat
      const coachingNote = alreadyAskedForIdeas
        ? ' You already asked "Before I share ideas..." - do NOT ask again. Generate ideas or respond to what the user said.'
        : '';
      messages.push({
        role: 'system',
        content: `Context: User "${userProfile?.name || 'User'}" has pain point: "${userPain?.description || 'unknown'}"${coachingNote}`
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

      // lowerMessage already defined above
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
