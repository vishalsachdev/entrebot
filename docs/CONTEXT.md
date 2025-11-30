# Codebase Context for AI Agents

> **Read this file before modifying any code.** This is the single source of truth for architectural decisions, naming conventions, and module boundaries.

---

## Architecture Overview

```
entrebot/
├── src/                    # Backend (Node.js/Express)
│   ├── agents/             # AI coaching agents (extend BaseAgent)
│   ├── config/             # Environment & logging configuration
│   ├── database/           # Supabase queries (ONLY database access point)
│   ├── middleware/         # Express middleware (auth, validation, errors)
│   ├── routes/             # API endpoints
│   └── services/           # External services (OpenAI)
├── frontend/               # React + Vite + TypeScript
│   └── src/
│       ├── components/     # Reusable UI components
│       ├── contexts/       # React contexts
│       ├── pages/          # Page components
│       ├── services/       # API client services
│       └── types/          # TypeScript type definitions
├── docs/                   # Documentation
│   └── adr/                # Architecture Decision Records
└── tests/                  # Test suites
```

## Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Backend Runtime | Node.js | ≥18.0.0 |
| Backend Framework | Express | ^4.21 |
| Database | Supabase (PostgreSQL) | - |
| AI | OpenAI API | ^4.71 |
| Frontend Framework | React | ^18.2 |
| Frontend Build | Vite | ^7.1 |
| Frontend Language | TypeScript | ~5.9 |
| Styling | TailwindCSS | ^3.3 |

---

## Naming Conventions

### Files & Directories
- **Files:** `kebab-case.js` (e.g., `idea-generator.js`, `market-validator.js`)
- **Directories:** lowercase (e.g., `agents/`, `routes/`)
- **Test files:** `*.test.ts` or `*.test.js`

### Code Identifiers
- **Variables/Functions:** `camelCase` (e.g., `getUserProfile`, `sessionId`)
- **Classes:** `PascalCase` (e.g., `BaseAgent`, `IdeaGenerator`)
- **Constants:** `UPPER_SNAKE_CASE` (e.g., `MAX_RETRIES`, `DEFAULT_TIMEOUT`)

### Memory Keys (Critical for Agent Coordination)
All memory keys MUST be `UPPER_SNAKE_CASE`:

| Key | Description | Type |
|-----|-------------|------|
| `USER_PROFILE` | User's name and basic info | `{ name: string }` |
| `USER_PAIN` | Primary pain point | `{ description: string, category?: string }` |
| `USER_PAIN_DEEP` | Detailed pain analysis | `{ frequency, severity, who_experiences, ... }` |
| `USER_PREFERENCES` | Interests and activities | `{ interests?: string, activities?: string }` |
| `IDEA_COACH` | Generated ideas list | `[{ id: number, idea: string }]` |
| `SELECTED_IDEA` | User's chosen idea | `{ id: number, idea: string }` |
| `VALIDATION_RESULTS` | Market validation data | `{ score: number, ... }` |

---

## Module Boundaries (DO NOT CROSS)

### Backend Rules
1. **Routes → Agents:** Routes can import and call agents
2. **Agents → Database:** Agents access data ONLY via `memoryQueries` from `database/queries.js`
3. **Agents → Services:** Agents can use services (e.g., OpenAI)
4. **Database → Nothing:** Database layer has no dependencies on other modules

```
routes/ ──imports──> agents/ ──imports──> database/
                        │
                        └──imports──> services/
```

### Frontend Rules
1. **Pages → Components:** Pages compose components
2. **Components → Services:** Components call API via `services/database.ts`
3. **Components → Types:** All components use types from `types/`

### Forbidden Imports
- ❌ `agents/` importing from `routes/`
- ❌ `database/` importing from `agents/` or `routes/`
- ❌ Direct SQL queries outside `database/` directory
- ❌ Importing internal files from another module (use public exports only)

---

## Agent Development

### Creating a New Agent
1. Create file in `src/agents/<name>.js`
2. Extend `BaseAgent` class
3. Register in `src/agents/index.js`
4. Use `this.getMemory()` and `this.setMemory()` for state

### Agent Identity
- All agents MUST identify as **"VentureBot"**
- Include: `"Always respond as VentureBot."`
- Use proper grammar, punctuation, and formatting

### Agent Memory Pattern
```javascript
// Reading memory
const userPain = await this.getMemory(sessionId, 'USER_PAIN');

// Writing memory
await this.setMemory(sessionId, 'SELECTED_IDEA', { id: 1, idea: '...' });
```

---

## Code Style

### JavaScript (Backend)
```javascript
// Imports: built-ins → third-party → local
import path from 'path';
import express from 'express';
import { BaseAgent } from './base.js';

// Use async/await for all async operations
async function processRequest(req, res) {
  try {
    const result = await someAsyncOperation();
    return res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

// JSDoc for exported functions
/**
 * Process user message through agent
 * @param {string} sessionId - Session identifier
 * @param {string} message - User's message
 * @returns {Promise<string>} Agent's response
 */
export async function processMessage(sessionId, message) { ... }
```

### TypeScript (Frontend)
```typescript
// Props interfaces above component
interface UserProfileProps {
  userId: string;
  onUpdate?: (user: DbUser) => void;
}

// Functional components with explicit return types
export function UserProfile({ userId, onUpdate }: UserProfileProps): JSX.Element {
  // ...
}
```

---

## Forbidden Patterns

| Pattern | Why It's Forbidden | Do This Instead |
|---------|-------------------|-----------------|
| Hardcoded secrets | Security risk | Use `.env` and `process.env` |
| Direct SQL strings | SQL injection risk | Use Supabase query builder |
| `console.log` | Inconsistent logging | Use `logger` from `config/logger.js` |
| Files >500 lines | Hard to maintain | Split into modules |
| Mixed case memory keys | Agent coordination fails | Use `UPPER_SNAKE_CASE` |
| Importing internal files | Tight coupling | Import from module's `index.js` |

---

## API Endpoint Patterns

### Route Structure
```javascript
// src/routes/<resource>.js
import { Router } from 'express';
import { asyncHandler } from '../middleware/error.js';
import { validateRequest } from '../middleware/validation.js';

const router = Router();

router.post('/',
  validateRequest(schema),
  asyncHandler(async (req, res) => {
    // Handler logic
  })
);

export default router;
```

### Response Format
```javascript
// Success
{ success: true, data: { ... } }

// Error
{ success: false, error: "Human-readable message" }
```

---

## Testing Requirements

- **Framework:** Jest via `ts-jest`
- **Coverage target:** 80%
- **Location:** `tests/unit/`, `tests/integration/`, `tests/e2e/`
- **Naming:** `<module>.test.ts`

---

## Commit Guidelines

Use Conventional Commits:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation only
- `refactor:` Code change that neither fixes nor adds
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

Example: `feat(agents): add market validator agent`

---

## Quick Reference

```
✅ DO:
- Read this file before making changes
- Use UPPER_SNAKE_CASE for memory keys
- Extend BaseAgent for new agents
- Use logger instead of console.log
- Keep files under 500 lines
- Write tests for new features

❌ DON'T:
- Import across module boundaries
- Hardcode secrets or API keys
- Use direct SQL queries
- Create files in root directory
- Skip input validation
- Ignore error handling
```
