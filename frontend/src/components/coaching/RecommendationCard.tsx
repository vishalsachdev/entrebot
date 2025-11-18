import { motion } from 'framer-motion';
import { ArrowRight, Lightbulb, AlertCircle } from 'lucide-react';
import { Card, CardContent, Badge, Button } from '../ui';
import { cn } from '../../utils/cn';

interface Recommendation {
  id: string;
  title: string;
  description: string;
  reasoning: string;
  priority: 'low' | 'medium' | 'high';
  expectedOutcome: string;
  actionLabel: string;
  actionPath: string;
}

interface RecommendationCardProps {
  recommendation: Recommendation;
  onAction?: () => void;
}

const RecommendationCard = ({ recommendation, onAction }: RecommendationCardProps) => {
  const priorityConfig = {
    low: { color: 'bg-neutral-100 text-neutral-800', icon: Lightbulb },
    medium: { color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
    high: { color: 'bg-red-100 text-red-800', icon: AlertCircle },
  };

  const config = priorityConfig[recommendation.priority];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
    >
      <Card className="hover:shadow-md transition-all">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                'h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0',
                config.color
              )}
            >
              <Icon className="h-5 w-5" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="font-semibold text-neutral-900">
                  {recommendation.title}
                </h4>
                <Badge
                  variant={
                    recommendation.priority === 'high'
                      ? 'danger'
                      : recommendation.priority === 'medium'
                      ? 'warning'
                      : 'neutral'
                  }
                  size="sm"
                >
                  {recommendation.priority}
                </Badge>
              </div>

              <p className="text-sm text-neutral-600 mb-3">
                {recommendation.description}
              </p>

              <div className="space-y-2 mb-4">
                <div className="text-xs">
                  <span className="font-medium text-neutral-700">Why: </span>
                  <span className="text-neutral-600">{recommendation.reasoning}</span>
                </div>
                <div className="text-xs">
                  <span className="font-medium text-neutral-700">Expected: </span>
                  <span className="text-neutral-600">
                    {recommendation.expectedOutcome}
                  </span>
                </div>
              </div>

              <Button
                size="sm"
                variant="primary"
                rightIcon={<ArrowRight className="h-3 w-3" />}
                onClick={onAction}
              >
                {recommendation.actionLabel}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default RecommendationCard;
