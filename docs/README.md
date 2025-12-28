# VentureBot Architecture Documentation

**Version:** 1.0
**Date:** October 2025
**Status:** Design Complete

---

## Overview

This directory contains the complete technical architecture for VentureBot, an AI-powered entrepreneurship coaching platform that guides aspiring solopreneurs from pain point discovery to product launch.

---

## Documentation Structure

### Core Architecture
1. **[System Architecture](./architecture.md)** - Complete technical architecture specification
2. **[API Design](./api-design.md)** - REST API and WebSocket specification  
3. **[Database Schema](./database-schema.sql)** - Complete Supabase/PostgreSQL schema

### Implementation & Setup
4. **[Quick Start](./QUICK_START.md)** - Get started in minutes (demo mode + production setup)
5. **[Supabase Setup](./SUPABASE_SETUP.md)** - Database configuration guide
6. **[Setup Complete](./setup-complete.md)** - Full production deployment guide

### AI Agent System
7. **[Claude-Flow Integration](./CLAUDE_FLOW_INTEGRATION_GUIDE.md)** - Multi-agent orchestration framework
8. **[Context & Conventions](./CONTEXT.md)** - Development patterns and best practices

### Development Resources
9. **[File Reference](./FILE_REFERENCE.md)** - File and directory structure guide
10. **[Testing Guide](./testing.md)** - Testing framework and strategies
11. **[Frontend API Service](./frontend-api-service.md)** - Frontend integration patterns

### Research & Analysis
12. **[Architecture Research](./architecture-research.md)** - Technical research and alternatives
13. **[Testing Analysis Report](./testing-analysis-report.md)** - Comprehensive testing analysis

### Specifications
14. **[OpenAPI Specification](./openapi.yaml)** - Complete API specification
15. **[Architecture Decision Records](./adr/)** - Key architectural decisions

### Examples & Tools
16. **[Examples](./examples/)** - Code examples and implementations
17. **[Monitoring](./monitor/)** - Monitoring and observability tools
18. **[Plans](./plans/)** - Development plans and roadmaps
19. **[Reviews](./reviews/)** - Code reviews and analyses

---

## Architecture Highlights

### Multi-Agent System
**5 specialized agents (MVP):**
1. **Onboarding Agent** - Pain point discovery
2. **Idea Generator Agent** - Generate 5 market-aware ideas
3. **Validator Agent** - Real-time market research + scoring
4. **Product Manager Agent** - PRD creation
5. **Prompt Engineer Agent** - No-code builder prompts

**Future agents:**
- Mentor Agent (ongoing coaching)
- Tool Skills Coach (teach AI tools)
- Go-to-Market Agent (launch strategy)
- Analytics Agent (KPI tracking)

