# Frontend API Service Documentation

## Overview

The frontend API service layer provides a comprehensive, production-ready interface for all database operations in the EntreBot application. It includes:

- **Automatic retry logic** with exponential backoff
- **Request timeouts** (30 seconds default)
- **Error handling** with detailed error information
- **Type safety** with TypeScript
- **JSDoc comments** for IDE intellisense
- **Easy-to-use functions** for all 4 database tables

## Installation & Setup

The API service is located at `/frontend/src/services/api.ts` and is ready to use out of the box.

### Configuration

The API base URL is configured via environment variable:

```bash
# .env or .env.local
VITE_API_URL=http://localhost:5000/api
```

If not set, it defaults to `http://localhost:5000/api`.

## Usage Examples

### 1. User Operations

```typescript
import { userService } from '@/services/api';

// Create a new user
const user = await userService.createUser('john@example.com', {
  name: 'John Doe',
  metadata: {
    role: 'entrepreneur',
    source: 'organic',
  },
});

// Get user by email
const user = await userService.getUserByEmail('john@example.com');

// Get user by ID
const user = await userService.getUser('user-123');

// Update user
const updatedUser = await userService.updateUser('user-123', {
  name: 'John Smith',
  metadata: {
    onboarded: true,
    last_login: new Date().toISOString(),
  },
});

// Delete user
await userService.deleteUser('user-123');

// List users (admin only)
const users = await userService.listUsers(50, 0);
```

### 2. Session Operations

```typescript
import { sessionService } from '@/services/api';

// Create a new session
const session = await sessionService.createSession('user-123', {
  journey_phase: 'discovery',
  agent_type: 'idea-generator',
  started_at: new Date().toISOString(),
});

// Get session by ID
const session = await sessionService.getSession('session-123');

// Get all sessions for a user
const sessions = await sessionService.getUserSessions('user-123', 20);

// Update session metadata
const updated = await sessionService.updateSession('session-123', {
  completed: true,
  outcome: 'successful',
  end_time: new Date().toISOString(),
});

// Get session with full data (messages + memory)
const fullSession = await sessionService.getSessionWithData(
  'session-123',
  true, // include messages
  true  // include memory
);

// Delete session
await sessionService.deleteSession('session-123');
```

### 3. Conversation Operations

```typescript
import { conversationService } from '@/services/api';

// Add a user message
const message = await conversationService.addMessage(
  'session-123',
  'user',
  'What are some business ideas in sustainable fashion?',
  { agent_type: 'idea-generator' }
);

// Add an assistant response
const response = await conversationService.addMessage(
  'session-123',
  'assistant',
  'Here are some sustainable fashion business ideas...',
  {
    agent_type: 'idea-generator',
    generated_at: new Date().toISOString(),
  }
);

// Get conversation history
const messages = await conversationService.getConversationHistory(
  'session-123',
  100 // limit
);

// Get conversation summary (first 5 and last 10 messages)
const summary = await conversationService.getConversationSummary(
  'session-123',
  5,  // first N
  10  // last N
);

// Search messages
const results = await conversationService.searchMessages(
  'session-123',
  'business idea'
);

// Update a message
const updated = await conversationService.updateMessage('msg-123', {
  content: 'Updated content',
  metadata: { edited: true },
});

// Delete a message
await conversationService.deleteMessage('msg-123');
```

### 4. Memory Operations

```typescript
import { memoryService } from '@/services/api';

// Set a memory value
await memoryService.setMemory('session-123', 'user_preferences', {
  theme: 'dark',
  notifications: true,
  language: 'en',
});

// Get a memory value
const preferences = await memoryService.getMemory(
  'session-123',
  'user_preferences'
);

// Get all memory for a session
const allMemory = await memoryService.getAllMemory('session-123');
// Returns: { user_preferences: {...}, journey_state: {...}, progress: 50 }

// Update memory value
await memoryService.updateMemory('session-123', 'progress', 75);

// Set multiple values at once
await memoryService.setMultipleMemory('session-123', {
  user_preferences: { theme: 'dark' },
  journey_state: { phase: 'validation' },
  progress: 50,
  milestones: ['discovery_complete', 'idea_validated'],
});

// Delete a memory key
await memoryService.deleteMemory('session-123', 'temp_data');

// Clear all memory
await memoryService.clearMemory('session-123');
```

## React Integration with React Query

### Example Hook

```typescript
// hooks/useUser.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/services/api';

export function useUser(userId: string) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => userService.getUser(userId),
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, updates }: { userId: string; updates: any }) =>
      userService.updateUser(userId, updates),
    onSuccess: (data) => {
      // Invalidate and refetch user data
      queryClient.invalidateQueries({ queryKey: ['user', data.id] });
    },
  });
}
```

### Example Component

```tsx
// components/UserProfile.tsx
import { useState } from 'react';
import { useUser, useUpdateUser } from '@/hooks/useUser';

export function UserProfile({ userId }: { userId: string }) {
  const { data: user, isLoading, error } = useUser(userId);
  const updateUser = useUpdateUser();
  const [name, setName] = useState('');

  const handleUpdate = async () => {
    try {
      await updateUser.mutateAsync({
        userId,
        updates: { name },
      });
      alert('Profile updated!');
    } catch (error) {
      alert('Failed to update profile');
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="New name"
      />
      <button onClick={handleUpdate}>Update</button>
    </div>
  );
}
```

## Error Handling

All service functions throw `ApiError` objects with the following structure:

```typescript
interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: any;
}
```

### Example Error Handling

