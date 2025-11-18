import { motion } from 'framer-motion';
import { Check, Circle } from 'lucide-react';
import { useProgress } from '../../contexts/ProgressContext';
import { cn } from '../../utils/cn';

interface ProgressTrackerProps {
  className?: string;
  variant?: 'horizontal' | 'vertical';
}

const ProgressTracker = ({ className, variant = 'horizontal' }: ProgressTrackerProps) => {
  const { allPhases, currentPhase } = useProgress();

  const isHorizontal = variant === 'horizontal';

  return (
    <div
      className={cn(
        'relative',
        isHorizontal ? 'flex items-center' : 'flex flex-col',
        className
      )}
    >
      {allPhases.map((phase, index) => {
        const isActive = currentPhase?.id === phase.id;
        const isCompleted = phase.status === 'completed';
        const isInProgress = phase.status === 'in_progress';
        const isLast = index === allPhases.length - 1;

        return (
          <div
            key={phase.id}
            className={cn(
              'relative flex items-center',
              isHorizontal ? 'flex-1' : 'flex-row mb-8 last:mb-0'
            )}
          >
            {/* Phase Node */}
            <div className="relative z-10 flex flex-col items-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className={cn(
                  'h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all',
                  isCompleted
                    ? 'bg-green-600 border-green-600'
                    : isInProgress || isActive
                    ? 'bg-primary-600 border-primary-600'
                    : 'bg-white border-neutral-300'
                )}
              >
                {isCompleted ? (
                  <Check className="h-5 w-5 text-white" />
                ) : isInProgress || isActive ? (
                  <Circle className="h-5 w-5 text-white fill-current" />
                ) : (
                  <span className="text-sm font-medium text-neutral-500">
                    {index + 1}
                  </span>
                )}
              </motion.div>

              {/* Phase Label */}
              <div
                className={cn(
                  'mt-2 text-center',
                  isHorizontal ? 'absolute top-12 w-24' : 'ml-4 text-left'
                )}
              >
                <p
                  className={cn(
                    'text-xs font-medium',
                    isActive || isInProgress
                      ? 'text-primary-700'
                      : isCompleted
                      ? 'text-green-700'
                      : 'text-neutral-600'
                  )}
                >
                  {phase.name}
                </p>
                {isActive && (
                  <p className="text-xs text-neutral-500 mt-0.5">Current</p>
                )}
              </div>
            </div>

            {/* Connector Line */}
            {!isLast && (
              <div
                className={cn(
                  'absolute',
                  isHorizontal
                    ? 'left-10 right-0 top-5 h-0.5'
                    : 'left-5 top-10 bottom-0 w-0.5'
                )}
              >
                <motion.div
                  initial={{ width: 0, height: 0 }}
                  animate={
                    isHorizontal
                      ? { width: '100%' }
                      : { height: '100%' }
                  }
                  transition={{ duration: 0.5, delay: index * 0.1 + 0.2 }}
                  className={cn(
                    isCompleted
                      ? 'bg-green-600'
                      : isInProgress
                      ? 'bg-primary-600'
                      : 'bg-neutral-300',
                    isHorizontal ? 'h-full' : 'w-full'
                  )}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ProgressTracker;
