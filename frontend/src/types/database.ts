// Database model types

export interface DbUser {
  id: string;
  name: string;
  phone_number: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface DbProject {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  status:
    | 'ideation'
    | 'validation'
    | 'strategy'
    | 'planning'
    | 'building'
    | 'launched'
    | 'active'
    | 'paused'
    | 'abandoned';
  created_at: string;
  updated_at: string;
}

export interface DbSession {
  id: string;
  user_id: string;
  project_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface DbConversation {
  id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

export interface DbMemory {
  id: string;
  session_id: string;
  key: string;
  value: string;
  created_at: string;
  updated_at: string;
}

// Form types
export interface UpdateUserForm {
  name?: string;
  phone_number?: string;
  email?: string;
}

export interface CreateMemoryForm {
  key: string;
  value: string;
}

export interface UpdateMemoryForm {
  value: string;
}
