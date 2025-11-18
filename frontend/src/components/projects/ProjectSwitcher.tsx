import { useState } from 'react';
import { ChevronDown, FolderKanban, Check } from 'lucide-react';
import { useProject } from '../../contexts/ProjectContext';
import { Modal, ModalFooter, Button, Badge } from '../ui';
import { cn } from '../../utils/cn';

interface ProjectSwitcherProps {
  className?: string;
}

const ProjectSwitcher = ({ className }: ProjectSwitcherProps) => {
  const { currentProject, projects, switchProject } = useProject();
  const [isOpen, setIsOpen] = useState(false);

  const handleSelectProject = (projectId: string) => {
    switchProject(projectId);
    setIsOpen(false);
  };

  return (
    <>
      <Button
        variant="secondary"
        size="md"
        onClick={() => setIsOpen(true)}
        className={cn('justify-between min-w-[200px]', className)}
        rightIcon={<ChevronDown className="h-4 w-4" />}
      >
        <div className="flex items-center gap-2">
          <FolderKanban className="h-4 w-4" />
          <span className="truncate">
            {currentProject ? currentProject.name : 'Select Project'}
          </span>
        </div>
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Switch Project"
        description="Select a project to work on"
        size="md"
      >
        <div className="space-y-2">
          {projects.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-neutral-600">No projects yet</p>
              <p className="text-sm text-neutral-500 mt-1">
                Create your first project to get started
              </p>
            </div>
          ) : (
            projects.map((project) => {
              const isSelected = currentProject?.id === project.id;
              
              return (
                <button
                  key={project.id}
                  onClick={() => handleSelectProject(project.id)}
                  className={cn(
                    'w-full text-left p-4 rounded-lg border-2 transition-all',
                    isSelected
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-neutral-200 hover:border-primary-300 hover:bg-neutral-50'
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-neutral-900 truncate">
                          {project.name}
                        </h4>
                        {isSelected && (
                          <Check className="h-4 w-4 text-primary-600 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-neutral-600 line-clamp-2 mb-2">
                        {project.description}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            project.status === 'active'
                              ? 'success'
                              : project.status === 'completed'
                              ? 'primary'
                              : 'neutral'
                          }
                          size="sm"
                        >
                          {project.status}
                        </Badge>
                        <span className="text-xs text-neutral-500">
                          {project.progress}% complete
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        <ModalFooter>
          <Button variant="ghost" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
};

export default ProjectSwitcher;
