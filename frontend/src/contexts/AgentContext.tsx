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

// Mock agents data - in production, this would come from the API
const mockAgents: Agent[] = [
  {
    id: 'idea-generator',
    name: 'Idea Generator',
    description: 'Helps you brainstorm and refine business ideas',
    specialization: ['ideation', 'brainstorming', 'market research'],
    personality: {
      color: 'text-yellow-600',
      icon: 'lightbulb',
      tone: 'creative and enthusiastic',
      expertise: ['Business ideation', 'Market analysis', 'Trend spotting'],
    },
    availability: 'available',
    recommendedFor: [
      {
        id: 'discovery',
        name: 'Discovery',
        description: 'Explore and validate your business concept',
        status: 'not_started',
        milestones: [],
        estimatedDuration: '1-2 weeks',
        requiredAgents: ['idea-generator'],
      },
    ],
  },
  {
    id: 'validator',
    name: 'Validator',
    description: 'Validates your business concept and identifies risks',
    specialization: ['validation', 'risk assessment', 'feasibility'],
    personality: {
      color: 'text-blue-600',
      icon: 'shield-check',
      tone: 'analytical and thorough',
      expertise: ['Market validation', 'Risk analysis', 'Feasibility studies'],
    },
    availability: 'available',
    recommendedFor: [
      {
        id: 'validation',
        name: 'Validation',
        description: 'Test and validate your business hypothesis',
        status: 'not_started',
        milestones: [],
        estimatedDuration: '2-3 weeks',
        requiredAgents: ['validator'],
      },
    ],
  },
  {
    id: 'strategist',
    name: 'Strategist',
    description: 'Develops comprehensive business strategies and plans',
    specialization: ['strategy', 'planning', 'roadmapping'],
    personality: {
      color: 'text-purple-600',
      icon: 'target',
      tone: 'strategic and forward-thinking',
      expertise: ['Business strategy', 'Go-to-market planning', 'Competitive analysis'],
    },
    availability: 'available',
    recommendedFor: [
      {
        id: 'planning',
        name: 'Planning',
        description: 'Create detailed business and execution plans',
        status: 'not_started',
        milestones: [],
        estimatedDuration: '3-4 weeks',
        requiredAgents: ['strategist'],
      },
    ],
  },
  {
    id: 'builder',
    name: 'Builder',
    description: 'Guides you through product development and MVP creation',
    specialization: ['product development', 'mvp', 'technical guidance'],
    personality: {
      color: 'text-green-600',
      icon: 'hammer',
      tone: 'practical and hands-on',
      expertise: ['Product development', 'MVP creation', 'Technical architecture'],
    },
    availability: 'available',
    recommendedFor: [
      {
        id: 'building',
        name: 'Building',
        description: 'Develop your minimum viable product',
        status: 'not_started',
        milestones: [],
        estimatedDuration: '4-8 weeks',
        requiredAgents: ['builder'],
      },
    ],
  },
  {
    id: 'growth-advisor',
    name: 'Growth Advisor',
    description: 'Helps scale your business and optimize growth',
    specialization: ['growth', 'marketing', 'scaling'],
    personality: {
      color: 'text-orange-600',
      icon: 'trending-up',
      tone: 'energetic and results-driven',
      expertise: ['Growth hacking', 'Marketing strategy', 'Customer acquisition'],
    },
    availability: 'available',
    recommendedFor: [
      {
        id: 'growth',
        name: 'Growth',
        description: 'Scale and optimize your business',
        status: 'not_started',
        milestones: [],
        estimatedDuration: 'Ongoing',
        requiredAgents: ['growth-advisor'],
      },
    ],
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
