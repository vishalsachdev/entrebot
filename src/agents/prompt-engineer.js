/**
 * Prompt Engineer Agent
 * Generates tool-specific implementation prompts for AI builders.
 */

import { BaseAgent } from './base.js';
import { conversationQueries } from '../database/queries.js';

const SYSTEM_PROMPT = `You are VentureBot's Prompt Engineer.

ROLE:
Convert product requirements into high-quality prompts for AI coding tools.

IMPORTANT RULES:
- Never use markdown formatting (no asterisks, no bold, no bullets)
- Deliver copy-paste-ready prompts
- Be explicit about stack, scope, and acceptance criteria
- Keep prompts focused on an MVP and one build step at a time

SUPPORTED TOOLS:
- Bolt.new
- Cursor
- v0.dev
- Lovable
- Replit

WHEN GENERATING PROMPTS:
1) Give one "master prompt" for the selected tool
2) Give 3 incremental follow-up prompts (iteration prompts)
3) Include constraints to avoid overbuilding
4) Include a simple definition of done`;

export class PromptEngineerAgent extends BaseAgent {
  constructor() {
    super('PromptEngineer', SYSTEM_PROMPT);
  }

  async chat(sessionId, userMessage, onChunk = null) {
    try {
      const [selectedIdea, userPain, prd, validation] = await Promise.all([
        this.getMemory(sessionId, 'SelectedIdea'),
        this.getMemory(sessionId, 'USER_PAIN'),
        this.getMemory(sessionId, 'PRD'),
        this.getMemory(sessionId, 'Validator')
      ]);

      const historyResult = await conversationQueries.getHistory(sessionId, 20);
      const conversationHistory = historyResult.success ? historyResult.messages : [];

      const messages = [
        {
          role: 'system',
          content: `Context:
Idea: ${selectedIdea?.idea || 'Not selected'}
Pain Point: ${userPain?.description || 'Not specified'}
PRD exists: ${prd?.content ? 'yes' : 'no'}
Validation score: ${validation?.overallScore || 'n/a'}`
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
      throw new Error(`Prompt engineer agent error: ${error.message}`);
    }
  }

  async generateBuildPrompts(sessionId, onChunk = null) {
    const [selectedIdea, userPain, prd, validation, userProfile] = await Promise.all([
      this.getMemory(sessionId, 'SelectedIdea'),
      this.getMemory(sessionId, 'USER_PAIN'),
      this.getMemory(sessionId, 'PRD'),
      this.getMemory(sessionId, 'Validator'),
      this.getMemory(sessionId, 'USER_PROFILE')
    ]);

    if (!selectedIdea?.idea) {
      throw new Error('No idea selected. Please select and validate an idea first.');
    }

    const messages = [
      {
        role: 'user',
        content: `Generate tool-specific build prompts for this MVP:

Idea: ${selectedIdea.idea}
Pain Point: ${userPain?.description || 'Not specified'}
Founder: ${userProfile?.name || 'Founder'}
${validation?.riskiestAssumption ? `Riskiest Assumption: ${validation.riskiestAssumption}` : ''}
${prd?.content ? `PRD excerpt: ${prd.content.substring(0, 700)}` : 'PRD not available'}

Output format:
Recommended Tool:
[Pick one and explain why in one sentence]

Master Prompt:
[Copy-paste prompt for the chosen tool]

Iteration Prompt 1:
[Improve onboarding and user flow]

Iteration Prompt 2:
[Add validation and persistence]

Iteration Prompt 3:
[Improve UX and polish]

Constraints:
[Scope limits to avoid overbuilding]

Definition of Done (Week 1):
[Concrete completion criteria]`
      }
    ];

    let content = '';
    if (onChunk) {
      const result = await this.stream(messages, chunk => {
        content += chunk;
        onChunk(chunk);
      });
      await this.persistPromptPack(sessionId, content);
      return result;
    }

    const result = await this.send(messages);
    await this.persistPromptPack(sessionId, result);
    return result;
  }

  async persistPromptPack(sessionId, content) {
    try {
      await this.setMemory(sessionId, 'PROMPT_PACK', {
        content,
        createdAt: new Date().toISOString(),
        version: 1
      });

      const existingMvp = (await this.getMemory(sessionId, 'MVP')) || {};
      if (!existingMvp.started) {
        await this.setMemory(sessionId, 'MVP', {
          ...existingMvp,
          started: true,
          complete: false,
          startedAt: new Date().toISOString()
        });
      }

      const existingMilestones = (await this.getMemory(sessionId, 'MILESTONES')) || { list: [] };
      if (!existingMilestones.list.includes('prompts_generated')) {
        existingMilestones.list.push('prompts_generated');
        existingMilestones.prompts_generated = new Date().toISOString();
        await this.setMemory(sessionId, 'MILESTONES', existingMilestones);
      }
    } catch (error) {
      console.error('Failed to persist prompt pack:', error);
    }
  }
}

export default PromptEngineerAgent;
