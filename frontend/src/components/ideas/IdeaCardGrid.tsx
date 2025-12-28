import { motion } from 'framer-motion';
import { LayoutGrid, List } from 'lucide-react';
import { useState } from 'react';
import IdeaCard, { type Idea } from './IdeaCard';
import { Button } from '../ui';
import { cn } from '../../utils/cn';

interface IdeaCardGridProps {
  ideas: Idea[];
  selectedIdeaId?: number;
  onSelectIdea?: (id: number) => void;
  className?: string;
}

/**
 * Grid/list view for comparing multiple business ideas
 */
const IdeaCardGrid = ({
  ideas,
  selectedIdeaId,
  onSelectIdea,
  className,
}: IdeaCardGridProps) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  if (ideas.length === 0) {
    return (
      <div className="text-center py-8 text-neutral-500">
        No ideas generated yet
      </div>
    );
  }

  return (
    <div className={className}>
      {/* View mode toggle */}
      {ideas.length > 1 && (
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-neutral-600">
            {ideas.length} ideas to compare
          </p>
          <div className="flex items-center gap-1 bg-neutral-100 rounded-lg p-0.5">
            <Button
              size="sm"
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              className={cn(
                'h-7 px-2',
                viewMode === 'grid' && 'bg-white shadow-sm'
              )}
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              className={cn(
                'h-7 px-2',
                viewMode === 'list' && 'bg-white shadow-sm'
              )}
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Ideas grid/list */}
      <motion.div
        className={cn(
          viewMode === 'grid'
            ? 'grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
            : 'flex flex-col gap-3'
        )}
        layout
      >
        {ideas.map((idea, index) => (
          <motion.div
            key={idea.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <IdeaCard
              idea={idea}
              isSelected={selectedIdeaId === idea.id}
              isCompareMode={viewMode === 'grid' && ideas.length > 1}
              onSelect={onSelectIdea}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Selection hint */}
      {!selectedIdeaId && ideas.length > 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-sm text-neutral-500 mt-4"
        >
          Click &quot;Select This Idea&quot; to move forward with validation
        </motion.p>
      )}
    </div>
  );
};

export default IdeaCardGrid;
