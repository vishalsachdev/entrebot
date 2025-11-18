// Application constants

export const JOURNEY_PHASES = [
  {
    id: 'discovery',
    name: 'Discovery',
    description: 'Explore your interests and identify opportunities',
    color: 'primary',
  },
  {
    id: 'ideation',
    name: 'Ideation',
    description: 'Generate and refine business ideas',
    color: 'secondary',
  },
  {
    id: 'validation',
    name: 'Validation',
    description: 'Test and validate your business concept',
    color: 'accent',
  },
  {
    id: 'planning',
    name: 'Planning',
    description: 'Create detailed business and execution plans',
    color: 'primary',
  },
  {
    id: 'building',
    name: 'Building',
    description: 'Develop your product or service',
    color: 'secondary',
  },
  {
    id: 'launch',
    name: 'Launch',
    description: 'Bring your venture to market',
    color: 'accent',
  },
  {
    id: 'growth',
    name: 'Growth',
    description: 'Scale and optimize your business',
    color: 'primary',
  },
] as const;

export const AGENT_TYPES = {
  IDEA_GENERATOR: 'idea-generator',
  VALIDATOR: 'validator',
  PLANNER: 'planner',
  MENTOR: 'mentor',
  RESEARCHER: 'researcher',
} as const;

export const MESSAGE_STATUS = {
  SENDING: 'sending',
  SENT: 'sent',
  DELIVERED: 'delivered',
  ERROR: 'error',
} as const;

export const PROJECT_STATUS = {
  ACTIVE: 'active',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  ARCHIVED: 'archived',
} as const;