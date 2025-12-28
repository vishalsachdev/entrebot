import { motion } from 'framer-motion';
import { Lightbulb, Wrench, Tag, Check, ArrowRight } from 'lucide-react';
import { Card, CardContent, Badge, Button } from '../ui';
import { cn } from '../../utils/cn';

export interface Idea {
  id: number;
  name: string;
  description: string;
  tool?: string;
  conceptType?: string;
  differentiator?: string;
}

interface IdeaCardProps {
  idea: Idea;
  isSelected?: boolean;
  isCompareMode?: boolean;
  onSelect?: (id: number) => void;
  className?: string;
}

/**
 * Card component for displaying a business idea with selection capability
 */
const IdeaCard = ({
  idea,
  isSelected = false,
  isCompareMode = false,
  onSelect,
  className,
}: IdeaCardProps) => {
  const toolColors: Record<string, string> = {
    'bolt.new': 'bg-purple-100 text-purple-700',
    lovable: 'bg-pink-100 text-pink-700',
    cursor: 'bg-blue-100 text-blue-700',
    'v0.dev': 'bg-green-100 text-green-700',
    replit: 'bg-orange-100 text-orange-700',
    default: 'bg-neutral-100 text-neutral-700',
  };

  const conceptColors: Record<string, string> = {
    marketplace: 'bg-indigo-100 text-indigo-700',
    saas: 'bg-cyan-100 text-cyan-700',
    tool: 'bg-amber-100 text-amber-700',
    community: 'bg-rose-100 text-rose-700',
    automation: 'bg-emerald-100 text-emerald-700',
    default: 'bg-neutral-100 text-neutral-700',
  };

  const getToolColor = (tool?: string) => {
    if (!tool) return toolColors.default;
    const normalized = tool.toLowerCase();
    return toolColors[normalized] || toolColors.default;
  };

  const getConceptColor = (concept?: string) => {
    if (!concept) return conceptColors.default;
    const normalized = concept.toLowerCase();
    for (const key of Object.keys(conceptColors)) {
      if (normalized.includes(key)) {
        return conceptColors[key];
      }
    }
    return conceptColors.default;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: isCompareMode ? 1 : 1.01 }}
      className={className}
    >
      <Card
        className={cn(
          'h-full transition-all duration-200',
          isSelected
            ? 'ring-2 ring-primary-500 border-primary-500 bg-primary-50/30'
            : 'hover:shadow-md hover:border-primary-200',
          isCompareMode && 'min-h-[280px]'
        )}
      >
        <CardContent className="pt-5 pb-4 h-full flex flex-col">
          {/* Header with number and tags */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold',
                  isSelected
                    ? 'bg-primary-500 text-white'
                    : 'bg-primary-100 text-primary-700'
                )}
              >
                {idea.id}
              </div>
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex items-center gap-1 text-xs text-primary-600 font-medium"
                >
                  <Check className="h-3.5 w-3.5" />
                  Selected
                </motion.div>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5 justify-end">
              {idea.tool && (
                <Badge
                  size="sm"
                  className={cn('gap-1', getToolColor(idea.tool))}
                >
                  <Wrench className="h-3 w-3" />
                  {idea.tool}
                </Badge>
              )}
              {idea.conceptType && (
                <Badge
                  size="sm"
                  className={cn('gap-1', getConceptColor(idea.conceptType))}
                >
                  <Tag className="h-3 w-3" />
                  {idea.conceptType}
                </Badge>
              )}
            </div>
          </div>

          {/* Idea name */}
          <h3 className="font-semibold text-neutral-900 mb-2 flex items-start gap-2">
            <Lightbulb className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
            <span>{idea.name}</span>
          </h3>

          {/* Description */}
          <p className="text-sm text-neutral-600 mb-3 flex-grow">
            {idea.description}
          </p>

          {/* Differentiator if provided */}
          {idea.differentiator && (
            <div className="text-xs bg-amber-50 text-amber-800 rounded-md px-2.5 py-1.5 mb-3">
              <span className="font-medium">What makes it different: </span>
              {idea.differentiator}
            </div>
          )}

          {/* Action button */}
          {onSelect && !isSelected && (
            <Button
              variant={isSelected ? 'secondary' : 'primary'}
              size="sm"
              className="w-full mt-auto"
              onClick={() => onSelect(idea.id)}
              rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
            >
              Select This Idea
            </Button>
          )}

          {isSelected && (
            <div className="text-center text-sm text-primary-600 font-medium mt-auto py-2">
              Currently validating this idea
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default IdeaCard;
