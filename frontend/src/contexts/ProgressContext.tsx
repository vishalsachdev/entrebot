import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import type { JourneyPhase, Milestone } from '../types';

export interface ProgressContextType {
  currentPhase: JourneyPhase | null;
  allPhases: JourneyPhase[];
  milestones: Milestone[];
  overallProgress: number;
  isLoading: boolean;
  setCurrentPhase: (phase: JourneyPhase) => void;
  updatePhaseStatus: (
    phaseId: string,
    status: 'not_started' | 'in_progress' | 'completed'
  ) => void;
  completeMilestone: (milestoneId: string) => void;
  addMilestone: (milestone: Milestone) => void;
  getPhaseProgress: (phaseId: string) => number;
}

const ProgressContext = createContext<ProgressContextType | undefined>(
  undefined
);

// eslint-disable-next-line react-refresh/only-export-components
export const useProgress = () => {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  return context;
};

interface ProgressProviderProps {
  children: ReactNode;
}

// Default journey phases
const defaultPhases: JourneyPhase[] = [
  {
    id: 'discovery',
    name: 'Discovery',
    description: 'Explore and identify your business opportunity',
    status: 'not_started',
    milestones: [],
    estimatedDuration: '1-2 weeks',
    requiredAgents: ['idea-generator'],
  },
  {
    id: 'ideation',
    name: 'Ideation',
    description: 'Develop and refine your business concept',
    status: 'not_started',
    milestones: [],
    estimatedDuration: '1-2 weeks',
    requiredAgents: ['idea-generator'],
  },
  {
    id: 'validation',
    name: 'Validation',
    description: 'Test and validate your business hypothesis',
    status: 'not_started',
    milestones: [],
    estimatedDuration: '2-3 weeks',
    requiredAgents: ['validator'],
  },
  {
    id: 'planning',
    name: 'Planning',
    description: 'Create detailed business and execution plans',
    status: 'not_started',
    milestones: [],
    estimatedDuration: '3-4 weeks',
    requiredAgents: ['builder'],
  },
  {
    id: 'building',
    name: 'Building',
    description: 'Develop your minimum viable product',
    status: 'not_started',
    milestones: [],
    estimatedDuration: '4-8 weeks',
    requiredAgents: ['builder'],
  },
  {
    id: 'launch',
    name: 'Launch',
    description: 'Bring your product to market',
    status: 'not_started',
    milestones: [],
    estimatedDuration: '2-4 weeks',
    requiredAgents: ['builder'],
  },
  {
    id: 'growth',
    name: 'Growth',
    description: 'Scale and optimize your business',
    status: 'not_started',
    milestones: [],
    estimatedDuration: 'Ongoing',
    requiredAgents: ['builder'],
  },
];

export const ProgressProvider = ({ children }: ProgressProviderProps) => {
  const [currentPhase, setCurrentPhase] = useState<JourneyPhase | null>(null);
  const [allPhases, setAllPhases] = useState<JourneyPhase[]>(defaultPhases);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load progress from localStorage on mount
  useEffect(() => {
    try {
      const storedPhases = localStorage.getItem('journeyPhases');
      const storedMilestones = localStorage.getItem('milestones');
      const storedCurrentPhaseId = localStorage.getItem('currentPhaseId');

      if (storedPhases) {
        const parsedPhases = JSON.parse(storedPhases);
        setAllPhases(parsedPhases);

        if (storedCurrentPhaseId) {
          const current = parsedPhases.find(
            (p: JourneyPhase) => p.id === storedCurrentPhaseId
          );
          if (current) {
            setCurrentPhase(current);
          }
        }
      }

      if (storedMilestones) {
        setMilestones(JSON.parse(storedMilestones));
      }
    } catch (error) {
      console.error('Failed to load progress:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save phases to localStorage
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('journeyPhases', JSON.stringify(allPhases));
    }
  }, [allPhases, isLoading]);

  // Save milestones to localStorage
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('milestones', JSON.stringify(milestones));
    }
  }, [milestones, isLoading]);

  // Save current phase ID
  useEffect(() => {
    if (!isLoading) {
      if (currentPhase) {
        localStorage.setItem('currentPhaseId', currentPhase.id);
      } else {
        localStorage.removeItem('currentPhaseId');
      }
    }
  }, [currentPhase, isLoading]);

  const updatePhaseStatus = (
    phaseId: string,
    status: 'not_started' | 'in_progress' | 'completed'
  ) => {
    setAllPhases(prev =>
      prev.map(phase => (phase.id === phaseId ? { ...phase, status } : phase))
    );

    if (currentPhase?.id === phaseId) {
      setCurrentPhase(prev => (prev ? { ...prev, status } : null));
    }
  };

  const completeMilestone = (milestoneId: string) => {
    setMilestones(prev =>
      prev.map(m =>
        m.id === milestoneId
          ? { ...m, completed: true, completedAt: new Date() }
          : m
      )
    );
  };

  const addMilestone = (milestone: Milestone) => {
    setMilestones(prev => [...prev, milestone]);
  };

  const getPhaseProgress = (phaseId: string): number => {
    const phaseMilestones = milestones.filter(m => m.phase === phaseId);
    if (phaseMilestones.length === 0) return 0;

    const completed = phaseMilestones.filter(m => m.completed).length;
    return Math.round((completed / phaseMilestones.length) * 100);
  };

  const overallProgress = (() => {
    const completedPhases = allPhases.filter(
      p => p.status === 'completed'
    ).length;
    return Math.round((completedPhases / allPhases.length) * 100);
  })();

  const value: ProgressContextType = {
    currentPhase,
    allPhases,
    milestones,
    overallProgress,
    isLoading,
    setCurrentPhase,
    updatePhaseStatus,
    completeMilestone,
    addMilestone,
    getPhaseProgress,
  };

  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  );
};

export default ProgressContext;
