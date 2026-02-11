/**
 * Agent Orchestrator
 *
 * Central routing and state management for multi-agent system.
 * Handles:
 * - Phase-aware agent routing
 * - Progress tracking and milestones
 * - Context aggregation across agents
 * - Curriculum-aware transitions (for course mode)
 */

import { getAgent } from '../agents/index.js';
import { memoryQueries } from '../database/queries.js';
import { logger } from '../config/logger.js';

/**
 * Journey phases and their associated agents
 */
export const PHASES = {
  discovery: {
    name: 'Discovery',
    description: 'Understand yourself and identify problems worth solving',
    agents: ['onboarding'],
    milestones: ['name_collected', 'pain_articulated', 'pain_validated'],
    nextPhase: 'ideation',
    learningObjectives: [
      'Identify frustrations that affect you and others',
      'Understand the frequency and severity of problems',
      'Recognize the emotional drivers behind pain points',
      'Articulate problems clearly and specifically'
    ]
  },
  ideation: {
    name: 'Ideation',
    description: 'Generate and explore business ideas',
    agents: ['ideaGenerator'],
    milestones: ['ideas_generated', 'idea_selected'],
    nextPhase: 'validation',
    learningObjectives: [
      'Generate multiple solution approaches to a problem',
      'Evaluate ideas based on feasibility and differentiation',
      'Match solutions to appropriate tools and platforms',
      'Select the most promising idea to pursue'
    ]
  },
  validation: {
    name: 'Validation',
    description: 'Validate your idea with market research',
    agents: ['validator'],
    milestones: ['validation_complete', 'decision_made'],
    nextPhase: 'strategy',
    learningObjectives: [
      'Assess market demand and competition',
      'Identify your riskiest assumptions',
      'Design quick validation experiments',
      'Make data-informed go/no-go decisions'
    ]
  },
  strategy: {
    name: 'Strategy',
    description: 'Create your product strategy and PRD',
    agents: ['builder'],
    milestones: ['prd_created', 'mvp_scoped'],
    nextPhase: 'building',
    learningObjectives: [
      'Define core features vs nice-to-haves',
      'Write clear product requirements',
      'Scope an MVP that can be built quickly',
      'Prioritize features by impact and effort'
    ]
  },
  building: {
    name: 'Building',
    description: 'Build your MVP with AI tools',
    agents: ['promptEngineer'],
    milestones: ['prompts_generated', 'mvp_started', 'mvp_complete'],
    nextPhase: 'launch',
    learningObjectives: [
      'Use AI coding tools effectively (Bolt, Cursor, v0)',
      'Write effective prompts for code generation',
      'Build a functional MVP in days, not months',
      'Iterate quickly based on what works'
    ]
  },
  launch: {
    name: 'Launch',
    description: 'Prepare and execute your launch',
    agents: ['goToMarket'],
    milestones: ['launch_plan_created', 'launched'],
    nextPhase: 'growth',
    learningObjectives: [
      'Create a compelling launch narrative',
      'Identify your initial target audience',
      'Choose appropriate launch channels',
      'Set up basic analytics and feedback loops'
    ]
  },
  growth: {
    name: 'Growth',
    description: 'Grow and iterate on your product',
    agents: ['growthCoach'],
    milestones: ['first_user', 'first_feedback', 'iteration_complete'],
    nextPhase: null,
    learningObjectives: [
      'Gather and analyze user feedback',
      'Identify patterns in user behavior',
      'Prioritize improvements based on impact',
      'Build sustainable growth habits'
    ]
  }
};

/**
 * Transition triggers - patterns that indicate phase transitions
 */
