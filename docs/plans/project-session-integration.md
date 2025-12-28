# Plan: Connect Projects to Chat Sessions

> **Status**: Drafted (pre-refactor)
> **Created**: 2025-12-28
> **Context**: This plan was created before a major refactor. Review after refactor to see what still applies.

## Problem Statement
Projects and chat sessions are completely independent systems:
- **Projects**: Frontend-only (localStorage), no persistence
- **Sessions**: Backend (Supabase), linked to users only
- **The FK exists** (`sessions.project_id`) in schema but is never used

## Goal
Make chat sessions project-aware so that:
1. Each session belongs to a specific project
2. Switching projects shows project-specific chat history
3. Projects persist to database (not just localStorage)

---

## Implementation Strategy

### Phase 1: Database Layer (Foundation)

**1.1 Update Simple Schema** (`src/database/schema.sql`)
- Add `project_id UUID` column to `sessions` table
- Add `projects` table if missing
- Add foreign key constraint

**1.2 Add Project Queries** (`src/database/queries.js`)
- Add `projectQueries` object with CRUD operations
- Update `sessionQueries.create()` to accept `projectId`
- Add `sessionQueries.getByProject(projectId)` method

### Phase 2: Backend API Routes

**2.1 Create Project Routes** (`src/routes/projects.js`)
```
POST   /api/v1/projects      - Create project
GET    /api/v1/projects      - List user's projects
GET    /api/v1/projects/:id  - Get single project
PUT    /api/v1/projects/:id  - Update project
DELETE /api/v1/projects/:id  - Delete project
```

**2.2 Update Session Routes** (`src/routes/sessions.js`)
- Add `projectId` to validation schema
- Pass `projectId` to query layer

**2.3 Mount Routes** (`src/routes/index.js`)
- Add `router.use('/projects', projectRoutes)`

### Phase 3: Frontend Integration

**3.1 Add API Service** (`frontend/src/services/api.ts`)
- Add `projectService` with CRUD methods matching new endpoints

**3.2 Update ProjectContext** (`frontend/src/contexts/ProjectContext.tsx`)
- Replace localStorage with API calls (database-only, no localStorage cache)
- Load projects from API on mount
- All CRUD operations go directly to API

**3.3 Update ChatInterface** (`frontend/src/components/agents/ChatInterface.tsx`)
- Import `useProject` hook
- Pass `currentProject?.id` to session creation
- Filter/create sessions by project

**3.4 Update Types** (`frontend/src/types/index.ts`, `frontend/src/types/database.ts`)
- Add `project_id` to `DbSession`
- Align `Project.status` enum with database

---

## File Changes Summary

| File | Action | Changes |
|------|--------|---------|
| `src/database/schema.sql` | Modify | Add projects table, project_id to sessions |
| `src/database/queries.js` | Modify | Add projectQueries, update sessionQueries |
| `src/routes/projects.js` | Create | New project CRUD endpoints |
| `src/routes/index.js` | Modify | Mount project routes |
| `src/routes/sessions.js` | Modify | Add projectId to schema |
| `frontend/src/services/api.ts` | Modify | Add projectService |
| `frontend/src/contexts/ProjectContext.tsx` | Modify | Use API instead of localStorage |
| `frontend/src/components/agents/ChatInterface.tsx` | Modify | Pass projectId to sessions |
| `frontend/src/types/database.ts` | Modify | Add project_id to DbSession |
| `frontend/src/types/index.ts` | Modify | Align status enums |

---

## Data Flow After Implementation

```
User creates/selects project
        │
        ▼
POST /api/v1/projects (if new)
        │
        ▼
ProjectContext.currentProject
        │
        ▼
ChatInterface.ensureSession({ projectId })
        │
        ▼
POST /api/v1/sessions { userId, projectId }
        │
        ▼
INSERT INTO sessions (user_id, project_id, ...)
        │
        ▼
All messages linked to project via session
```

---

## Status Enum Reconciliation

**Option chosen**: Update frontend to match database enums

| Frontend (current) | Database | Action |
|-------------------|----------|--------|
| `active` | `active` | Keep |
| `paused` | `paused` | Keep |
| `completed` | `launched` | Map completed → launched |
| `archived` | `abandoned` | Map archived → abandoned |
| - | `ideation` | Add to frontend |
| - | `validation` | Add to frontend |
| - | `planning` | Add to frontend |
| - | `building` | Add to frontend |

---

## Testing Considerations

1. Create project → verify in database
2. Create session with projectId → verify FK set
3. Switch projects → verify different sessions shown
4. Delete project → verify sessions.project_id set to NULL

---

## Key Insight

The root cause was architectural: **two independent storage systems** (localStorage for projects, Supabase for sessions) that were never connected despite the FK existing in the schema. The fix requires a unified data layer where both projects and sessions flow through the same backend.
