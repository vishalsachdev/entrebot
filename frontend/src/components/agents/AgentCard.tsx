import { motion } from 'framer-motion';
import { Lightbulb, ShieldCheck, Target, Hammer, TrendingUp, Check } from 'lucide-react';
import { Card, CardContent, Badge } from '../ui';
import { cn } from '../../utils/cn';
import type { Agent } from '../../types';

interface AgentCardProps {
  agent: Agent;
  isSelected?: boolean;
  isRecommended?: boolean;
  onClick?: () => void;
}

const iconMap: Record<string, React.ElementType> = {
  lightbulb: Lightbulb,
  'shield-check': ShieldCheck,
  target: Target,
  hammer: Hammer,
  'trending-up': TrendingUp,
};

const AgentCard = ({ agent, isSelected, isRecommended, onClick }: AgentCardProps) => {
  const Icon = iconMap[agent.personality.icon] || Lightbulb;

  const availabilityColors = {
    available: 'bg-green-100 text-green-800',
    busy: 'bg-yellow-100 text-yellow-800',
    offline: 'bg-neutral-100 text-neutral-800',
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={cn(
          'cursor-pointer transition-all relative',
          isSelected
            ? 'ring-2 ring-primary-500 shadow-lg'
            : 'hover:shadow-md',
          onClick && 'hover:border-primary-300'
        )}
        onClick={onClick}
      >
        {isSelected && (
          <div className="absolute top-3 right-3 h-6 w-6 bg-primary-600 rounded-full flex items-center justify-center">
            <Check className="h-4 w-4 text-white" />
          </div>
        )}

        {isRecommended && (
          <div className="absolute top-3 left-3">
            <Badge variant="accent" size="sm">
              Recommended
            </Badge>
          </div>
        )}

        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div
              className={cn(
                'h-12 w-12 rounded-lg flex items-center justify-center flex-shrink-0',
                agent.personality.color.replace('text-', 'bg-').replace('600', '100')
              )}
            >
              <Icon className={cn('h-6 w-6', agent.personality.color)} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-semibold text-neutral-900">{agent.name}</h3>
                <Badge
                  variant="neutral"
                  size="sm"
                  className={availabilityColors[agent.availability]}
                >
                  {agent.availability}
                </Badge>
              </div>

              <p className="text-sm text-neutral-600 mb-3">
                {agent.description}
              </p>

              <div className="space-y-2">
                <div>
                  <p className="text-xs font-medium text-neutral-700 mb-1">
                    Specialization
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {agent.specialization.slice(0, 3).map((spec) => (
                      <Badge key={spec} variant="secondary" size="sm">
                        {spec}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-neutral-700 mb-1">
                    Expertise
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {agent.personality.expertise.slice(0, 2).map((exp) => (
                      <span
                        key={exp}
                        className="text-xs text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded"
                      >
                        {exp}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AgentCard;
