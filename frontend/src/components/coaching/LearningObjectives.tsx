import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent } from '../ui';
import { cn } from '../../utils/cn';

export interface LearningObjective {
  text: string;
  completed?: boolean;
}

interface LearningObjectivesProps {
  phaseName: string;
  objectives: string[];
  completedObjectives?: string[];
  variant?: 'default' | 'compact' | 'expanded';
  className?: string;
}

/**
 * Displays learning objectives for a phase with optional completion tracking
 */
const LearningObjectives = ({
  phaseName,
  objectives,
  completedObjectives = [],
  variant = 'default',
  className,
}: LearningObjectivesProps) => {
  const [isExpanded, setIsExpanded] = useState(variant === 'expanded');

  const completedCount = objectives.filter(obj =>
    completedObjectives.includes(obj)
  ).length;
  const progressPercentage =
    objectives.length > 0
      ? Math.round((completedCount / objectives.length) * 100)
      : 0;

  if (variant === 'compact') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn(
          'flex items-center gap-2 text-sm text-neutral-600',
          className
        )}
      >
        <BookOpen className="h-4 w-4 text-primary-500" />
        <span>{objectives.length} learning objectives</span>
        {completedCount > 0 && (
          <span className="text-green-600">
            ({completedCount}/{objectives.length} complete)
          </span>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      <Card className="border-primary-100 bg-gradient-to-br from-primary-50/50 to-white">
        <CardContent className="pt-4 pb-4">
          {/* Header */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between gap-3 text-left"
          >
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary-100 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <h4 className="font-semibold text-neutral-900 text-sm">
                  What You'll Learn
                </h4>
                <p className="text-xs text-neutral-500">{phaseName} Phase</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {completedCount > 0 && (
                <span className="text-xs text-green-600 font-medium">
                  {progressPercentage}%
                </span>
              )}
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 text-neutral-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-neutral-400" />
              )}
            </div>
          </button>

          {/* Progress bar */}
          {completedCount > 0 && (
            <div className="mt-3 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-green-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
          )}

          {/* Objectives list */}
          <AnimatePresence>
            {isExpanded && (
              <motion.ul
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-4 space-y-2 overflow-hidden"
              >
                {objectives.map((objective, index) => {
                  const isCompleted = completedObjectives.includes(objective);
                  return (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-start gap-2"
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      ) : (
                        <Circle className="h-4 w-4 text-neutral-300 mt-0.5 flex-shrink-0" />
                      )}
                      <span
                        className={cn(
                          'text-sm',
                          isCompleted
                            ? 'text-neutral-500 line-through'
                            : 'text-neutral-700'
                        )}
                      >
                        {objective}
                      </span>
                    </motion.li>
                  );
                })}
              </motion.ul>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default LearningObjectives;
