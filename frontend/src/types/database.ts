// Database model types

export interface DbUser {
  id: string;
  name: string;
  phone_number: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface DbSession {
  id: string;
  user_id: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface DbConversation {
  id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
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
