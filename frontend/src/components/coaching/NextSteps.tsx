import { motion } from 'framer-motion';
import { ArrowRight, Circle, CheckCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from '../ui';
import { cn } from '../../utils/cn';

interface Step {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: string;
  completed?: boolean;
}

interface NextStepsProps {
  steps?: Step[];
  onStepClick?: (stepId: string) => void;
}

const NextSteps = ({ steps = [], onStepClick }: NextStepsProps) => {
  // Mock steps if none provided
  const displaySteps = steps.length > 0 ? steps : [
    {
      id: '1',
      title: 'Validate your target market',
      description: 'Conduct customer interviews to validate demand',
      difficulty: 'medium' as const,
      estimatedTime: '2-3 days',
      completed: false,
    },
    {
      id: '2',
      title: 'Create a landing page',
      description: 'Build a simple landing page to test interest',
      difficulty: 'easy' as const,
      estimatedTime: '1 day',
      completed: false,
    },
    {
      id: '3',
      title: 'Define your MVP features',
      description: 'List the minimum features needed for launch',
      difficulty: 'medium' as const,
      estimatedTime: '1-2 days',
      completed: false,
    },
  ];

  const difficultyConfig = {
    easy: { color: 'bg-green-100 text-green-800', label: 'Easy' },
    medium: { color: 'bg-yellow-100 text-yellow-800', label: 'Medium' },
    hard: { color: 'bg-red-100 text-red-800', label: 'Hard' },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recommended Next Steps</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displaySteps.map((step, index) => {
            const config = difficultyConfig[step.difficulty];

            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  'p-4 rounded-lg border-2 transition-all',
                  step.completed
                    ? 'bg-green-50 border-green-200'
                    : 'bg-white border-neutral-200 hover:border-primary-300 cursor-pointer'
                )}
                onClick={() => !step.completed && onStepClick?.(step.id)}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {step.completed ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <Circle className="h-5 w-5 text-neutral-400" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4
                        className={cn(
                          'font-medium',
                          step.completed
                            ? 'text-green-900 line-through'
                            : 'text-neutral-900'
                        )}
                      >
                        {step.title}
                      </h4>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge className={config.color} size="sm">
                          {config.label}
                        </Badge>
                      </div>
                    </div>

                    <p
                      className={cn(
                        'text-sm mb-2',
                        step.completed ? 'text-green-700' : 'text-neutral-600'
                      )}
                    >
                      {step.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-neutral-500">
                        ⏱️ {step.estimatedTime}
                      </span>
                      {!step.completed && (
                        <Button
                          size="sm"
                          variant="ghost"
                          rightIcon={<ArrowRight className="h-3 w-3" />}
                          onClick={(e) => {
                            e.stopPropagation();
                            onStepClick?.(step.id);
                          }}
                        >
                          Start
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default NextSteps;
