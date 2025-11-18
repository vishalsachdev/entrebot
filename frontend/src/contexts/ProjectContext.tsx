import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Project } from '../types';

export interface ProjectContextType {
  currentProject: Project | null;
  projects: Project[];
  isLoading: boolean;
  setCurrentProject: (project: Project | null) => void;
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  switchProject: (id: string) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

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

export const ProjectProvider = ({ children }: ProjectProviderProps) => {
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load projects from localStorage on mount
  useEffect(() => {
    try {
      const storedProjects = localStorage.getItem('projects');
      const storedCurrentProjectId = localStorage.getItem('currentProjectId');

      if (storedProjects) {
        const parsedProjects = JSON.parse(storedProjects);
        setProjects(parsedProjects);

        if (storedCurrentProjectId) {
          const current = parsedProjects.find(
            (p: Project) => p.id === storedCurrentProjectId
          );
          if (current) {
            setCurrentProject(current);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save projects to localStorage whenever they change
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('projects', JSON.stringify(projects));
    }
  }, [projects, isLoading]);

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

  const addProject = (project: Project) => {
    setProjects((prev) => [...prev, project]);
    setCurrentProject(project);
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );

    if (currentProject?.id === id) {
      setCurrentProject((prev) => (prev ? { ...prev, ...updates } : null));
    }
  };

  const deleteProject = (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));

    if (currentProject?.id === id) {
      setCurrentProject(null);
    }
  };

  const switchProject = (id: string) => {
    const project = projects.find((p) => p.id === id);
    if (project) {
      setCurrentProject(project);
    }
  };

  const value: ProjectContextType = {
    currentProject,
    projects,
    isLoading,
    setCurrentProject,
    addProject,
    updateProject,
    deleteProject,
    switchProject,
  };

  return (
    <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
  );
};

export default ProjectContext;
