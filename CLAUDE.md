# Claude Code Configuration - SPARC Development Environment

## 🚨 CRITICAL: CONCURRENT EXECUTION & FILE MANAGEMENT

**ABSOLUTE RULES**:
1. ALL operations MUST be concurrent/parallel in a single message
2. **NEVER save working files, text/mds and tests to the root folder**
3. ALWAYS organize files in appropriate subdirectories
4. **USE CLAUDE CODE'S TASK TOOL** for spawning agents concurrently, not just MCP

### ⚡ GOLDEN RULE: "1 MESSAGE = ALL RELATED OPERATIONS"

**MANDATORY PATTERNS:**
- **TodoWrite**: ALWAYS batch ALL todos in ONE call (5-10+ todos minimum)
- **Task tool (Claude Code)**: ALWAYS spawn ALL agents in ONE message with full instructions
- **File operations**: ALWAYS batch ALL reads/writes/edits in ONE message
- **Bash commands**: ALWAYS batch ALL terminal operations in ONE message
- **Memory operations**: ALWAYS batch ALL memory store/retrieve in ONE message

### 🎯 CRITICAL: Claude Code Task Tool for Agent Execution

**Claude Code's Task tool is the PRIMARY way to spawn agents:**
```javascript
// ✅ CORRECT: Use Claude Code's Task tool for parallel agent execution
[Single Message]:
  Task("Research agent", "Analyze requirements and patterns...", "researcher")
  Task("Coder agent", "Implement core features...", "coder")
  Task("Tester agent", "Create comprehensive tests...", "tester")
  Task("Reviewer agent", "Review code quality...", "reviewer")
  Task("Architect agent", "Design system architecture...", "system-architect")
```

**MCP tools are ONLY for coordination setup:**
- `mcp__claude-flow__swarm_init` - Initialize coordination topology
- `mcp__claude-flow__agent_spawn` - Define agent types for coordination
- `mcp__claude-flow__task_orchestrate` - Orchestrate high-level workflows

### 📁 File Organization Rules

**NEVER save to root folder. Use these directories:**
- `/src` - Source code files
- `/tests` - Test files
- `/docs` - Documentation and markdown files
- `/config` - Configuration files
- `/scripts` - Utility scripts
- `/examples` - Example code

## Project Overview

This project uses SPARC (Specification, Pseudocode, Architecture, Refinement, Completion) methodology with Claude-Flow orchestration for systematic Test-Driven Development.

## SPARC Commands

### Core Commands
- `npx claude-flow sparc modes` - List available modes
- `npx claude-flow sparc run <mode> "<task>"` - Execute specific mode
- `npx claude-flow sparc tdd "<feature>"` - Run complete TDD workflow
- `npx claude-flow sparc info <mode>` - Get mode details

### Batchtools Commands
- `npx claude-flow sparc batch <modes> "<task>"` - Parallel execution
- `npx claude-flow sparc pipeline "<task>"` - Full pipeline processing
- `npx claude-flow sparc concurrent <mode> "<tasks-file>"` - Multi-task processing

### Build Commands
- `npm run build` - Build project
- `npm run test` - Run tests
- `npm run lint` - Linting
- `npm run typecheck` - Type checking

## SPARC Workflow Phases

1. **Specification** - Requirements analysis (`sparc run spec-pseudocode`)
2. **Pseudocode** - Algorithm design (`sparc run spec-pseudocode`)
3. **Architecture** - System design (`sparc run architect`)
4. **Refinement** - TDD implementation (`sparc tdd`)
5. **Completion** - Integration (`sparc run integration`)

## Code Style & Best Practices

- **Modular Design**: Files under 500 lines
- **Environment Safety**: Never hardcode secrets
- **Test-First**: Write tests before implementation
- **Clean Architecture**: Separate concerns
- **Documentation**: Keep updated

## 🚀 Available Agents (54 Total)