```typescript
import { userService, ApiError } from '@/services/api';

try {
  const user = await userService.getUserByEmail('test@example.com');
} catch (error) {
  const apiError = error as ApiError;

  if (apiError.status === 404) {
    console.log('User not found');
  } else if (apiError.status === 500) {
    console.log('Server error');
  } else {
    console.log('Error:', apiError.message);
  }
}
```

## Advanced Features

### Custom Timeout

```typescript
import { apiClient } from '@/services/api';

// Set custom timeout (in milliseconds)
apiClient.setTimeout(60000); // 60 seconds
```

### Authentication

```typescript
import { apiClient } from '@/services/api';

// Set auth token
apiClient.setToken('your-jwt-token');

// Clear auth token
apiClient.clearToken();
```

### Retry Configuration

The API client automatically retries failed requests with exponential backoff:

- **Max retries**: 3
- **Base delay**: 1 second
- **Backoff**: Exponential (1s, 2s, 4s)
- **Retryable errors**: Network errors, 500+ status codes, 408, 429

Retries are handled automatically - no configuration needed!

## Complete Integration Example

```tsx
// App.tsx
import { useState, useEffect } from 'react';
import {
  userService,
  sessionService,
  conversationService,
  memoryService,
} from '@/services/api';

export function ChatInterface() {
  const [userId, setUserId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  // Initialize user and session
  useEffect(() => {
    async function init() {
      try {
        // Get or create user
        let user = await userService.getUserByEmail('user@example.com');
        if (!user) {
          user = await userService.createUser('user@example.com', {
            name: 'Test User',
          });
        }
        setUserId(user.id);

        // Create new session
        const session = await sessionService.createSession(user.id, {
          journey_phase: 'discovery',
          agent_type: 'idea-generator',
        });
        setSessionId(session.id);

        // Load conversation history
        const history = await conversationService.getConversationHistory(
          session.id
        );
        setMessages(history);
      } catch (error) {
        console.error('Initialization failed:', error);
      }
    }

    init();
  }, []);

  const sendMessage = async () => {
    if (!sessionId || !input.trim()) return;

    try {
      // Add user message
      const userMessage = await conversationService.addMessage(
        sessionId,
        'user',
        input
      );
      setMessages((prev) => [...prev, userMessage]);

      // TODO: Call your AI agent here
      const aiResponse = 'This is an AI response';

      // Add assistant message
      const assistantMessage = await conversationService.addMessage(
        sessionId,
        'assistant',
        aiResponse
      );
      setMessages((prev) => [...prev, assistantMessage]);

      // Update memory
      await memoryService.setMemory(sessionId, 'last_interaction', {
        timestamp: new Date().toISOString(),
        message_count: messages.length + 2,
      });

      setInput('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  return (
    <div>
      <div className="messages">
        {messages.map((msg) => (
          <div key={msg.id} className={msg.role}>
            {msg.content}
          </div>
        ))}
      </div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type a message..."
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}
```

## API Endpoint Reference

The service layer expects the backend to implement these endpoints:

### Users
- `POST /api/users` - Create user
- `GET /api/users/:id` - Get user by ID
- `GET /api/users/email/:email` - Get user by email
- `PATCH /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `GET /api/users?limit&offset` - List users

### Sessions
- `POST /api/sessions` - Create session
- `GET /api/sessions/:id` - Get session
- `GET /api/users/:userId/sessions?limit` - Get user sessions
- `PATCH /api/sessions/:id` - Update session
- `DELETE /api/sessions/:id` - Delete session
- `GET /api/sessions/:id/full?messages&memory` - Get session with data

### Conversations
- `POST /api/conversations` - Add message
- `GET /api/sessions/:sessionId/conversations?limit&offset` - Get history
- `GET /api/sessions/:sessionId/conversations/summary?first&last` - Get summary
- `GET /api/conversations/:id` - Get message
- `PATCH /api/conversations/:id` - Update message
- `DELETE /api/conversations/:id` - Delete message
- `GET /api/sessions/:sessionId/conversations/search?q&limit` - Search messages

### Memory
- `POST /api/memory` - Set memory
- `GET /api/sessions/:sessionId/memory/:key` - Get memory
- `GET /api/sessions/:sessionId/memory` - Get all memory
- `PATCH /api/sessions/:sessionId/memory/:key` - Update memory
- `DELETE /api/sessions/:sessionId/memory/:key` - Delete memory
- `DELETE /api/sessions/:sessionId/memory` - Clear all memory
- `POST /api/memory/batch` - Set multiple memory values

## Best Practices

1. **Use React Query** for data fetching and caching
2. **Handle errors gracefully** with try-catch blocks
3. **Show loading states** during async operations
4. **Validate data** before sending to API
5. **Use TypeScript** for type safety
6. **Implement optimistic updates** for better UX
7. **Cache frequently accessed data**
8. **Implement pagination** for large datasets

## Type Definitions

All types are available in `/frontend/src/types/index.ts`:

- `DbUser` - User database model
- `DbSession` - Session database model
- `DbConversation` - Conversation message model
- `DbMemory` - Memory key-value model
- `ApiResponse<T>` - Standard API response wrapper
- `ApiError` - Error object structure

## Production Considerations

1. **Environment Variables**: Set `VITE_API_URL` in production
2. **Authentication**: Implement JWT token refresh logic
3. **Error Tracking**: Integrate with Sentry or similar service
4. **Analytics**: Track API usage and errors
5. **Rate Limiting**: Handle 429 responses gracefully
6. **Offline Support**: Implement offline-first with local storage
7. **Performance**: Use React Query's caching effectively
8. **Security**: Never expose sensitive tokens in client code

---

For more information, see the source code at `/frontend/src/services/api.ts`.
