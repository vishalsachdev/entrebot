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

PRIORITIZATION FRAMEWORK:
When creating PRD or MVP plan, ALWAYS ask yourself:
"If they could only ship ONE feature this week, which would prove the idea fastest?"

Focus on the "riskiest assumption test" from validation - build to test that first.
The goal is NOT a complete product. The goal is LEARNING whether this solves a real problem.

YOUR CAPABILITIES:

1. PRD (Product Requirements Document)
When asked to create a PRD, use this scope-limited template for solopreneurs:

[Product Name] - MVP PRD

Problem Statement: [1 sentence from their pain point]

Target User: [1 sentence - who exactly, be specific]

Core Feature (Week 1): [The ONE thing that tests the riskiest assumption]

User Flow:
1. [Step 1 - how they discover/access]
2. [Step 2 - the core action]
3. [Step 3 - the outcome/value]

Success Metric: [How they'll know if it's working - be specific, measurable]

NOT Building (Yet):
- [Feature to defer - explain briefly why]
- [Feature to defer]
- [Feature to defer]

Tech Stack: [Specific recommendation based on their skills]

2. LANDING PAGE
When asked to help with a landing page:
- Write actual headline and subheadline copy
- Suggest 3-4 key benefit bullets
- Write the CTA button text
- Recommend specific tool based on need

3. MVP PLANNING
When asked about building the MVP:
- Identify the ONE core feature to build first
- Break into 2-3 day chunks maximum
- Suggest specific tools from the list below
- Estimate time realistically (2-4 hours per chunk for AI-assisted builds)
- Be explicit about what NOT to build yet

4. CUSTOMER INTERVIEW SCRIPT
When asked about customer discovery:
- Provide 5-7 specific questions to ask
- Explain what to listen for
- Suggest where to find people to interview

TOOL RECOMMENDATIONS (2025):

LANDING PAGE:
- Framer: Best for design-focused pages, drag-and-drop, $0 to start
- Carrd: Fastest and cheapest ($19/year), perfect for simple waitlist pages
- v0.dev: Generate React components with AI, great if they know React

FULL APP (AI-ASSISTED):
- Bolt.new: Fastest for full-stack apps, deploys instantly, best for prototypes
- Lovable: Polished UI out of the box, good for customer-facing MVPs
- Cursor: Most customizable, best for devs who want control
- Replit: Good for learning, easy to share and collaborate

BACKEND:
- Supabase: Generous free tier, auth built-in, Postgres, best default choice
- Firebase: Good for mobile apps, real-time features
- PlanetScale: If they specifically need MySQL

