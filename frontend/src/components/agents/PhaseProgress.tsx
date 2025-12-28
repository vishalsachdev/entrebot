import { cn } from '../../utils/cn';

// Phase configuration matching backend orchestrator
const PHASES = [
  {
    id: 'discovery',
    label: 'Discover',
    icon: '🔍',
    description: 'Find your pain point',
  },
  {
    id: 'ideation',
    label: 'Ideate',
    icon: '💡',
    description: 'Generate solutions',
  },
  {
    id: 'validation',
    label: 'Validate',
    icon: '✓',
    description: 'Test assumptions',
  },
  {
    id: 'strategy',
    label: 'Strategy',
    icon: '📋',
    description: 'Plan your product',
  },
  {
    id: 'building',
    label: 'Build',
    icon: '🔨',
    description: 'Create your MVP',
  },
  { id: 'launch', label: 'Launch', icon: '🚀', description: 'Go to market' },
  {
    id: 'growth',
    label: 'Grow',
    icon: '📈',
    description: 'Scale your business',
  },
];

export interface Progress {
  currentPhase: string;
  phaseName: string;
  phaseDescription: string;
  progress: {
    percentage: number;
    completedPhases: string[];
    remainingPhases: string[];
  };
  milestones: string[];
  context: {
    userName?: string;
    painPoint?: string;
    selectedIdea?: string;
  };
}

interface PhaseProgressProps {
  progress: Progress | null;
}

export const PhaseProgress = ({ progress }: PhaseProgressProps) => {
  const currentPhase = progress?.currentPhase || 'discovery';
  const completedPhases = progress?.progress?.completedPhases || [];
  const progressPercentage = progress?.progress?.percentage || 0;

  return (
    <div className="border-b border-neutral-200 px-4 py-3 bg-gradient-to-r from-primary-50 to-white">
      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-neutral-600">
            {progress?.phaseName || 'Discovery'}:{' '}
            {progress?.phaseDescription || 'Find your pain point'}
          </span>
          <span className="text-xs font-semibold text-primary-600">
            {progressPercentage}%
          </span>
        </div>
        <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Phase Steps */}
      <div className="flex items-center justify-between overflow-x-auto pb-1">
        {PHASES.map((phase, index) => {
          const isCompleted = completedPhases.includes(phase.id);
          const isCurrent = currentPhase === phase.id;

          return (
            <div key={phase.id} className="flex items-center flex-shrink-0">
              <div
                className={cn(
                  'flex flex-col items-center px-1.5 py-1 rounded-lg transition-all',
                  isCurrent && 'bg-primary-50'
                )}
                title={phase.description}
              >
                <div
                  className={cn(
                    'w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium mb-0.5',
                    isCurrent
                      ? 'bg-primary-600 text-white ring-2 ring-primary-300 ring-offset-1'
                      : isCompleted
                        ? 'bg-primary-200 text-primary-700'
                        : 'bg-neutral-200 text-neutral-400'
                  )}
                >
                  {isCompleted ? '✓' : phase.icon}
                </div>
                <span
                  className={cn(
                    'text-[10px] font-medium whitespace-nowrap',
                    isCurrent
                      ? 'text-primary-700'
                      : isCompleted
                        ? 'text-primary-600'
                        : 'text-neutral-400'
                  )}
                >
                  {phase.label}
                </span>
              </div>
              {index < PHASES.length - 1 && (
                <div
                  className={cn(
                    'w-4 h-0.5 mx-0.5 flex-shrink-0',
                    isCompleted ? 'bg-primary-400' : 'bg-neutral-200'
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Context Summary (if available) */}
      {progress?.context?.userName && (
        <div className="mt-2 pt-2 border-t border-neutral-100 flex items-center gap-4 text-xs text-neutral-500">
          <span>👤 {progress.context.userName}</span>
          {progress.context.painPoint && (
            <span
              className="truncate max-w-[200px]"
              title={progress.context.painPoint}
            >
              💡 {progress.context.painPoint}
            </span>
          )}
          {progress.milestones?.length > 0 && (
            <span className="text-primary-600">
              🏆 {progress.milestones.length} milestone
              {progress.milestones.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default PhaseProgress;