const TRANSITION_TRIGGERS = {
  discovery_to_ideation: {
    memoryConditions: memory =>
      memory.USER_PROFILE?.name &&
      memory.USER_PAIN?.description &&
      (memory.USER_PAIN?.frequency || memory.USER_PAIN?.severity),
    messagePatterns: ['generate ideas', 'show me ideas', 'what ideas', 'ready for ideas']
  },
  ideation_to_validation: {
    memoryConditions: memory => memory.SelectedIdea?.idea,
    messagePatterns: ['validate', 'check this', 'is this viable', 'market research']
  },
  validation_to_strategy: {
    memoryConditions: memory => memory.Validator?.validated,
    messagePatterns: ['proceed', 'next step', "let's build", 'prd', 'requirements', 'help me']
  },
  strategy_to_building: {
    memoryConditions: memory => memory.PRD?.created,
    messagePatterns: ['build', 'start coding', 'create mvp', 'bolt', 'cursor', 'v0']
  },
  building_to_launch: {
    memoryConditions: memory => memory.MVP?.complete,
    messagePatterns: ['launch', 'go live', 'release', 'ship it']
  },
  launch_to_growth: {
    memoryConditions: memory => memory.Launch?.complete || memory.LAUNCH_PLAN?.content,
    messagePatterns: ['launched', 'post-launch', 'growth', 'first users', 'iterate']
  }
};

/**
 * Main Orchestrator class
 */
export class Orchestrator {
  constructor() {
    this.phases = PHASES;
  }

  /**
   * Get current journey state for a session
   */
  async getState(sessionId) {
    // Retry logic for transient DB errors (common when Render wakes from sleep)
    let memory;
    let retries = 2;

    while (retries >= 0) {
      memory = await memoryQueries.getAll(sessionId);
      if (memory.success) {
        break;
      }

      if (retries > 0) {
        logger.warn(`Memory query failed, retrying... (${retries} left)`);
        await new Promise(r => setTimeout(r, 500)); // Wait 500ms before retry
      }
      retries--;
    }

    if (!memory.success) {
      logger.error(`Memory query failed after retries for session ${sessionId}: ${memory.error}`);
    }

    const allMemory = memory.success ? memory.memory : {};

    // Get or initialize journey state
    let journeyState = allMemory.JOURNEY_STATE || {
      currentPhase: 'discovery',
      milestones: [],
      startedAt: new Date().toISOString(),
      lastActivity: new Date().toISOString()
    };

    return {
      ...journeyState,
      memory: allMemory
    };
  }

  /**
   * Update journey state
   */
  async updateState(sessionId, updates) {
    const currentState = await this.getState(sessionId);
    const newState = {
      ...currentState,
      ...updates,
      lastActivity: new Date().toISOString()
    };

    // Remove memory from state before saving (it's fetched separately)
    const { memory: _memory, ...stateToSave } = newState;
    await memoryQueries.set(sessionId, 'JOURNEY_STATE', stateToSave);

    return newState;
  }

  /**
   * Add a milestone to the journey
   */
  async addMilestone(sessionId, milestone) {
    const state = await this.getState(sessionId);
    if (!state.milestones.includes(milestone)) {
      state.milestones.push(milestone);
      await this.updateState(sessionId, { milestones: state.milestones });
      logger.info(`Milestone added: ${milestone} for session ${sessionId}`);
    }
    return state;
  }

  /**
   * Determine the appropriate phase based on state and message
   */
  async determinePhase(sessionId, message, currentPhase) {
    const state = await this.getState(sessionId);
    const memory = state.memory;
    const lowerMessage = message.toLowerCase();

    // Check for explicit phase requests
    const phaseKeywords = {
      discovery: ['start over', 'new pain', 'different problem'],
      ideation: ['new ideas', 'other ideas', 'generate ideas', 'back to ideas'],
      validation: ['validate', 'market research', 'check viability'],
      strategy: ['prd', 'requirements', 'product plan', 'strategy'],
      building: ['build', 'mvp', 'code', 'create app'],
      launch: ['launch', 'go live', 'release'],
      growth: ['growth', 'retention', 'iterate', 'scale']
    };

    for (const [phase, keywords] of Object.entries(phaseKeywords)) {
      if (keywords.some(kw => lowerMessage.includes(kw))) {
        // Only allow forward progression or explicit back-to-ideas
        if (phase === 'ideation' && lowerMessage.includes('back')) {
          return phase;
        }
        // Check if this phase is reachable
        if (this.isPhaseReachable(phase, memory)) {
          return phase;
        }
      }
    }

    // Check automatic transitions based on memory state
    const transitionKey = `${currentPhase}_to_${PHASES[currentPhase]?.nextPhase}`;
    const trigger = TRANSITION_TRIGGERS[transitionKey];

    if (trigger) {
      const memoryReady = trigger.memoryConditions(memory);
      const messageMatch = trigger.messagePatterns.some(p => lowerMessage.includes(p));

      if (memoryReady && messageMatch) {
        const nextPhase = PHASES[currentPhase].nextPhase;
        logger.info(`Auto-transitioning from ${currentPhase} to ${nextPhase}`);
        return nextPhase;
      }
    }

    return currentPhase;
  }