### Agent Orchestration
**Manager Agent** routes conversations to specialized agents based on:
- Journey stage (onboarding → ideation → validation → planning → building)
- User input (explicit agent selection)
- Memory context (what's been completed)

**Communication:** Agents coordinate via shared memory (not direct calls)

### Memory System
**Persistent memory enables:**
- Context continuity across sessions
- Multi-device support
- Agent coordination
- Journey stage tracking
- Skill progress tracking

**Memory Schema:**
```
USER_PROFILE → USER_PAIN → IdeaCoach → SelectedIdea →
Validator → PRD → BuilderPrompt
```

### Real-Time Streaming
**Server-Sent Events (SSE) protocol:**
1. Client POSTs to `/api/chat/stream`
2. Express keeps HTTP connection open (`text/event-stream`)
3. Assistant tokens stream as SSE `data` events
4. Server emits completion signal and closes stream
5. Memory updates persisted in Supabase

**Benefits:**
- Immediate feedback
- Works over standard HTTP infra
- Simplified reconnect & auth handling for MVP

### Multi-Channel Access
**Unified backend supports:**
- **Web** (primary) - React app with full features
- **WhatsApp** - Twilio integration with voice transcription
- **Discord** - Bot with slash commands
- **Telegram** - Bot with inline keyboards

**All channels:**
- Share same agent orchestration
- Access same memory
- Link to user account
- Persist conversation history

---

## Key Technical Decisions (ADRs)

### ADR-001: Multi-Agent Architecture
**Decision:** Specialized agents instead of single monolithic LLM
**Rationale:** Distinct personalities, modular development, clear responsibilities
**Trade-offs:** Coordination complexity vs. consistency

### ADR-002: Supabase as Primary Database
**Decision:** Use Supabase instead of self-hosted PostgreSQL
**Rationale:** Built-in auth, real-time, storage, managed infrastructure
**Trade-offs:** Vendor lock-in vs. reduced operational complexity

### ADR-003: Server-Sent Events for Streaming
**Decision:** SSE instead of WebSockets for MVP streaming
**Rationale:** Simpler to operate on Express/HTTP stack; conversations are request/response oriented
**Trade-offs:** No true bidirectional streaming

### ADR-004: Memory as Database Table
**Decision:** Store agent memory in database, not in-memory
**Rationale:** Persistence, multi-device support, scalability
**Trade-offs:** Latency vs. durability (mitigated with Redis caching)

### ADR-005: Frontend-Only Prompts
**Decision:** Generate frontend-only code prompts
**Rationale:** Faster MVP iteration, lower complexity for students
**Trade-offs:** Limited functionality vs. rapid prototyping

---

## Scalability Features

### Horizontal Scaling
- Stateless API servers
- WebSocket load balancing with sticky sessions
- Task queue for agent processing (Celery/RQ)

### Caching
- Redis for memory caching (5-minute TTL)
- Frequent memory reads cached
- Session context cached

### Database
- Supabase connection pooling
- Read replicas for heavy queries
- Indexes on all foreign keys and common queries

### Performance Targets
- API response time: < 200ms (p95)
- Validation completion: 15-30 seconds
- WebSocket streaming: < 100ms latency
- Database queries: < 50ms (p95)

---

## Security Features

### Authentication
- JWT tokens (access + refresh)
- Supabase Auth integration
- Social OAuth (Google, GitHub)

### Authorization
- Row Level Security (RLS) in database
- Users can only access own data
- Public endpoints for shared content

### Data Protection
- HTTPS/WSS encryption in transit
- Database encryption at rest (Supabase)
- Input sanitization (XSS prevention)
- Rate limiting per user/endpoint

### Privacy
- Users control what's shared publicly
- Shared conversations are opt-in
- Memory can be deleted by user
- GDPR/FERPA compliant design

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React + TypeScript + Vite | Web interface |
| **Backend** | Node.js 18 + Express | API server |
| **Database** | Supabase (PostgreSQL) | Primary data store |
| **Cache** | (Planned) Redis | Memory caching |
| **Auth** | Supabase Auth + lightweight JWT middleware | Authentication |
| **LLM** | OpenAI GPT-4 / Claude via custom service | Agent intelligence |
| **Search** | Perplexity API | Market research |
| **Messaging** | Twilio (WhatsApp placeholder) | Multi-channel |
| **Agent Framework** | Custom BaseAgent classes | Agent orchestration |
| **Real-Time** | Server-Sent Events | Streaming responses |
| **Hosting** | Vercel (frontend) + Railway/Render (Express API) | Cloud deployment |
| **Monitoring** | Sentry + DataDog | Error tracking, metrics |

---

## Development Workflow

### Local Development
```bash
# Install dependencies (root)
npm install

# Run Express API with nodemon
npm run dev

# Frontend (separate terminal)
cd frontend
npm install
npm run dev

# Database
# Use Supabase project (see docs/SUPABASE_SETUP.md)
```

### Environment Variables
```bash
DATABASE_URL=postgresql://...
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...
ANTHROPIC_API_KEY=...
PERPLEXITY_API_KEY=...
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
REDIS_URL=redis://...
SECRET_KEY=...
```

### Testing
```bash
# Backend tests
pytest tests/

# Frontend tests
npm run test

# Integration tests
npm run test:integration
```

---

## Deployment

### Production Deployment
**Frontend:** Vercel
**Backend:** Railway or Render
**Database:** Supabase (managed PostgreSQL)
**Cache:** Upstash Redis

### Docker Deployment
```bash
# Build
docker build -t venturebot-api .

# Run
docker-compose up -d
```

### CI/CD
- GitHub Actions for automated deployment
- Automatic testing on PR
- Staging environment for testing
- Production deployment on merge to main

---

## Implementation Status

**Backend (MVP Phase 1):** Implemented

- **Runtime/Framework**: Node.js + Express
- **Database**: Supabase (PostgreSQL)
- **AI Provider**: Anthropic Claude (configured via env)
- **Core capabilities**:
  - Users, sessions, messages, and memory persistence
  - Multi-agent scaffolding (base agent + specialized agents)
  - Server-Sent Events (SSE) streaming for chat responses
  - Input validation, logging, and centralized error handling

For the current code-level implementation details, see the repository root `README.md` and the API contract docs (`openapi.yaml`, `api-design.md`).

---

## Monitoring & Observability

### Metrics
- Request latency (p50, p95, p99)
- Agent response time
- LLM token usage
- WebSocket connections
- Database query performance
- Error rates
- User funnel metrics

### Logging
- Structured logging (JSON)
- Application logs to CloudWatch/DataDog
- Database logs in Supabase
- Error tracking in Sentry

### Alerts
- High error rate
- Slow response times
- Database connection issues
- LLM API failures
- High token costs

---

## Future Extensibility

### New Agents
Plugin architecture allows adding agents:
```python
class MentorAgentPlugin(AgentPlugin):
    def get_name(self):
        return "mentor_agent"

    def get_instruction(self):
        return "You are a mentor..."

    async def handle(self, input, context):
        ...

agent_registry.register(MentorAgentPlugin())
```

### New Tools
Tool integration framework:
```python
class EmailTool(ToolPlugin):
    def get_name(self):
        return "send_email"

    async def execute(self, to, subject, body):
        await email_client.send(to, subject, body)

tool_registry.register(EmailTool())
```

### New Channels
Adding channels (e.g., Slack):
```python
@app.post("/webhooks/slack")
async def slack_webhook(request):
    # Handle Slack webhook
    # Route to agent manager
    # Send response via Slack API
```

---

## Related Documents

- **Product Requirements:** `/PRD.md` - Complete product vision
- **Agent Prompts:** `/AGENT_PROMPTS_REFERENCE.md` - Agent instruction patterns
- **Coaching Best Practices:** `/COACHING_BEST_PRACTICES.md` - Entrepreneurship coaching methodology

---

## Architecture Diagrams

### High-Level Data Flow
```
User Input → API Gateway → Manager Agent → Specialized Agent
                                              ↓
                                        Tools (Search, Analyzer)
                                              ↓
                                        Response Generation
                                              ↓
                                        Memory Update (Supabase)
                                              ↓
                                        Stream Response → User
```

### Agent Transition Flow
```
Onboarding Agent (collect pain)
        ↓
Idea Generator Agent (generate 5 ideas)
        ↓
User Selection
        ↓
Validator Agent (market research + scoring)
        ↓
Product Manager Agent (create PRD)
        ↓
Prompt Engineer Agent (generate builder prompt)
        ↓
[User builds product]
        ↓
Mentor Agent (ongoing coaching) [future]
```

### Memory Schema Flow
```
USER_PROFILE
     ↓
USER_PAIN → USER_PAIN_DEEP
     ↓
IdeaCoach (5 ideas)
     ↓
SelectedIdea
     ↓
Validator (market scores + intelligence)
     ↓
PRD (user stories + requirements)
     ↓
BuilderPrompt (no-code prompt)
```

---

## Questions & Support

For questions about the architecture:
1. Review this documentation
2. Check ADRs for decision rationale
3. Consult API design for endpoint details
4. Review database schema for data models

---

**Last Updated:** October 2025
**Maintained By:** VentureBot Architecture Team
**Status:** ✅ Design Complete - Ready for Implementation