### Core Development
`coder`, `reviewer`, `tester`, `planner`, `researcher`

### Swarm Coordination
`hierarchical-coordinator`, `mesh-coordinator`, `adaptive-coordinator`, `collective-intelligence-coordinator`, `swarm-memory-manager`

### Consensus & Distributed
`byzantine-coordinator`, `raft-manager`, `gossip-coordinator`, `consensus-builder`, `crdt-synchronizer`, `quorum-manager`, `security-manager`

### Performance & Optimization
`perf-analyzer`, `performance-benchmarker`, `task-orchestrator`, `memory-coordinator`, `smart-agent`

### GitHub & Repository
`github-modes`, `pr-manager`, `code-review-swarm`, `issue-tracker`, `release-manager`, `workflow-automation`, `project-board-sync`, `repo-architect`, `multi-repo-swarm`

### SPARC Methodology
`sparc-coord`, `sparc-coder`, `specification`, `pseudocode`, `architecture`, `refinement`

### Specialized Development
`backend-dev`, `mobile-dev`, `ml-developer`, `cicd-engineer`, `api-docs`, `system-architect`, `code-analyzer`, `base-template-generator`

### Testing & Validation
`tdd-london-swarm`, `production-validator`

### Migration & Planning
`migration-planner`, `swarm-init`

## 🎯 Claude Code vs MCP Tools

### Claude Code Handles ALL EXECUTION:
- **Task tool**: Spawn and run agents concurrently for actual work
- File operations (Read, Write, Edit, MultiEdit, Glob, Grep)
- Code generation and programming
- Bash commands and system operations
- Implementation work
- Project navigation and analysis
- TodoWrite and task management
- Git operations
- Package management
- Testing and debugging

### MCP Tools ONLY COORDINATE:
- Swarm initialization (topology setup)
- Agent type definitions (coordination patterns)
- Task orchestration (high-level planning)
- Memory management
- Neural features
- Performance tracking
- GitHub integration

**KEY**: MCP coordinates the strategy, Claude Code's Task tool executes with real agents.

## 🚀 Quick Setup

```bash
# Add MCP servers (Claude Flow required, others optional)
claude mcp add claude-flow npx claude-flow@alpha mcp start
claude mcp add ruv-swarm npx ruv-swarm mcp start  # Optional: Enhanced coordination
claude mcp add flow-nexus npx flow-nexus@latest mcp start  # Optional: Cloud features
```

## MCP Tool Categories

### Coordination
`swarm_init`, `agent_spawn`, `task_orchestrate`

### Monitoring
`swarm_status`, `agent_list`, `agent_metrics`, `task_status`, `task_results`

### Memory & Neural
`memory_usage`, `neural_status`, `neural_train`, `neural_patterns`

### GitHub Integration
`github_swarm`, `repo_analyze`, `pr_enhance`, `issue_triage`, `code_review`

### System
`benchmark_run`, `features_detect`, `swarm_monitor`

### Flow-Nexus MCP Tools (Optional Advanced Features)
Flow-Nexus extends MCP capabilities with 70+ cloud-based orchestration tools:

**Key MCP Tool Categories:**
- **Swarm & Agents**: `swarm_init`, `swarm_scale`, `agent_spawn`, `task_orchestrate`
- **Sandboxes**: `sandbox_create`, `sandbox_execute`, `sandbox_upload` (cloud execution)
- **Templates**: `template_list`, `template_deploy` (pre-built project templates)
- **Neural AI**: `neural_train`, `neural_patterns`, `seraphina_chat` (AI assistant)
- **GitHub**: `github_repo_analyze`, `github_pr_manage` (repository management)
- **Real-time**: `execution_stream_subscribe`, `realtime_subscribe` (live monitoring)
- **Storage**: `storage_upload`, `storage_list` (cloud file management)

**Authentication Required:**
- Register: `mcp__flow-nexus__user_register` or `npx flow-nexus@latest register`
- Login: `mcp__flow-nexus__user_login` or `npx flow-nexus@latest login`
- Access 70+ specialized MCP tools for advanced orchestration

