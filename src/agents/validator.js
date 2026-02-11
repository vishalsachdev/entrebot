/**
 * Market Validator Agent
 * Validates ideas with market research and scoring
 */

import { BaseAgent } from './base.js';
import { conversationQueries } from '../database/queries.js';
import { performMarketResearch } from '../services/market-research.js';

const SYSTEM_PROMPT = `You are VentureBot, a market validation expert who gives honest, actionable feedback.

IMPORTANT RULES:
- Never use markdown formatting (no asterisks, no bold, no bullets)
- Be honest - if an idea is weak, say so constructively
- Focus on ACTIONABLE insights, not just scores
- Never make up competitor names - be honest about what you know vs don't know

CALIBRATED SCORING SCALES (use these exact criteria):

FEASIBILITY (X/10):
- 10: Build in a weekend with existing tools
- 7-9: Build in 2-4 weeks with AI tools, minor learning curve
- 4-6: Requires significant new skills or integrations
- 1-3: Needs a team, funding, or rare expertise

MARKET DEMAND (X/10):
- 10: Proven demand (existing solutions have paying customers)
- 7-9: Strong signals (forum complaints, workarounds in use)
- 4-6: Moderate interest (some search volume, few solutions)
- 1-3: Speculative (no evidence of demand yet)

COMPETITION (X/10) - Higher is BETTER (less competition):
- 10: Blue ocean, no direct competitors
- 7-9: Few competitors, clear gaps to exploit
- 4-6: Crowded but differentiation possible
- 1-3: Dominated by well-funded players

DIFFERENTIATION (X/10):
- 10: Unique angle no one has tried
- 7-9: Clear advantages over existing solutions
- 4-6: Incremental improvements only
- 1-3: Me-too product

WHEN VALIDATING AN IDEA, structure your response:

1. FEASIBILITY: [score]/10
   Brief explanation of what's needed to build this.

2. MARKET DEMAND: [score]/10
   Who would pay and evidence of demand.

3. COMPETITION: [score]/10
   IMPORTANT: Only name competitors you actually know exist with real pricing.
   If you're unsure, say: "I'd need to research this - search for [specific query] to find competitors."

4. DIFFERENTIATION: [score]/10
   What makes this different from alternatives.

ASSUMPTION SURFACING (always include):

Your riskiest assumption: [The one thing that must be true for this to work]

48-hour validation test: [A specific, concrete test they can run this week]

Success criteria: [What result means proceed vs pivot]

DECISION FRAMEWORK (end with clear options):

Based on this analysis:
A) Proceed - [if scores support it, explain positioning]
B) Pivot - Consider targeting [specific niche] instead because [reason]
C) Explore different idea - This market may be too [crowded/speculative/difficult]

What's your gut telling you?

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
        // Return a helpful guidance message instead of throwing an error
        const guidanceMessage = `I'd love to help validate your business idea, but I don't see one selected yet.

Here's how to get started:

1. First, chat with the Onboarding agent to share what problems frustrate you
2. Then, the Idea Generator will help brainstorm potential business ideas
3. Once you select an idea you like, come back here and I'll give you a thorough market validation

