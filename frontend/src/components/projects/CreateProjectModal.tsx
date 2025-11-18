import { useState, type FormEvent } from 'react';
import { useProject } from '../../contexts/ProjectContext';
import { useProgress } from '../../contexts/ProgressContext';
import { Modal, ModalFooter, Button, Input, Textarea, Alert } from '../ui';
import type { Project } from '../../types';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateProjectModal = ({ isOpen, onClose }: CreateProjectModalProps) => {
  const { addProject } = useProject();
  const { allPhases } = useProgress();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Project name is required');
      return;
    }

    if (!description.trim()) {
      setError('Project description is required');
      return;
    }

    setIsSubmitting(true);

    try {
      const newProject: Project = {
        id: `project-${Date.now()}`,
        name: name.trim(),
        description: description.trim(),
        currentPhase: allPhases[0], // Start with Discovery phase
        progress: 0,
        createdAt: new Date(),
        lastActivity: new Date(),
        milestones: [],
        agents: [],
        status: 'active',
      };

      addProject(newProject);
      
      // Reset form
      setName('');
      setDescription('');
      onClose();
    } catch (err) {
      setError('Failed to create project. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setName('');
      setDescription('');
      setError('');
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Project"
      description="Start a new entrepreneurship venture"
      size="md"
    >
      <form onSubmit={handleSubmit}>
        {error && (
          <Alert variant="error" className="mb-4" onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <div className="space-y-4">
          <Input
            label="Project Name"
            placeholder="e.g., Sustainable Fashion Marketplace"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />

          <Textarea
            label="Description"
            placeholder="Describe your business idea and what problem it solves..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            required
          />

          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-900">
              <strong>Getting Started:</strong> Your project will begin in the Discovery phase. 
              You'll work with AI agents to explore and validate your business concept.
            </p>
          </div>
        </div>

        <ModalFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            disabled={isSubmitting}
          >
            Create Project
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};

export default CreateProjectModal;
