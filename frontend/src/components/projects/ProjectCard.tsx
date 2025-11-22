import { motion } from 'framer-motion';
import { MoreVertical, Calendar, TrendingUp, Users } from 'lucide-react';
import { Card, CardContent, Badge } from '../ui';
import { cn } from '../../utils/cn';
import type { Project } from '../../types';

interface ProjectCardProps {
  project: Project;
  onClick?: () => void;
}

const ProjectCard = ({ project, onClick }: ProjectCardProps) => {
  const statusConfig = {
    active: { color: 'bg-green-100 text-green-800', label: 'Active' },
    paused: { color: 'bg-yellow-100 text-yellow-800', label: 'Paused' },
    completed: { color: 'bg-blue-100 text-blue-800', label: 'Completed' },
    archived: { color: 'bg-neutral-100 text-neutral-800', label: 'Archived' },
  };

  const status = statusConfig[project.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className="cursor-pointer hover:shadow-lg transition-all"
        onClick={onClick}
      >
        <CardContent className="pt-6">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-neutral-900 mb-1 truncate">
                {project.name}
              </h3>
              <p className="text-sm text-neutral-600 line-clamp-2">
                {project.description}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                // Show menu
              }}
              className="ml-2 p-1 hover:bg-neutral-100 rounded transition-colors"
            >
              <MoreVertical className="h-4 w-4 text-neutral-600" />
            </button>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <Badge className={status.color}>{status.label}</Badge>
            <Badge variant="secondary">{project.currentPhase.name}</Badge>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-neutral-600">Progress</span>
              <span className="font-medium text-neutral-900">
                {project.progress}%
              </span>
            </div>
            <div className="w-full bg-neutral-200 rounded-full h-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${project.progress}%` }}
                transition={{ duration: 0.5 }}
                className={cn(
                  'h-2 rounded-full',
                  project.status === 'completed'
                    ? 'bg-blue-600'
                    : project.status === 'active'
                    ? 'bg-green-600'
                    : 'bg-neutral-400'
                )}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between text-xs text-neutral-600">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>
                {new Date(project.lastActivity).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                <span>{project.milestones.filter((m) => m.completed).length} / {project.milestones.length}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                <span>{project.agents.length}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ProjectCard;
