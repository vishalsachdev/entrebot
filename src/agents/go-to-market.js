/**
 * Go-to-Market Agent
 * Helps users prepare and execute launch plans.
 */

import { BaseAgent } from './base.js';
import { conversationQueries } from '../database/queries.js';

const SYSTEM_PROMPT = `You are VentureBot's Go-to-Market agent.

ROLE:
Help founders launch fast with clear messaging, focused channels, and practical execution plans.

IMPORTANT RULES:
- Never use markdown formatting (no asterisks, no bold, no bullets)
- Give concrete outputs they can use immediately
- Focus on this week, not a long theoretical plan
- Keep channel strategy narrow and realistic for a solo founder

WHEN CREATING A LAUNCH PLAN, INCLUDE:
1) Positioning statement
2) Ideal first customer profile
3) Primary launch channel and one backup channel
4) 14-day launch checklist
5) Launch announcement copy
6) 3 social post drafts
7) Simple KPI plan (traffic, signups, activation, feedback)

COACHING STYLE:
- Practical and direct
- Ask one sharp clarification question only when needed
- Favor action over perfection`;

export class GoToMarketAgent extends BaseAgent {
  constructor() {
    super('GoToMarket', SYSTEM_PROMPT);
  }

  async chat(sessionId, userMessage, onChunk = null) {
    try {
      const [selectedIdea, userPain, userProfile, prd, validation] = await Promise.all([
        this.getMemory(sessionId, 'SelectedIdea'),
        this.getMemory(sessionId, 'USER_PAIN'),
        this.getMemory(sessionId, 'USER_PROFILE'),
        this.getMemory(sessionId, 'PRD'),
        this.getMemory(sessionId, 'Validator')
      ]);

      const historyResult = await conversationQueries.getHistory(sessionId, 20);
      const conversationHistory = historyResult.success ? historyResult.messages : [];

      const messages = [
        {
          role: 'system',
          content: `Context:
Founder: ${userProfile?.name || 'Founder'}
Pain Point: ${userPain?.description || 'Not specified'}
Idea: ${selectedIdea?.idea || 'Not selected'}
Validation: ${validation?.overallScore ? `${validation.overallScore}/10 overall` : 'Not available'}
PRD available: ${prd?.content ? 'yes' : 'no'}`
        }
      ];

      const recentHistory = conversationHistory.slice(-10);
      for (const msg of recentHistory) {
        if (msg.role === 'user' || msg.role === 'assistant') {
          messages.push({ role: msg.role, content: msg.content });
        }
      }

      const lastMsg = recentHistory[recentHistory.length - 1];
      if (!lastMsg || lastMsg.role !== 'user' || lastMsg.content !== userMessage) {
        messages.push({ role: 'user', content: userMessage });
      }

      if (onChunk) {
        return await this.stream(messages, onChunk);
      }
      return await this.send(messages);
    } catch (error) {
      throw new Error(`Go-to-market agent error: ${error.message}`);
    }
  }

  async generateLaunchPlan(sessionId, onChunk = null) {
    const [selectedIdea, userPain, userProfile, prd, validation] = await Promise.all([
      this.getMemory(sessionId, 'SelectedIdea'),
      this.getMemory(sessionId, 'USER_PAIN'),
      this.getMemory(sessionId, 'USER_PROFILE'),
      this.getMemory(sessionId, 'PRD'),
      this.getMemory(sessionId, 'Validator')
    ]);

    if (!selectedIdea?.idea) {
      throw new Error('No idea selected. Please select and validate an idea first.');
    }

    const messages = [
      {
        role: 'user',
        content: `Create a concrete 14-day launch plan for:

Idea: ${selectedIdea.idea}
Pain Point: ${userPain?.description || 'Not specified'}
Founder: ${userProfile?.name || 'Founder'}
${validation?.overallScore ? `Validation Score: ${validation.overallScore}/10` : ''}
${prd?.content ? `PRD excerpt: ${prd.content.substring(0, 600)}` : 'PRD not available'}

Output format:
Positioning Statement:
[One sentence]

Ideal First Customer:
[Specific persona and use case]

Primary Channel:
[One channel and why]

Backup Channel:
[One backup channel]

14-Day Launch Checklist:
Day 1-3: ...
Day 4-7: ...
Day 8-10: ...
Day 11-14: ...

Launch Announcement Copy:
[One announcement paragraph]

3 Social Posts:
Post 1:
Post 2:
Post 3:

KPIs to Track (Week 1):
Traffic:
Signups:
Activation:
User Feedback:

Risk to Watch:
[Single biggest launch risk and mitigation]`
      }
    ];

    let content = '';
    if (onChunk) {
      const result = await this.stream(messages, chunk => {
        content += chunk;
        onChunk(chunk);
      });
      await this.persistLaunchPlan(sessionId, content);
      return result;
    }

    const result = await this.send(messages);
    await this.persistLaunchPlan(sessionId, result);
    return result;
  }

  async persistLaunchPlan(sessionId, content) {
    try {
      await this.setMemory(sessionId, 'LAUNCH_PLAN', {
        content,
        createdAt: new Date().toISOString(),
        version: 1
      });

      const existingMilestones = (await this.getMemory(sessionId, 'MILESTONES')) || { list: [] };
      if (!existingMilestones.list.includes('launch_plan_created')) {
        existingMilestones.list.push('launch_plan_created');
        existingMilestones.launch_plan_created = new Date().toISOString();
        await this.setMemory(sessionId, 'MILESTONES', existingMilestones);
      }
    } catch (error) {
      console.error('Failed to persist launch plan:', error);
    }
  }

  async markLaunched(sessionId) {
    const existing = (await this.getMemory(sessionId, 'Launch')) || {};
    await this.setMemory(sessionId, 'Launch', {
      ...existing,
      complete: true,
      launchedAt: new Date().toISOString()
    });

    const existingMilestones = (await this.getMemory(sessionId, 'MILESTONES')) || { list: [] };
    if (!existingMilestones.list.includes('launched')) {
      existingMilestones.list.push('launched');
      existingMilestones.launched = new Date().toISOString();
      await this.setMemory(sessionId, 'MILESTONES', existingMilestones);
    }
  }
}

export default GoToMarketAgent;
