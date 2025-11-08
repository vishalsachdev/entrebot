/**
 * API Service Layer for EntreBot
 *
 * Provides comprehensive, production-ready API client with:
 * - Retry logic with exponential backoff
 * - Request timeout handling
 * - Error handling and formatting
 * - Loading state management
 * - Type-safe operations for all database tables
 *
 * @module services/api
 */

import type {
  DbUser,
  DbSession,
  DbConversation,
  DbMemory,
  ApiResponse,
  ApiError,
  CreateUserRequest,
  UpdateUserRequest,
  CreateSessionRequest,
  AddMessageRequest,
  SetMemoryRequest,
} from '../types';

// ============================================================================
// Configuration
// ============================================================================

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const DEFAULT_TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second base delay

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Sleep utility for retry delays
 * @param ms - Milliseconds to sleep
 */
const sleep = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * Calculate exponential backoff delay
 * @param attempt - Current retry attempt (0-indexed)
 * @returns Delay in milliseconds
 */
const getRetryDelay = (attempt: number): number =>
  RETRY_DELAY * Math.pow(2, attempt);

/**
 * Check if error is retryable
 * @param status - HTTP status code
 * @returns True if request should be retried
 */
const isRetryableError = (status?: number): boolean => {
  if (!status) return true; // Network errors
  return status >= 500 || status === 408 || status === 429;
};

// ============================================================================
// API Client Class
// ============================================================================