  /**
   * Check if a phase is reachable based on prerequisites
   */
  isPhaseReachable(targetPhase, memory) {
    const prerequisites = {
      discovery: () => true,
      ideation: () => memory.USER_PROFILE?.name && memory.USER_PAIN?.description,
      validation: () => memory.SelectedIdea?.idea,
      strategy: () => memory.Validator?.validated,
      building: () => memory.Validator?.validated, // Can start building after validation
      launch: () => memory.MVP?.complete,
      growth: () => memory.Launch?.complete
    };

    return prerequisites[targetPhase]?.() ?? false;
  }

  /**
   * Select the appropriate agent for the current context
   */
  async selectAgent(sessionId, message, phase) {
    const phaseConfig = PHASES[phase];
    if (!phaseConfig) {
      logger.warn(`Unknown phase: ${phase}, defaulting to onboarding`);
      return getAgent('onboarding');
    }

    // For now, use the first agent in the phase
    // Future: Use LLM to select best agent based on message intent
    const agentName = phaseConfig.agents[0];

    try {
      return getAgent(agentName);
    } catch (error) {
      logger.error(`Agent not found: ${agentName}, falling back to onboarding`);
      return getAgent('onboarding');
    }
  }

  /**
   * Main routing function - determines agent and handles response
   */
  async route(sessionId, message) {
    const state = await this.getState(sessionId);
    const currentPhase = state.currentPhase || 'discovery';

    // Determine if we should transition phases
    const newPhase = await this.determinePhase(sessionId, message, currentPhase);

    // Update phase if changed
    if (newPhase !== currentPhase) {
      await this.updateState(sessionId, { currentPhase: newPhase });
      logger.info(`Phase transition: ${currentPhase} -> ${newPhase}`);
    }

    // Select appropriate agent
    const agent = await this.selectAgent(sessionId, message, newPhase);

    return {
      agent,
      phase: newPhase,
      phaseChanged: newPhase !== currentPhase,
      state: await this.getState(sessionId)
    };
  }

  /**
   * Get progress summary for a session
   */
  async getProgress(sessionId) {
    const state = await this.getState(sessionId);
    const memory = state.memory;

    const phaseOrder = [
      'discovery',
      'ideation',
      'validation',
      'strategy',
      'building',
      'launch',
      'growth'
    ];
    const currentIndex = phaseOrder.indexOf(state.currentPhase);

    return {
      currentPhase: state.currentPhase,
      phaseName: PHASES[state.currentPhase]?.name || 'Unknown',
      phaseDescription: PHASES[state.currentPhase]?.description || '',
      progress: {
        percentage: Math.round((currentIndex / (phaseOrder.length - 1)) * 100),
        completedPhases: phaseOrder.slice(0, currentIndex),
        currentPhase: state.currentPhase,
        remainingPhases: phaseOrder.slice(currentIndex + 1)
      },
      milestones: state.milestones,
      context: {
        userName: memory.USER_PROFILE?.name,
        painPoint: memory.USER_PAIN?.description,
        selectedIdea: memory.SelectedIdea?.idea,
        validated: memory.Validator?.validated
      },
      startedAt: state.startedAt,
      lastActivity: state.lastActivity
    };
  }

  /**
   * Get context summary for agents
   */
  async getContextForAgent(sessionId) {
    const state = await this.getState(sessionId);
    const memory = state.memory;

    return {
      phase: state.currentPhase,
      user: {
        name: memory.USER_PROFILE?.name,
        background: memory.USER_PROFILE?.background
      },
      painPoint: memory.USER_PAIN,
      ideas: memory.GeneratedIdeas,
      selectedIdea: memory.SelectedIdea,
      validation: memory.Validator,
      prd: memory.PRD,
      milestones: state.milestones
    };
  }
}

// Singleton instance
export const orchestrator = new Orchestrator();

export default orchestrator;
