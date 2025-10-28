// Core application types

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  preferences: UserPreferences;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  defaultAgent: string;
  notificationSettings: NotificationSettings;
  dashboardLayout: DashboardLayout;
}

export interface NotificationSettings {
  milestones: boolean;
  agentRecommendations: boolean;
  projectUpdates: boolean;
  email: boolean;
  push: boolean;
}

export interface DashboardLayout {
  widgets: string[];
  layout: 'grid' | 'list';
}

export interface Project {
  id: string;
  name: string;
  description: string;
  currentPhase: JourneyPhase;
  progress: number; // 0-100
  createdAt: Date;
  lastActivity: Date;
  milestones: Milestone[];
  agents: AgentInteraction[];
  status: 'active' | 'paused' | 'completed' | 'archived';
}

export interface JourneyPhase {
  id: string;
  name: string;
  description: string;
  status: 'not_started' | 'in_progress' | 'completed';
  milestones: Milestone[];
  estimatedDuration: string;
  requiredAgents: string[];
}

export interface Milestone {
  id: string;
  name: string;
  description: string;
  completed: boolean;
  completedAt?: Date;
  phase: string;
  priority: 'low' | 'medium' | 'high';
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  specialization: string[];
  personality: AgentPersonality;
  availability: 'available' | 'busy' | 'offline';
  recommendedFor: JourneyPhase[];
}

export interface AgentPersonality {
  color: string;
  icon: string;
  tone: string;
  expertise: string[];
}

export interface AgentInteraction {
  id: string;
  agentId: string;
  sessionId: string;
  startedAt: Date;
  endedAt?: Date;
  messageCount: number;
  context: SessionContext;
}

export interface Session {
  id: string;
  projectId: string;
  agentId: string;
  messages: Message[];
  context: SessionContext;
  createdAt: Date;
  lastActivity: Date;
}

export interface SessionContext {
  currentPhase: string;
  memory: Record<string, unknown>;
  goals: string[];
  nextSteps: string[];
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  agentId?: string;
  timestamp: Date;
  status: 'sending' | 'sent' | 'delivered' | 'error';
  metadata?: {
    agent?: string;
    phase?: string;
    milestone?: string;
  };
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface ProjectForm {
  name: string;
  description: string;
}

// Context types
export interface UserContextType {
  user: User | null;
  currentProject: Project | null;
  projects: Project[];
  preferences: UserPreferences;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginForm) => Promise<void>;
  logout: () => void;
  updatePreferences: (preferences: Partial<UserPreferences>) => void;
  switchProject: (projectId: string) => void;
}

export interface AgentContextType {
  currentAgent: Agent | null;
  availableAgents: Agent[];
  isLoading: boolean;
  switchAgent: (agentId: string) => void;
  getRecommendedAgents: (phase?: string) => Agent[];
}

export interface ProjectContextType {
  currentProject: Project | null;
  projects: Project[];
  isLoading: boolean;
  createProject: (project: ProjectForm) => Promise<Project>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  switchProject: (id: string) => void;
}