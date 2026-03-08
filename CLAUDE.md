# EntreBot - AI Venture Ideation Assistant

## Stack
Express.js backend, React frontend (Vite/TypeScript), OpenAI gpt-4o-mini, Supabase, Docker

## Commands

```bash
# Backend
node src/server.js          # or: npm run dev (--watch mode)

# Frontend
cd frontend && npm run dev

# Full stack
docker compose up --build
```

## Environment

- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` required in `frontend/.env`
- Auth: magic link only, restricted to @illinois.edu emails
- Deployed: Vercel (frontend) + Render (backend)

## Known Bug — VALIDATION LOOP (unresolved, top priority)

After idea selection, user gets stuck in validation phase. Validator agent loops instead of transitioning to builder.

**Investigation areas:**
1. `src/agents/validator.js` — does `validate()` set `Validator` memory key with `{ validated: true }`?
2. `src/routes/chat.js` stream endpoint — validator completion check requires `isProceedToBuildRequest()` match
3. Stream endpoint re-calls `agent.validate()` if memory isn't set, causing loop
4. Frontend `ChatInterface.tsx` — does it send correct agent name after validation?

## Key Gotchas

- `memoryQueries.get()` returns `{success, value}` — always access `.value`
- Stream and non-stream endpoints must have identical routing logic
- Supabase project ID: `zdtrnfexjviccudkaufu`

## Known Bug — MAGIC LINK EXPIRED (blocking local dev)

Magic links always show "expired" when clicked. Root cause: `http://localhost:5173` is likely missing from Supabase Redirect URLs allowlist.

**Fix:** Supabase Dashboard → Authentication → URL Configuration → add `http://localhost:5173/**` to Redirect URLs. Verify Site URL is set.

## Current Focus

1. Fix magic link redirect (blocking all local testing)
2. Resolve validation loop bug
3. Phase 5 (advanced coaching features)

## Session Log

### 2026-03-07
- Installed deps (node_modules were missing), started backend (port 3000) + frontend (port 5173)
- Browser audit: login page UX works well (validation, error messages, cooldown timer)
- Found: ProjectContext fires "Failed to load projects" errors on login page (harmless but noisy)
- Found: CLAUDE.md had wrong stack info (said FastAPI/CrewAI, actually Express/OpenAI) — fixed
- Blocked: magic links always expire — need Supabase redirect URL allowlist fix before full UX audit
- Dropped 3 stale git stashes, stopped unrelated Vite process

### 2026-02-13
- Removed Google OAuth (not enabled), magic link only (@illinois.edu)
- Added missing Supabase env vars to frontend/.env

### 2026-02-07
- Full frontend-backend integration, deployed to Vercel + Render
- Fixed session creation race condition, phase transitions, idea selection wiring
- Discovered validation loop bug (unresolved)
