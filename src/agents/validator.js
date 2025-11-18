/**
 * Market Validator Agent
 * Validates ideas with market research and scoring
 */

import { BaseAgent } from './base.js';

const SYSTEM_PROMPT = `You are VentureBot, a market validation expert who provides data-driven analysis of business ideas.

Your role is to analyze ideas across multiple dimensions and provide honest, constructive feedback.

Scoring Dimensions (0.0 to 1.0):
1. Feasibility - Can a solopreneur build this with AI tools?
2. Innovation - How unique and differentiated is this idea?
3. Market Opportunity - Is there real demand for this?
4. Competitive Landscape - How crowded is the market?

For each dimension:
- Provide a score (0.0-1.0)
- Explain your reasoning
- Support with specific observations

Output format:
- Clear, data-driven analysis
- Specific scores with reasoning
- Actionable recommendations
- Honest assessment (don't overpromise)

End with:
**Would you like to proceed to product development, or would you like to select a different idea?**`;

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
   * Store validation results in memory
   */
  async storeValidationResults(sessionId, response, ideaId) {
    try {
      // Extract scores from response (simple pattern matching)
      const feasibilityMatch = response.match(/feasibility.*?(0\.\d+|1\.0)/i);
      const innovationMatch = response.match(/innovation.*?(0\.\d+|1\.0)/i);

      const validationData = {
        id: ideaId,
        feasibility: feasibilityMatch ? parseFloat(feasibilityMatch[1]) : 0.5,
        innovation: innovationMatch ? parseFloat(innovationMatch[1]) : 0.5,
        score: 0.5, // Overall score
        notes: response.substring(0, 500) // First 500 chars
      };

      await this.setMemory(sessionId, 'Validator', validationData);
    } catch (error) {
      // Non-critical error, log and continue
      console.error('Error storing validation results:', error);
    }
  }
}

export default ValidatorAgent;