Would you like to start with the Onboarding agent to discover your pain points? Or if you've already generated ideas, head to the Idea Generator to select one.`;

        // Stream or return the guidance message
        if (onChunk) {
          onChunk(guidanceMessage);
          return guidanceMessage;
        }
        return guidanceMessage;
      }

      const researchQuery = `${selectedIdea.idea} ${userPain?.description || ''} market size competitors pricing`;
      const research = await performMarketResearch(researchQuery);
      const hasResearch = research.success && research.findings.length > 0;
      let evidenceContext =
        'No external research data was available. Clearly state uncertainty and avoid fabricated claims.';
      if (hasResearch) {
        evidenceContext = research.findings
          .map(
            (item, index) =>
              `${index + 1}. ${item.title}\nURL: ${item.url}\nSnippet: ${item.snippet}`
          )
          .join('\n\n');
      }

      const messages = [
        {
          role: 'system',
          content: `External market research context:
${evidenceContext}

Citation rule:
- When external sources are provided, cite specific URLs inline as: [Source: https://...]
- Do not invent citations.
- If evidence is missing for a claim, explicitly say so.`
        },
        {
          role: 'user',
          content: `Idea: ${selectedIdea.idea}
Pain point: ${userPain?.description || 'Not specified'}

Please validate this idea across all dimensions and provide detailed analysis.
${hasResearch ? 'Use the external evidence above and include citations.' : 'Use best-effort reasoning and note where evidence is unavailable.'}`
        }
      ];

      // Stream response if callback provided
      if (onChunk) {
        const response = await this.stream(messages, onChunk);

        // Parse and store validation results
        await this.storeValidationResults(sessionId, response, selectedIdea.id, research);

        return response;
      }

      const response = await this.send(messages);
      await this.storeValidationResults(sessionId, response, selectedIdea.id, research);

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
   * Extract score from response using multiple patterns
   * @param {string} response - The LLM response text
   * @param {string} dimension - The dimension name to search for
   * @returns {number|null} - Extracted score or null if not found
   */
  extractScore(response, dimension) {
    // Pattern 1: "DIMENSION: X/10" or "DIMENSION: X /10"
    const pattern1 = new RegExp(`${dimension}[:\\s]+?(\\d+)\\s*/\\s*10`, 'i');
    // Pattern 2: "DIMENSION (X/10)"
    const pattern2 = new RegExp(`${dimension}\\s*\\(?\\s*(\\d+)\\s*/\\s*10\\s*\\)?`, 'i');
    // Pattern 3: "DIMENSION ... X/10" within same line
    const pattern3 = new RegExp(`${dimension}[^\\n]*?(\\d+)\\s*/\\s*10`, 'i');
    // Pattern 4: Just "DIMENSION...number" as fallback
    const pattern4 = new RegExp(`${dimension}[^\\d]*(\\d+)`, 'i');

    for (const pattern of [pattern1, pattern2, pattern3, pattern4]) {
      const match = response.match(pattern);
      if (match) {
        const score = parseInt(match[1], 10);
        // Validate score is in valid range (1-10)
        if (score >= 1 && score <= 10) {
          return score;
        }
      }
    }
    return null;
  }

  /**
   * Extract riskiest assumption from response
   * @param {string} response - The LLM response text
   * @returns {string|null} - Extracted assumption or null
   */
  extractRiskiestAssumption(response) {
    // Match "riskiest assumption:" followed by content until next section
    const pattern = /riskiest assumption[:\s]+([^\n]+(?:\n(?![A-Z0-9]|\d+[\-\.\)]).+)*)/i;
    const match = response.match(pattern);
    if (match) {
      return match[1].trim().substring(0, 500);
    }
    return null;
  }

  /**
   * Extract validation test from response
   * @param {string} response - The LLM response text
   * @returns {string|null} - Extracted test or null
   */
  extractValidationTest(response) {
    // Match "48-hour validation test:" or "48-hour test:" or "validation test:"
    const pattern =
      /(?:48[- ]hour\s+)?validation\s+test[:\s]+([^\n]+(?:\n(?![A-Z0-9]|\d+[\-\.\)]).+)*)/i;
    const match = response.match(pattern);
    if (match) {
      return match[1].trim().substring(0, 500);
    }
    return null;
  }

  /**
   * Store validation results in memory
   */
  async storeValidationResults(sessionId, response, ideaId, research = null) {
    try {
      // Extract scores using robust multi-pattern matching
      const feasibility = this.extractScore(response, 'feasibility');
      const marketDemand =
        this.extractScore(response, 'market\\s*demand') || this.extractScore(response, 'demand');
      const competition = this.extractScore(response, 'competition');
      const differentiation = this.extractScore(response, 'differentiation');

      // Extract assumption and test
      const riskiestAssumption = this.extractRiskiestAssumption(response);
      const validationTest = this.extractValidationTest(response);

      // Calculate overall score (weighted average)
      const scores = [feasibility, marketDemand, competition, differentiation].filter(
        s => s !== null
      );
      const overallScore =
        scores.length > 0
          ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
          : null;

      const validationData = {
        id: ideaId,
        feasibility: feasibility,
        marketDemand: marketDemand,
        competition: competition,
        differentiation: differentiation,
        overallScore: overallScore,
        riskiestAssumption: riskiestAssumption,
        validationTest: validationTest,
        validated: true,
        scoresExtracted: scores.length,
        notes: response.substring(0, 1000),
        citations: research?.citations || [],
        researchFindings: research?.findings || [],
        researchProvider: research?.provider || 'none'
      };

      await this.setMemory(sessionId, 'Validator', validationData);
    } catch (error) {
      // Non-critical error, log and continue
      console.error('Error storing validation results:', error);
    }
  }
}

export default ValidatorAgent;
