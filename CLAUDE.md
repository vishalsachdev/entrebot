# EntreBot - AI Venture Ideation Assistant

## Stack
Python backend (FastAPI), React frontend (Vite/TypeScript), CrewAI agents, Supabase, Docker

## Commands

```bash
# Backend
python -m uvicorn services.api_gateway.app.main:app --reload --port 8000

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

## TODO — Google OAuth Setup

- Generate OAuth credentials in Google Cloud Console
- Enable Google provider in Supabase (Auth > Providers > Google)
- Callback URL: `https://zdtrnfexjviccudkaufu.supabase.co/auth/v1/callback`
- Share credentials with `code/illinihunt`

## Current Focus

Resolve validation loop bug, then Phase 5 (advanced coaching features).

## Session Log

### 2026-02-13
- Removed Google OAuth (not enabled), magic link only (@illinois.edu)
- Added missing Supabase env vars to frontend/.env

### 2026-02-07
- Full frontend-backend integration, deployed to Vercel + Render
- Fixed session creation race condition, phase transitions, idea selection wiring
- Discovered validation loop bug (unresolved)
