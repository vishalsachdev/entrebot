/**
 * Builder Agent
 * Helps users create PRDs, landing pages, and MVPs
 */

import { BaseAgent } from './base.js';
import { conversationQueries } from '../database/queries.js';

const SYSTEM_PROMPT = `You are VentureBot's Builder agent - a practical product coach who helps turn validated ideas into real products.

IMPORTANT RULES:
- Never use markdown formatting (no asterisks, no bold, no bullets)
- Be specific and actionable - give actual content, not just advice
- Focus on what can be built THIS WEEK

YOUR CAPABILITIES:

1. PRD (Product Requirements Document)
When asked to create a PRD, generate a complete document with:
- Problem Statement (from their pain point)
- Target User (be specific: demographics, behaviors)
- Core Features (prioritized: must-have vs nice-to-have)
- User Stories (3-5 key ones in "As a user, I want..." format)
- Success Metrics (how to measure if it's working)
- MVP Scope (what to build first in 1-2 weeks)
- Tech Stack Recommendation (for solo founder using AI tools)

2. LANDING PAGE
When asked to help with a landing page:
- Write actual headline and subheadline copy
- Suggest 3-4 key benefit bullets
- Write the CTA button text
- Recommend a simple tool (Carrd, Framer, or just HTML)
- Offer to generate the actual HTML/code if they want

3. MVP PLANNING
When asked about building the MVP:
- Break it into 3-4 buildable chunks
- Suggest specific AI tools for each (Cursor, Bolt.new, Replit, v0.dev)
- Estimate time for each chunk
- Identify what to skip for v1

4. CUSTOMER INTERVIEW SCRIPT
When asked about customer discovery:
- Provide 5-7 specific questions to ask
- Explain what to listen for
- Suggest where to find people to interview

CONVERSATION STYLE:
- Ask clarifying questions if needed, but don't over-ask
- Provide actual deliverables, not just guidance
- If they say "help me with X", DO X, don't just explain how

CONTEXT: You have access to their validated idea and pain point. Reference these specifically.`;

export class BuilderAgent extends BaseAgent {
  constructor() {
    super('Builder', SYSTEM_PROMPT);
  }

  /**
   * Chat with builder context
   */
  async chat(sessionId, userMessage, onChunk = null) {
    try {
      // Get context from memory
      const selectedIdea = await this.getMemory(sessionId, 'SelectedIdea');
      const userPain = await this.getMemory(sessionId, 'USER_PAIN');
      const userProfile = await this.getMemory(sessionId, 'USER_PROFILE');
      const validation = await this.getMemory(sessionId, 'Validator');

      // Get conversation history
      const historyResult = await conversationQueries.getHistory(sessionId, 20);
      const conversationHistory = historyResult.success ? historyResult.messages : [];

      // Build messages
      const messages = [];

      // Add context
      let context = 'CONTEXT:\n';
      if (userProfile?.name) {
        context += `User: ${userProfile.name}\n`;
      }
      if (userPain?.description) {
        context += `Pain Point: ${userPain.description}\n`;
      }
      if (selectedIdea?.idea) {
        context += `Selected Idea: ${selectedIdea.idea}\n`;
      }
      if (validation?.validated) {
        context += `Validation Scores: Feasibility ${validation.feasibility}/10, Market ${validation.marketDemand}/10\n`;
      }

      messages.push({
        role: 'system',
        content: context
      });

      // Add recent history
      const recentHistory = conversationHistory.slice(-10);
      for (const msg of recentHistory) {
        if (msg.role === 'user' || msg.role === 'assistant') {
          messages.push({ role: msg.role, content: msg.content });
        }
      }

      // Add current message
      const lastMsg = recentHistory[recentHistory.length - 1];
      if (!lastMsg || lastMsg.role !== 'user' || lastMsg.content !== userMessage) {
        messages.push({ role: 'user', content: userMessage });
      }

      if (onChunk) {
        return await this.stream(messages, onChunk);
      }

      return await this.send(messages);
    } catch (error) {
      throw new Error(`Builder agent error: ${error.message}`);
    }
  }

  /**
   * Generate a PRD
   */
  async generatePRD(sessionId, onChunk = null) {
    const selectedIdea = await this.getMemory(sessionId, 'SelectedIdea');
    const userPain = await this.getMemory(sessionId, 'USER_PAIN');
    const userProfile = await this.getMemory(sessionId, 'USER_PROFILE');

    if (!selectedIdea?.idea) {
      throw new Error('No idea selected. Please select and validate an idea first.');
    }

    const messages = [
      {
        role: 'user',
        content: `Create a complete PRD for this idea:

Idea: ${selectedIdea.idea}
Pain Point: ${userPain?.description || 'Not specified'}
User: ${userProfile?.name || 'Founder'}

Generate a full Product Requirements Document that I can use to start building.`
      }
    ];

    if (onChunk) {
      return await this.stream(messages, onChunk);
    }

    return await this.send(messages);
  }

  /**
   * Generate landing page content
   */
  async generateLandingPage(sessionId, onChunk = null) {
    const selectedIdea = await this.getMemory(sessionId, 'SelectedIdea');
    const userPain = await this.getMemory(sessionId, 'USER_PAIN');

    if (!selectedIdea?.idea) {
      throw new Error('No idea selected. Please select and validate an idea first.');
    }

    const messages = [
      {
        role: 'user',
        content: `Create landing page content for:

Idea: ${selectedIdea.idea}
Pain Point: ${userPain?.description || 'Not specified'}

Provide:
1. Headline (compelling, under 10 words)
2. Subheadline (explains the value, under 20 words)
3. 3-4 benefit bullets
4. CTA button text
5. Simple HTML code I can use with Tailwind CSS`
      }
    ];

    if (onChunk) {
      return await this.stream(messages, onChunk);
    }

    return await this.send(messages);
  }
}

export default BuilderAgent;
