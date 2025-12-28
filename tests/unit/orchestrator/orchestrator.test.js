/**
 * Orchestrator Unit Tests
 * Comprehensive tests for the Agent Orchestrator
 *
 * Tests cover:
 * - Phase transitions (discovery -> ideation -> validation -> etc.)
 * - Agent selection based on phase
 * - Memory-based transition triggers
 * - Progress tracking
 */

// Mock dependencies before importing anything
jest.mock('../../../src/database/supabase.js');
jest.mock('../../../src/database/queries.js');
jest.mock('../../../src/config/logger.js');
jest.mock('../../../src/agents/index.js');
jest.mock('../../../src/config/env.js', () => ({
  config: {
    supabase: {
      url: 'http://localhost:54321',
      anonKey: 'test-key'
    },
    openai: {
      apiKey: 'test-key'
    },
    server: {
      port: 3001
    }
  }
}));

const { memoryQueries } = require('../../../src/database/queries.js');
const { getAgent, agents } = require('../../../src/agents/index.js');

// Mock logger
const logger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
};
require('../../../src/config/logger.js').logger = logger;

describe('Orchestrator', () => {
  let Orchestrator;
  let PHASES;
  let orchestrator;

  // Mock agents
  const mockAgents = {
    onboarding: { name: 'onboarding' },
    ideaGenerator: { name: 'ideaGenerator' },
    validator: { name: 'validator' },
    builder: { name: 'builder' }
  };

  beforeAll(async () => {
    // Setup agent mocks
    agents.onboarding = mockAgents.onboarding;
    agents.ideaGenerator = mockAgents.ideaGenerator;
    agents.validator = mockAgents.validator;
    agents.builder = mockAgents.builder;

    // Import the module under test
    const orchestratorModule = await import('../../../src/orchestrator/index.js');
    Orchestrator = orchestratorModule.Orchestrator;
    PHASES = orchestratorModule.PHASES;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    orchestrator = new Orchestrator();

    // Default mock implementations
    getAgent.mockImplementation(name => {
      if (mockAgents[name]) {
        return mockAgents[name];
      }
      throw new Error(`Agent not found: ${name}`);
    });
  });

  describe('PHASES constant', () => {
    it('should define all expected phases', () => {
      const expectedPhases = [
        'discovery',
        'ideation',
        'validation',
        'strategy',
        'building',
        'launch',
        'growth'
      ];

      expect(Object.keys(PHASES)).toEqual(expectedPhases);
    });

    it('should have correct structure for each phase', () => {
      Object.entries(PHASES).forEach(([phaseName, phase]) => {
        expect(phase).toHaveProperty('name');
        expect(phase).toHaveProperty('description');
        expect(phase).toHaveProperty('agents');
        expect(phase).toHaveProperty('milestones');
        expect(Array.isArray(phase.agents)).toBe(true);
        expect(Array.isArray(phase.milestones)).toBe(true);
      });
    });

    it('should have correct phase chain (nextPhase)', () => {
      expect(PHASES.discovery.nextPhase).toBe('ideation');
      expect(PHASES.ideation.nextPhase).toBe('validation');
      expect(PHASES.validation.nextPhase).toBe('strategy');
      expect(PHASES.strategy.nextPhase).toBe('building');
      expect(PHASES.building.nextPhase).toBe('launch');
      expect(PHASES.launch.nextPhase).toBe('growth');
      expect(PHASES.growth.nextPhase).toBeNull();
    });
  });

  describe('getState()', () => {
    const sessionId = 'test-session-123';

    it('should return initial state for new session', async () => {
      memoryQueries.getAll.mockResolvedValue({
        success: true,
        memory: {}
      });

      const state = await orchestrator.getState(sessionId);

      expect(state.currentPhase).toBe('discovery');
      expect(state.milestones).toEqual([]);
      expect(state.startedAt).toBeDefined();
      expect(state.lastActivity).toBeDefined();
      expect(state.memory).toEqual({});
      expect(memoryQueries.getAll).toHaveBeenCalledWith(sessionId);
    });

    it('should return existing state from memory', async () => {
      const existingState = {
        currentPhase: 'validation',
        milestones: ['name_collected', 'pain_articulated', 'ideas_generated'],
        startedAt: '2024-01-01T00:00:00.000Z',
        lastActivity: '2024-01-02T00:00:00.000Z'
      };

      memoryQueries.getAll.mockResolvedValue({
        success: true,
        memory: {
          JOURNEY_STATE: existingState,
          USER_PROFILE: { name: 'John' }
        }
      });

      const state = await orchestrator.getState(sessionId);

      expect(state.currentPhase).toBe('validation');
      expect(state.milestones).toEqual(existingState.milestones);
      expect(state.startedAt).toBe(existingState.startedAt);
      expect(state.memory.USER_PROFILE).toEqual({ name: 'John' });
    });

    it('should handle memory query failure gracefully', async () => {
      memoryQueries.getAll.mockResolvedValue({
        success: false,
        error: 'Database error'
      });

      const state = await orchestrator.getState(sessionId);

      // Should return default state when memory fails
      expect(state.currentPhase).toBe('discovery');
      expect(state.milestones).toEqual([]);
      expect(state.memory).toEqual({});
    });

    it('should preserve additional memory fields', async () => {
      memoryQueries.getAll.mockResolvedValue({
        success: true,
        memory: {
          JOURNEY_STATE: { currentPhase: 'ideation', milestones: [] },
          USER_PROFILE: { name: 'Alice' },
          USER_PAIN: { description: 'Too many meetings' },
          SelectedIdea: { idea: 'Meeting optimizer' }
        }
      });

      const state = await orchestrator.getState(sessionId);

      expect(state.memory.USER_PROFILE).toEqual({ name: 'Alice' });
      expect(state.memory.USER_PAIN).toEqual({ description: 'Too many meetings' });
      expect(state.memory.SelectedIdea).toEqual({ idea: 'Meeting optimizer' });
    });
  });

  describe('updateState()', () => {
    const sessionId = 'test-session-123';

    beforeEach(() => {
      memoryQueries.getAll.mockResolvedValue({
        success: true,
        memory: {
          JOURNEY_STATE: {
            currentPhase: 'discovery',
            milestones: [],
            startedAt: '2024-01-01T00:00:00.000Z'
          }
        }
      });

      memoryQueries.set.mockResolvedValue({
        success: true,
        memory: {}
      });
    });

    it('should update phase correctly', async () => {
      const newState = await orchestrator.updateState(sessionId, {
        currentPhase: 'ideation'
      });

      expect(newState.currentPhase).toBe('ideation');
      expect(memoryQueries.set).toHaveBeenCalledWith(
        sessionId,
        'JOURNEY_STATE',
        expect.objectContaining({ currentPhase: 'ideation' })
      );
    });

    it('should update lastActivity timestamp', async () => {
      const beforeUpdate = new Date();

      const newState = await orchestrator.updateState(sessionId, {
        currentPhase: 'validation'
      });

      const afterUpdate = new Date();
      const lastActivityDate = new Date(newState.lastActivity);

      expect(lastActivityDate >= beforeUpdate).toBe(true);
      expect(lastActivityDate <= afterUpdate).toBe(true);
    });

    it('should preserve existing state fields when updating', async () => {
      memoryQueries.getAll.mockResolvedValue({
        success: true,
        memory: {
          JOURNEY_STATE: {
            currentPhase: 'discovery',
            milestones: ['name_collected'],
            startedAt: '2024-01-01T00:00:00.000Z',
            customField: 'should_preserve'
          }
        }
      });

      const newState = await orchestrator.updateState(sessionId, {
        currentPhase: 'ideation'
      });

      expect(newState.currentPhase).toBe('ideation');
      expect(newState.milestones).toEqual(['name_collected']);
      expect(newState.startedAt).toBe('2024-01-01T00:00:00.000Z');
    });

    it('should not save memory object to JOURNEY_STATE', async () => {
      await orchestrator.updateState(sessionId, {
        currentPhase: 'validation'
      });

      const savedState = memoryQueries.set.mock.calls[0][2];
      expect(savedState).not.toHaveProperty('memory');
    });
  });

  describe('addMilestone()', () => {
    const sessionId = 'test-session-123';

    beforeEach(() => {
      memoryQueries.getAll.mockResolvedValue({
        success: true,
        memory: {
          JOURNEY_STATE: {
            currentPhase: 'discovery',
            milestones: ['name_collected'],
            startedAt: '2024-01-01T00:00:00.000Z'
          }
        }
      });

      memoryQueries.set.mockResolvedValue({
        success: true,
        memory: {}
      });
    });

    it('should add new milestone', async () => {
      const state = await orchestrator.addMilestone(sessionId, 'pain_articulated');

      expect(state.milestones).toContain('pain_articulated');
      expect(memoryQueries.set).toHaveBeenCalled();
    });

    it('should not add duplicate milestone', async () => {
      const state = await orchestrator.addMilestone(sessionId, 'name_collected');

      // Should not call set since milestone already exists
      expect(memoryQueries.set).not.toHaveBeenCalled();
      expect(state.milestones.filter(m => m === 'name_collected').length).toBe(1);
    });

    it('should preserve existing milestones when adding new one', async () => {
      memoryQueries.getAll.mockResolvedValue({
        success: true,
        memory: {
          JOURNEY_STATE: {
            currentPhase: 'discovery',
            milestones: ['name_collected', 'pain_articulated']
          }
        }
      });

      const state = await orchestrator.addMilestone(sessionId, 'pain_validated');

      expect(state.milestones).toContain('name_collected');
      expect(state.milestones).toContain('pain_articulated');
      expect(state.milestones).toContain('pain_validated');
    });

    it('should handle empty milestones array', async () => {
      memoryQueries.getAll.mockResolvedValue({
        success: true,
        memory: {
          JOURNEY_STATE: {
            currentPhase: 'discovery',
            milestones: []
          }
        }
      });

      const state = await orchestrator.addMilestone(sessionId, 'name_collected');

      expect(state.milestones).toEqual(['name_collected']);
    });
  });

  describe('determinePhase()', () => {
    const sessionId = 'test-session-123';

    describe('explicit phase requests via keywords', () => {
      it('should detect validation phase request', async () => {
        memoryQueries.getAll.mockResolvedValue({
          success: true,
          memory: {
            JOURNEY_STATE: { currentPhase: 'ideation', milestones: [] },
            SelectedIdea: { idea: 'Test idea' }
          }
        });

        const phase = await orchestrator.determinePhase(
          sessionId,
          'Can you validate this idea?',
          'ideation'
        );

        expect(phase).toBe('validation');
      });

      it('should detect ideation phase request with back keyword', async () => {
        memoryQueries.getAll.mockResolvedValue({
          success: true,
          memory: {
            JOURNEY_STATE: { currentPhase: 'validation', milestones: [] },
            USER_PROFILE: { name: 'John' },
            USER_PAIN: { description: 'Test pain' }
          }
        });

        const phase = await orchestrator.determinePhase(
          sessionId,
          'Let me go back to ideas',
          'validation'
        );

        expect(phase).toBe('ideation');
      });

      it('should detect building phase request', async () => {
        memoryQueries.getAll.mockResolvedValue({
          success: true,
          memory: {
            JOURNEY_STATE: { currentPhase: 'strategy', milestones: [] },
            Validator: { validated: true }
          }
        });

        const phase = await orchestrator.determinePhase(sessionId, 'Let me build an MVP', 'strategy');

        expect(phase).toBe('building');
      });

      it('should not transition to unreachable phase', async () => {
        memoryQueries.getAll.mockResolvedValue({
          success: true,
          memory: {
            JOURNEY_STATE: { currentPhase: 'discovery', milestones: [] }
            // No prerequisites met for validation
          }
        });

        const phase = await orchestrator.determinePhase(
          sessionId,
          'validate my idea',
          'discovery'
        );

        // Should stay in discovery since prerequisites not met
        expect(phase).toBe('discovery');
      });
    });

    describe('automatic transitions based on memory', () => {
      it('should auto-transition from discovery to ideation', async () => {
        memoryQueries.getAll.mockResolvedValue({
          success: true,
          memory: {
            JOURNEY_STATE: { currentPhase: 'discovery', milestones: [] },
            USER_PROFILE: { name: 'John' },
            USER_PAIN: { description: 'Too many meetings', frequency: 'daily' }
          }
        });

        const phase = await orchestrator.determinePhase(
          sessionId,
          'Show me ideas for this',
          'discovery'
        );

        expect(phase).toBe('ideation');
      });

      it('should auto-transition from ideation to validation', async () => {
        memoryQueries.getAll.mockResolvedValue({
          success: true,
          memory: {
            JOURNEY_STATE: { currentPhase: 'ideation', milestones: [] },
            SelectedIdea: { idea: 'Meeting optimizer app' }
          }
        });

        const phase = await orchestrator.determinePhase(
          sessionId,
          'Can you validate this idea?',
          'ideation'
        );

        expect(phase).toBe('validation');
      });

      it('should auto-transition from validation to strategy', async () => {
        memoryQueries.getAll.mockResolvedValue({
          success: true,
          memory: {
            JOURNEY_STATE: { currentPhase: 'validation', milestones: [] },
            Validator: { validated: true }
          }
        });

        const phase = await orchestrator.determinePhase(
          sessionId,
          'Help me proceed to next step',
          'validation'
        );

        expect(phase).toBe('strategy');
      });

      it('should not auto-transition without memory conditions met', async () => {
        memoryQueries.getAll.mockResolvedValue({
          success: true,
          memory: {
            JOURNEY_STATE: { currentPhase: 'discovery', milestones: [] },
            USER_PROFILE: { name: 'John' }
            // Missing USER_PAIN
          }
        });

        const phase = await orchestrator.determinePhase(
          sessionId,
          'Generate ideas for me',
          'discovery'
        );

        expect(phase).toBe('discovery');
      });

      it('should not auto-transition without message pattern match', async () => {
        memoryQueries.getAll.mockResolvedValue({
          success: true,
          memory: {
            JOURNEY_STATE: { currentPhase: 'discovery', milestones: [] },
            USER_PROFILE: { name: 'John' },
            USER_PAIN: { description: 'Problem', frequency: 'daily' }
          }
        });

        const phase = await orchestrator.determinePhase(
          sessionId,
          'Tell me more about the process', // No transition trigger
          'discovery'
        );

        expect(phase).toBe('discovery');
      });
    });

    it('should be case-insensitive for message matching', async () => {
      memoryQueries.getAll.mockResolvedValue({
        success: true,
        memory: {
          JOURNEY_STATE: { currentPhase: 'discovery', milestones: [] },
          USER_PROFILE: { name: 'John' },
          USER_PAIN: { description: 'Test', frequency: 'daily' }
        }
      });

      const phase = await orchestrator.determinePhase(
        sessionId,
        'GENERATE IDEAS FOR ME!',
        'discovery'
      );

      expect(phase).toBe('ideation');
    });

    it('should return current phase when no transition triggers', async () => {
      memoryQueries.getAll.mockResolvedValue({
        success: true,
        memory: {
          JOURNEY_STATE: { currentPhase: 'ideation', milestones: [] }
        }
      });

      const phase = await orchestrator.determinePhase(sessionId, 'Hello there', 'ideation');

      expect(phase).toBe('ideation');
    });
  });

  describe('isPhaseReachable()', () => {
    it('should always return true for discovery phase', () => {
      const result = orchestrator.isPhaseReachable('discovery', {});
      expect(result).toBe(true);
    });

    it('should return truthy for ideation when prerequisites met', () => {
      const memory = {
        USER_PROFILE: { name: 'John' },
        USER_PAIN: { description: 'Test pain' }
      };

      const result = orchestrator.isPhaseReachable('ideation', memory);
      expect(result).toBeTruthy();
    });

    it('should return false for ideation when name missing', () => {
      const memory = {
        USER_PROFILE: {},
        USER_PAIN: { description: 'Test pain' }
      };

      const result = orchestrator.isPhaseReachable('ideation', memory);
      expect(result).toBe(false);
    });

    it('should return false for ideation when pain missing', () => {
      const memory = {
        USER_PROFILE: { name: 'John' }
      };

      const result = orchestrator.isPhaseReachable('ideation', memory);
      expect(result).toBe(false);
    });

    it('should return truthy for validation when idea selected', () => {
      const memory = {
        SelectedIdea: { idea: 'Test idea' }
      };

      const result = orchestrator.isPhaseReachable('validation', memory);
      expect(result).toBeTruthy();
    });

    it('should return false for validation when no idea selected', () => {
      const memory = {};

      const result = orchestrator.isPhaseReachable('validation', memory);
      expect(result).toBe(false);
    });

    it('should return true for strategy when validated', () => {
      const memory = {
        Validator: { validated: true }
      };

      const result = orchestrator.isPhaseReachable('strategy', memory);
      expect(result).toBe(true);
    });

    it('should return false for strategy when not validated', () => {
      const memory = {
        Validator: { validated: false }
      };

      const result = orchestrator.isPhaseReachable('strategy', memory);
      expect(result).toBe(false);
    });

    it('should return true for building when validated', () => {
      const memory = {
        Validator: { validated: true }
      };

      const result = orchestrator.isPhaseReachable('building', memory);
      expect(result).toBe(true);
    });

    it('should return true for launch when MVP started', () => {
      const memory = {
        MVP: { started: true }
      };

      const result = orchestrator.isPhaseReachable('launch', memory);
      expect(result).toBe(true);
    });

    it('should return true for growth when launch complete', () => {
      const memory = {
        Launch: { complete: true }
      };

      const result = orchestrator.isPhaseReachable('growth', memory);
      expect(result).toBe(true);
    });

    it('should return false for unknown phase', () => {
      const result = orchestrator.isPhaseReachable('unknown_phase', {});
      expect(result).toBe(false);
    });
  });

  describe('selectAgent()', () => {
    const sessionId = 'test-session-123';

    it('should return correct agent for discovery phase', async () => {
      const agent = await orchestrator.selectAgent(sessionId, 'Hello', 'discovery');

      expect(getAgent).toHaveBeenCalledWith('onboarding');
      expect(agent.name).toBe('onboarding');
    });

    it('should return correct agent for ideation phase', async () => {
      const agent = await orchestrator.selectAgent(sessionId, 'Generate ideas', 'ideation');

      expect(getAgent).toHaveBeenCalledWith('ideaGenerator');
      expect(agent.name).toBe('ideaGenerator');
    });

    it('should return correct agent for validation phase', async () => {
      const agent = await orchestrator.selectAgent(sessionId, 'Validate this', 'validation');

      expect(getAgent).toHaveBeenCalledWith('validator');
      expect(agent.name).toBe('validator');
    });

    it('should return correct agent for strategy phase', async () => {
      const agent = await orchestrator.selectAgent(sessionId, 'Create PRD', 'strategy');

      expect(getAgent).toHaveBeenCalledWith('builder');
      expect(agent.name).toBe('builder');
    });

    it('should return correct agent for building phase', async () => {
      const agent = await orchestrator.selectAgent(sessionId, 'Build MVP', 'building');

      expect(getAgent).toHaveBeenCalledWith('builder');
      expect(agent.name).toBe('builder');
    });

    it('should return correct agent for launch phase', async () => {
      const agent = await orchestrator.selectAgent(sessionId, 'Launch plan', 'launch');

      expect(getAgent).toHaveBeenCalledWith('builder');
      expect(agent.name).toBe('builder');
    });

    it('should return correct agent for growth phase', async () => {
      const agent = await orchestrator.selectAgent(sessionId, 'Grow users', 'growth');

      expect(getAgent).toHaveBeenCalledWith('builder');
      expect(agent.name).toBe('builder');
    });

    it('should fallback to onboarding for unknown phase', async () => {
      const agent = await orchestrator.selectAgent(sessionId, 'Hello', 'unknown_phase');

      expect(getAgent).toHaveBeenCalledWith('onboarding');
      expect(agent.name).toBe('onboarding');
    });

    it('should fallback to onboarding when agent not found', async () => {
      // First call throws, second returns onboarding
      getAgent
        .mockImplementationOnce(() => {
          throw new Error('Agent not found');
        })
        .mockImplementationOnce(() => mockAgents.onboarding);

      const agent = await orchestrator.selectAgent(sessionId, 'Hello', 'discovery');

      expect(agent.name).toBe('onboarding');
    });
  });

  describe('route()', () => {
    const sessionId = 'test-session-123';

    beforeEach(() => {
      memoryQueries.set.mockResolvedValue({ success: true, memory: {} });
    });

    it('should return full routing result', async () => {
      memoryQueries.getAll.mockResolvedValue({
        success: true,
        memory: {
          JOURNEY_STATE: { currentPhase: 'discovery', milestones: [] }
        }
      });

      const result = await orchestrator.route(sessionId, 'Hello');

      expect(result).toHaveProperty('agent');
      expect(result).toHaveProperty('phase');
      expect(result).toHaveProperty('phaseChanged');
      expect(result).toHaveProperty('state');
    });

    it('should indicate when phase changed', async () => {
      memoryQueries.getAll.mockResolvedValue({
        success: true,
        memory: {
          JOURNEY_STATE: { currentPhase: 'discovery', milestones: [] },
          USER_PROFILE: { name: 'John' },
          USER_PAIN: { description: 'Test', frequency: 'daily' }
        }
      });

      const result = await orchestrator.route(sessionId, 'Generate ideas');

      expect(result.phaseChanged).toBe(true);
      expect(result.phase).toBe('ideation');
    });

    it('should indicate when phase did not change', async () => {
      memoryQueries.getAll.mockResolvedValue({
        success: true,
        memory: {
          JOURNEY_STATE: { currentPhase: 'discovery', milestones: [] }
        }
      });

      const result = await orchestrator.route(sessionId, 'Hello there');

      expect(result.phaseChanged).toBe(false);
      expect(result.phase).toBe('discovery');
    });

    it('should update state when phase changes', async () => {
      memoryQueries.getAll.mockResolvedValue({
        success: true,
        memory: {
          JOURNEY_STATE: { currentPhase: 'discovery', milestones: [] },
          USER_PROFILE: { name: 'John' },
          USER_PAIN: { description: 'Test', frequency: 'daily' }
        }
      });

      await orchestrator.route(sessionId, 'Show me ideas');

      expect(memoryQueries.set).toHaveBeenCalledWith(
        sessionId,
        'JOURNEY_STATE',
        expect.objectContaining({ currentPhase: 'ideation' })
      );
    });

    it('should select correct agent for new phase', async () => {
      memoryQueries.getAll.mockResolvedValue({
        success: true,
        memory: {
          JOURNEY_STATE: { currentPhase: 'discovery', milestones: [] },
          USER_PROFILE: { name: 'John' },
          USER_PAIN: { description: 'Test', frequency: 'daily' }
        }
      });

      const result = await orchestrator.route(sessionId, 'Generate ideas');

      expect(result.agent.name).toBe('ideaGenerator');
    });

    it('should return updated state in result', async () => {
      memoryQueries.getAll.mockResolvedValue({
        success: true,
        memory: {
          JOURNEY_STATE: { currentPhase: 'ideation', milestones: ['name_collected'] },
          USER_PROFILE: { name: 'Alice' }
        }
      });

      const result = await orchestrator.route(sessionId, 'Tell me more');

      expect(result.state.currentPhase).toBe('ideation');
      expect(result.state.milestones).toContain('name_collected');
    });

    it('should handle default to discovery when no current phase', async () => {
      memoryQueries.getAll.mockResolvedValue({
        success: true,
        memory: {
          JOURNEY_STATE: { milestones: [] }
          // No currentPhase
        }
      });

      const result = await orchestrator.route(sessionId, 'Hello');

      expect(result.phase).toBe('discovery');
    });
  });

  describe('getProgress()', () => {
    const sessionId = 'test-session-123';

    it('should return 0% progress for discovery phase', async () => {
      memoryQueries.getAll.mockResolvedValue({
        success: true,
        memory: {
          JOURNEY_STATE: { currentPhase: 'discovery', milestones: [] }
        }
      });

      const progress = await orchestrator.getProgress(sessionId);

      expect(progress.progress.percentage).toBe(0);
      expect(progress.currentPhase).toBe('discovery');
    });

    it('should calculate correct percentage for middle phases', async () => {
      const testCases = [
        { phase: 'ideation', expectedPercentage: 17 }, // 1/6 * 100
        { phase: 'validation', expectedPercentage: 33 }, // 2/6 * 100
        { phase: 'strategy', expectedPercentage: 50 }, // 3/6 * 100
        { phase: 'building', expectedPercentage: 67 }, // 4/6 * 100
        { phase: 'launch', expectedPercentage: 83 }, // 5/6 * 100
        { phase: 'growth', expectedPercentage: 100 } // 6/6 * 100
      ];

      for (const { phase, expectedPercentage } of testCases) {
        memoryQueries.getAll.mockResolvedValue({
          success: true,
          memory: {
            JOURNEY_STATE: { currentPhase: phase, milestones: [] }
          }
        });

        const progress = await orchestrator.getProgress(sessionId);

        expect(progress.progress.percentage).toBe(expectedPercentage);
      }
    });

    it('should return 100% progress for growth phase', async () => {
      memoryQueries.getAll.mockResolvedValue({
        success: true,
        memory: {
          JOURNEY_STATE: { currentPhase: 'growth', milestones: [] }
        }
      });

      const progress = await orchestrator.getProgress(sessionId);

      expect(progress.progress.percentage).toBe(100);
    });

    it('should include completed phases', async () => {
      memoryQueries.getAll.mockResolvedValue({
        success: true,
        memory: {
          JOURNEY_STATE: { currentPhase: 'validation', milestones: [] }
        }
      });

      const progress = await orchestrator.getProgress(sessionId);

      expect(progress.progress.completedPhases).toEqual(['discovery', 'ideation']);
    });

    it('should include remaining phases', async () => {
      memoryQueries.getAll.mockResolvedValue({
        success: true,
        memory: {
          JOURNEY_STATE: { currentPhase: 'validation', milestones: [] }
        }
      });

      const progress = await orchestrator.getProgress(sessionId);

      expect(progress.progress.remainingPhases).toEqual(['strategy', 'building', 'launch', 'growth']);
    });

    it('should include phase name and description', async () => {
      memoryQueries.getAll.mockResolvedValue({
        success: true,
        memory: {
          JOURNEY_STATE: { currentPhase: 'ideation', milestones: [] }
        }
      });

      const progress = await orchestrator.getProgress(sessionId);

      expect(progress.phaseName).toBe('Ideation');
      expect(progress.phaseDescription).toBe('Generate and explore business ideas');
    });

    it('should include context from memory', async () => {
      memoryQueries.getAll.mockResolvedValue({
        success: true,
        memory: {
          JOURNEY_STATE: { currentPhase: 'validation', milestones: [] },
          USER_PROFILE: { name: 'Alice' },
          USER_PAIN: { description: 'Too many meetings' },
          SelectedIdea: { idea: 'Meeting optimizer' },
          Validator: { validated: true }
        }
      });

      const progress = await orchestrator.getProgress(sessionId);

      expect(progress.context.userName).toBe('Alice');
      expect(progress.context.painPoint).toBe('Too many meetings');
      expect(progress.context.selectedIdea).toBe('Meeting optimizer');
      expect(progress.context.validated).toBe(true);
    });

    it('should include milestones', async () => {
      memoryQueries.getAll.mockResolvedValue({
        success: true,
        memory: {
          JOURNEY_STATE: {
            currentPhase: 'ideation',
            milestones: ['name_collected', 'pain_articulated', 'ideas_generated']
          }
        }
      });

      const progress = await orchestrator.getProgress(sessionId);

      expect(progress.milestones).toEqual(['name_collected', 'pain_articulated', 'ideas_generated']);
    });

    it('should include timestamps', async () => {
      const startedAt = '2024-01-01T00:00:00.000Z';
      const lastActivity = '2024-01-15T12:30:00.000Z';

      memoryQueries.getAll.mockResolvedValue({
        success: true,
        memory: {
          JOURNEY_STATE: {
            currentPhase: 'validation',
            milestones: [],
            startedAt,
            lastActivity
          }
        }
      });

      const progress = await orchestrator.getProgress(sessionId);

      expect(progress.startedAt).toBe(startedAt);
      expect(progress.lastActivity).toBe(lastActivity);
    });

    it('should handle unknown phase gracefully', async () => {
      memoryQueries.getAll.mockResolvedValue({
        success: true,
        memory: {
          JOURNEY_STATE: { currentPhase: 'unknown_phase', milestones: [] }
        }
      });

      const progress = await orchestrator.getProgress(sessionId);

      expect(progress.phaseName).toBe('Unknown');
      expect(progress.phaseDescription).toBe('');
    });
  });

  describe('getContextForAgent()', () => {
    const sessionId = 'test-session-123';

    it('should return context summary for agents', async () => {
      memoryQueries.getAll.mockResolvedValue({
        success: true,
        memory: {
          JOURNEY_STATE: { currentPhase: 'validation', milestones: ['name_collected'] },
          USER_PROFILE: { name: 'Alice', background: 'Software Engineer' },
          USER_PAIN: { description: 'Too many meetings', frequency: 'daily' },
          GeneratedIdeas: [{ title: 'Idea 1' }, { title: 'Idea 2' }],
          SelectedIdea: { idea: 'Meeting optimizer' },
          Validator: { validated: true, score: 8 },
          PRD: { title: 'Meeting Optimizer PRD' }
        }
      });

      const context = await orchestrator.getContextForAgent(sessionId);

      expect(context.phase).toBe('validation');
      expect(context.user.name).toBe('Alice');
      expect(context.user.background).toBe('Software Engineer');
      expect(context.painPoint).toEqual({ description: 'Too many meetings', frequency: 'daily' });
      expect(context.ideas).toHaveLength(2);
      expect(context.selectedIdea).toEqual({ idea: 'Meeting optimizer' });
      expect(context.validation).toEqual({ validated: true, score: 8 });
      expect(context.prd).toEqual({ title: 'Meeting Optimizer PRD' });
      expect(context.milestones).toEqual(['name_collected']);
    });

    it('should handle missing memory fields gracefully', async () => {
      memoryQueries.getAll.mockResolvedValue({
        success: true,
        memory: {
          JOURNEY_STATE: { currentPhase: 'discovery', milestones: [] }
        }
      });

      const context = await orchestrator.getContextForAgent(sessionId);

      expect(context.phase).toBe('discovery');
      expect(context.user.name).toBeUndefined();
      expect(context.painPoint).toBeUndefined();
      expect(context.ideas).toBeUndefined();
      expect(context.selectedIdea).toBeUndefined();
      expect(context.validation).toBeUndefined();
      expect(context.prd).toBeUndefined();
    });
  });

  describe('Edge Cases', () => {
    const sessionId = 'test-session-123';

    it('should handle empty message', async () => {
      memoryQueries.getAll.mockResolvedValue({
        success: true,
        memory: {
          JOURNEY_STATE: { currentPhase: 'discovery', milestones: [] }
        }
      });

      const phase = await orchestrator.determinePhase(sessionId, '', 'discovery');

      expect(phase).toBe('discovery');
    });

    it('should handle very long messages', async () => {
      memoryQueries.getAll.mockResolvedValue({
        success: true,
        memory: {
          JOURNEY_STATE: { currentPhase: 'discovery', milestones: [] },
          USER_PROFILE: { name: 'John' },
          USER_PAIN: { description: 'Test', frequency: 'daily' }
        }
      });

      const longMessage = 'a'.repeat(10000) + ' generate ideas ' + 'b'.repeat(10000);
      const phase = await orchestrator.determinePhase(sessionId, longMessage, 'discovery');

      expect(phase).toBe('ideation');
    });

    it('should handle special characters in messages', async () => {
      memoryQueries.getAll.mockResolvedValue({
        success: true,
        memory: {
          JOURNEY_STATE: { currentPhase: 'discovery', milestones: [] }
        }
      });

      const specialMessage = '!@#$%^&*() generate <script>alert("xss")</script> ideas';
      const phase = await orchestrator.determinePhase(sessionId, specialMessage, 'discovery');

      // Should not throw and should handle gracefully
      expect(['discovery', 'ideation']).toContain(phase);
    });

    it('should handle concurrent getState calls', async () => {
      memoryQueries.getAll.mockResolvedValue({
        success: true,
        memory: {
          JOURNEY_STATE: { currentPhase: 'ideation', milestones: [] }
        }
      });

      const promises = Array(10)
        .fill(null)
        .map(() => orchestrator.getState(sessionId));

      const results = await Promise.all(promises);

      results.forEach(state => {
        expect(state.currentPhase).toBe('ideation');
      });
    });

    it('should handle null values in memory gracefully', async () => {
      memoryQueries.getAll.mockResolvedValue({
        success: true,
        memory: {
          JOURNEY_STATE: null
        }
      });

      const state = await orchestrator.getState(sessionId);

      // Should use defaults when JOURNEY_STATE is null
      expect(state.currentPhase).toBe('discovery');
    });
  });
});
