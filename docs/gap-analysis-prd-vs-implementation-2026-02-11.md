# VentureBot PRD vs Current Implementation Gap Analysis

**Date:** February 11, 2026  
**Source PRD:** `/Users/vishal/code/entrebot/PRD.md` (Version 2.1, December 2025)  
**Codebase Reviewed:** `/Users/vishal/code/entrebot/src`, `/Users/vishal/code/entrebot/frontend/src`

## Scope and Method

This analysis compares PRD commitments against the app currently implemented in this repository.

- Inputs reviewed: PRD, backend routes/services/agents/orchestrator, frontend pages/contexts/chat flow.
- Method: requirement-to-capability mapping with code evidence.
- Note: this is a code-level assessment; no production runtime or user telemetry validation was performed.

## Executive Summary

The current product is strongest in the early coaching journey (discovery, ideation, basic validation) and foundational chat architecture. The largest gaps are in execution/launch/growth workflows, external integrations, multi-channel support, and production-grade auth/history/community capabilities.

### Maturity Snapshot

| Area | Status | Summary |
|---|---|---|
| Phases 1-3 (Discovery, Ideation, Validation) | Partial | Implemented with working agents and UI, but validation lacks external market data/citations. |
| Phase 4 (Strategy/PRD) | Partial with defects | Builder exists, but streaming path bypasses PRD-specific logic and builder routing has validation mismatch. |
| Phases 5-7 (Build, Launch, Growth) | Mostly missing | Limited prompt/planning support; no dedicated launch/growth agent workflows. |
| Auth, history, cross-device continuity | Partial | Conversation persistence exists; auth is demo-style in frontend and does not match backend JWT validation model. |
| Sharing/community/multi-channel | Missing | No implemented public share/IllinoisHunt/Discord/Telegram/WhatsApp channels (WhatsApp is placeholder). |

## Phase-by-Phase Gap Analysis

| PRD Phase | PRD Expectation | Current Implementation | Gap |
|---|---|---|---|
| Phase 1: Discovery | Socratic onboarding, pain profiling, persistent context | Onboarding agent and memory persistence are implemented | Moderate: no formal learning outcomes tracking in backend, limited structured skill progression |
| Phase 2: Ideation | 5 market-aware ideas + concept teaching + selection | Idea generation/selection exists with structured parsing and UI cards | Low-Moderate: typically 3 ideas in prompt patterns; concept pedagogy is lightweight |
| Phase 3: Validation | Real-time market intelligence, citations, dashboard, proceed/pivot | Validator scoring + dashboard UI present | High: no external market research tool calls/citations; mostly LLM-only analysis |
| Phase 4: Strategy | PRD generation + refinement loop + strategic coaching | Builder agent supports PRD generation methods | High: streaming endpoint does not call PRD-specific builder methods, causing persistence/milestone drift |
| Phase 5: Execution | Tool-specific build prompts + troubleshooting support | Builder has MVP/landing support methods | High: no dedicated prompt-engineer/tool-skills agent workflows exposed end-to-end |
| Phase 6: Launch | GTM strategy, content assets, launch checklist | No dedicated GTM agent; launch mapped to Builder placeholder | Very High |
| Phase 7: Growth | Post-launch mentorship, KPI coaching, adaptive learning | No growth agent implementation; growth phase is placeholder | Very High |

## Core Capability Gaps (PRD Sections 1-9)

### 1) Multi-Agent Coaching System
- Implemented: 4 agents only (`onboarding`, `ideaGenerator`, `validator`, `builder`).
- Missing vs PRD: strategy/prompt-engineer/tool-skills/mentor/analytics/innovation-scout/go-to-market/creative agents.
- Evidence: `/Users/vishal/code/entrebot/src/agents/index.js:11`

### 2) Socratic Coaching and Personalized Learning
- Implemented: strong prompt-level Socratic behavior in onboarding/ideation.
- Missing vs PRD: explicit skill-gap model, structured learning resource engine, adaptive coaching profile over time.

### 3) Authentication and History Tracking
- Implemented: users/projects/sessions/conversations/memory persistence.
- Missing vs PRD: real credential auth flow, social login, password recovery, reliable cross-device auth continuity, history search/export.
- Critical mismatch: frontend creates synthetic token while backend expects Supabase JWT.
- Evidence: `/Users/vishal/code/entrebot/frontend/src/contexts/AuthContext.tsx:127`, `/Users/vishal/code/entrebot/src/middleware/auth.js:33`

### 4) Tool Calling and External Integrations
- Implemented: OpenAI-only model invocation.
- Missing vs PRD: market search tools, competitor intelligence APIs, citation pipeline, extensible tool catalog.

### 5) Chat Sharing and Community Discovery
- Missing in runtime API/UI: no share/fork/public journey workflows exposed.
- Evidence: mounted routes are limited to chat/users/projects/sessions/conversations/memory only.  
  `/Users/vishal/code/entrebot/src/routes/index.js:63`

### 6) Multi-Channel Access - Ignore, do not implement 
- Implemented: web only.
- Missing vs PRD: Discord/Telegram/WhatsApp production channels and account linking.
- Evidence: WhatsApp service is placeholder.  
  `/Users/vishal/code/entrebot/src/services/whatsapp.js:22`

### 7) Comprehensive Market Intelligence
- Implemented: score extraction and visualization.
- Missing vs PRD: external evidence, confidence/citation rigor, competitor dataset grounding.

