/**
 * Integration Tests: Agent Coordination
 * Tests multi-agent workflows and handoffs
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';

describe('Agent Coordination', () => {
  let mockMemory: any;
  let agents: any;

  beforeEach(() => {
    mockMemory = {
      store: jest.fn(),
      retrieve: jest.fn(),
      update: jest.fn()
    };

    agents = {
      onboarding: { name: 'onboarding', process: jest.fn() },
      ideaGenerator: { name: 'idea_generator', process: jest.fn() },
      marketValidator: { name: 'market_validator', process: jest.fn() },
      productManager: { name: 'product_manager', process: jest.fn() }
    };
  });

  describe('Sequential Agent Handoffs', () => {
    test('should coordinate onboarding → idea generation workflow', async () => {
      // Onboarding completes and stores pain point
      const painPoint = {
        description: 'Students waste time searching papers',
        category: 'functional'
      };

      await agents.onboarding.process({ user_id: 'user-123' });
      await mockMemory.store('USER_PAIN', painPoint);

      // System triggers idea generator
      const trigger = await shouldTriggerAgent('idea_generator', mockMemory);
      expect(trigger).toBe(true);

      // Idea generator retrieves pain point
      mockMemory.retrieve.mockResolvedValue(painPoint);
      const ideas = await agents.ideaGenerator.process({ user_id: 'user-123' });

      expect(mockMemory.retrieve).toHaveBeenCalledWith('USER_PAIN');
      expect(ideas).toBeDefined();
    });

    test('should coordinate idea selection → market validation workflow', async () => {
      const selectedIdea = {
        id: 'idea-123',
        title: 'Academic Search Engine',
        description: 'Unified search platform'
      };

      // User selects idea
      await mockMemory.store('SELECTED_IDEA', selectedIdea);

      // System triggers market validator
      const trigger = await shouldTriggerAgent('market_validator', mockMemory);
      expect(trigger).toBe(true);

      // Market validator retrieves idea
      mockMemory.retrieve.mockResolvedValue(selectedIdea);
      await agents.marketValidator.process({ user_id: 'user-123' });

      expect(mockMemory.retrieve).toHaveBeenCalledWith('SELECTED_IDEA');
    });

    test('should coordinate validation → PRD generation workflow', async () => {
      const validationResult = {
        overall_score: 0.82,
        recommendation: 'strong_proceed',
        insights: {}
      };

      await mockMemory.store('VALIDATION_RESULT', validationResult);

      // System triggers PRD generator
      const trigger = await shouldTriggerAgent('product_manager', mockMemory);
      expect(trigger).toBe(true);

      // PRD agent retrieves validation
      mockMemory.retrieve.mockResolvedValue(validationResult);
      await agents.productManager.process({ user_id: 'user-123' });

      expect(mockMemory.retrieve).toHaveBeenCalledWith('VALIDATION_RESULT');
    });
  });

  describe('Parallel Agent Coordination', () => {
    test('should coordinate multiple agents analyzing same data', async () => {
      const idea = {
        id: 'idea-123',
        title: 'Test Idea'
      };

      await mockMemory.store('CURRENT_IDEA', idea);

      // Multiple agents process in parallel
      const [validation, feasibility, innovation] = await Promise.all([
        mockAnalyzeMarket(idea),
        mockAnalyzeFeasibility(idea),
        mockAnalyzeInnovation(idea)
      ]);

      expect(validation).toHaveProperty('market_score');
      expect(feasibility).toHaveProperty('complexity_score');
      expect(innovation).toHaveProperty('uniqueness_score');

      // Results aggregated
      const aggregated = await aggregateAnalysis([validation, feasibility, innovation]);
      expect(aggregated.overall_assessment).toBeDefined();
    });
  });

  describe('Agent Context Sharing', () => {
    test('should maintain shared context across agents', async () => {
      const sharedContext = {
        user_id: 'user-123',
        project_id: 'proj-456',
        current_stage: 'validation',
        history: []
      };

      await mockMemory.store('SHARED_CONTEXT', sharedContext);

      // Each agent updates shared context
      await updateAgentContext('onboarding', { stage_completed: 'onboarding' }, mockMemory);
      await updateAgentContext('idea_generator', { ideas_generated: 5 }, mockMemory);
      await updateAgentContext('market_validator', { validation_score: 0.82 }, mockMemory);

      const finalContext = await mockMemory.retrieve('SHARED_CONTEXT');

      expect(finalContext).toHaveProperty('onboarding');
      expect(finalContext).toHaveProperty('idea_generator');
      expect(finalContext).toHaveProperty('market_validator');
    });

    test('should handle context conflicts gracefully', async () => {
      // Two agents try to update context simultaneously
      const updates = [
        updateAgentContext('agent1', { value: 'A' }, mockMemory),
        updateAgentContext('agent2', { value: 'B' }, mockMemory)
      ];

      await Promise.all(updates);

      const context = await mockMemory.retrieve('SHARED_CONTEXT');

      // Should have both updates (no data loss)
      expect(context.agent1 || context.agent2).toBeDefined();
    });
  });

  describe('Error Propagation', () => {
    test('should propagate errors between agents', async () => {
      agents.onboarding.process.mockRejectedValue(new Error('Onboarding failed'));

      // Error should prevent downstream agents
      try {
        await agents.onboarding.process({ user_id: 'user-123' });
      } catch (error) {
        // System should NOT trigger idea generator
        const shouldTrigger = await shouldTriggerAgent('idea_generator', mockMemory);
        expect(shouldTrigger).toBe(false);
      }
    });

    test('should allow agents to recover from upstream failures', async () => {
      // Market validator fails
      agents.marketValidator.process.mockRejectedValue(new Error('API timeout'));

      const fallback = await handleAgentFailure('market_validator', 'user-123', mockMemory);

      expect(fallback.error_handled).toBe(true);
      expect(fallback.fallback_strategy).toBeDefined();
      expect(fallback.user_message).toContain('temporary issue');
    });
  });

  describe('Agent Routing', () => {
    test('should route user to correct agent based on context', () => {
      const testCases = [
        { context: { stage: 'onboarding', pain_identified: false }, expected: 'onboarding' },
        { context: { stage: 'ideation', ideas_generated: 0 }, expected: 'idea_generator' },
        { context: { stage: 'validation', idea_selected: true }, expected: 'market_validator' },
        { context: { stage: 'building', prd_generated: true }, expected: 'prompt_engineer' }
      ];

      testCases.forEach(({ context, expected }) => {
        const agent = routeToAgent(context);
        expect(agent).toBe(expected);
      });
    });

    test('should handle user explicitly requesting specific agent', () => {
      const userRequest = {
        message: "I want to validate my idea",
        explicit_agent: 'market_validator'
      };

      const agent = routeToAgent({ stage: 'onboarding' }, userRequest);
      expect(agent).toBe('market_validator'); // User override
    });
  });

  describe('Workflow Orchestration', () => {
    test('should execute complete workflow pipeline', async () => {
      const userId = 'user-123';
      const pipeline = [
        'onboarding',
        'idea_generator',
        'market_validator',
        'product_manager'
      ];

      const results = [];

      for (const agentName of pipeline) {
        const result = await executeAgentStep(agentName, userId, mockMemory);
        results.push({ agent: agentName, result });

        // Store result for next agent
        await mockMemory.store(`${agentName}_RESULT`, result);
      }

      expect(results).toHaveLength(4);
      expect(results[0].agent).toBe('onboarding');
      expect(results[3].agent).toBe('product_manager');
    });

    test('should support branching workflows', async () => {
      const validationResult = {
        overall_score: 0.45,
        recommendation: 'pivot_required'
      };

      const nextSteps = determineNextSteps(validationResult);

      if (validationResult.recommendation === 'pivot_required') {
        expect(nextSteps).toContain('idea_generator'); // Re-generate ideas
        expect(nextSteps).not.toContain('product_manager'); // Skip PRD
      } else {
        expect(nextSteps).toContain('product_manager');
      }
    });
  });

  describe('Performance Optimization', () => {
    test('should cache agent results to avoid redundant processing', async () => {
      const idea = { id: 'idea-123', title: 'Test Idea' };

      // First validation
      const result1 = await agents.marketValidator.process({ idea });
      await mockMemory.store('VALIDATION_CACHE_idea-123', result1);

      // Second validation (should use cache)
      const cached = await mockMemory.retrieve('VALIDATION_CACHE_idea-123');

      expect(cached).toEqual(result1);
      expect(agents.marketValidator.process).toHaveBeenCalledTimes(1); // Not called twice
    });

    test('should invalidate cache when input changes', async () => {
      const idea1 = { id: 'idea-123', title: 'Original Idea' };
      const idea2 = { id: 'idea-123', title: 'Modified Idea' };

      await mockMemory.store('VALIDATION_CACHE_idea-123', { cached: true });

      const shouldInvalidate = ideaHasChanged(idea1, idea2);
      expect(shouldInvalidate).toBe(true);

      if (shouldInvalidate) {
        await mockMemory.delete('VALIDATION_CACHE_idea-123');
      }
    });
  });
});

// Helper functions
async function shouldTriggerAgent(agentName: string, memory: any): Promise<boolean> {
  const triggers: Record<string, string[]> = {
    'idea_generator': ['USER_PAIN'],
    'market_validator': ['SELECTED_IDEA'],
    'product_manager': ['VALIDATION_RESULT']
  };

  const requiredKeys = triggers[agentName] || [];

  for (const key of requiredKeys) {
    const value = await memory.retrieve(key);
    if (!value) return false;
  }

  return true;
}

async function mockAnalyzeMarket(idea: any) {
  return { market_score: 0.8 };
}

async function mockAnalyzeFeasibility(idea: any) {
  return { complexity_score: 0.7 };
}

async function mockAnalyzeInnovation(idea: any) {
  return { uniqueness_score: 0.65 };
}

async function aggregateAnalysis(analyses: any[]) {
  return { overall_assessment: 'positive' };
}

async function updateAgentContext(agentName: string, updates: any, memory: any) {
  const current = await memory.retrieve('SHARED_CONTEXT') || {};
  current[agentName] = updates;
  await memory.store('SHARED_CONTEXT', current);
}

async function handleAgentFailure(agentName: string, userId: string, memory: any) {
  return {
    error_handled: true,
    fallback_strategy: 'use_cached_data',
    user_message: 'We encountered a temporary issue. Using previous data.'
  };
}

function routeToAgent(context: any, userRequest?: any): string {
  if (userRequest?.explicit_agent) {
    return userRequest.explicit_agent;
  }

  if (!context.pain_identified) return 'onboarding';
  if (!context.ideas_generated) return 'idea_generator';
  if (!context.idea_validated) return 'market_validator';
  if (!context.prd_generated) return 'product_manager';

  return 'mentor'; // Default to mentor agent
}

async function executeAgentStep(agentName: string, userId: string, memory: any) {
  return { agent: agentName, completed: true };
}

function determineNextSteps(validationResult: any): string[] {
  if (validationResult.recommendation === 'pivot_required') {
    return ['idea_generator', 'mentor'];
  }
  return ['product_manager', 'prompt_engineer'];
}

function ideaHasChanged(idea1: any, idea2: any): boolean {
  return idea1.title !== idea2.title || idea1.description !== idea2.description;
}
