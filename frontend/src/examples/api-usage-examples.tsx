/**
 * API Service Usage Examples
 *
 * This file demonstrates practical usage patterns for the API service layer.
 * Copy these examples into your components as needed.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  userService,
  sessionService,
  conversationService,
  memoryService,
  type ApiError,
} from '../services/api';
import type {
  DbUser,
  DbSession,
  DbConversation,
  DbMemory,
} from '../types';

// ============================================================================
// React Query Hooks
// ============================================================================

/**
 * Hook to fetch user by ID with automatic caching
 */
export function useUser(userId: string) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => userService.getUser(userId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch user by email
 */
export function useUserByEmail(email: string) {
  return useQuery({
    queryKey: ['user', 'email', email],
    queryFn: () => userService.getUserByEmail(email),
    enabled: !!email, // Only run if email is provided
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to create or update user
 */
export function useUserMutation() {
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: ({ email, name, metadata }: {
      email: string;
      name: string;
      metadata?: Record<string, any>
    }) => userService.createUser(email, { name, metadata }),
    onSuccess: (data) => {
      queryClient.setQueryData(['user', data.id], data);
      queryClient.setQueryData(['user', 'email', data.email], data);
    },
  });

  const update = useMutation({
    mutationFn: ({ userId, updates }: {
      userId: string;
      updates: { name?: string; metadata?: Record<string, any> }
    }) => userService.updateUser(userId, updates),
    onSuccess: (data) => {
      queryClient.setQueryData(['user', data.id], data);
      queryClient.invalidateQueries({ queryKey: ['user', data.id] });
    },
  });

  return { create, update };
}

/**
 * Hook to fetch session with full data (messages + memory)
 */
export function useSession(sessionId: string, includeMessages = true, includeMemory = true) {
  return useQuery({
    queryKey: ['session', sessionId, 'full', includeMessages, includeMemory],
    queryFn: () => sessionService.getSessionWithData(sessionId, includeMessages, includeMemory),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook to fetch user sessions
 */
export function useUserSessions(userId: string, limit = 20) {
  return useQuery({
    queryKey: ['sessions', 'user', userId, limit],
    queryFn: () => sessionService.getUserSessions(userId, limit),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Hook to create and manage sessions
 */
export function useSessionMutation() {
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: ({ userId, metadata }: {
      userId: string;
      metadata?: Record<string, any>
    }) => sessionService.createSession(userId, metadata),
    onSuccess: (data) => {
      queryClient.setQueryData(['session', data.id], data);
      queryClient.invalidateQueries({ queryKey: ['sessions', 'user', data.user_id] });
    },
  });

  const update = useMutation({
    mutationFn: ({ sessionId, metadata }: {
      sessionId: string;
      metadata: Record<string, any>
    }) => sessionService.updateSession(sessionId, metadata),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['session', data.id] });
    },
  });

  return { create, update };
}

/**
 * Hook to fetch conversation history
 */
export function useConversationHistory(sessionId: string, limit = 100) {
  return useQuery({
    queryKey: ['conversation', sessionId, limit],
    queryFn: () => conversationService.getConversationHistory(sessionId, limit),
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to add messages to conversation
 */
export function useConversationMutation() {
  const queryClient = useQueryClient();

  const addMessage = useMutation({
    mutationFn: ({
      sessionId,
      role,
      content,
      metadata
    }: {
      sessionId: string;
      role: 'user' | 'assistant' | 'system';
      content: string;
      metadata?: Record<string, any>
    }) => conversationService.addMessage(sessionId, role, content, metadata),
    onSuccess: (data) => {
      // Optimistically update the conversation history
      queryClient.setQueryData<DbConversation[]>(
        ['conversation', data.session_id],
        (old) => old ? [...old, data] : [data]
      );
    },
  });

  return { addMessage };
}

/**
 * Hook to fetch and manage memory
 */
export function useMemory(sessionId: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['memory', sessionId],
    queryFn: () => memoryService.getAllMemory(sessionId),
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  const setMemory = useMutation({
    mutationFn: ({ key, value }: { key: string; value: any }) =>
      memoryService.setMemory(sessionId, key, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memory', sessionId] });
    },
  });

  const setMultiple = useMutation({
    mutationFn: (data: Record<string, any>) =>
      memoryService.setMultipleMemory(sessionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memory', sessionId] });
    },
  });

  const deleteMemory = useMutation({
    mutationFn: (key: string) => memoryService.deleteMemory(sessionId, key),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memory', sessionId] });
    },
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    setMemory,
    setMultiple,
    deleteMemory
  };
}

// ============================================================================
// Component Examples
// ============================================================================

/**
 * Example: User Profile Component
 */
export function UserProfile({ userId }: { userId: string }) {
  const { data: user, isLoading, error } = useUser(userId);
  const { update } = useUserMutation();

  if (isLoading) return <div>Loading user...</div>;
  if (error) return <div>Error: {(error as ApiError).message}</div>;
  if (!user) return <div>User not found</div>;

  const handleUpdate = async () => {
    try {
      await update.mutateAsync({
        userId: user.id,
        updates: {
          metadata: {
            ...user.metadata,
            last_updated: new Date().toISOString(),
          },
        },
      });
      alert('Profile updated successfully!');
    } catch (err) {
      alert(`Failed to update profile: ${(err as ApiError).message}`);
    }
  };

  return (
    <div className="card">
      <h2>{user.name}</h2>
      <p>{user.email}</p>
      <p>Joined: {new Date(user.created_at).toLocaleDateString()}</p>
      <button onClick={handleUpdate} className="btn-primary">
        Update Profile
      </button>
    </div>
  );
}

/**
 * Example: Session List Component
 */
export function SessionList({ userId }: { userId: string }) {
  const { data: sessions, isLoading, error } = useUserSessions(userId, 20);

  if (isLoading) return <div>Loading sessions...</div>;
  if (error) return <div>Error: {(error as ApiError).message}</div>;
  if (!sessions || sessions.length === 0) return <div>No sessions yet</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Your Sessions</h2>
      {sessions.map((session) => (
        <div key={session.id} className="card">
          <p className="text-sm text-neutral-600">
            {new Date(session.created_at).toLocaleDateString()}
          </p>
          <p className="text-sm">
            Phase: {session.metadata?.journey_phase || 'Unknown'}
          </p>
        </div>
      ))}
    </div>
  );
}

/**
 * Example: Chat Interface Component
 */
export function ChatInterface({ sessionId }: { sessionId: string }) {
  const { data: messages, isLoading } = useConversationHistory(sessionId);
  const { addMessage } = useConversationMutation();
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || isSending) return;

    setIsSending(true);
    try {
      await addMessage.mutateAsync({
        sessionId,
        role: 'user',
        content: input,
        metadata: { timestamp: new Date().toISOString() },
      });
      setInput('');
    } catch (error) {
      alert(`Failed to send message: ${(error as ApiError).message}`);
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) return <div>Loading conversation...</div>;

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages?.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-lg p-3 rounded-lg ${
                msg.role === 'user'
                  ? 'bg-primary-600 text-white'
                  : 'bg-neutral-100 text-neutral-900'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
      </div>
      <div className="border-t p-4 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type a message..."
          className="flex-1 input"
          disabled={isSending}
        />
        <button
          onClick={handleSend}
          disabled={isSending}
          className="btn-primary"
        >
          {isSending ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
}

/**
 * Example: Session Memory Component
 */
export function SessionMemory({ sessionId }: { sessionId: string }) {
  const { data: memory, isLoading, setMemory } = useMemory(sessionId);
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');

  const handleSet = async () => {
    if (!key || !value) return;

    try {
      await setMemory.mutateAsync({ key, value: JSON.parse(value) });
      setKey('');
      setValue('');
      alert('Memory saved!');
    } catch (error) {
      alert(`Failed to save memory: ${(error as ApiError).message}`);
    }
  };

  if (isLoading) return <div>Loading memory...</div>;

  return (
    <div className="card">
      <h2 className="text-xl font-bold mb-4">Session Memory</h2>

      {/* Display existing memory */}
      <div className="mb-4 space-y-2">
        {memory && Object.entries(memory).map(([k, v]) => (
          <div key={k} className="bg-neutral-50 p-2 rounded">
            <strong>{k}:</strong> {JSON.stringify(v)}
          </div>
        ))}
      </div>

      {/* Add new memory */}
      <div className="space-y-2">
        <input
          type="text"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="Key"
          className="input"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder='Value (JSON, e.g., {"theme": "dark"})'
          className="input"
        />
        <button onClick={handleSet} className="btn-primary">
          Save Memory
        </button>
      </div>
    </div>
  );
}

/**
 * Example: Complete Application Flow
 */
export function CompleteExample() {
  const [email] = useState('demo@example.com');
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // Get or create user
  const { data: user, isLoading: userLoading } = useUserByEmail(email);
  const { create: createUser } = useUserMutation();
  const { create: createSession } = useSessionMutation();

  // Initialize user and session
  useEffect(() => {
    async function init() {
      try {
        let currentUser = user;

        // Create user if doesn't exist
        if (!userLoading && !currentUser) {
          const newUser = await createUser.mutateAsync({
            email,
            name: 'Demo User',
            metadata: { source: 'demo' },
          });
          currentUser = newUser;
        }

        // Create new session
        if (currentUser && !currentSessionId) {
          const session = await createSession.mutateAsync({
            userId: currentUser.id,
            metadata: {
              journey_phase: 'discovery',
              started_at: new Date().toISOString(),
            },
          });
          setCurrentSessionId(session.id);
        }
      } catch (error) {
        console.error('Initialization failed:', error);
      }
    }

    init();
  }, [user, userLoading, currentSessionId]);

  if (userLoading) return <div>Initializing...</div>;
  if (!currentSessionId) return <div>Setting up session...</div>;

  return (
    <div className="grid grid-cols-2 gap-4 p-4">
      <div>
        {user && <UserProfile userId={user.id} />}
        <ChatInterface sessionId={currentSessionId} />
      </div>
      <div>
        <SessionMemory sessionId={currentSessionId} />
        {user && <SessionList userId={user.id} />}
      </div>
    </div>
  );
}

// Import useState and useEffect
import { useState, useEffect } from 'react';
