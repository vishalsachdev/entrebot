import { createContext, useContext, useState, type ReactNode } from 'react';
import type { Agent } from '../types';

export interface AgentContextType {
  currentAgent: Agent | null;
  availableAgents: Agent[];
  isLoading: boolean;
  setCurrentAgent: (agent: Agent | null) => void;
  switchAgent: (agentId: string) => void;
  getRecommendedAgents: (phase?: string) => Agent[];
}

const AgentContext = createContext<AgentContextType | undefined>(undefined);

export const useAgent = () => {
  const context = useContext(AgentContext);
  if (!context) {
    throw new Error('useAgent must be used within an AgentProvider');
  }
  return context;
};

interface AgentProviderProps {
  children: ReactNode;
}

// Agents for the user journey - only show user-facing agents in selector
const mockAgents: Agent[] = [
  {
    id: 'onboarding',
    name: 'Start Here',
    description: 'Tell me about yourself and a problem you want to solve. I\'ll help you turn it into a business idea.',
    specialization: ['onboarding', 'pain discovery', 'profile setup'],
    personality: {
      color: 'text-emerald-600',
      icon: 'user-plus',
      tone: 'friendly and supportive',
      expertise: ['Pain point discovery', 'User profiling', 'Getting started'],
    },
    availability: 'available',
    recommendedFor: [],
  },
  {
    id: 'idea-generator',
    name: 'Idea Generator',
    description: 'Generates business ideas based on your pain point.',
    specialization: ['ideation', 'brainstorming', 'market research'],
    personality: {
      color: 'text-yellow-600',
      icon: 'lightbulb',
      tone: 'creative and enthusiastic',
      expertise: ['Business ideation', 'Market analysis', 'Trend spotting'],
    },
    availability: 'available',
    recommendedFor: [],
  },
  {
    id: 'validator',
    name: 'Validator',
    description: 'Validates your selected idea with market analysis.',
    specialization: ['validation', 'risk assessment', 'feasibility'],
    personality: {
      color: 'text-blue-600',
      icon: 'shield-check',
      tone: 'analytical and helpful',
      expertise: ['Market validation', 'Risk analysis', 'Feasibility studies'],
    },
    availability: 'available',
    recommendedFor: [],
  },
  {
    id: 'builder',
    name: 'Builder',
    description: 'Helps you create PRDs, landing pages, and plan your MVP.',
    specialization: ['product', 'development', 'planning'],
    personality: {
      color: 'text-purple-600',
      icon: 'hammer',
      tone: 'practical and action-oriented',
      expertise: ['PRD creation', 'Landing pages', 'MVP planning', 'Customer discovery'],
    },
    availability: 'available',
    recommendedFor: [],
  },
];

export const AgentProvider = ({ children }: AgentProviderProps) => {
  const [currentAgent, setCurrentAgent] = useState<Agent | null>(null);
  const [availableAgents] = useState<Agent[]>(mockAgents);
  const [isLoading] = useState(false);

  const switchAgent = (agentId: string) => {
    const agent = availableAgents.find((a) => a.id === agentId);
    if (agent) {
      setCurrentAgent(agent);
    }
  };

  const getRecommendedAgents = (phase?: string): Agent[] => {
    if (!phase) return availableAgents.slice(0, 3);

    return availableAgents.filter((agent) =>
      agent.recommendedFor.some((p) => p.id === phase)
    );
  };

  const value: AgentContextType = {
    currentAgent,
    availableAgents,
    isLoading,
    setCurrentAgent,
    switchAgent,
    getRecommendedAgents,
  };

  return (
    <AgentContext.Provider value={value}>{children}</AgentContext.Provider>
  );
};

export default AgentContext;
