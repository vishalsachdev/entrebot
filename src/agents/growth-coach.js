/**
 * Growth Coach Agent
 * Helps users improve traction after launch.
 */

import { BaseAgent } from './base.js';
import { conversationQueries } from '../database/queries.js';

const SYSTEM_PROMPT = `You are VentureBot's Growth Coach.

ROLE:
Help early founders grow after launch using feedback loops, simple KPIs, and focused experiments.

IMPORTANT RULES:
- Never use markdown formatting (no asterisks, no bold, no bullets)
- Keep recommendations realistic for a solo founder
- Prefer one clear growth loop over many scattered tactics
- Tie every action to a measurable metric

WHEN CREATING A GROWTH PLAN, INCLUDE:
1) Current stage diagnosis
2) 30-day growth objective
3) Weekly experiment plan
4) KPI dashboard with targets
5) Feedback collection plan
6) Product iteration priorities
7) Founder operating cadence

COACHING STYLE:
- Encouraging but direct
- Specific next actions
- No fluff`;

export class GrowthCoachAgent extends BaseAgent {
  constructor() {
    super('GrowthCoach', SYSTEM_PROMPT);
  }

  async chat(sessionId, userMessage, onChunk = null) {
    try {
      const [selectedIdea, validation, launchPlan, launchState] = await Promise.all([
        this.getMemory(sessionId, 'SelectedIdea'),
        this.getMemory(sessionId, 'Validator'),
        this.getMemory(sessionId, 'LAUNCH_PLAN'),
        this.getMemory(sessionId, 'Launch')
      ]);

      const historyResult = await conversationQueries.getHistory(sessionId, 20);
      const conversationHistory = historyResult.success ? historyResult.messages : [];

      const messages = [
        {
          role: 'system',
          content: `Context:
Idea: ${selectedIdea?.idea || 'Not selected'}
Validation score: ${validation?.overallScore || 'n/a'}
Launch plan exists: ${launchPlan?.content ? 'yes' : 'no'}
Launch complete: ${launchState?.complete ? 'yes' : 'no'}`
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
      throw new Error(`Growth coach agent error: ${error.message}`);
    }
  }

  async generateGrowthPlan(sessionId, onChunk = null) {
    const [selectedIdea, validation, launchPlan, launchState] = await Promise.all([
      this.getMemory(sessionId, 'SelectedIdea'),
      this.getMemory(sessionId, 'Validator'),
      this.getMemory(sessionId, 'LAUNCH_PLAN'),
      this.getMemory(sessionId, 'Launch')
    ]);

    if (!selectedIdea?.idea) {
      throw new Error('No idea selected. Please select and validate an idea first.');
    }

    const messages = [
      {
        role: 'user',
        content: `Create a practical 30-day post-launch growth plan for:

Idea: ${selectedIdea.idea}
${validation?.overallScore ? `Validation Score: ${validation.overallScore}/10` : ''}
Launch complete: ${launchState?.complete ? 'yes' : 'no'}
${launchPlan?.content ? `Launch plan excerpt: ${launchPlan.content.substring(0, 600)}` : 'Launch plan not available'}

Output format:
Stage Diagnosis:
[Current likely bottleneck]

30-Day Growth Objective:
[One measurable objective]

Weekly Experiments:
Week 1:
Week 2:
Week 3:
Week 4:

KPI Dashboard:
Activation:
Retention:
Referral:
Revenue:

Feedback Loop:
[How to collect and process user feedback every week]

Iteration Priorities:
Priority 1:
Priority 2:
Priority 3:

Founder Weekly Cadence:
[Simple recurring schedule for building, learning, and outreach]

Stop Doing:
[Two low-value activities to avoid]`
      }
    ];

    let content = '';
    if (onChunk) {
      const result = await this.stream(messages, chunk => {
        content += chunk;
        onChunk(chunk);
      });
      await this.persistGrowthPlan(sessionId, content);
      return result;
    }

    const result = await this.send(messages);
    await this.persistGrowthPlan(sessionId, result);
    return result;
  }

  async persistGrowthPlan(sessionId, content) {
    try {
      await this.setMemory(sessionId, 'GROWTH_PLAN', {
        content,
        createdAt: new Date().toISOString(),
        version: 1
      });

      const existingMilestones = (await this.getMemory(sessionId, 'MILESTONES')) || { list: [] };
      if (!existingMilestones.list.includes('first_feedback')) {
        existingMilestones.list.push('first_feedback');
        existingMilestones.first_feedback = new Date().toISOString();
        await this.setMemory(sessionId, 'MILESTONES', existingMilestones);
      }
    } catch (error) {
      console.error('Failed to persist growth plan:', error);
    }
  }
}

export default GrowthCoachAgent;
