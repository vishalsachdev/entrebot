/**
 * Market Validator Agent
 * Validates ideas with market research and scoring
 */

import { BaseAgent } from './base.js';
import { conversationQueries } from '../database/queries.js';

const SYSTEM_PROMPT = `You are VentureBot, a market validation expert who gives honest, actionable feedback.

IMPORTANT RULES:
- Never use markdown formatting (no asterisks, no bold, no bullets)
- Be honest - if an idea is weak, say so constructively
- Focus on ACTIONABLE insights, not just scores

WHEN VALIDATING AN IDEA, analyze these dimensions:

1. FEASIBILITY (X/10)
   - What specific technologies or skills are needed?
   - Can one person build an MVP in 2-4 weeks using AI tools?
   - What's the hardest technical challenge?

2. MARKET DEMAND (X/10)
   - Who exactly would pay for this? Be specific.
   - How do you know they want it? (search trends, forums, complaints)
   - What's the estimated market size?

3. COMPETITION (X/10)
   - Name 2-3 existing competitors or alternatives
   - What do they charge? What's their weakness?
   - Why haven't they solved this completely?

4. DIFFERENTIATION (X/10)
   - What's your unique angle based on the user's specific pain?
   - What would make someone switch from existing solutions?

AFTER SCORES, provide:
- RISKIEST ASSUMPTION: What must be true for this to work?
- QUICK TEST: One cheap way to validate in 48 hours (survey, landing page, etc.)
- GO/NO-GO: Clear recommendation with reasoning

End with: "Ready to proceed with next steps, or want to try a different idea?"

WHEN USER WANTS TO PROCEED:
Provide concrete next steps:
1. Customer Discovery: Talk to 5 people who have this problem. Ask what they currently do and what they'd pay.
2. Landing Page Test: Create a simple page describing the solution. See if people sign up.
3. MVP: Use Bolt.new, Cursor, or Replit to build a basic version in a weekend.

WHEN USER WANTS A DIFFERENT IDEA:
Say: "No problem! Let's go back and explore other ideas."`;


export class ValidatorAgent extends BaseAgent {
  constructor() {
    super('Validator', SYSTEM_PROMPT);
  }

  /**
   * Validate selected idea
   */
  async validate(sessionId, onChunk = null) {
    try {
      // Get selected idea and pain point from memory
      const selectedIdea = await this.getMemory(sessionId, 'SelectedIdea');
      const userPain = await this.getMemory(sessionId, 'USER_PAIN');

      if (!selectedIdea?.idea) {
        throw new Error('No idea selected. Please select an idea first.');
      }

      const messages = [
        {
          role: 'user',
          content: `Idea: ${selectedIdea.idea}\nPain point: ${userPain?.description || 'Not specified'}\n\nPlease validate this idea across all dimensions and provide detailed analysis.`
        }
      ];

      // Stream response if callback provided
      if (onChunk) {
        const response = await this.stream(messages, onChunk);

        // Parse and store validation results
        await this.storeValidationResults(sessionId, response, selectedIdea.id);

        return response;
      }

      const response = await this.send(messages);
      await this.storeValidationResults(sessionId, response, selectedIdea.id);

      return response;
    } catch (error) {
      throw new Error(`Validator error: ${error.message}`);
    }
  }

  /**
   * Chat method for handling follow-up conversation
   */
  async chat(sessionId, userMessage, onChunk = null) {
    try {
      // Get conversation history
      const historyResult = await conversationQueries.getHistory(sessionId, 20);
      const conversationHistory = historyResult.success ? historyResult.messages : [];
      
      // Get context from memory
      const selectedIdea = await this.getMemory(sessionId, 'SelectedIdea');
      const userPain = await this.getMemory(sessionId, 'USER_PAIN');

      // Build messages with history
      const messages = [];
      
      // Add context
      messages.push({
        role: 'system',
        content: `Context: User's idea: "${selectedIdea?.idea || 'unknown'}". Pain point: "${userPain?.description || 'unknown'}"`
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

      // Stream response
      if (onChunk) {
        return await this.stream(messages, onChunk);
      }
      return await this.send(messages);
    } catch (error) {
      throw new Error(`Validator chat error: ${error.message}`);
    }
  }

  /**
   * Store validation results in memory
   */
  async storeValidationResults(sessionId, response, ideaId) {
    try {
      // Extract scores from response (simple pattern matching)
      const feasibilityMatch = response.match(/feasibility.*?(\d+)/i);
      const demandMatch = response.match(/demand.*?(\d+)/i);
      const competitionMatch = response.match(/competition.*?(\d+)/i);

      const validationData = {
        id: ideaId,
        feasibility: feasibilityMatch ? parseInt(feasibilityMatch[1]) : 5,
        demand: demandMatch ? parseInt(demandMatch[1]) : 5,
        competition: competitionMatch ? parseInt(competitionMatch[1]) : 5,
        validated: true,
        notes: response.substring(0, 500)
      };

      await this.setMemory(sessionId, 'Validator', validationData);
    } catch (error) {
      // Non-critical error, log and continue
      console.error('Error storing validation results:', error);
    }
  }
}

export default ValidatorAgent;
