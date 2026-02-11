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
    id: 'strategy',
    name: 'Strategy',
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
  ONBOARDING: 'onboarding',
  IDEA_GENERATOR: 'idea-generator',
  VALIDATOR: 'validator',
  BUILDER: 'builder',
  PROMPT_ENGINEER: 'prompt-engineer',
  GO_TO_MARKET: 'go-to-market',
  GROWTH_COACH: 'growth-coach',
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
