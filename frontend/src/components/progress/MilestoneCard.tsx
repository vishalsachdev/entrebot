import { motion } from 'framer-motion';
import { Check, Circle, Flag } from 'lucide-react';
import { Card, CardContent, Badge } from '../ui';
import { cn } from '../../utils/cn';
import type { Milestone } from '../../types';

interface MilestoneCardProps {
  milestone: Milestone;
  onComplete?: () => void;
}

const MilestoneCard = ({ milestone, onComplete }: MilestoneCardProps) => {
  const priorityConfig = {
    low: { color: 'text-neutral-600', bgColor: 'bg-neutral-100', variant: 'neutral' as const },
    medium: { color: 'text-yellow-600', bgColor: 'bg-yellow-100', variant: 'warning' as const },
    high: { color: 'text-red-600', bgColor: 'bg-red-100', variant: 'danger' as const },
  };

  const config = priorityConfig[milestone.priority];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ scale: 1.01 }}
    >
      <Card
        className={cn(
          'transition-all',
          milestone.completed
            ? 'bg-green-50 border-green-200'
            : 'hover:shadow-md cursor-pointer'
        )}
        onClick={!milestone.completed ? onComplete : undefined}
      >
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                'h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
                milestone.completed
                  ? 'bg-green-600'
                  : config.bgColor
              )}
            >
              {milestone.completed ? (
                <Check className="h-4 w-4 text-white" />
              ) : (
                <Circle className={cn('h-4 w-4', config.color)} />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h4
                  className={cn(
                    'font-medium',
                    milestone.completed
                      ? 'text-green-900 line-through'
                      : 'text-neutral-900'
                  )}
                >
                  {milestone.name}
                </h4>
                <Badge variant={config.variant} size="sm">
                  {milestone.priority}
                </Badge>
              </div>

              <p
                className={cn(
                  'text-sm mb-2',
                  milestone.completed ? 'text-green-700' : 'text-neutral-600'
                )}
              >
                {milestone.description}
              </p>

              <div className="flex items-center gap-2 text-xs text-neutral-500">
                <Flag className="h-3 w-3" />
                <span>{milestone.phase}</span>
                {milestone.completedAt && (
                  <>
                    <span>•</span>
                    <span>
                      Completed {new Date(milestone.completedAt).toLocaleDateString()}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default MilestoneCard;
