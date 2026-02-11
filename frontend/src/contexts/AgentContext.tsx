import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  type ReactNode,
} from 'react';
import type { Agent, AgentPrerequisite } from '../types';

// Callback type for agent switch events (internal use)
type AgentSwitchCallback = (fromAgent: Agent | null, toAgent: Agent) => void;

export interface AgentContextType {
  currentAgent: Agent | null;
  availableAgents: Agent[];
  isLoading: boolean;
  setCurrentAgent: (agent: Agent | null) => void;
  switchAgent: (agentId: string) => void;
  getRecommendedAgents: (phase?: string) => Agent[];
  onAgentSwitch: (callback: AgentSwitchCallback) => () => void;
  refreshPrerequisites: () => Promise<void>;
  sessionMemory: Record<string, unknown>;
}

const AgentContext = createContext<AgentContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
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

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

// Define prerequisites for each agent
const agentPrerequisites: Record<string, AgentPrerequisite[]> = {
  'idea-generator': [
    {
      memoryKey: 'USER_PAIN',
      label: 'Pain Point',
      description: 'Share your frustration with the Onboarding agent first',
    },
  ],
  validator: [
    {
      memoryKey: 'SelectedIdea',
      label: 'Selected Idea',
      description: 'Generate and select an idea with the Idea Generator first',
    },
  ],
  builder: [
    {
      memoryKey: 'SelectedIdea',
      label: 'Selected Idea',
      description: 'You need a validated idea before building',
    },
  ],
  'prompt-engineer': [
    {
      memoryKey: 'PRD',
      label: 'PRD',
      description: 'Create your PRD before generating build prompts',
    },
  ],
  'go-to-market': [
    {
      memoryKey: 'PRD',
      label: 'PRD',
      description:
        'Create your product strategy and PRD before launch planning',
    },
  ],
  'growth-coach': [
    {
      memoryKey: 'LAUNCH_PLAN',
      label: 'Launch Plan',
      description: 'Create your launch plan before moving into growth coaching',
    },
  ],
};

// Agents for the user journey - only show user-facing agents in selector
const baseAgents: Agent[] = [
  {
    id: 'onboarding',
    name: 'Start Here',
    description:
      "Tell me about yourself and a problem you want to solve. I'll help you turn it into a business idea.",
    specialization: ['onboarding', 'pain discovery', 'profile setup'],
    personality: {
      color: 'text-emerald-600',
      icon: 'user-plus',
      tone: 'friendly and supportive',
      expertise: ['Pain point discovery', 'User profiling', 'Getting started'],
    },
    availability: 'available',
    recommendedFor: [],
    prerequisites: [],
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
    prerequisites: agentPrerequisites['idea-generator'],
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
    prerequisites: agentPrerequisites['validator'],
  },
  {
    id: 'prompt-engineer',
    name: 'Prompt Engineer',
    description:
      'Generates tool-specific prompts for Bolt, Cursor, v0, Lovable, and Replit.',
    specialization: ['prompting', 'ai-builders', 'execution'],
    personality: {
      color: 'text-amber-600',
      icon: 'lightbulb',
      tone: 'precise and implementation-focused',
      expertise: ['Tool-specific prompts', 'MVP scoping', 'Build constraints'],
    },
    availability: 'available',
    recommendedFor: [],
    prerequisites: agentPrerequisites['prompt-engineer'],
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
      expertise: [
        'PRD creation',
        'Landing pages',
        'MVP planning',
        'Customer discovery',
      ],
    },
    availability: 'available',
    recommendedFor: [],
    prerequisites: agentPrerequisites['builder'],
  },
  {
    id: 'go-to-market',
    name: 'Go-to-Market',
    description:
      'Build launch strategy, messaging, channel plan, and launch-ready content assets.',
    specialization: ['launch', 'positioning', 'marketing'],
    personality: {
      color: 'text-indigo-600',
      icon: 'target',
      tone: 'strategic and execution-focused',
      expertise: [
        'Go-to-market strategy',
        'Channel prioritization',
        'Launch content',
      ],
    },
    availability: 'available',
    recommendedFor: [],
    prerequisites: agentPrerequisites['go-to-market'],
  },
  {
    id: 'growth-coach',
    name: 'Growth Coach',
    description:
      'Optimize post-launch traction with KPI tracking, feedback loops, and experiments.',
    specialization: ['growth', 'retention', 'experiments'],
    personality: {
      color: 'text-teal-600',
      icon: 'trending-up',
      tone: 'analytical and momentum-driven',
      expertise: ['Growth loops', 'KPI coaching', 'Post-launch iteration'],
    },
    availability: 'available',
    recommendedFor: [],
    prerequisites: agentPrerequisites['growth-coach'],
  },
];

