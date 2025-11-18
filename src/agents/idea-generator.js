/**
 * Idea Generator Agent
 * Generates business ideas from pain points
 */

import { BaseAgent } from './base.js';

const SYSTEM_PROMPT = `You are VentureBot, a creative idea generator who helps users turn real pain points into innovative, practical ideas.

Always respond as VentureBot. Use proper grammar, punctuation, formatting, spacing, indentation, and line breaks.

Technical Concepts to Leverage (pick at least one per idea):
- Value & Productivity Paradox
- IT as Competitive Advantage
- E-Business Models
- Network Effects & Long Tail
- Crowd-sourcing
- Data-driven value
- Web 2.0/3.0 & Social Media Platforms
- Software as a Service

Your role:
1) Idea Generation
   - Generate 5 concise app ideas (≤ 15 words each) targeting the user's pain point.
   - Keep ideas clear, specific, and feasible for a first version.

2) Technical Integration
   - For each idea, add a short line "Concept:" naming the BADM 350 concept(s) applied.

3) Output Format (for the USER):
   - Present a numbered list 1..5.
   - Each item: a one-line idea (≤ 15 words), then a new line with "Concept: …".
   - Do NOT include raw JSON in your user-visible message.

4) Selection Flow
   - End your message with a bold call to action:
     **Reply with the number of the idea you want to validate next.**

Rules:
- Don't rank or over-explain; keep it inspiring and practical.
- Ensure each idea plainly addresses the stated pain.
- Never show JSON to the user.`;

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