## 🚀 Agent Execution Flow with Claude Code

### The Correct Pattern:

1. **Optional**: Use MCP tools to set up coordination topology
2. **REQUIRED**: Use Claude Code's Task tool to spawn agents that do actual work
3. **REQUIRED**: Each agent runs hooks for coordination
4. **REQUIRED**: Batch all operations in single messages

### Example Full-Stack Development:

```javascript
// Single message with all agent spawning via Claude Code's Task tool
[Parallel Agent Execution]:
  Task("Backend Developer", "Build REST API with Express. Use hooks for coordination.", "backend-dev")
  Task("Frontend Developer", "Create React UI. Coordinate with backend via memory.", "coder")
  Task("Database Architect", "Design PostgreSQL schema. Store schema in memory.", "code-analyzer")
  Task("Test Engineer", "Write Jest tests. Check memory for API contracts.", "tester")
  Task("DevOps Engineer", "Setup Docker and CI/CD. Document in memory.", "cicd-engineer")
  Task("Security Auditor", "Review authentication. Report findings via hooks.", "reviewer")
  
  // All todos batched together
  TodoWrite { todos: [...8-10 todos...] }
  
  // All file operations together
  Write "backend/server.js"
  Write "frontend/App.jsx"
  Write "database/schema.sql"
```

## 📋 Agent Coordination Protocol

### Every Agent Spawned via Task Tool MUST:

**1️⃣ BEFORE Work:**
```bash
npx claude-flow@alpha hooks pre-task --description "[task]"
npx claude-flow@alpha hooks session-restore --session-id "swarm-[id]"
```

**2️⃣ DURING Work:**
```bash
npx claude-flow@alpha hooks post-edit --file "[file]" --memory-key "swarm/[agent]/[step]"
npx claude-flow@alpha hooks notify --message "[what was done]"
```

**3️⃣ AFTER Work:**
```bash
npx claude-flow@alpha hooks post-task --task-id "[task]"
npx claude-flow@alpha hooks session-end --export-metrics true
```

## 🎯 Concurrent Execution Examples

### ✅ CORRECT WORKFLOW: MCP Coordinates, Claude Code Executes

```javascript
// Step 1: MCP tools set up coordination (optional, for complex tasks)
[Single Message - Coordination Setup]:
  mcp__claude-flow__swarm_init { topology: "mesh", maxAgents: 6 }
  mcp__claude-flow__agent_spawn { type: "researcher" }
  mcp__claude-flow__agent_spawn { type: "coder" }
  mcp__claude-flow__agent_spawn { type: "tester" }

// Step 2: Claude Code Task tool spawns ACTUAL agents that do the work
[Single Message - Parallel Agent Execution]:
  // Claude Code's Task tool spawns real agents concurrently
  Task("Research agent", "Analyze API requirements and best practices. Check memory for prior decisions.", "researcher")
  Task("Coder agent", "Implement REST endpoints with authentication. Coordinate via hooks.", "coder")
  Task("Database agent", "Design and implement database schema. Store decisions in memory.", "code-analyzer")
  Task("Tester agent", "Create comprehensive test suite with 90% coverage.", "tester")
  Task("Reviewer agent", "Review code quality and security. Document findings.", "reviewer")
  
  // Batch ALL todos in ONE call
  TodoWrite { todos: [
    {id: "1", content: "Research API patterns", status: "in_progress", priority: "high"},
    {id: "2", content: "Design database schema", status: "in_progress", priority: "high"},
    {id: "3", content: "Implement authentication", status: "pending", priority: "high"},
    {id: "4", content: "Build REST endpoints", status: "pending", priority: "high"},
    {id: "5", content: "Write unit tests", status: "pending", priority: "medium"},
    {id: "6", content: "Integration tests", status: "pending", priority: "medium"},
    {id: "7", content: "API documentation", status: "pending", priority: "low"},
    {id: "8", content: "Performance optimization", status: "pending", priority: "low"}
  ]}
  
  // Parallel file operations
  Bash "mkdir -p app/{src,tests,docs,config}"
  Write "app/package.json"
  Write "app/src/server.js"
  Write "app/tests/server.test.js"
  Write "app/docs/API.md"
```

