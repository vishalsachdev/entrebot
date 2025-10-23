# VentureBot Architecture Documentation

**Version:** 1.0
**Date:** January 2025
**Status:** Design Complete

---

## Overview

This directory contains the complete technical architecture for VentureBot, an AI-powered entrepreneurship coaching platform that guides aspiring solopreneurs from pain point discovery to product launch.

---

## Documentation Structure

### 1. [System Architecture](./architecture.md)
**Complete technical architecture specification**

**Contents:**
- High-level architecture diagram
- Component architecture (Frontend, API Gateway, Agent Orchestration, Tools, Data Layer)
- Agent orchestration system (Manager + specialized agents)
- Real-time streaming architecture (WebSocket protocol)
- WhatsApp integration layer (Twilio)
- Memory management system
- Scalability & performance strategies
- Security architecture
- Monitoring & observability
- Deployment architecture
- Error handling & resilience
- Technology stack summary
- Architecture Decision Records (ADRs)

**Key Decisions:**
- Multi-agent microservices architecture
- Supabase for database + auth + real-time
- FastAPI backend with Python 3.11
- React frontend with TypeScript
- Google ADK for agent orchestration
- WebSockets for streaming responses
- Redis for caching and performance

---

### 2. [Database Schema](./database-schema.sql)
**Complete Supabase/PostgreSQL schema**

**Tables:**

**User & Authentication:**
- `users` - User accounts (extends Supabase auth)
- `user_profiles` - Additional user metadata
- `whatsapp_users`, `discord_users`, `telegram_users` - Channel mappings

**Conversations:**
- `sessions` - Conversation threads
- `messages` - Individual messages
- `memory` - Agent memory (key-value store)

**Projects & Ideas:**
- `projects` - User startup projects
- `pain_points` - Discovered pain points
- `ideas` - Generated/selected ideas
- `validations` - Market research results
- `products` - PRDs and builder prompts

**Community:**
- `shared_conversations` - Public share links
- `hunt_listings` - IllinoisHunt.org listings

**Learning:**
- `milestones` - Journey tracking
- `skills` - User-learned skills
- `learning_resources` - Educational content
- `resource_progress` - User progress tracking

**Analytics:**
- `user_activity` - Activity tracking
- `agent_metrics` - Agent performance

**Features:**
- Row Level Security (RLS) policies
- Indexes for performance
- Triggers for auto-update timestamps
- Views for analytics
- Sample data for development

---

### 3. [API Design](./api-design.md)
**Complete REST API and WebSocket specification**

**Endpoint Categories:**

**Authentication:**
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/refresh` - Token refresh
- `POST /auth/logout` - Logout

**User Profile:**
- `GET /users/{user_id}` - Get profile
- `PATCH /users/{user_id}` - Update profile

**Projects:**
- `GET /users/{user_id}/projects` - List projects
- `POST /users/{user_id}/projects` - Create project
- `GET /users/{user_id}/projects/{project_id}` - Get details
- `PATCH /users/{user_id}/projects/{project_id}` - Update
- `DELETE /users/{user_id}/projects/{project_id}` - Delete

**Conversations:**
- `POST /apps/manager/users/{user_id}/sessions/{session_id}/run` - Main conversation endpoint
- `GET /users/{user_id}/sessions` - List sessions
- `GET /users/{user_id}/sessions/{session_id}` - Get session with messages
- `DELETE /users/{user_id}/sessions/{session_id}` - Delete session

**Memory:**
- `GET /users/{user_id}/memory/{key}` - Retrieve memory
- `POST /users/{user_id}/memory` - Store memory
- `DELETE /users/{user_id}/memory/{key}` - Delete memory

**Validation & Products:**
- `GET /users/{user_id}/validations/{validation_id}` - Get validation results
- `GET /users/{user_id}/products/{product_id}` - Get PRD
- `PATCH /users/{user_id}/products/{product_id}` - Update (mark launched)

**Sharing:**
- `POST /conversations/{conversation_id}/share` - Create public share
- `GET /shared/{share_id}` - Get shared conversation (public)
- `DELETE /shared/{share_id}` - Revoke share

**Community:**
- `GET /hunt/listings` - Get IllinoisHunt listings (public)
- `POST /hunt/listings` - Create listing

**Learning:**
- `GET /users/{user_id}/milestones` - Get achievements
- `GET /users/{user_id}/skills` - Get learned skills
- `GET /learning/resources` - Get recommended resources

**Webhooks (Multi-Channel):**
- `POST /webhooks/whatsapp` - WhatsApp webhook (Twilio)
- `POST /webhooks/discord` - Discord bot
- `POST /webhooks/telegram` - Telegram bot

**WebSocket:**
- `wss://api.venturebot.io/ws/chat` - Real-time streaming

**Features:**
- JWT authentication
- Rate limiting
- Pagination
- CORS configuration
- Error handling
- SDK examples (TypeScript, Python)

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
**WebSocket protocol:**
1. Client connects and authenticates
2. Client sends message
3. Server streams response chunks character-by-character
4. Server sends completion signal
5. Memory updates persisted

**Benefits:**
- Immediate feedback
- Better UX for long responses
- Progress indicators during validation

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

### ADR-003: WebSocket for Streaming
**Decision:** WebSockets instead of Server-Sent Events (SSE)
**Rationale:** Bi-directional communication, better mobile support
**Trade-offs:** Connection management complexity vs. simpler HTTP

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
| **Backend** | FastAPI + Python 3.11 | API server |
| **Database** | Supabase (PostgreSQL) | Primary data store |
| **Cache** | Redis (Upstash) | Memory caching |
| **Auth** | Supabase Auth + JWT | Authentication |
| **LLM** | Claude (Anthropic) via LiteLLM | Agent intelligence |
| **Search** | Perplexity API | Market research |
| **Messaging** | Twilio (WhatsApp) | Multi-channel |
| **Agent Framework** | Google ADK | Agent orchestration |
| **Real-Time** | WebSockets | Streaming responses |
| **Hosting** | Vercel + Railway | Cloud deployment |
| **Monitoring** | Sentry + DataDog | Error tracking, metrics |

---

## Development Workflow

### Local Development
```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload

# Frontend
cd frontend
npm install
npm run dev

# Database
# Use Supabase local development or cloud project
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

**Last Updated:** January 2025
**Maintained By:** VentureBot Architecture Team
**Status:** ✅ Design Complete - Ready for Implementation