PAYMENTS: Stripe (always - don't waste time on alternatives)
AUTH: Supabase Auth (if using Supabase) or Clerk (if not)

CONVERSATION STYLE:
- Ask clarifying questions if needed, but don't over-ask
- Provide actual deliverables, not just guidance
- If they say "help me with X", DO X, don't just explain how
- When recommending tools, explain WHY that specific tool fits their situation

CONTEXT: You have access to their validated idea, pain point, and validation scores. Reference these specifically when making recommendations.`;

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
   * Generate a PRD and persist to memory
   */
  async generatePRD(sessionId, onChunk = null) {
    const selectedIdea = await this.getMemory(sessionId, 'SelectedIdea');
    const userPain = await this.getMemory(sessionId, 'USER_PAIN');
    const userProfile = await this.getMemory(sessionId, 'USER_PROFILE');
    const validation = await this.getMemory(sessionId, 'Validator');

    if (!selectedIdea?.idea) {
      throw new Error('No idea selected. Please select and validate an idea first.');
    }

    // Get riskiest assumption from validation if available
    const riskiestAssumption =
      validation?.riskiestAssumption || 'whether users will pay for this solution';

    const messages = [
      {
        role: 'user',
        content: `Create a scope-limited MVP PRD for this idea:

Idea: ${selectedIdea.idea}
Pain Point: ${userPain?.description || 'Not specified'}
User: ${userProfile?.name || 'Founder'}
Riskiest Assumption: ${riskiestAssumption}
${validation ? `Validation Scores: Feasibility ${validation.feasibility}/10, Market ${validation.marketDemand}/10` : ''}

Remember: The goal is to test the riskiest assumption as fast as possible, not to build a complete product.

Use this exact template format:

[Product Name] - MVP PRD

Problem Statement: [1 sentence]

Target User: [1 sentence - be specific]

Core Feature (Week 1): [The ONE thing that tests the riskiest assumption: ${riskiestAssumption}]

User Flow:
1. [Discovery/access]
2. [Core action]
3. [Outcome/value]

Success Metric: [Specific, measurable - how they know it's working]

NOT Building (Yet):
- [Feature 1 to defer]
- [Feature 2 to defer]
- [Feature 3 to defer]

Tech Stack Recommendation: [Specific tools with reasons]`
      }
    ];

    let prdContent = '';

    if (onChunk) {
      // Collect content while streaming
      const result = await this.stream(messages, chunk => {
        prdContent += chunk;
        onChunk(chunk);
      });

      // Persist PRD to memory after generation
      await this.persistPRD(sessionId, prdContent);

      return result;
    }

    const result = await this.send(messages);
    prdContent = result;

    // Persist PRD to memory
    await this.persistPRD(sessionId, prdContent);

    return result;
  }

  /**
   * Persist PRD to memory and add milestone
   */
  async persistPRD(sessionId, prdContent) {
    try {
      await this.setMemory(sessionId, 'PRD', {
        content: prdContent,
        createdAt: new Date().toISOString(),
        version: 1
      });

      // Add milestone for PRD creation
      await this.addMilestone(sessionId, 'prd_created');
    } catch (error) {
      console.error('Failed to persist PRD:', error);
      // Don't throw - PRD generation succeeded, persistence is secondary
    }
  }

  /**
   * Add a milestone to the session
   */
  async addMilestone(sessionId, milestone) {
    try {
      const existingMilestones = (await this.getMemory(sessionId, 'MILESTONES')) || { list: [] };

      if (!existingMilestones.list.includes(milestone)) {
        existingMilestones.list.push(milestone);
        existingMilestones[milestone] = new Date().toISOString();

        await this.setMemory(sessionId, 'MILESTONES', existingMilestones);
      }
    } catch (error) {
      console.error('Failed to add milestone:', error);
    }
  }

  /**
   * Mark MVP as started
   */
  async markMVPStarted(sessionId) {
    await this.addMilestone(sessionId, 'mvp_started');

    // Store build start context
    await this.setMemory(sessionId, 'MVP_BUILD', {
      startedAt: new Date().toISOString(),
      status: 'in_progress'
    });
  }

  /**
   * Mark MVP as complete
   */
  async markMVPComplete(sessionId, details = {}) {
    await this.addMilestone(sessionId, 'mvp_complete');

    // Update build context
    const buildContext = (await this.getMemory(sessionId, 'MVP_BUILD')) || {};
    await this.setMemory(sessionId, 'MVP_BUILD', {
      ...buildContext,
      completedAt: new Date().toISOString(),
      status: 'complete',
      ...details
    });
  }

  /**
   * Generate landing page content and persist to memory
   */
  async generateLandingPage(sessionId, onChunk = null) {
    const selectedIdea = await this.getMemory(sessionId, 'SelectedIdea');
    const userPain = await this.getMemory(sessionId, 'USER_PAIN');
    const userProfile = await this.getMemory(sessionId, 'USER_PROFILE');

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
3. 3-4 benefit bullets (focus on outcomes, not features)
4. CTA button text
5. Tool recommendation: Carrd ($19/year, fastest) vs Framer (best design) vs v0.dev (if they want React)
6. Simple HTML code with Tailwind CSS they can paste into any tool

Make the copy speak directly to the pain point. No generic startup jargon.`
      }
    ];

    let landingPageContent = '';

    if (onChunk) {
      const result = await this.stream(messages, chunk => {
        landingPageContent += chunk;
        onChunk(chunk);
      });

      // Persist landing page to memory
      await this.persistLandingPage(sessionId, landingPageContent);

      return result;
    }

    const result = await this.send(messages);
    landingPageContent = result;

    // Persist landing page to memory
    await this.persistLandingPage(sessionId, landingPageContent);

    return result;
  }

  /**
   * Persist landing page content to memory
   */
  async persistLandingPage(sessionId, content) {
    try {
      await this.setMemory(sessionId, 'LANDING_PAGE', {
        content: content,
        createdAt: new Date().toISOString(),
        version: 1
      });

      await this.addMilestone(sessionId, 'landing_page_created');
    } catch (error) {
      console.error('Failed to persist landing page:', error);
    }
  }

  /**
   * Generate MVP build plan with specific tool recommendations
   */
  async generateMVPPlan(sessionId, onChunk = null) {
    const selectedIdea = await this.getMemory(sessionId, 'SelectedIdea');
    const userPain = await this.getMemory(sessionId, 'USER_PAIN');
    const userProfile = await this.getMemory(sessionId, 'USER_PROFILE');
    const prd = await this.getMemory(sessionId, 'PRD');
    const validation = await this.getMemory(sessionId, 'Validator');

    if (!selectedIdea?.idea) {
      throw new Error('No idea selected. Please select and validate an idea first.');
    }

    const techBackground = userProfile?.technicalLevel || 'unknown';

    const messages = [
      {
        role: 'user',
        content: `Create a specific MVP build plan for:

Idea: ${selectedIdea.idea}
Pain Point: ${userPain?.description || 'Not specified'}
Technical Level: ${techBackground}
${prd ? `PRD Core Feature: ${prd.content?.substring(0, 500)}...` : ''}
${validation ? `Riskiest Assumption: ${validation.riskiestAssumption || 'whether users will pay'}` : ''}

Create a concrete build plan with these sections:

WEEK 1 GOAL: [The ONE thing to ship]

DAY-BY-DAY BREAKDOWN:
Day 1-2: [Specific task with tool recommendation]
Day 3-4: [Specific task with tool recommendation]
Day 5-7: [Specific task with tool recommendation]

RECOMMENDED STACK:
- Frontend: [Tool + why it fits their level]
- Backend: [Tool + why, or "None needed for MVP"]
- Database: [Tool + why, or "Use Supabase - generous free tier"]
- Auth: [Supabase Auth or Clerk - explain which]
- Payments: [Stripe if needed, or "Add later"]

WHAT TO SKIP (For Now):
- [Feature that feels important but isn't for validation]
- [Feature that can be manual initially]
- [Feature that's "nice to have"]

VALIDATION CHECKPOINT:
After Day 7, check: [Specific metric or signal to look for]

Based on their technical level (${techBackground}), be specific about which AI coding tools to use:
- Non-technical: Bolt.new or Lovable (they handle everything)
- Some coding: Cursor with Claude
- Developer: Cursor or direct code`
      }
    ];

    let mvpPlanContent = '';

    if (onChunk) {
      const result = await this.stream(messages, chunk => {
        mvpPlanContent += chunk;
        onChunk(chunk);
      });

      await this.persistMVPPlan(sessionId, mvpPlanContent);
      return result;
    }

    const result = await this.send(messages);
    mvpPlanContent = result;

    await this.persistMVPPlan(sessionId, mvpPlanContent);
    return result;
  }

  /**
   * Persist MVP plan to memory
   */
  async persistMVPPlan(sessionId, content) {
    try {
      await this.setMemory(sessionId, 'MVP_PLAN', {
        content: content,
        createdAt: new Date().toISOString(),
        version: 1
      });

      await this.addMilestone(sessionId, 'mvp_plan_created');
    } catch (error) {
      console.error('Failed to persist MVP plan:', error);
    }
  }

  /**
   * Get all builder artifacts for a session
   */
  async getArtifacts(sessionId) {
    const prd = await this.getMemory(sessionId, 'PRD');
    const landingPage = await this.getMemory(sessionId, 'LANDING_PAGE');
    const mvpPlan = await this.getMemory(sessionId, 'MVP_PLAN');
    const mvpBuild = await this.getMemory(sessionId, 'MVP_BUILD');
    const milestones = await this.getMemory(sessionId, 'MILESTONES');

    return {
      prd,
      landingPage,
      mvpPlan,
      mvpBuild,
      milestones: milestones?.list || []
    };
  }
}

export default BuilderAgent;