### ❌ WRONG (Multiple Messages):
```javascript
Message 1: mcp__claude-flow__swarm_init
Message 2: Task("agent 1")
Message 3: TodoWrite { todos: [single todo] }
Message 4: Write "file.js"
// This breaks parallel coordination!
```

## Performance Benefits

- **84.8% SWE-Bench solve rate**
- **32.3% token reduction**
- **2.8-4.4x speed improvement**
- **27+ neural models**

## Hooks Integration

### Pre-Operation
- Auto-assign agents by file type
- Validate commands for safety
- Prepare resources automatically
- Optimize topology by complexity
- Cache searches

### Post-Operation
- Auto-format code
- Train neural patterns
- Update memory
- Analyze performance
- Track token usage

### Session Management
- Generate summaries
- Persist state
- Track metrics
- Restore context
- Export workflows

## Advanced Features (v2.0.0)

- 🚀 Automatic Topology Selection
- ⚡ Parallel Execution (2.8-4.4x speed)
- 🧠 Neural Training
- 📊 Bottleneck Analysis
- 🤖 Smart Auto-Spawning
- 🛡️ Self-Healing Workflows
- 💾 Cross-Session Memory
- 🔗 GitHub Integration

## Integration Tips

1. Start with basic swarm init
2. Scale agents gradually
3. Use memory for context
4. Monitor progress regularly
5. Train patterns from success
6. Enable hooks automation
7. Use GitHub tools first

## Support

- Documentation: https://github.com/ruvnet/claude-flow
- Issues: https://github.com/ruvnet/claude-flow/issues
- Flow-Nexus Platform: https://flow-nexus.ruv.io (registration required for cloud features)

---

Remember: **Claude Flow coordinates, Claude Code creates!**

---

## Session Log

### 2024-12-28
**Completed:**
- Merged feature branch `feature/investigate-project-session-independence` to main (Phases 1-4)
- Fixed reflection transition bug: onboarding agent now waits for user to answer "What's the REAL reason this bothers you?" before transitioning to idea generation
- Phase 4.2: Added `learningObjectives` to all PHASES in orchestrator, created `LearningObjectives` component
- Phase 4.3: Created `IdeaCard` and `IdeaCardGrid` components for structured idea display
- Added test file: `tests/reflection-flow.test.js` for verifying reflection flow behavior

**Key Pattern Learned:**
- When implementing conversational state machines, use explicit flags (`reflectionAsked`, `reflectionReceived`) to track multi-turn exchanges rather than inferring state from conversation history

**Next Focus:**
- Phase 5: Advanced coaching features (follow-up questions, progress tracking)
- Clean up console.log statements in onboarding.js (18 lint warnings)
- Consider adding more tests for the agent state machine logic

### 2025-12-28
**Completed:**
- Created `scripts/chat-test.js` - standalone CLI for testing chat without UI
- Fixed 8 bugs in onboarding agent pattern extraction discovered via automated testing
- Merged PR #5 (`fix/venturebot-chat-agent-issues`) to main

**Chat Test Script Usage:**
```bash
# Interactive mode
node scripts/chat-test.js

# Auto-test with Ralph Wiggum persona (5 conversation patterns)
node scripts/chat-test.js --auto

# Run specific pattern (0-4)
node scripts/chat-test.js --auto --iteration 2

# Commands in interactive mode:
#   /new      - Start fresh session
#   /state    - Show memory state
#   /phase    - Show current phase
#   /history  - Show conversation history
#   /debug    - Toggle debug output
#   /quit     - Exit
```

