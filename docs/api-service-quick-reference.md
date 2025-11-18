# API Service Quick Reference

## Import

```typescript
import {
  userService,
  sessionService,
  conversationService,
  memoryService,
  apiClient,
  type ApiError,
} from '@/services/api';
```

## User Service

```typescript
// Create user
userService.createUser(email, { name, metadata })

// Get user
userService.getUser(userId)
userService.getUserByEmail(email)

// Update user
userService.updateUser(userId, { name, metadata })

// Delete user
userService.deleteUser(userId)

// List users
userService.listUsers(limit, offset)
```

## Session Service

```typescript
// Create session
sessionService.createSession(userId, metadata)

// Get session
sessionService.getSession(sessionId)
sessionService.getUserSessions(userId, limit)
sessionService.getSessionWithData(sessionId, includeMessages, includeMemory)

// Update session
sessionService.updateSession(sessionId, metadata)

// Delete session
sessionService.deleteSession(sessionId)
```

## Conversation Service

```typescript
// Add message
conversationService.addMessage(sessionId, role, content, metadata)

// Get messages
conversationService.getConversationHistory(sessionId, limit, offset)
conversationService.getConversationSummary(sessionId, firstN, lastN)
conversationService.getMessage(messageId)
conversationService.searchMessages(sessionId, query, limit)

// Update/delete message
conversationService.updateMessage(messageId, { content, metadata })
conversationService.deleteMessage(messageId)
```

## Memory Service

```typescript
// Set memory
memoryService.setMemory(sessionId, key, value)
memoryService.setMultipleMemory(sessionId, data)

// Get memory
memoryService.getMemory(sessionId, key)
memoryService.getAllMemory(sessionId)
memoryService.getMemoryObject(sessionId, key)

// Update memory
memoryService.updateMemory(sessionId, key, value)

// Delete memory
memoryService.deleteMemory(sessionId, key)
memoryService.clearMemory(sessionId)
```

## Authentication

```typescript
// Set auth token
apiClient.setToken('your-jwt-token')

// Clear token
apiClient.clearToken()
```

## Error Handling

```typescript
try {
  const user = await userService.getUser('user-123');
} catch (error) {
  const apiError = error as ApiError;
  console.log(apiError.message);
  console.log(apiError.status);
  console.log(apiError.code);
  console.log(apiError.details);
}
```

## React Query Hooks

```typescript
// User hooks
const { data, isLoading, error } = useUser(userId);
const { data, isLoading, error } = useUserByEmail(email);
const { create, update } = useUserMutation();

// Session hooks
const { data, isLoading, error } = useSession(sessionId);
const { data, isLoading, error } = useUserSessions(userId);
const { create, update } = useSessionMutation();

// Conversation hooks
const { data, isLoading, error } = useConversationHistory(sessionId);
const { addMessage } = useConversationMutation();

// Memory hooks
const { data, isLoading, setMemory, setMultiple, deleteMemory } = useMemory(sessionId);
```

## Configuration

```bash
# .env
VITE_API_URL=http://localhost:5000/api
```

## Features

- Automatic retry with exponential backoff (3 retries)
- 30-second request timeout
- Error handling with detailed error objects
- Full TypeScript support with JSDoc comments
- Works with React Query for caching and state management
- Production-ready with proper error recovery

## Response Types

All API responses follow this structure:

```typescript
interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}
```

## Database Models

```typescript
interface DbUser {
  id: string;
  email: string;
  name: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface DbSession {
  id: string;
  user_id: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface DbConversation {
  id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: Record<string, any>;
  created_at: string;
}

interface DbMemory {
  id: string;
  session_id: string;
  key: string;
  value: any;
  created_at: string;
  updated_at: string;
}
```

---

See full documentation: `/docs/frontend-api-service.md`