class ApiClient {
  private baseURL: string;
  private token: string | null = null;
  private timeout: number = DEFAULT_TIMEOUT;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('auth_token');
  }

  /**
   * Set authentication token
   * @param token - JWT or auth token
   */
  setToken(token: string): void {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  /**
   * Clear authentication token
   */
  clearToken(): void {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  /**
   * Set request timeout
   * @param ms - Timeout in milliseconds
   */
  setTimeout(ms: number): void {
    this.timeout = ms;
  }

  /**
   * Create fetch request with timeout
   * @param url - Request URL
   * @param options - Fetch options
   * @returns Promise with fetch response
   */
  private async fetchWithTimeout(
    url: string,
    options: RequestInit
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }

  /**
   * Make HTTP request with retry logic
   * @param endpoint - API endpoint
   * @param options - Request options
   * @param retries - Number of retry attempts remaining
   * @returns Parsed response data
   * @throws {ApiError} When request fails after all retries
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retries = MAX_RETRIES
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await this.fetchWithTimeout(url, {
        ...options,
        headers,
      });

      // Handle non-OK responses
      if (!response.ok) {
        const error: ApiError = {
          message: `API Error: ${response.status} ${response.statusText}`,
          status: response.status,
        };

        // Try to parse error response
        try {
          const errorData = await response.json();
          error.message = errorData.message || errorData.error || error.message;
          error.code = errorData.code;
          error.details = errorData.details;
        } catch {
          // Response not JSON, use default message
        }

        // Retry on retryable errors
        if (retries > 0 && isRetryableError(response.status)) {
          const delay = getRetryDelay(MAX_RETRIES - retries);
          await sleep(delay);
          return this.request<T>(endpoint, options, retries - 1);
        }

        throw error;
      }

      // Parse successful response
      return await response.json();
    } catch (error) {
      // Retry on network errors
      if (retries > 0 && error instanceof Error) {
        const delay = getRetryDelay(MAX_RETRIES - retries);
        await sleep(delay);
        return this.request<T>(endpoint, options, retries - 1);
      }

      // Convert to ApiError
      if (error && typeof error === 'object' && 'message' in error) {
        throw error as ApiError;
      }

      throw {
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        details: error,
      } as ApiError;
    }
  }

  /**
   * GET request
   * @param endpoint - API endpoint
   * @returns Promise with typed response
   */
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  /**
   * POST request
   * @param endpoint - API endpoint
   * @param data - Request body data
   * @returns Promise with typed response
   */
  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request
   * @param endpoint - API endpoint
   * @param data - Request body data
   * @returns Promise with typed response
   */
  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PATCH request
   * @param endpoint - API endpoint
   * @param data - Request body data
   * @returns Promise with typed response
   */
  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request
   * @param endpoint - API endpoint
   * @returns Promise with typed response
   */
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// ============================================================================
// API Client Instance
// ============================================================================

export const apiClient = new ApiClient(API_BASE_URL);

// ============================================================================
// User Service
// ============================================================================

/**
 * User API service for managing user accounts
 */
export const userService = {
  /**
   * Create a new user
   * @param email - User email address
   * @param userData - Additional user data
   * @returns Created user object
   * @throws {ApiError} When creation fails
   *
   * @example
   * const user = await userService.createUser('user@example.com', {
   *   name: 'John Doe',
   *   metadata: { role: 'entrepreneur' }
   * });
   */
  async createUser(
    email: string,
    userData: Omit<CreateUserRequest, 'email'>
  ): Promise<DbUser> {
    const response = await apiClient.post<ApiResponse<DbUser>>('/users', {
      email,
      ...userData,
    });
    return response.data;
  },

  /**
   * Get user by email address
   * @param email - User email address
   * @returns User object or null if not found
   * @throws {ApiError} When request fails
   *
   * @example
   * const user = await userService.getUserByEmail('user@example.com');
   */
  async getUserByEmail(email: string): Promise<DbUser | null> {
    try {
      const response = await apiClient.get<ApiResponse<DbUser>>(
        `/users/email/${encodeURIComponent(email)}`
      );
      return response.data;
    } catch (error) {
      if ((error as ApiError).status === 404) {
        return null;
      }
      throw error;
    }
  },

  /**
   * Get user by ID
   * @param userId - User ID
   * @returns User object
   * @throws {ApiError} When user not found or request fails
   *
   * @example
   * const user = await userService.getUser('user-123');
   */
  async getUser(userId: string): Promise<DbUser> {
    const response = await apiClient.get<ApiResponse<DbUser>>(
      `/users/${userId}`
    );
    return response.data;
  },

  /**
   * Update user information
   * @param userId - User ID
   * @param updates - Fields to update
   * @returns Updated user object
   * @throws {ApiError} When update fails
   *
   * @example
   * const user = await userService.updateUser('user-123', {
   *   name: 'Jane Doe',
   *   metadata: { onboarded: true }
   * });
   */
  async updateUser(
    userId: string,
    updates: UpdateUserRequest
  ): Promise<DbUser> {
    const response = await apiClient.patch<ApiResponse<DbUser>>(
      `/users/${userId}`,
      updates
    );
    return response.data;
  },

  /**
   * Delete user account
   * @param userId - User ID
   * @throws {ApiError} When deletion fails
   *
   * @example
   * await userService.deleteUser('user-123');
   */
  async deleteUser(userId: string): Promise<void> {
    await apiClient.delete<ApiResponse<void>>(`/users/${userId}`);
  },

  /**
   * List all users (admin only)
   * @param limit - Maximum number of users to return
   * @param offset - Number of users to skip
   * @returns Array of users
   * @throws {ApiError} When request fails
   *
   * @example
   * const users = await userService.listUsers(10, 0);
   */
  async listUsers(limit = 50, offset = 0): Promise<DbUser[]> {
    const response = await apiClient.get<ApiResponse<DbUser[]>>(
      `/users?limit=${limit}&offset=${offset}`
    );
    return response.data;
  },
};

// ============================================================================
// Session Service
// ============================================================================

/**
 * Session API service for managing user sessions
 */
export const sessionService = {
  /**
   * Create a new session
   * @param userId - User ID
   * @param metadata - Session metadata (e.g., journey phase, agent type)
   * @returns Created session object
   * @throws {ApiError} When creation fails
   *
   * @example
   * const session = await sessionService.createSession('user-123', {
   *   journey_phase: 'discovery',
   *   agent_type: 'idea-generator'
   * });
   */
  async createSession(
    userId: string,
    metadata?: Record<string, any>
  ): Promise<DbSession> {
    const response = await apiClient.post<ApiResponse<DbSession>>('/sessions', {
      user_id: userId,
      metadata: metadata || {},
    });
    return response.data;
  },

  /**
   * Get session by ID
   * @param sessionId - Session ID
   * @returns Session object
   * @throws {ApiError} When session not found or request fails
   *
   * @example
   * const session = await sessionService.getSession('session-123');
   */
  async getSession(sessionId: string): Promise<DbSession> {
    const response = await apiClient.get<ApiResponse<DbSession>>(
      `/sessions/${sessionId}`
    );
    return response.data;
  },

  /**
   * Get all sessions for a user
   * @param userId - User ID
   * @param limit - Maximum number of sessions to return
   * @returns Array of sessions, ordered by most recent first
   * @throws {ApiError} When request fails
   *
   * @example
   * const sessions = await sessionService.getUserSessions('user-123', 20);
   */
  async getUserSessions(
    userId: string,
    limit = 50
  ): Promise<DbSession[]> {
    const response = await apiClient.get<ApiResponse<DbSession[]>>(
      `/users/${userId}/sessions?limit=${limit}`
    );
    return response.data;
  },

  /**
   * Update session metadata
   * @param sessionId - Session ID
   * @param metadata - Updated metadata
   * @returns Updated session object
   * @throws {ApiError} When update fails
   *
   * @example
   * const session = await sessionService.updateSession('session-123', {
   *   completed: true,
   *   outcome: 'successful'
   * });
   */
  async updateSession(
    sessionId: string,
    metadata: Record<string, any>
  ): Promise<DbSession> {
    const response = await apiClient.patch<ApiResponse<DbSession>>(
      `/sessions/${sessionId}`,
      { metadata }
    );
    return response.data;
  },

  /**
   * Delete session and all associated data
   * @param sessionId - Session ID
   * @throws {ApiError} When deletion fails
   *
   * @example
   * await sessionService.deleteSession('session-123');
   */
  async deleteSession(sessionId: string): Promise<void> {
    await apiClient.delete<ApiResponse<void>>(`/sessions/${sessionId}`);
  },

  /**
   * Get session with conversation history
   * @param sessionId - Session ID
   * @param includeMessages - Include conversation messages
   * @param includeMemory - Include session memory
   * @returns Session with related data
   * @throws {ApiError} When request fails
   *
   * @example
   * const sessionData = await sessionService.getSessionWithData('session-123', true, true);
   */
  async getSessionWithData(
    sessionId: string,
    includeMessages = true,
    includeMemory = true
  ): Promise<{
    session: DbSession;
    messages?: DbConversation[];
    memory?: DbMemory[];
  }> {
    const response = await apiClient.get<ApiResponse<{
      session: DbSession;
      messages?: DbConversation[];
      memory?: DbMemory[];
    }>>(
      `/sessions/${sessionId}/full?messages=${includeMessages}&memory=${includeMemory}`
    );
    return response.data;
  },
};

// ============================================================================
// Conversation Service
// ============================================================================

/**
 * Conversation API service for managing chat messages
 */
export const conversationService = {
  /**
   * Add a message to a conversation
   * @param sessionId - Session ID
   * @param role - Message role (user, assistant, system)
   * @param content - Message content
   * @param metadata - Additional message metadata
   * @returns Created message object
   * @throws {ApiError} When creation fails
   *
   * @example
   * const message = await conversationService.addMessage(
   *   'session-123',
   *   'user',
   *   'What are some business ideas in sustainable fashion?',
   *   { agent_type: 'idea-generator' }
   * );
   */
  async addMessage(
    sessionId: string,
    role: 'user' | 'assistant' | 'system',
    content: string,
    metadata?: Record<string, any>
  ): Promise<DbConversation> {
    const response = await apiClient.post<ApiResponse<DbConversation>>(
      '/conversations',
      {
        session_id: sessionId,
        role,
        content,
        metadata: metadata || {},
      }
    );
    return response.data;
  },

  /**
   * Get conversation history for a session
   * @param sessionId - Session ID
   * @param limit - Maximum number of messages to return (default: 100)
   * @param offset - Number of messages to skip
   * @returns Array of messages, ordered by timestamp
   * @throws {ApiError} When request fails
   *
   * @example
   * const messages = await conversationService.getConversationHistory('session-123', 50);
   */
  async getConversationHistory(
    sessionId: string,
    limit = 100,
    offset = 0
  ): Promise<DbConversation[]> {
    const response = await apiClient.get<ApiResponse<DbConversation[]>>(
      `/sessions/${sessionId}/conversations?limit=${limit}&offset=${offset}`
    );
    return response.data;
  },

  /**
   * Get conversation summary (first and last N messages)
   * @param sessionId - Session ID
   * @param firstN - Number of first messages to include (default: 5)
   * @param lastN - Number of last messages to include (default: 10)
   * @returns Object with first and last messages
   * @throws {ApiError} When request fails
   *
   * @example
   * const summary = await conversationService.getConversationSummary('session-123', 5, 10);
   */
  async getConversationSummary(
    sessionId: string,
    firstN = 5,
    lastN = 10
  ): Promise<{
    first: DbConversation[];
    last: DbConversation[];
    total: number;
  }> {
    const response = await apiClient.get<ApiResponse<{
      first: DbConversation[];
      last: DbConversation[];
      total: number;
    }>>(
      `/sessions/${sessionId}/conversations/summary?first=${firstN}&last=${lastN}`
    );
    return response.data;
  },

  /**
   * Get single message by ID
   * @param messageId - Message ID
   * @returns Message object
   * @throws {ApiError} When message not found or request fails
   *
   * @example
   * const message = await conversationService.getMessage('msg-123');
   */
  async getMessage(messageId: string): Promise<DbConversation> {
    const response = await apiClient.get<ApiResponse<DbConversation>>(
      `/conversations/${messageId}`
    );
    return response.data;
  },

  /**
   * Update message content or metadata
   * @param messageId - Message ID
   * @param updates - Fields to update
   * @returns Updated message object
   * @throws {ApiError} When update fails
   *
   * @example
   * const message = await conversationService.updateMessage('msg-123', {
   *   content: 'Updated message content',
   *   metadata: { edited: true }
   * });
   */
  async updateMessage(
    messageId: string,
    updates: { content?: string; metadata?: Record<string, any> }
  ): Promise<DbConversation> {
    const response = await apiClient.patch<ApiResponse<DbConversation>>(
      `/conversations/${messageId}`,
      updates
    );
    return response.data;
  },

  /**
   * Delete message
   * @param messageId - Message ID
   * @throws {ApiError} When deletion fails
   *
   * @example
   * await conversationService.deleteMessage('msg-123');
   */
  async deleteMessage(messageId: string): Promise<void> {
    await apiClient.delete<ApiResponse<void>>(`/conversations/${messageId}`);
  },

  /**
   * Search messages by content
   * @param sessionId - Session ID
   * @param query - Search query
   * @param limit - Maximum results to return
   * @returns Array of matching messages
   * @throws {ApiError} When request fails
   *
   * @example
   * const results = await conversationService.searchMessages('session-123', 'business idea');
   */
  async searchMessages(
    sessionId: string,
    query: string,
    limit = 20
  ): Promise<DbConversation[]> {
    const response = await apiClient.get<ApiResponse<DbConversation[]>>(
      `/sessions/${sessionId}/conversations/search?q=${encodeURIComponent(query)}&limit=${limit}`
    );
    return response.data;
  },
};

// ============================================================================
// Memory Service
// ============================================================================

/**
 * Memory API service for managing session key-value storage
 */
export const memoryService = {
  /**
   * Set a memory value
   * @param sessionId - Session ID
   * @param key - Memory key
   * @param value - Memory value (any JSON-serializable data)
   * @returns Created/updated memory object
   * @throws {ApiError} When operation fails
   *
   * @example
   * const memory = await memoryService.setMemory('session-123', 'user_preferences', {
   *   theme: 'dark',
   *   notifications: true
   * });
   */
  async setMemory(
    sessionId: string,
    key: string,
    value: any
  ): Promise<DbMemory> {
    const response = await apiClient.post<ApiResponse<DbMemory>>('/memory', {
      session_id: sessionId,
      key,
      value,
    });
    return response.data;
  },

  /**
   * Get a memory value by key
   * @param sessionId - Session ID
   * @param key - Memory key
   * @returns Memory value or null if not found
   * @throws {ApiError} When request fails
   *
   * @example
   * const preferences = await memoryService.getMemory('session-123', 'user_preferences');
   */
  async getMemory(sessionId: string, key: string): Promise<any | null> {
    try {
      const response = await apiClient.get<ApiResponse<DbMemory>>(
        `/sessions/${sessionId}/memory/${encodeURIComponent(key)}`
      );
      return response.data.value;
    } catch (error) {
      if ((error as ApiError).status === 404) {
        return null;
      }
      throw error;
    }
  },

  /**
   * Get all memory for a session
   * @param sessionId - Session ID
   * @returns Object with all key-value pairs
   * @throws {ApiError} When request fails
   *
   * @example
   * const allMemory = await memoryService.getAllMemory('session-123');
   * // Returns: { user_preferences: {...}, journey_state: {...}, ... }
   */
  async getAllMemory(sessionId: string): Promise<Record<string, any>> {
    const response = await apiClient.get<ApiResponse<DbMemory[]>>(
      `/sessions/${sessionId}/memory`
    );

    // Convert array of memory objects to key-value object
    return response.data.reduce((acc, memory) => {
      acc[memory.key] = memory.value;
      return acc;
    }, {} as Record<string, any>);
  },

  /**
   * Get memory object by key (includes metadata)
   * @param sessionId - Session ID
   * @param key - Memory key
   * @returns Full memory object with timestamps
   * @throws {ApiError} When request fails
   *
   * @example
   * const memoryObj = await memoryService.getMemoryObject('session-123', 'user_preferences');
   */
  async getMemoryObject(sessionId: string, key: string): Promise<DbMemory | null> {
    try {
      const response = await apiClient.get<ApiResponse<DbMemory>>(
        `/sessions/${sessionId}/memory/${encodeURIComponent(key)}`
      );
      return response.data;
    } catch (error) {
      if ((error as ApiError).status === 404) {
        return null;
      }
      throw error;
    }
  },

  /**
   * Update memory value
   * @param sessionId - Session ID
   * @param key - Memory key
   * @param value - New value
   * @returns Updated memory object
   * @throws {ApiError} When update fails
   *
   * @example
   * const memory = await memoryService.updateMemory('session-123', 'progress', 75);
   */
  async updateMemory(
    sessionId: string,
    key: string,
    value: any
  ): Promise<DbMemory> {
    const response = await apiClient.patch<ApiResponse<DbMemory>>(
      `/sessions/${sessionId}/memory/${encodeURIComponent(key)}`,
      { value }
    );
    return response.data;
  },

  /**
   * Delete memory by key
   * @param sessionId - Session ID
   * @param key - Memory key
   * @throws {ApiError} When deletion fails
   *
   * @example
   * await memoryService.deleteMemory('session-123', 'temp_data');
   */
  async deleteMemory(sessionId: string, key: string): Promise<void> {
    await apiClient.delete<ApiResponse<void>>(
      `/sessions/${sessionId}/memory/${encodeURIComponent(key)}`
    );
  },

  /**
   * Delete all memory for a session
   * @param sessionId - Session ID
   * @throws {ApiError} When deletion fails
   *
   * @example
   * await memoryService.clearMemory('session-123');
   */
  async clearMemory(sessionId: string): Promise<void> {
    await apiClient.delete<ApiResponse<void>>(
      `/sessions/${sessionId}/memory`
    );
  },

  /**
   * Set multiple memory values at once
   * @param sessionId - Session ID
   * @param data - Object with key-value pairs
   * @returns Array of created/updated memory objects
   * @throws {ApiError} When operation fails
   *
   * @example
   * const memories = await memoryService.setMultipleMemory('session-123', {
   *   user_preferences: { theme: 'dark' },
   *   journey_state: { phase: 'discovery' },
   *   progress: 50
   * });
   */
  async setMultipleMemory(
    sessionId: string,
    data: Record<string, any>
  ): Promise<DbMemory[]> {
    const response = await apiClient.post<ApiResponse<DbMemory[]>>(
      '/memory/batch',
      {
        session_id: sessionId,
        data,
      }
    );
    return response.data;
  },
};

// ============================================================================
// Exports
// ============================================================================

export default {
  apiClient,
  userService,
  sessionService,
  conversationService,
  memoryService,
};

export type { ApiError };
