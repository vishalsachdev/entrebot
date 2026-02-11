/**
 * Agent Registry
 * Central export for all agents
 */

import { OnboardingAgent } from './onboarding.js';
import { IdeaGeneratorAgent } from './idea-generator.js';
import { ValidatorAgent } from './validator.js';
import { BuilderAgent } from './builder.js';
import { PromptEngineerAgent } from './prompt-engineer.js';
import { GoToMarketAgent } from './go-to-market.js';
import { GrowthCoachAgent } from './growth-coach.js';

export const agents = {
  onboarding: new OnboardingAgent(),
  ideaGenerator: new IdeaGeneratorAgent(),
  validator: new ValidatorAgent(),
  builder: new BuilderAgent(),
  promptEngineer: new PromptEngineerAgent(),
  goToMarket: new GoToMarketAgent(),
  growthCoach: new GrowthCoachAgent()
};

export const getAgent = agentName => {
  const agent = agents[agentName];
  if (!agent) {
    throw new Error(`Agent not found: ${agentName}`);
  }
  return agent;
};

export default agents;
