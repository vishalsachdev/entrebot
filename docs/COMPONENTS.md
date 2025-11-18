# Database Components Documentation

## Overview

This document describes the 4 React components built to interact with the database tables: Users, Sessions, Conversations, and Memory.

## File Structure

```
frontend/src/
├── components/
│   ├── UserProfile.tsx         # User profile display & editing
│   ├── ConversationView.tsx    # Chat interface for conversations
│   ├── SessionList.tsx         # Session management
│   ├── MemoryViewer.tsx        # Key-value memory storage
│   └── index.ts                # Component exports
├── services/
│   └── database.ts             # API service methods
├── types/
│   └── database.ts             # TypeScript types
└── pages/
    └── DatabaseDemo.tsx        # Demo page showing all components
```

## Components

### 1. UserProfile

**File:** `/home/user/entrebot/frontend/src/components/UserProfile.tsx`

Display and edit user profile information.

**Props:**
```typescript
interface UserProfileProps {
  userId: string;                    // User ID to load
  onUpdate?: (user: DbUser) => void; // Callback when user is updated
}
```

**Features:**
- View user details (name, phone, email)
- Inline editing with form validation
- Loading and error states
- Cancel editing functionality
- Display creation date and user ID

**Usage:**
```tsx
import { UserProfile } from '@/components';

<UserProfile
  userId="user-123"
  onUpdate={(user) => console.log('Updated:', user)}
/>
```

---

### 2. ConversationView

**File:** `/home/user/entrebot/frontend/src/components/ConversationView.tsx`

Chat interface for viewing and sending messages in a conversation.

**Props:**
```typescript
interface ConversationViewProps {
  sessionId: string;                           // Session ID for the conversation
  onMessageSent?: (message: DbConversation) => void; // Callback when message is sent
}
```

**Features:**
- Display messages in chat format
- Different styling for user/assistant/system messages
- Auto-scroll to latest message
- Send new messages with Enter key
- Relative timestamps (e.g., "2m ago", "1h ago")
- Empty state when no messages
- Loading and error handling

**Usage:**
```tsx
import { ConversationView } from '@/components';

<ConversationView
  sessionId="session-456"
  onMessageSent={(msg) => console.log('Sent:', msg)}
/>
```

**Keyboard Shortcuts:**
- `Enter` - Send message
- `Shift + Enter` - New line in message

---

### 3. SessionList

**File:** `/home/user/entrebot/frontend/src/components/SessionList.tsx`

List and manage user sessions.

**Props:**
```typescript
interface SessionListProps {
  userId: string;                          // User ID to load sessions for
  onSessionSelect?: (session: DbSession) => void; // Callback when session is selected
  selectedSessionId?: string;              // Currently selected session ID
}
```

**Features:**
- List all user sessions sorted by date
- Create new sessions
- Select active session (highlighted)
- Delete sessions with confirmation
- Display metadata and timestamps
- Empty state with call-to-action
- Relative date formatting

**Usage:**
```tsx
import { SessionList } from '@/components';

<SessionList
  userId="user-123"
  onSessionSelect={(session) => setActiveSession(session)}
  selectedSessionId={activeSession?.id}
/>
```

---

### 4. MemoryViewer

**File:** `/home/user/entrebot/frontend/src/components/MemoryViewer.tsx`

View and manage key-value memory pairs for a session.

**Props:**
```typescript
interface MemoryViewerProps {
  sessionId: string;                            // Session ID to load memories for
  onMemoryChange?: (memories: DbMemory[]) => void; // Callback when memories change
}
```

**Features:**
- Display all memory key-value pairs
- Add new memory entries
- Edit existing memory values
- Delete memory entries
- JSON syntax highlighting for JSON values
- Search/filter memories
- Empty state with call-to-action
- Inline editing

**Usage:**
```tsx
import { MemoryViewer } from '@/components';

<MemoryViewer
  sessionId="session-456"
  onMemoryChange={(memories) => console.log('Total:', memories.length)}
/>
```

---

## API Services

**File:** `/home/user/entrebot/frontend/src/services/database.ts`

All components use centralized API service methods:

### User Service
```typescript
userService.getUser(userId: string)
userService.updateUser(userId: string, data: UpdateUserForm)
userService.getAllUsers()
```

### Session Service
```typescript
sessionService.getSession(sessionId: string)
sessionService.getUserSessions(userId: string)
sessionService.createSession(userId: string, metadata?: object)
sessionService.deleteSession(sessionId: string)
```

### Conversation Service
```typescript
conversationService.getConversations(sessionId: string)
conversationService.createMessage(sessionId: string, role: string, content: string)
```

### Memory Service
```typescript
memoryService.getMemories(sessionId: string)
memoryService.createMemory(sessionId: string, data: CreateMemoryForm)
memoryService.updateMemory(memoryId: string, data: UpdateMemoryForm)
memoryService.deleteMemory(memoryId: string)
```

---

## TypeScript Types

**File:** `/home/user/entrebot/frontend/src/types/database.ts`