**Bugs Fixed:**
1. UUID format for test user ID
2. Severity extraction ("Maybe a 6" pattern)
3. Frequency extraction ("every few months" pattern)
4. readyForIdeas trigger on standalone "yes"
5. Reflection timing (turn tracking)
6. Name extraction punctuation ("Hello!" filtered correctly)
7. readyForIdeas false positive ("Yes everyone" no longer triggers)

**Key Pattern Learned:**
- Use automated conversation testing with varied personas to catch edge cases in pattern matching that unit tests miss

### 2025-12-28 (continued)
**Completed:**
- Fixed 4 critical IdeaGenerator agent bugs discovered during live testing at entrebot.vercel.app
- Bug 1: Phase state defaults to 'discovery' on DB errors - added retry logic in orchestrator
- Bug 2: GeneratedIdeas flag race condition - added conversation history fallback check
- Bug 3: Duplicate 'Before I share ideas' messages - added `alreadyAskedForIdeas` history check
- Bug 4: LLM repeats coaching question - added code-based pattern detection to bypass LLM for "no ideas" responses

**Key Files Modified:**
- `src/agents/idea-generator.js` - Added `noIdeasPatterns` regex array and bypass logic in `chat()` method
- `src/services/chat.js` - Added conversation history check for coaching question
- `src/orchestrator/index.js` - Added retry logic for transient DB errors

**Key Pattern Learned:**
- Code-based pattern detection > prompt-based hints for LLM behavior control
- When you need deterministic outcomes, detect user intent in code and route to specific functions rather than hoping the LLM follows system message instructions

### 2025-12-28 (session 3)
**Completed:**
- Fixed 3 additional bugs found during comprehensive testing
- Bug 5: Coaching question repeat - multi-layer fix across idea-generator.js and chat.js
- Bug 6: Memory access pattern - fixed `existingIdeas?.generated` to `existingIdeas?.value?.generated`
- Bug 7: Idea selection not triggering - fixed pattern detection in chat.js
- Created comprehensive API test suite (46 tests total, 91% pass rate)
  - `tests/api-chat-flow.test.js` - 7 major flow tests
  - `tests/api-chat-edge-cases.test.js` - 8 edge case tests
- Spawned parallel test agents for architecture analysis and test design

**Commits:**
- `64b2c91` - fix: resolve idea selection and coaching question bugs
- `5f6aad5` - test: add comprehensive API chat flow tests

