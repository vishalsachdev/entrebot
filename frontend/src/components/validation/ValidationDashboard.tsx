import { motion } from 'framer-motion';
import {
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  TrendingUp,
  Target,
  Users,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Button } from '../ui';
import { cn } from '../../utils/cn';

export interface ValidationDashboardProps {
  feasibility: number;
  marketDemand: number;
  competition: number;
  differentiation: number;
  riskiestAssumption?: string;
  validationTest?: string;
  recommendation?: 'proceed' | 'pivot' | 'explore_different';
  onDecision?: (decision: string) => void;
}

interface ScoreConfig {
  label: string;
  icon: typeof TrendingUp;
  description: string;
}

const scoreConfigs: Record<string, ScoreConfig> = {
  feasibility: {
    label: 'Feasibility',
    icon: CheckCircle,
    description: 'Technical and operational viability',
  },
  marketDemand: {
    label: 'Market Demand',
    icon: TrendingUp,
    description: 'Customer interest and need',
  },
  competition: {
    label: 'Competition',
    icon: Users,
    description: 'Market positioning advantage',
  },
  differentiation: {
    label: 'Differentiation',
    icon: Sparkles,
    description: 'Unique value proposition',
  },
};

const getScoreColor = (
  score: number
): { bg: string; fill: string; text: string; border: string } => {
  if (score <= 3) {
    return {
      bg: 'bg-red-100',
      fill: 'bg-red-500',
      text: 'text-red-700',
      border: 'border-red-200',
    };
  }
  if (score <= 6) {
    return {
      bg: 'bg-yellow-100',
      fill: 'bg-yellow-500',
      text: 'text-yellow-700',
      border: 'border-yellow-200',
    };
  }
  return {
    bg: 'bg-green-100',
    fill: 'bg-green-500',
    text: 'text-green-700',
    border: 'border-green-200',
  };
};

const getScoreLabel = (score: number): string => {
  if (score <= 3) return 'Low';
  if (score <= 6) return 'Medium';
  return 'High';
};

interface ScoreGaugeProps {
  score: number;
  config: ScoreConfig;
  index: number;
}

const ScoreGauge = ({ score, config, index }: ScoreGaugeProps) => {
  const colors = getScoreColor(score);
  const Icon = config.icon;
  const percentage = (score / 10) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className={cn('p-4 rounded-lg border', colors.bg, colors.border)}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className={cn('p-2 rounded-lg bg-white/60')}>
          <Icon className={cn('h-5 w-5', colors.text)} />
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-neutral-900 text-sm">
            {config.label}
          </h4>
          <p className="text-xs text-neutral-600">{config.description}</p>
        </div>
        <div className="text-right">
          <span className={cn('text-2xl font-bold', colors.text)}>{score}</span>
          <span className="text-neutral-500 text-sm">/10</span>
        </div>
      </div>

      <div className="relative">
        <div className="w-full bg-white/60 rounded-full h-3">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{
              duration: 0.6,
              delay: index * 0.1 + 0.2,
              ease: 'easeOut',
            }}
            className={cn('h-3 rounded-full', colors.fill)}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className={cn('text-xs font-medium', colors.text)}>
            {getScoreLabel(score)}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

interface CircularGaugeProps {
  score: number;
  size?: number;
  strokeWidth?: number;
}

const CircularGauge = ({
  score,
  size = 120,
  strokeWidth = 10,
}: CircularGaugeProps) => {
  const colors = getScoreColor(score);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percentage = (score / 10) * 100;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={score <= 3 ? '#ef4444' : score <= 6 ? '#eab308' : '#22c55e'}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: 'easeOut' }}
          style={{
            strokeDasharray: circumference,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn('text-3xl font-bold', colors.text)}>
          {score.toFixed(1)}
        </span>
        <span className="text-xs text-neutral-500">out of 10</span>
      </div>
    </div>
  );
};

const ValidationDashboard = ({
  feasibility,
  marketDemand,
  competition,
  differentiation,
  riskiestAssumption,
  validationTest,
  recommendation,
  onDecision,
}: ValidationDashboardProps) => {
  const scores = {
    feasibility,
    marketDemand,
    competition,
    differentiation,
  };

  const overallScore =
    (feasibility + marketDemand + competition + differentiation) / 4;
  const overallColors = getScoreColor(overallScore);

  const getRecommendationText = () => {
    switch (recommendation) {
      case 'proceed':
        return 'Strong foundation detected. Recommended to proceed with validation.';
      case 'pivot':
        return 'Some areas need improvement. Consider pivoting your approach.';
      case 'explore_different':
        return 'Significant challenges identified. Exploring a different idea may be beneficial.';
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Overall Score */}
      <Card variant="elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary-600" />
            Overall Validation Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-center gap-6">
            <CircularGauge score={overallScore} />
            <div className="flex-1 text-center md:text-left">
              <p
                className={cn('text-lg font-semibold mb-1', overallColors.text)}
              >
                {getScoreLabel(overallScore)} Validation Score
              </p>
              <p className="text-sm text-neutral-600">
                {getRecommendationText() ||
                  'Review individual scores below for detailed insights.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual Scores */}
      <Card>
        <CardHeader>
          <CardTitle>Dimension Scores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.entries(scores).map(([key, value], index) => (
              <ScoreGauge
                key={key}
                score={value}
                config={scoreConfigs[key]}
                index={index}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Riskiest Assumption */}
      {riskiestAssumption && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="p-3 bg-amber-100 rounded-lg h-fit">
                  <AlertTriangle className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-amber-900 mb-1">
                    Riskiest Assumption
                  </h4>
                  <p className="text-sm text-amber-800">{riskiestAssumption}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Validation Test Suggestion */}
      {validationTest && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.6 }}
        >
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="p-3 bg-blue-100 rounded-lg h-fit">
                  <Lightbulb className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-blue-900 mb-1">
                    Quick Validation Test
                  </h4>
                  <p className="text-sm text-blue-800">{validationTest}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Decision Buttons */}
      {onDecision && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.7 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>What would you like to do?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => onDecision('proceed')}
                  className={cn(
                    'flex-1 bg-green-600 hover:bg-green-700 focus:ring-green-500',
                    recommendation === 'proceed' &&
                      'ring-2 ring-green-400 ring-offset-2'
                  )}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Proceed
                </Button>
                <Button
                  onClick={() => onDecision('pivot')}
                  className={cn(
                    'flex-1 bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-400 text-yellow-950',
                    recommendation === 'pivot' &&
                      'ring-2 ring-yellow-400 ring-offset-2'
                  )}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Pivot
                </Button>
                <Button
                  onClick={() => onDecision('explore_different')}
                  variant="secondary"
                  className={cn(
                    'flex-1',
                    recommendation === 'explore_different' &&
                      'ring-2 ring-neutral-400 ring-offset-2'
                  )}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Explore Different Idea
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ValidationDashboard;