export const AgentProvider = ({ children }: AgentProviderProps) => {
  const [currentAgent, setCurrentAgent] = useState<Agent | null>(null);
  const [sessionMemory, setSessionMemory] = useState<Record<string, unknown>>(
    {}
  );
  const [isLoading] = useState(false);

  // Store callbacks for agent switch events
  const switchCallbacksRef = useRef<Set<AgentSwitchCallback>>(new Set());

  // Check if an agent's prerequisites are met based on session memory
  const checkPrerequisitesMet = useCallback(
    (agent: Agent): { met: boolean; missing: AgentPrerequisite[] } => {
      if (!agent.prerequisites || agent.prerequisites.length === 0) {
        return { met: true, missing: [] };
      }

      const missing = agent.prerequisites.filter(
        prereq => !sessionMemory[prereq.memoryKey]
      );

      return { met: missing.length === 0, missing };
    },
    [sessionMemory]
  );

  // Compute available agents with prerequisite status
  const availableAgents = baseAgents.map(agent => {
    const { met, missing } = checkPrerequisitesMet(agent);
    return {
      ...agent,
      prerequisitesMet: met,
      missingPrerequisites: missing,
    };
  });

  // Fetch session memory from backend
  const refreshPrerequisites = useCallback(async () => {
    const sessionId = localStorage.getItem('venturebot_session_id');
    if (!sessionId) {
      setSessionMemory({});
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/memory/${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.memory) {
          // Backend returns { data: { memory: { key: value, ... } } }
          setSessionMemory(data.data.memory);
        }
      }
    } catch (error) {
      console.error('Failed to fetch session memory:', error);
    }
  }, []);

  // Refresh prerequisites on mount and when session changes
  useEffect(() => {
    refreshPrerequisites();

    // Also refresh when storage changes (for cross-tab support)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'venturebot_session_id') {
        refreshPrerequisites();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [refreshPrerequisites]);

  const switchAgent = useCallback(
    (agentId: string) => {
      const agent = availableAgents.find(a => a.id === agentId);
      if (agent) {
        // Refresh prerequisites when switching agents
        refreshPrerequisites();

        // Notify all registered callbacks before switching
        setCurrentAgent(prevAgent => {
          // Only notify if actually switching to a different agent
          if (prevAgent?.id !== agent.id) {
            switchCallbacksRef.current.forEach(callback => {
              callback(prevAgent, agent);
            });
          }
          return agent;
        });
      }
    },
    [availableAgents, refreshPrerequisites]
  );

  const getRecommendedAgents = useCallback(
    (phase?: string): Agent[] => {
      if (!phase) return availableAgents.slice(0, 3);

      return availableAgents.filter(agent =>
        agent.recommendedFor.some(p => p.id === phase)
      );
    },
    [availableAgents]
  );

  // Register a callback to be notified when agent switches
  const onAgentSwitch = useCallback((callback: AgentSwitchCallback) => {
    switchCallbacksRef.current.add(callback);
    // Return unsubscribe function
    return () => {
      switchCallbacksRef.current.delete(callback);
    };
  }, []);

  const value: AgentContextType = {
    currentAgent,
    availableAgents,
    isLoading,
    setCurrentAgent,
    switchAgent,
    getRecommendedAgents,
    onAgentSwitch,
    refreshPrerequisites,
    sessionMemory,
  };

  return (
    <AgentContext.Provider value={value}>{children}</AgentContext.Provider>
  );
};

export default AgentContext;