### Database Models
```typescript
interface DbUser {
  id: string;
  name: string;
  phone_number: string;
  email: string;
  created_at: string;
  updated_at: string;
}

interface DbSession {
  id: string;
  user_id: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

interface DbConversation {
  id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

interface DbMemory {
  id: string;
  session_id: string;
  key: string;
  value: string;
  created_at: string;
  updated_at: string;
}
```

---

## Common Patterns

### Loading States
All components implement consistent loading states:
```tsx
{isLoading && (
  <div className="flex items-center justify-center py-12">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    <span className="ml-3 text-neutral-600">Loading...</span>
  </div>
)}
```

### Error Handling
All components show errors with retry options:
```tsx
{error && (
  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
    <p className="text-red-700 text-sm">{error}</p>
  </div>
)}
```

### Empty States
All components have helpful empty states:
```tsx
{items.length === 0 && (
  <div className="text-center py-12">
    <div className="text-6xl mb-4">📋</div>
    <h3 className="text-lg font-semibold text-neutral-700 mb-2">
      No items yet
    </h3>
    <p className="text-neutral-500 text-sm">
      Get started by creating your first item
    </p>
  </div>
)}
```

---

## Styling

All components use Tailwind CSS with custom design system classes:

- `card` - Card container with padding and shadow
- `btn-primary` - Primary action button
- `btn-secondary` - Secondary action button
- `input` - Form input styling
- `badge-primary` - Primary badge
- Color palette: `primary-*`, `neutral-*`, `red-*`

---

## Animation

Components use Framer Motion for smooth animations:

- **Initial load**: Fade in with slide up
- **List items**: Staggered animations
- **Form toggles**: Height animations
- **State changes**: Smooth transitions

---

## Demo Page

**File:** `/home/user/entrebot/frontend/src/pages/DatabaseDemo.tsx`

A complete demo page showing all components working together with:
- Tab navigation between Sessions, Conversation, and Memory
- User profile in sidebar
- Session selection flow
- Connected state management

**Usage:**
```tsx
import DatabaseDemo from '@/pages/DatabaseDemo';

// In your router
<Route path="/demo" element={<DatabaseDemo />} />
```

---

## Best Practices

### Component Usage
1. Always provide required props (userId, sessionId)
2. Use callbacks to respond to changes
3. Handle loading and error states in parent components
4. Implement proper TypeScript types

### Performance
1. Components use React hooks efficiently
2. API calls are only made when necessary
3. State updates are optimized
4. Auto-scroll doesn't trigger re-renders

### Accessibility
1. Semantic HTML elements
2. Proper form labels
3. Keyboard navigation support
4. Screen reader friendly

### Error Handling
1. All API calls wrapped in try-catch
2. User-friendly error messages
3. Retry functionality where appropriate
4. Graceful fallbacks

---

## Integration Example

```tsx
import { useState } from 'react';
import { UserProfile, SessionList, ConversationView, MemoryViewer } from '@/components';

export default function MyApp() {
  const [userId] = useState('user-123');
  const [selectedSession, setSelectedSession] = useState(null);

  return (
    <div className="container mx-auto p-6">
      <div className="grid grid-cols-3 gap-6">
        {/* User Profile */}
        <div className="col-span-1">
          <UserProfile userId={userId} />
        </div>

        {/* Sessions */}
        <div className="col-span-2">
          <SessionList
            userId={userId}
            onSessionSelect={setSelectedSession}
            selectedSessionId={selectedSession?.id}
          />
        </div>

        {/* Conversation (when session selected) */}
        {selectedSession && (
          <>
            <div className="col-span-2">
              <ConversationView sessionId={selectedSession.id} />
            </div>
            <div className="col-span-1">
              <MemoryViewer sessionId={selectedSession.id} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
```

---

## Testing

Each component should be tested for:
- Rendering with valid props
- Loading states
- Error states
- Empty states
- User interactions (clicks, form submissions)
- API integration

Example test structure:
```typescript
describe('UserProfile', () => {
  it('should load and display user data', async () => {
    // Test implementation
  });

  it('should handle edit mode', () => {
    // Test implementation
  });

  it('should show error on API failure', async () => {
    // Test implementation
  });
});
```

---

## Future Enhancements

Potential improvements:
- Real-time updates with WebSockets
- Pagination for large datasets
- Export/import memory data
- Conversation search
- Message reactions
- File attachments
- Rich text editor
- Dark mode support
- Accessibility audit
- Unit test coverage

---

## API Endpoints Required

The components expect these API endpoints:

**Users:**
- `GET /api/users/:userId`
- `PUT /api/users/:userId`

**Sessions:**
- `GET /api/sessions/:sessionId`
- `GET /api/users/:userId/sessions`
- `POST /api/sessions`
- `DELETE /api/sessions/:sessionId`

**Conversations:**
- `GET /api/sessions/:sessionId/conversations`
- `POST /api/conversations`

**Memory:**
- `GET /api/sessions/:sessionId/memories`
- `POST /api/memories`
- `PUT /api/memories/:memoryId`
- `DELETE /api/memories/:memoryId`

---

## Support

For issues or questions:
- Check component prop types
- Review error messages in browser console
- Verify API endpoints are configured
- Check network tab for failed requests