**Test Results:**
- Onboarding flow: ✅ All passing
- Ideation ("yes"/"no ideas"): ✅ All passing
- Idea selection (numeric/#1/word): ✅ All passing
- Validation phase transitions: ✅ All passing
- Back-to-ideas flow: ✅ All passing
- 4 failures due to rate limiting during rapid test succession (not bugs)

**Key Pattern Learned:**
- Supabase queries return `{success, value}` - always access `.value` property
- When testing rapidly, add delays between test suites to avoid API rate limits

**Next Focus:**
- Phase 5: Advanced coaching features (follow-up questions)

### 2025-12-29
**Completed:**
- Fixed lint warnings (0 warnings now) - added `varsIgnorePattern` to ESLint
- Added semantic message classification to onboarding agent
- Fixed severity overwrite bug ("#1" idea selection was overwriting severity rating)
- Fixed description extraction (was too strict with 5-word minimum)
- All 21 API tests pass

**Key Change - Semantic Message Classification:**
New `classifyMessage()` method returns: `'rating'`, `'selection'`, `'affirmative'`, `'frequency'`, `'greeting'`, or `'content'`
- Severity only extracted from `'rating'` type (prevents "#1" from being mistaken as severity)
- Description only stored from `'content'` type with >=15 chars (not word counts)
- More robust than hard-coded word count heuristics

**Commits:**
- `d6744ee` - fix: lint cleanup and test rate limiting fixes
- `6bdf25a` - fix: semantic message classification for robust extraction

**Key Pattern Learned:**
- Semantic message classification > hard-coded word counts for NLP extraction
- Classify intent first, then extract - prevents cross-contamination between data fields

**Next Focus:**
- Phase 5: Advanced coaching features (follow-up questions, progress tracking)
- Consider adding unit tests for `classifyMessage()` function

### 2026-02-07
**Completed:**
- Full frontend-backend integration: fixed API URL mismatches (6 files), mock auth → real auth, dead agent mappings removed
- Memory endpoint fixes: URL path, auth middleware removal, data format parsing
- Restored paused Supabase project
- Deployed to Vercel (frontend) + Render (backend)
- Created root `vercel.json` to build from `frontend/` subdirectory
- Fixed TypeScript build errors for Vercel (CreateProjectModal signature, ToastState export, example exclusion)
- Fixed session creation race condition (ref-based promise deduplication in `ensureSession()`)
- Added phase transition logic to `/chat/stream` endpoint (was completely missing - users got stuck in onboarding)
- Added pre-routing for idea selection and back-to-ideas in stream endpoint
- Wired idea card button `onSelectIdea` prop chain (was no-op `() => {}`)
- Fixed validator memory access: `?.validated` → `?.value?.validated`
- Added Builder agent handling to stream endpoint

**Known Bug - VALIDATION LOOP (unresolved):**
- After idea selection, user gets stuck in validation phase
- Validator agent keeps looping instead of completing and allowing transition to builder
- Likely root cause areas to investigate:
  1. `src/agents/validator.js` - check `validate()` method and how it sets `Validator` memory key with `{ validated: true }`
  2. `src/routes/chat.js` stream endpoint - validator completion check: `validationDone?.value?.validated && isProceedToBuildRequest(lowerMessage)` — user may not be sending a message that matches `isProceedToBuildRequest()` patterns
  3. The stream endpoint agent routing (lines ~324-330) re-calls `agent.validate()` if `Validator` memory isn't set yet, but if `validate()` never sets the memory key, it loops
  4. Check if `validator.validate()` actually calls `memoryQueries.set(sessionId, 'Validator', { validated: true })` on completion
  5. Frontend `ChatInterface.tsx` — after validation completes, does it send the right agent name for the next message?
- This is the **top priority** for next session

**Key Files Modified:**
- `src/routes/chat.js` - Stream endpoint overhaul (pre-routing, transitions, builder handling)
- `frontend/src/hooks/useStreamingChat.ts` - PhaseTransition type, onComplete signature
- `frontend/src/components/agents/ChatInterface.tsx` - Session race fix, handleSelectIdea, transition handling
- `frontend/src/components/agents/MessageList.tsx` - onSelectIdea prop wiring
- `vercel.json` (root, new) - Vercel build config for frontend subdirectory

**Key Patterns Learned:**
- Stream and non-stream endpoints must have identical routing logic — easy to add features to one and forget the other
- `memoryQueries.get()` returns `{success, value}` — always access `.value`
- React ref-based promise deduplication prevents concurrent async operations (session creation race)

### 2026-02-13
**Completed:**
- Removed Google OAuth sign-in button from Login page (provider not enabled in Supabase)
- Login now uses magic link only, restricted to @illinois.edu emails
- Added missing `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to `frontend/.env` (was blocking all local auth)

**TODO - Google OAuth Setup:**
- Generate new Google OAuth credentials (Client ID + Secret) in Google Cloud Console
- Enable Google provider in Supabase dashboard (Auth > Providers > Google)
- Add Supabase callback URL as authorized redirect URI: `https://zdtrnfexjviccudkaufu.supabase.co/auth/v1/callback`
- Use same credentials for both `entrebot` and `code/illinihunt` projects
- Re-add Google sign-in button to `frontend/src/pages/Login.tsx` once configured

---

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.
Never save working files, text/mds and tests to the root folder.
