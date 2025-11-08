// Database API service methods
import apiClient from './api';
import type {
  DbUser,
  DbSession,
  DbConversation,
  DbMemory,
  UpdateUserForm,
  CreateMemoryForm,
  UpdateMemoryForm,
} from '../types/database';

// User endpoints
export const userService = {
  getUser: (userId: string) =>
    apiClient.get<DbUser>(`/users/${userId}`),

  updateUser: (userId: string, data: UpdateUserForm) =>
    apiClient.put<DbUser>(`/users/${userId}`, data),

  getAllUsers: () =>
    apiClient.get<DbUser[]>('/users'),
};

// Session endpoints
export const sessionService = {
  getSession: (sessionId: string) =>
    apiClient.get<DbSession>(`/sessions/${sessionId}`),

  getUserSessions: (userId: string) =>
    apiClient.get<DbSession[]>(`/users/${userId}/sessions`),

  createSession: (userId: string, metadata?: Record<string, unknown>) =>
    apiClient.post<DbSession>('/sessions', { user_id: userId, metadata }),

  deleteSession: (sessionId: string) =>
    apiClient.delete<void>(`/sessions/${sessionId}`),
};

// Conversation endpoints
export const conversationService = {
  getConversations: (sessionId: string) =>
    apiClient.get<DbConversation[]>(`/conversations/${sessionId}`),

  createMessage: (sessionId: string, role: 'user' | 'assistant' | 'system', content: string) =>
    apiClient.post<DbConversation>('/conversations', {
      session_id: sessionId,
      role,
      content,
    }),
};

// Memory endpoints
export const memoryService = {
  getMemories: (sessionId: string) =>
    apiClient.get<DbMemory[]>(`/sessions/${sessionId}/memories`),

  createMemory: (sessionId: string, data: CreateMemoryForm) =>
    apiClient.post<DbMemory>('/memories', {
      session_id: sessionId,
      ...data,
    }),

  updateMemory: (memoryId: string, data: UpdateMemoryForm) =>
    apiClient.put<DbMemory>(`/memories/${memoryId}`, data),

  deleteMemory: (memoryId: string) =>
    apiClient.delete<void>(`/memories/${memoryId}`),
};
