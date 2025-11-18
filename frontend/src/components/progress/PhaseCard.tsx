import { motion } from 'framer-motion';
import { Check, Circle, Lock } from 'lucide-react';
import { Card, CardContent, Badge } from '../ui';
import { cn } from '../../utils/cn';
import type { JourneyPhase } from '../../types';

interface PhaseCardProps {
  phase: JourneyPhase;
  index: number;
  isActive?: boolean;
  progress?: number;
  onClick?: () => void;
}

const PhaseCard = ({ phase, index, isActive, progress = 0, onClick }: PhaseCardProps) => {
  const statusConfig = {
    not_started: {
      icon: Lock,
      color: 'text-neutral-400',
      bgColor: 'bg-neutral-100',
      badge: 'Not Started',
      badgeVariant: 'neutral' as const,
    },
    in_progress: {
      icon: Circle,
      color: 'text-primary-600',
      bgColor: 'bg-primary-100',
      badge: 'In Progress',
      badgeVariant: 'primary' as const,
    },
    completed: {
      icon: Check,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      badge: 'Completed',
      badgeVariant: 'success' as const,
    },
  };

  const config = statusConfig[phase.status];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      whileHover={{ scale: 1.02 }}
      className="relative"
    >
      <Card
        className={cn(
          'cursor-pointer transition-all',
          isActive
            ? 'ring-2 ring-primary-500 shadow-lg'
            : 'hover:shadow-md',
          phase.status === 'not_started' && 'opacity-75'
        )}
        onClick={onClick}
      >
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div
              className={cn(
                'h-12 w-12 rounded-lg flex items-center justify-center flex-shrink-0',
                config.bgColor
              )}
            >
              <Icon className={cn('h-6 w-6', config.color)} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-neutral-500">
                      Phase {index + 1}
                    </span>
                    <Badge variant={config.badgeVariant} size="sm">
                      {config.badge}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-neutral-900">
                    {phase.name}
                  </h3>
                </div>
              </div>

              <p className="text-sm text-neutral-600 mb-3">
                {phase.description}
              </p>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-600">Progress</span>
                  <span className="font-medium text-neutral-900">
                    {progress}%
                  </span>
                </div>
                <div className="w-full bg-neutral-200 rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, delay: index * 0.1 + 0.2 }}
                    className={cn(
                      'h-2 rounded-full',
                      phase.status === 'completed'
                        ? 'bg-green-600'
                        : phase.status === 'in_progress'
                        ? 'bg-primary-600'
                        : 'bg-neutral-300'
                    )}
                  />
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between text-xs text-neutral-600">
                <span>{phase.estimatedDuration}</span>
                <span>{phase.milestones.length} milestones</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default PhaseCard;
