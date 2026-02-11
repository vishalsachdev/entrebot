// Database API service methods
import { apiClient } from './api';
import type {
  DbUser,
  DbSession,
  DbConversation,
  DbMemory,
  UpdateUserForm,
  CreateMemoryForm,
  UpdateMemoryForm,
} from '../types/database';
import type { ApiResponse } from '../types';

const unwrap = async <T>(promise: Promise<ApiResponse<T>>): Promise<T> => {
  const response = await promise;
  return response.data;
};

const normalizeMemoryValue = (value: unknown): string => {
  if (typeof value === 'string') {
    return value;
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

const normalizeMemory = (memory: DbMemory): DbMemory => ({
  ...memory,
  value: normalizeMemoryValue(memory.value),
});

// User endpoints
export const userService = {
  getUser: (userId: string) =>
    unwrap(apiClient.get<ApiResponse<DbUser>>(`/users/${userId}`)),

  updateUser: (userId: string, data: UpdateUserForm) =>
    unwrap(apiClient.put<ApiResponse<DbUser>>(`/users/${userId}`, data)),

  getAllUsers: () => unwrap(apiClient.get<ApiResponse<DbUser[]>>('/users')),
};

// Session endpoints
export const sessionService = {
  getSession: (sessionId: string) =>
    unwrap(apiClient.get<ApiResponse<DbSession>>(`/sessions/${sessionId}`)),

  getUserSessions: (userId: string) =>
    unwrap(
      apiClient.get<ApiResponse<DbSession[]>>(
        `/sessions/users/${userId}/sessions`
      )
    ),

  createSession: (userId: string, metadata?: Record<string, unknown>) =>
    unwrap(
      apiClient.post<ApiResponse<DbSession>>('/sessions', { userId, metadata })
    ),

  deleteSession: (sessionId: string) =>
    unwrap(apiClient.delete<ApiResponse<void>>(`/sessions/${sessionId}`)),
};

// Conversation endpoints
export const conversationService = {
  getConversations: (sessionId: string) =>
    unwrap(
      apiClient.get<ApiResponse<DbConversation[]>>(
        `/conversations/${sessionId}`
      )
    ),

  createMessage: (
    sessionId: string,
    role: 'user' | 'assistant' | 'system',
    content: string
  ) =>
    unwrap(
      apiClient.post<ApiResponse<DbConversation>>('/conversations', {
        sessionId,
        role,
        content,
      })
    ),
};

// Memory endpoints
export const memoryService = {
  getMemories: (sessionId: string) =>
    unwrap(
      apiClient
        .get<
          ApiResponse<{ memory: Record<string, unknown> }>
        >(`/memory/${sessionId}`)
        .then(response => ({
          ...response,
          data: Object.entries(response.data.memory || {}).map(
            ([key, value]) => ({
              id: `${sessionId}:${key}`,
              session_id: sessionId,
              key,
              value: normalizeMemoryValue(value),
              created_at: '',
              updated_at: '',
            })
          ),
        }))
    ),

  createMemory: async (sessionId: string, data: CreateMemoryForm) =>
    normalizeMemory(
      await unwrap(
        apiClient.post<ApiResponse<DbMemory>>('/memory', {
          sessionId,
          ...data,
        })
      )
    ),

  updateMemory: async (memoryId: string, data: UpdateMemoryForm) => {
    const [sessionId, key] = memoryId.split(':');
    return normalizeMemory(
      await unwrap(
        apiClient.post<ApiResponse<DbMemory>>('/memory', {
          sessionId,
          key,
          value: data.value,
        })
      )
    );
  },

  deleteMemory: (memoryId: string) => {
    const [sessionId, key] = memoryId.split(':');
    return unwrap(
      apiClient.delete<ApiResponse<void>>(`/memory/${sessionId}/${key}`)
    );
  },
};
