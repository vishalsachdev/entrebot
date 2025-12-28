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
  currentPhase?: string;
  completedMilestones?: string[];
  onStepClick?: (stepId: string) => void;
}

// Phase-specific next steps
const PHASE_STEPS: Record<string, Step[]> = {
  discovery: [
    {
      id: 'intro-yourself',
      title: 'Introduce yourself',
      description: 'Share your name and background with your AI coach',
      difficulty: 'easy',
      estimatedTime: '2 minutes',
    },
    {
      id: 'describe-pain',
      title: 'Describe your pain point',
      description: 'Tell us about a problem you face regularly',
      difficulty: 'easy',
      estimatedTime: '5 minutes',
    },
    {
      id: 'validate-pain',
      title: 'Validate your pain point',
      description: 'Explore how often this problem occurs and its impact',
      difficulty: 'medium',
      estimatedTime: '10 minutes',
    },
  ],
  ideation: [
    {
      id: 'generate-ideas',
      title: 'Generate business ideas',
      description: 'Let AI help you brainstorm solutions to your pain point',
      difficulty: 'easy',
      estimatedTime: '5 minutes',
    },
    {
      id: 'evaluate-ideas',
      title: 'Evaluate your ideas',
      description: 'Compare the generated ideas and consider trade-offs',
      difficulty: 'medium',
      estimatedTime: '15 minutes',
    },
    {
      id: 'select-idea',
      title: 'Select your best idea',
      description: 'Choose the idea you want to pursue',
      difficulty: 'easy',
      estimatedTime: '5 minutes',
    },
  ],
  validation: [
    {
      id: 'market-research',
      title: 'Review market research',
      description: 'Analyze market size, competitors, and trends',
      difficulty: 'medium',
      estimatedTime: '20 minutes',
    },
    {
      id: 'customer-interviews',
      title: 'Plan customer interviews',
      description: 'Identify potential customers to validate demand',
      difficulty: 'hard',
      estimatedTime: '2-3 days',
    },
    {
      id: 'make-decision',
      title: 'Make a go/no-go decision',
      description: 'Decide whether to proceed based on validation',
      difficulty: 'medium',
      estimatedTime: '30 minutes',
    },
  ],
  strategy: [
    {
      id: 'define-mvp',
      title: 'Define your MVP features',
      description: 'List the minimum features needed for launch',
      difficulty: 'medium',
      estimatedTime: '1-2 hours',
    },
    {
      id: 'create-prd',
      title: 'Create your PRD',
      description: 'Document product requirements with AI assistance',
      difficulty: 'medium',
      estimatedTime: '2-3 hours',
    },
    {
      id: 'plan-tech',
      title: 'Plan your tech stack',
      description: 'Choose technologies for building your MVP',
      difficulty: 'hard',
      estimatedTime: '1-2 hours',
    },
  ],
  building: [
    {
      id: 'get-prompts',
      title: 'Get AI building prompts',
      description: 'Generate prompts for tools like Bolt, Cursor, or v0',
      difficulty: 'easy',
      estimatedTime: '15 minutes',
    },
    {
      id: 'build-mvp',
      title: 'Build your MVP',
      description: 'Use AI tools to create your minimum viable product',
      difficulty: 'hard',
      estimatedTime: '1-2 weeks',
    },
    {
      id: 'test-mvp',
      title: 'Test your MVP',
      description: 'Ensure core functionality works correctly',
      difficulty: 'medium',
      estimatedTime: '2-3 days',
    },
  ],
  launch: [
    {
      id: 'create-launch-plan',
      title: 'Create launch plan',
      description: 'Plan your go-to-market strategy',
      difficulty: 'medium',
      estimatedTime: '2-3 hours',
    },
    {
      id: 'prepare-assets',
      title: 'Prepare marketing assets',
      description: 'Create landing page, social posts, and content',
      difficulty: 'medium',
      estimatedTime: '1-2 days',
    },
    {
      id: 'launch',
      title: 'Launch your product',
      description: 'Go live and share with your first users',
      difficulty: 'medium',
      estimatedTime: '1 day',
    },
  ],
  growth: [
    {
      id: 'gather-feedback',
      title: 'Gather user feedback',
      description: 'Collect insights from your first users',
      difficulty: 'easy',
      estimatedTime: 'Ongoing',
    },
    {
      id: 'analyze-metrics',
      title: 'Analyze key metrics',
      description: 'Track usage, retention, and conversion',
      difficulty: 'medium',
      estimatedTime: 'Ongoing',
    },
    {
      id: 'iterate',
      title: 'Iterate on your product',
      description: 'Improve based on feedback and data',
      difficulty: 'hard',
      estimatedTime: 'Ongoing',
    },
  ],
};

// Default steps when no phase is specified
const DEFAULT_STEPS: Step[] = [
  {
    id: '1',
    title: 'Start your coaching session',
    description: 'Chat with your AI coach to begin your journey',
    difficulty: 'easy',
    estimatedTime: '5 minutes',
    completed: false,
  },
  {
    id: '2',
    title: 'Share your pain point',
    description: 'Tell us about a problem you want to solve',
    difficulty: 'easy',
    estimatedTime: '10 minutes',
    completed: false,
  },
  {
    id: '3',
    title: 'Generate business ideas',
    description: 'Let AI help you brainstorm solutions',
    difficulty: 'medium',
    estimatedTime: '15 minutes',
    completed: false,
  },
];

// Map milestones to step IDs
const MILESTONE_TO_STEP: Record<string, string> = {
  name_collected: 'intro-yourself',
  pain_articulated: 'describe-pain',
  pain_validated: 'validate-pain',
  ideas_generated: 'generate-ideas',
  idea_selected: 'select-idea',
  validation_complete: 'market-research',
  decision_made: 'make-decision',
  prd_created: 'create-prd',
  mvp_scoped: 'define-mvp',
  prompts_generated: 'get-prompts',
  mvp_started: 'build-mvp',
  mvp_complete: 'test-mvp',
  launch_plan_created: 'create-launch-plan',
  launched: 'launch',
  first_user: 'gather-feedback',
  first_feedback: 'analyze-metrics',
  iteration_complete: 'iterate',
};

const NextSteps = ({
  steps = [],
  currentPhase,
  completedMilestones = [],
  onStepClick,
}: NextStepsProps) => {
  // Determine which steps to show
  let displaySteps: Step[] = [];

  if (steps.length > 0) {
    // Use provided steps
    displaySteps = steps;
  } else if (currentPhase && PHASE_STEPS[currentPhase]) {
    // Use phase-specific steps with completion status
    const completedStepIds = completedMilestones
      .map(m => MILESTONE_TO_STEP[m])
      .filter(Boolean);

    displaySteps = PHASE_STEPS[currentPhase].map(step => ({
      ...step,
      completed: completedStepIds.includes(step.id),
    }));
  } else {
    // Use default steps
    displaySteps = DEFAULT_STEPS;
  }

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
                        {step.estimatedTime}
                      </span>
                      {!step.completed && (
                        <Button
                          size="sm"
                          variant="ghost"
                          rightIcon={<ArrowRight className="h-3 w-3" />}
                          onClick={e => {
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