### 8) Educational Content Integration
- Implemented: contextual concept mentions in agent prompts and UI copy.
- Missing vs PRD: concept library, tracked competency progression, dynamic learning-path recommendations.

### 9) Modular and Extensible Architecture
- Implemented: modular agent classes and shared memory pattern.
- Missing vs PRD: dynamic tool registry/catalog, agent marketplace/versioning, feature-flag/A-B infrastructure, health/deprecation framework.

## Critical Implementation Drifts (Code-Level)

1. **Builder routing blocked by validation schema**
- `sendMessage` schema allows only onboarding/ideaGenerator/validator.
- Builder requests through `/chat/stream` can fail validation.
- Evidence: `/Users/vishal/code/entrebot/src/middleware/validation.js:46`

2. **Streaming path bypasses orchestrated builder workflows**
- `/chat/stream` directly dispatches by selected agent and uses `builder.chat()`, not PRD/landing specialized handlers used in `/chat/message`.
- PRD persistence/milestone behavior can diverge.
- Evidence: `/Users/vishal/code/entrebot/src/routes/chat.js:289`, `/Users/vishal/code/entrebot/src/routes/chat.js:332`, `/Users/vishal/code/entrebot/src/services/chat.js:168`

3. **Frontend edit/delete message APIs not implemented in backend**
- Frontend calls `PATCH/DELETE /conversations/:messageId`, backend exposes only POST + GET + summary.
- Evidence: `/Users/vishal/code/entrebot/frontend/src/components/agents/ChatInterface.tsx:695`, `/Users/vishal/code/entrebot/src/routes/conversations.js:28`

4. **Phase naming drift (`planning` vs `strategy`)**
- Frontend progress context uses `planning`; backend orchestrator uses `strategy`.
- Evidence: `/Users/vishal/code/entrebot/frontend/src/contexts/ProgressContext.tsx:73`, `/Users/vishal/code/entrebot/src/orchestrator/index.js:59`

5. **Project service endpoint prefix drift risk**
- API base defaults to `/api/v1`, while project service uses `/v1/projects...` paths.
- This can become `/api/v1/v1/...` depending environment setup.
- Evidence: `/Users/vishal/code/entrebot/frontend/src/services/api.ts:30`, `/Users/vishal/code/entrebot/frontend/src/services/api.ts:939`

## Recommended Remediation Roadmap

### Now (stabilize current scope)
- Unify chat logic so streaming and non-streaming share the same orchestration/handler path.
- Fix agent validation schema to include Builder.
- Resolve frontend/backend API contract mismatches (conversation patch/delete, project path prefixes).
- Align phase identifiers (`strategy` vs `planning`) across backend and frontend.
- Replace demo auth token flow with real Supabase session JWT flow.

### Next (deliver PRD Phase 1 fully)
- Add evidence-backed market research tool calls with citations.
- Add dedicated Prompt Engineer + Tool Skills Coach agents to support Phase 5.
- Add history search/export and stronger milestone/learning tracking.

### Later (PRD Phase 2+)
- Implement share/fork/public journey APIs + UI and IllinoisHunt integration.
- Add Discord/Telegram/WhatsApp production channel adapters.
- Introduce post-launch growth agent workflows and analytics instrumentation.

## Conclusion

The current implementation is a strong foundation for PRD Phase 1 intent, but not yet at PRD breadth. The highest-value path is to first close architecture and contract drifts, then complete evidence-backed validation and execution-support agents before expanding into community and multi-channel features.

## Status Update (Fix Pass - February 11, 2026)

Since this gap analysis was created, the following high-priority items have been addressed in code:

- Streaming path now uses orchestrator routing and the same shared handler path as non-streaming chat.
- Dedicated `PromptEngineer` execution agent was added and set as the primary Building phase agent.
- Dedicated `GoToMarket` and `GrowthCoach` agents were added and wired into `launch` and `growth` phases.
- Launch completion transition to growth phase is now implemented (`GoToMarket` -> `GrowthCoach`).
- Public conversation sharing now includes API + frontend page flow (`/shared/:shareId`) with authenticated fork support.
- Authenticated session creation is now used in frontend chat via `POST /api/v1/chat/sessions`.
- Session history now includes authenticated listing, search, export (`json`/`text`), and server-backed delete endpoints.
- Remaining phase naming drift reduced by adding `strategy` status support while preserving `planning` compatibility.
- Auth UX now includes a working forgot-password flow (`POST /api/v1/auth/forgot-password` + `/forgot-password` page).
- Secondary API contracts were aligned (sessions/conversations/memory service methods now match implemented backend routes).
- Frontend quality gates are now passing (`npm run lint`, `npm run type-check`, and `npm run build`), including cleanup of hook dependency warnings and strict-type lint debt in shared hooks/components.
- Ownership/auth hardening was applied to session/conversation/memory/project APIs so authenticated users can only read or mutate their own resources.
- Chat endpoints are now ownership-guarded and authenticated for session data operations (`/chat/message`, `/chat/stream`, `/chat/history/:sessionId`, `/chat/progress/:sessionId`, `/chat/select-idea`, and `/chat/sessions/:sessionId`).
- Progress and coaching activity pages now use the same session storage key as chat (`venturebot_session_id`), fixing session context drift in those views.
- User API contract now aligns with frontend usage (`GET /users/email/:email` and `GET/PUT/DELETE /users/:userId`) with authenticated ownership checks and `phone_number` response normalization.
