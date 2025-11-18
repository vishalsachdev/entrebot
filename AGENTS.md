# Repository Guidelines

## Project Structure & Module Organization
- `src/` — application code
  - `agents/` (Onboarding, IdeaGenerator, Validator; extend `BaseAgent`)
  - `routes/` (Express routers; mounted in `src/routes/index.js` under `/api`)
  - `middleware/` (auth, validation, error handling)
  - `services/` (OpenAI, WhatsApp, external clients)
  - `database/` (Supabase client, queries, `schema.sql`)
  - `config/` (env, logger)
  - `utils/` (helpers)
- `tests/` — TypeScript Jest suite (unit, integration, e2e)
- `scripts/` — local helpers (e.g., `scripts/test-api.sh`)

## Build, Test, and Development Commands
- Install: `npm install`
- Dev server (auto-reload): `npm run dev`
- Start (prod): `npm start`
- API smoke test: `./scripts/test-api.sh`
- Tests: `cd tests && npm install && npm test`
- Coverage: `cd tests && npm run test:coverage`

## Coding Style & Naming Conventions
- Language: Node.js (ES modules), Node >= 18.
- Indentation: 2 spaces; use semicolons; single quotes.
- Filenames: kebab-case (`idea-generator.js`); directories lower-case.
- Identifiers: camelCase for vars/functions; PascalCase for classes.
- Imports: group built-ins → third-party → local.
- Comments: add concise JSDoc for exported functions and classes.

## Testing Guidelines
- Framework: Jest via `ts-jest` (in `tests/`).
- Structure: `tests/unit`, `tests/integration`, `tests/e2e`.
- File naming: `*.test.ts`.
- Coverage target: 80% global (`npm run test:coverage`).
- Add fixtures under `tests/fixtures/` when helpful; avoid network calls in unit tests.

## Commit & Pull Request Guidelines
- Use Conventional Commits: `feat:`, `fix:`, `docs:`, `chore:`, etc.
- PRs must include: clear description, linked issue, test plan (commands or curl), and any config/doc updates.
- Keep diffs focused; update or add tests for behavior changes.

## Security & Configuration Tips
- Copy `.env.example` → `.env`; never commit secrets.
- Required envs: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `OPENAI_API_KEY` (see `src/config/env.js`).
- Enable Supabase RLS in production (see notes in `schema.sql`).
- Don’t log sensitive data; use `logger` with appropriate levels.

## Agent-Specific Instructions
- Add a new agent under `src/agents/<name>.js` extending `BaseAgent`.
- Register it in `src/agents/index.js` and reference by key (e.g., `onboarding`, `ideaGenerator`).
- Persist context via `memoryQueries` with uppercase keys (e.g., `USER_PROFILE`).
- For new endpoints, create a router in `src/routes/`, validate with `Joi` schemas, wrap with `asyncHandler`, and mount in `routes/index.js`.

