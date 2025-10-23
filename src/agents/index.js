/**
 * Agent Registry
 * Central export for all agents
 */

import { OnboardingAgent } from './onboarding.js';
import { IdeaGeneratorAgent } from './idea-generator.js';
import { ValidatorAgent } from './validator.js';

export const agents = {
  onboarding: new OnboardingAgent(),
  ideaGenerator: new IdeaGeneratorAgent(),
  validator: new ValidatorAgent()
};

export const getAgent = (agentName) => {
  const agent = agents[agentName];
  if (!agent) {
    throw new Error(`Agent not found: ${agentName}`);
  }
  return agent;
};

export default agents;
