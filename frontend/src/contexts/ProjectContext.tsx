import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import type { Project, DbProject } from '../types';
import { projectService } from '../services/api';

export interface ProjectContextType {
  currentProject: Project | null;
  projects: Project[];
  isLoading: boolean;
  error: string | null;
  setCurrentProject: (project: Project | null) => void;
  addProject: (name: string, description?: string) => Promise<Project>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  switchProject: (id: string) => void;
  refreshProjects: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};

interface ProjectProviderProps {
  children: ReactNode;
}

/**
 * Transform database project to frontend project format
 * Adds default values for computed fields
 */
function dbProjectToProject(dbProject: DbProject): Project {
  return {
    id: dbProject.id,
    name: dbProject.name,
    description: dbProject.description || '',
    // Map database status to frontend-compatible status
    status: mapDbStatusToFrontend(dbProject.status),
    progress: 0, // Computed field - would be calculated from milestones
    createdAt: new Date(dbProject.created_at),
    lastActivity: new Date(dbProject.updated_at),
    // These are computed/aggregated fields - defaults for now
    currentPhase: {
      id: dbProject.status,
      name: formatPhaseName(dbProject.status),
      description: '',
      status: 'in_progress',
      milestones: [],
      estimatedDuration: '',
      requiredAgents: [],
    },
    milestones: [],
    agents: [],
  };
}

/**
 * Map database status enum to frontend status
 */
function mapDbStatusToFrontend(
  dbStatus: DbProject['status']
): Project['status'] {
  const statusMap: Record<DbProject['status'], Project['status']> = {
    ideation: 'active',
    validation: 'active',
    strategy: 'active',
    planning: 'active',
    building: 'active',
    launched: 'completed',
    active: 'active',
    paused: 'paused',
    abandoned: 'archived',
  };
  return statusMap[dbStatus] || 'active';
}

/**
 * Map frontend status to database status
 */
function mapFrontendStatusToDb(
  frontendStatus: Project['status']
): DbProject['status'] {
  const statusMap: Record<Project['status'], DbProject['status']> = {
    active: 'active',
    paused: 'paused',
    completed: 'launched',
    archived: 'abandoned',
  };
  return statusMap[frontendStatus] || 'active';
}

/**
 * Format phase name for display
 */
function formatPhaseName(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
}

/**
 * Get user ID from localStorage or return demo user
 */
function getUserId(): string | null {
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      return user.id || null;
    }
  } catch {
    // Ignore parsing errors
  }
  return null;
}

export const ProjectProvider = ({ children }: ProjectProviderProps) => {
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load projects from API on mount
  const loadProjects = useCallback(async () => {
    const userId = getUserId();
    if (!userId) {
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      const dbProjects = await projectService.getUserProjects(userId);
      const frontendProjects = dbProjects.map(dbProjectToProject);
      setProjects(frontendProjects);

      // Restore current project from localStorage if available
      const storedCurrentProjectId = localStorage.getItem('currentProjectId');
      if (storedCurrentProjectId) {
        const current = frontendProjects.find(
          p => p.id === storedCurrentProjectId
        );
        if (current) {
          setCurrentProject(current);
        }
      }
    } catch (err) {
      console.error('Failed to load projects:', err);
      setError(err instanceof Error ? err.message : 'Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // Save current project ID to localStorage
  useEffect(() => {
    if (!isLoading) {
      if (currentProject) {
        localStorage.setItem('currentProjectId', currentProject.id);
      } else {
        localStorage.removeItem('currentProjectId');
      }
    }
  }, [currentProject, isLoading]);

  const addProject = async (
    name: string,
    description?: string
  ): Promise<Project> => {
    const userId = getUserId();
    if (!userId) {
      throw new Error('User not logged in');
    }

    try {
      setError(null);
      const dbProject = await projectService.createProject(
        userId,
        name,
        description
      );
      const project = dbProjectToProject(dbProject);
      setProjects(prev => [project, ...prev]);
      setCurrentProject(project);
      return project;
    } catch (err) {
      console.error('Failed to create project:', err);
      setError(err instanceof Error ? err.message : 'Failed to create project');
      throw err;
    }
  };

  const updateProject = async (
    id: string,
    updates: Partial<Project>
  ): Promise<void> => {
    try {
      setError(null);

      // Transform frontend updates to database format
      const dbUpdates: {
        name?: string;
        description?: string;
        status?: DbProject['status'];
      } = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.description !== undefined)
        dbUpdates.description = updates.description;
      if (updates.status !== undefined)
        dbUpdates.status = mapFrontendStatusToDb(updates.status);

      const dbProject = await projectService.updateProject(id, dbUpdates);
      const updatedProject = dbProjectToProject(dbProject);

      setProjects(prev =>
        prev.map(p => (p.id === id ? { ...p, ...updatedProject } : p))
      );

      if (currentProject?.id === id) {
        setCurrentProject(prev =>
          prev ? { ...prev, ...updatedProject } : null
        );
      }
    } catch (err) {
      console.error('Failed to update project:', err);
      setError(err instanceof Error ? err.message : 'Failed to update project');
      throw err;
    }
  };

  const deleteProject = async (id: string): Promise<void> => {
    try {
      setError(null);
      await projectService.deleteProject(id);
      setProjects(prev => prev.filter(p => p.id !== id));

      if (currentProject?.id === id) {
        setCurrentProject(null);
      }
    } catch (err) {
      console.error('Failed to delete project:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete project');
      throw err;
    }
  };

  const switchProject = (id: string) => {
    const project = projects.find(p => p.id === id);
    if (project) {
      setCurrentProject(project);
    }
  };

  const refreshProjects = async () => {
    setIsLoading(true);
    await loadProjects();
  };

  const value: ProjectContextType = {
    currentProject,
    projects,
    isLoading,
    error,
    setCurrentProject,
    addProject,
    updateProject,
    deleteProject,
    switchProject,
    refreshProjects,
  };

  return (
    <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
  );
};

export default ProjectContext;
