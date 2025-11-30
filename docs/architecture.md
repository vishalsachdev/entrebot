# VentureBot System Architecture

**Version:** 1.0
**Date:** October 2025
**Status:** Design Specification

---

## Executive Summary

VentureBot is a multi-agent AI coaching platform built on a microservices architecture with real-time streaming, persistent memory, and multi-channel access. The system orchestrates specialized AI agents (onboarding, ideation, validation, product management, prompt engineering) that guide users through the entrepreneurship journey from pain point discovery to product launch.

**Core Architecture Principles:**
- **Agent-Centric:** Specialized AI agents with distinct responsibilities and personalities
- **Memory-Driven:** Shared persistent memory enables context continuity across sessions
- **Real-Time:** Streaming responses for immediate feedback
- **Multi-Channel:** Unified backend supporting web, WhatsApp, Discord, Telegram
- **Scalable:** Stateless services with horizontal scaling capability
- **Extensible:** Plugin architecture for adding agents, tools, and integrations

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Client Layer                                 │
├──────────────┬──────────────┬──────────────┬─────────────────────────┤
│   Web App    │   WhatsApp   │   Discord    │   Telegram              │
│   (React)    │   (Twilio)   │   (Bot)      │   (Bot)                 │
└──────┬───────┴──────┬───────┴──────┬───────┴──────┬──────────────────┘
       │              │              │              │
       └──────────────┴──────────────┴──────────────┘
                      │
       ┌──────────────▼──────────────────────────────────────────┐
       │              API Gateway Layer                          │
       │  ┌────────────────────────────────────────────────┐    │
       │  │  Express API (Node.js 18, Port 3000)           │    │
       │  │  - Authentication & Authorization (JWT/Supabase)│    │
       │  │  - Request Routing                             │    │
       │  │  - Rate Limiting (express-rate-limit)          │    │
       │  │  - Server-Sent Events (stream endpoint)        │    │
       │  └────────────────────────────────────────────────┘    │
       └──────────────┬──────────────────────────────────────────┘
                      │
       ┌──────────────▼──────────────────────────────────────────┐
       │           Agent Orchestration Layer                     │
       │  ┌─────────────────────────────────────────────────┐   │
       │  │  Manager Agent (custom orchestration)           │   │
       │  │  - Route conversations to specialized agents    │   │
       │  │  - Manage agent lifecycle                       │   │
       │  │  - Coordinate multi-agent workflows             │   │
       │  │  - Handle agent errors and fallbacks            │   │
       │  └──────────────────┬──────────────────────────────┘   │
       │                     │                                    │
       │  ┌──────────────────▼──────────────────────────────┐   │
       │  │         Specialized Agents                       │   │
       │  ├──────────────┬──────────────┬───────────────────┤   │
       │  │ Onboarding   │ Idea Gen     │ Validator         │   │
       │  │ Agent        │ Agent        │ Agent             │   │
       │  ├──────────────┼──────────────┼───────────────────┤   │
       │  │ Product Mgr  │ Prompt Eng   │ Mentor            │   │
       │  │ Agent        │ Agent        │ Agent (future)    │   │
       │  └──────────────┴──────────────┴───────────────────┘   │
       └──────────────┬──────────────────────────────────────────┘
                      │
       ┌──────────────▼──────────────────────────────────────────┐
       │              Tools & Integration Layer                  │
       │  ┌────────────────┬────────────────┬──────────────────┐│
       │  │ Web Search     │ Market Analyzer│ Dashboard Gen    ││
       │  │ (Perplexity)   │                │                  ││
       │  └────────────────┴────────────────┴──────────────────┘│
       └──────────────┬──────────────────────────────────────────┘
                      │
       ┌──────────────▼──────────────────────────────────────────┐
       │                  Data Layer                              │
       │  ┌─────────────────────────────────────────────────┐   │
       │  │         Supabase (PostgreSQL)                   │   │
       │  ├─────────────────────────────────────────────────┤   │
       │  │  - Users & Authentication                       │   │
       │  │  - Conversations & Messages                     │   │
       │  │  - Memory (Pain Points, Ideas, Validations)     │   │
       │  │  - Projects & Products                          │   │
       │  │  - Real-time Subscriptions                      │   │
       │  └─────────────────────────────────────────────────┘   │
       │  ┌─────────────────────────────────────────────────┐   │
       │  │      LLM Providers (via LiteLLM)                │   │
       │  ├─────────────────────────────────────────────────┤   │
       │  │  - Claude (Anthropic)                           │   │
       │  │  - GPT-4 (OpenAI) - fallback                    │   │
       │  └─────────────────────────────────────────────────┘   │
       └──────────────────────────────────────────────────────────┘
```

---

## Component Architecture

### 1. Frontend Layer

#### Web Application (Primary Interface)
**Technology:** React + TypeScript + Vite
**Key Features:**
- Real-time streaming chat interface
- Multi-project management dashboard
- Session history browsing
- Public chat sharing
- Progress milestone visualization

**State Management:**
- React Context for user session
- SSE-friendly streaming hooks (fetch + EventSource polyfill)
- Local storage for draft messages

**Components:**
```
src/
├── components/
│   ├── chat/
│   │   ├── MessageList.tsx          # Streaming message display
│   │   ├── MessageInput.tsx         # User input with send
│   │   ├── AgentIndicator.tsx       # Shows active agent
│   │   └── ProgressIndicator.tsx    # Validation/loading states
│   ├── dashboard/
│   │   ├── ProjectCard.tsx          # Project overview cards
│   │   ├── MilestoneTracker.tsx     # Visual progress
│   │   └── HistoryTimeline.tsx      # Conversation history
│   ├── validation/
│   │   ├── ValidationDashboard.tsx  # Scores and insights
│   │   └── MarketIntelligence.tsx   # Competitive analysis
│   └── shared/
│       ├── Layout.tsx               # App shell
│       └── Navigation.tsx           # Sidebar nav
├── hooks/
│   ├── useStreamingResponse.ts      # Handle SSE streaming
│   └── useAuth.ts                   # Authentication
├── services/
│   ├── api.ts                       # API client
│   ├── supabase.ts                  # Supabase client
│   └── streaming.ts                 # SSE helpers (fetch/EventSource)
└── types/
    ├── message.ts                   # Message types
    ├── agent.ts                     # Agent types
    └── memory.ts                    # Memory schemas
```

#### WhatsApp Integration (planned)
**Technology:** Twilio WhatsApp Business API
**Flow:**
1. User sends message to WhatsApp number
2. Twilio webhook forwards to Express endpoint
3. Manager agent processes, routes to specialized agent
4. Response sent back via Twilio API
5. Conversation state persisted in Supabase

**Features:**
- Text message support
- Voice message transcription (via Whisper API)
- Image/document sharing
- Quick reply buttons for navigation
- Scheduled check-ins via cron jobs

---

### 2. API Gateway Layer

#### Express Application
**Technology:** Node.js 18 + Express
**Responsibilities:**
- HTTP REST endpoints + SSE streaming
- Authentication & session management
- Request validation and sanitization
- Rate limiting (per user, per endpoint)
- CORS configuration
- Error handling and logging

**Endpoint Structure:**
```
/api/v1/
├── auth/
│   ├── POST /register              # User registration
│   ├── POST /login                 # User login
│   ├── POST /logout                # User logout
│   └── POST /refresh               # Token refresh
├── apps/
│   └── manager/
│       ├── POST /users/{user_id}/sessions/{session_id}/run
│       │       # Main conversation endpoint
│       ├── GET /users/{user_id}/sessions
│       │       # List user sessions
│       ├── GET /users/{user_id}/sessions/{session_id}
│       │       # Get session details
│       └── DELETE /users/{user_id}/sessions/{session_id}
│               # Delete session
├── projects/
│   ├── GET /users/{user_id}/projects
│   │       # List user projects
│   ├── POST /users/{user_id}/projects
│   │       # Create project
│   ├── GET /users/{user_id}/projects/{project_id}
│   │       # Get project details
│   └── PATCH /users/{user_id}/projects/{project_id}
│           # Update project
├── memory/
│   ├── GET /users/{user_id}/memory/{key}
│   │       # Retrieve memory value
│   ├── POST /users/{user_id}/memory
│   │       # Store memory value
│   └── DELETE /users/{user_id}/memory/{key}
│           # Delete memory value
├── sharing/
│   ├── POST /conversations/{conversation_id}/share
│   │       # Create public share link
│   ├── GET /shared/{share_id}
│   │       # Get shared conversation
│   └── DELETE /shared/{share_id}
│           # Revoke share
├── webhooks/
│   ├── POST /whatsapp               # WhatsApp Twilio webhook
│   ├── POST /discord                # Discord bot webhook
│   └── POST /telegram               # Telegram bot webhook
└── ws/
    └── /chat/stream                 # SSE for streaming
```

**Authentication Strategy:**
- JWT tokens (access + refresh)
- Supabase Auth integration
- Session management via Supabase
- Optional social OAuth (Google, GitHub)

**Rate Limiting:**
- 100 requests/minute per user (normal)
- 10 requests/minute for validation endpoint (expensive)
- WebSocket connection limit: 5 concurrent per user

---

### 3. Agent Orchestration Layer

#### Manager Agent
**Technology:** Custom BaseAgent orchestration (Node.js services)
**Responsibilities:**
- Route incoming messages to appropriate specialized agent
- Maintain conversation state and context
- Handle agent handoffs (e.g., onboarding → idea generation)
- Error handling and fallback mechanisms
- Memory management coordination

**Agent Lifecycle:**
```javascript
export class ManagerAgent {
    def __init__(self):
        self.agents = {
            "onboarding": OnboardingAgent(),
            "idea_generator": IdeaGeneratorAgent(),
            "validator": ValidatorAgent(),
            "product_manager": ProductManagerAgent(),
            "prompt_engineer": PromptEngineerAgent()
        }
        self.memory = MemoryManager()
        self.router = AgentRouter()

    async handle(userInput, context) {
        # 1. Load user context from memory
        const userContext = await this.memory.loadContext(context.userId);

        # 2. Determine active agent based on journey stage
        const activeAgent = this.router.route(userInput, userContext);

        # 3. Execute agent
        const response = await activeAgent.handle(userInput, userContext);

        # 4. Update memory with new context
        await this.memory.update(response.memoryUpdates);

        # 5. Return response
        return response;
```

**Agent Routing Logic:**
```javascript
export class AgentRouter {
    route(userInput, context) {
        # Check explicit agent selection by user
        if (this.isExplicitSelection(userInput)) {
            return this.getAgentFromSelection(userInput);
        }

        # Route based on conversation stage
        const stage = context.journey_stage || 'onboarding';

        if stage == 'onboarding' and not context.get('USER_PAIN'):
            return this.agents.onboarding;

        elif stage == 'ideation' and not context.get('SelectedIdea'):
            return this.agents.ideaGenerator;

        elif stage == 'validation' and context.get('SelectedIdea'):
            return this.agents.validator;

        elif stage == 'product_planning' and context.get('Validator'):
            return this.agents.productManager;

        elif stage == 'prompt_engineering' and context.get('PRD'):
            return this.agents.promptEngineer;

        # Default to manager for general queries
        return this.agents.manager;
```

#### Specialized Agents
Each agent follows this interface:
```python
class BaseAgent(ABC):
    def __init__(self, name: str, model: str = "claude-3-5-haiku"):
        self.name = name
        self.model = model
        self.instruction = self._load_instruction()
        self.tools = self._register_tools()

    @abstractmethod
    def _load_instruction(self) -> str:
        """Load agent system instruction"""
        pass

    @abstractmethod
    async def handle(self, user_input: str, context: dict) -> AgentResponse:
        """Handle user input and return response"""
        pass

    def _register_tools(self) -> List[Tool]:
        """Register tools available to agent"""
        return []
```

**Agent Communication Pattern:**
- Agents communicate via shared memory (not direct calls)
- Manager coordinates agent transitions
- Each agent stores structured data for downstream agents
- Agents can delegate back to manager if out of scope

---

### 4. Tools & Integration Layer

#### Web Search Tool
**Technology:** Perplexity API (or SerpAPI as fallback)
**Purpose:** Real-time market research for validation

**Implementation:**
```python
class WebSearchTool:
    def __init__(self, provider: str = "perplexity"):
        self.provider = provider
        self.timeout = 30  # seconds

    async def search(self, query: str, max_results: int = 10) -> List[SearchResult]:
        """Execute web search with timeout protection"""
        try:
            if self.provider == "perplexity":
                return await self._perplexity_search(query, max_results)
            else:
                return await self._serpapi_search(query, max_results)
        except TimeoutError:
            logger.warning("Search timeout, using fallback")
            return await self._fallback_search(query)
        except Exception as e:
            logger.error(f"Search failed: {e}")
            return []
```

#### Market Analyzer
**Purpose:** Multi-dimensional idea scoring
**Dimensions:**
- Market Opportunity (30% weight)
- Competitive Landscape (25% weight)
- Execution Feasibility (25% weight)
- Innovation Potential (20% weight)

**Implementation:**
```python
class MarketAnalyzer:
    def __init__(self):
        self.weights = {
            "market_opportunity": 0.30,
            "competitive_landscape": 0.25,
            "execution_feasibility": 0.25,
            "innovation_potential": 0.20
        }

    async def analyze(self, idea: str, context: dict) -> ValidationResult:
        # 1. Gather market data via web search
        market_data = await self.search_tool.search(f"{idea} market competitors")

        # 2. Score each dimension
        scores = {
            "market_opportunity": self._score_market_opportunity(market_data),
            "competitive_landscape": self._score_competition(market_data),
            "execution_feasibility": self._score_feasibility(idea, context),
            "innovation_potential": self._score_innovation(idea, market_data)
        }

        # 3. Calculate overall score
        overall = sum(scores[k] * self.weights[k] for k in scores)

        # 4. Generate recommendations
        recommendations = self._generate_recommendations(scores, market_data)

        return ValidationResult(
            scores=scores,
            overall_score=overall,
            confidence=self._calculate_confidence(market_data),
            recommendations=recommendations,
            market_data=market_data
        )
```

#### Dashboard Generator
**Purpose:** Create visual validation dashboards

**Output Format:**
```markdown
✅ **Validation Complete!**

**Idea:** {idea}

📊 **Scores:**
• **Market Opportunity:** 0.85/1.0 🟢
• **Competitive Landscape:** 0.60/1.0 🟡
• **Execution Feasibility:** 0.75/1.0 🟢
• **Innovation Potential:** 0.70/1.0 🟢
• **Overall Score:** 0.73/1.0 🟢

🔍 **Competitive Analysis:**
Found 12 competitors:
1. Competitor A - B2B SaaS, $5M funding, 10K users
2. Competitor B - Consumer app, 50K downloads
...

💡 **Market Insights:**
- Growing market with 23% YoY growth
- Clear gap in [specific niche]
- Strong demand signals (15K monthly searches)

⚠️ **Risks:**
- Crowded competitive space requires clear differentiation
- Execution complexity moderate (needs specific technical skills)

🚀 **Recommendation:** 🟢 Proceed with refinement
Focus on [specific differentiation strategy]

**Would you like to proceed to product development?**
```

---

### 5. Data Layer

#### Database Schema (Supabase/PostgreSQL)

See `database-schema.sql` for complete schema.

**Key Tables:**
- `users` - User accounts and profiles
- `sessions` - Conversation sessions
- `messages` - Individual messages in sessions
- `memory` - Key-value store for agent memory
- `pain_points` - Stored pain point discoveries
- `ideas` - Generated and selected ideas
- `validations` - Market validation results
- `products` - PRDs and product plans
- `shared_conversations` - Public share links
- `projects` - User projects (multiple ideas per user)

**Relationships:**
```
users (1) ──→ (N) sessions
sessions (1) ──→ (N) messages
users (1) ──→ (N) projects
projects (1) ──→ (N) ideas
ideas (1) ──→ (1) validations
ideas (1) ──→ (1) products
sessions (1) ──→ (1) shared_conversations
```

#### Memory Management

**Memory Schema:**
```typescript
interface UserMemory {
  user_id: string;
  session_id: string;

  // User Profile
  USER_PROFILE: {
    name: string;
    email: string;
    university?: string;
  };

  // Pain Point Discovery
  USER_PAIN: {
    description: string;
    category?: 'functional' | 'social' | 'emotional' | 'financial';
  };

  USER_PAIN_DEEP?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'rare';
    severity: number; // 1-10
    who_experiences: string;
    current_workarounds: string;
    willingness_to_pay: 'yes' | 'no' | 'unknown';
    personal_experience: boolean;
  };

  // User Preferences
  USER_PREFERENCES?: {
    interests?: string;
    activities?: string;
  };

  // Idea Generation
  IdeaCoach?: Array<{
    id: number;
    idea: string;
  }>;

  SelectedIdea?: {
    id: number;
    idea: string;
  };

  // Validation
  Validator?: {
    id: number;
    feasibility: number;
    innovation: number;
    score: number;
    notes: string;
    market_scores: {
      market_opportunity: number;
      competitive_landscape: number;
      execution_feasibility: number;
      innovation_potential: number;
      overall_score: number;
      confidence: number;
    };
    market_intelligence: {
      competitors: Array<any>;
      market_gaps: string[];
      trends: string[];
      barriers: string[];
      recommendations: string[];
    };
  };

  // Product Planning
  PRD?: {
    prd: string;
    user_stories: string[];
    functional_requirements: string[];
    nonfunctional_requirements: string[];
    success_metrics: string[];
  };

  // Prompt Engineering
  BuilderPrompt?: string;

  // Journey Stage
  journey_stage: 'onboarding' | 'ideation' | 'validation' | 'product_planning' | 'prompt_engineering' | 'building' | 'launched';
}
```

**Memory Manager:**
```python
class MemoryManager:
    def __init__(self, supabase_client):
        self.db = supabase_client

    async def load_context(self, user_id: str, session_id: str) -> dict:
        """Load all memory for user session"""
        result = await self.db.table('memory').select('*').match({
            'user_id': user_id,
            'session_id': session_id
        }).execute()

        return {row['key']: json.loads(row['value']) for row in result.data}

    async def store(self, user_id: str, session_id: str, key: str, value: any):
        """Store memory value"""
        await self.db.table('memory').upsert({
            'user_id': user_id,
            'session_id': session_id,
            'key': key,
            'value': json.dumps(value),
            'updated_at': datetime.utcnow()
        }).execute()

    async def update_journey_stage(self, user_id: str, session_id: str, stage: str):
        """Update user's journey stage"""
        await self.store(user_id, session_id, 'journey_stage', stage)
```

---

### 6. Real-Time Streaming Architecture

#### Server-Sent Events (SSE)
**Flow:**
1. Client sends POST to `/api/chat/stream` with `sessionId`, `message`, and optional `agent`.
2. Express handler sets `Content-Type: text/event-stream` and keeps the HTTP connection open.
3. Specialized agent streams chunks via callbacks; each chunk is flushed as an SSE `data` event.
4. When the agent finishes, the server emits a `done` event, stores the transcript, and closes the stream.

**Server-Side Implementation (Express):**
```javascript
import express from 'express';
import { getAgent } from '../agents/index.js';

router.post('/chat/stream', asyncHandler(async (req, res) => {
  const { sessionId, message, agent: agentName } = req.body;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const agent = agentName ? getAgent(agentName) : await autoSelectAgent(sessionId);
  let fullResponse = '';

  const onChunk = chunk => {
    fullResponse += chunk;
    res.write(`data: ${JSON.stringify({ chunk, agent: agent.name })}\n\n`);
  };

  try {
    await agent.handle(sessionId, message, onChunk);
    await conversationQueries.create(sessionId, 'assistant', fullResponse, { agent: agent.name });
    res.write('data: {"done": true}\n\n');
  } catch (error) {
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
  } finally {
    res.end();
  }
}));
```

**Client-Side Implementation:**
```typescript
async function streamResponse(payload: SendMessagePayload, onChunk: (chunk: string) => void) {
  const response = await fetch('/api/chat/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  while (reader) {
    const { value, done } = await reader.read();
    if (done) break;
    const text = decoder.decode(value, { stream: true });
    text.trim().split('\n\n').forEach(event => {
      if (!event.startsWith('data:')) return;
      const data = JSON.parse(event.replace('data: ', ''));
      if (data.chunk) onChunk(data.chunk);
    });
  }
}
```

---

### 7. WhatsApp Integration Architecture

#### Twilio Integration
**Flow:**
1. User sends WhatsApp message to Twilio number
2. Twilio forwards to webhook: `POST /api/v1/webhooks/whatsapp`
3. Server extracts message, user identifier (phone number)
4. Server creates/resumes session for user
5. Manager agent processes message
6. Response sent back via Twilio Messaging API
7. Conversation state persisted to database

**Webhook Handler (Express):**
```javascript
import twilio from 'twilio';

router.post('/api/webhooks/whatsapp', asyncHandler(async (req, res) => {
  const from = req.body.From;
  let message = req.body.Body;
  const mediaUrl = req.body.MediaUrl0;

  const user = await whatsappQueries.getOrCreateUser(from);
  const session = await sessionQueries.getOrCreate(user.id, { channel: 'whatsapp' });

  if (mediaUrl) {
    message = await transcribeVoiceMessage(mediaUrl);
  }

  const responseText = await agentManager.handle({
    userId: user.id,
    sessionId: session.id,
    message
  });

  const client = twilio(accountSid, authToken);
  await client.messages.create({
    from: `whatsapp:${twilioNumber}`,
    to: from,
    body: responseText
  });

  res.sendStatus(200);
}));
```

**Voice Message Transcription:**
```python
from openai import OpenAI

async def transcribe_voice_message(media_url: str) -> str:
    # Download audio file
    audio_data = await download_media(media_url)

    # Transcribe via Whisper
    client = OpenAI()
    transcription = client.audio.transcriptions.create(
        model="whisper-1",
        file=audio_data
    )

    return transcription.text
```

**Quick Reply Buttons:**
```python
def create_quick_replies(options: List[str]) -> str:
    """Format options as numbered list for WhatsApp"""
    reply = "Please reply with the number:\n\n"
    for i, option in enumerate(options, 1):
        reply += f"{i}. {option}\n"
    return reply
```

---

## Scalability & Performance

### Horizontal Scaling
**Stateless Services:**
- API servers can scale horizontally
- WebSocket connections load-balanced via sticky sessions
- Agent processing distributed via task queue (Celery/RQ)

**Database Scaling:**
- Supabase handles connection pooling
- Read replicas for heavy read operations
- Caching layer (Redis) for frequently accessed memory

### Caching Strategy
**Memory Cache (Redis):**
```python
class CachedMemoryManager(MemoryManager):
    def __init__(self, supabase_client, redis_client):
        super().__init__(supabase_client)
        self.cache = redis_client

    async def load_context(self, user_id: str, session_id: str) -> dict:
        # Check cache first
        cache_key = f"context:{user_id}:{session_id}"
        cached = await self.cache.get(cache_key)

        if cached:
            return json.loads(cached)

        # Load from database
        context = await super().load_context(user_id, session_id)

        # Cache for 5 minutes
        await self.cache.setex(cache_key, 300, json.dumps(context))

        return context
```

### Rate Limiting
**Implementation:**
```javascript
import rateLimit from 'express-rate-limit';

const conversationLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false
});

const validationLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10
});

router.post(
  '/apps/manager/users/:userId/sessions/:sessionId/run',
  conversationLimiter,
  asyncHandler(conversationController.run)
);

router.post(
  '/apps/manager/validate',
  validationLimiter,
  asyncHandler(validationController.validate)
);
```

### Health Checks
```python
@app.get("/health")
async def health_check():
    checks = {
        "database": await check_database_health(),
        "redis": await check_redis_health(),
        "llm_provider": await check_llm_health()
    }

    is_healthy = all(checks.values())
    status = 200 if is_healthy else 503

    return Response(
        content=json.dumps({"status": "healthy" if is_healthy else "unhealthy", "checks": checks}),
        status_code=status
    )
```

---

## Deployment Architecture

### Infrastructure (Cloud-Agnostic)
**Recommended Stack:**
- **Compute:** Vercel (frontend), Railway/Render (backend)
- **Database:** Supabase (PostgreSQL + Auth + Storage)
- **Cache:** Upstash Redis
- **LLM:** Anthropic Claude via LiteLLM
- **Search:** Perplexity API
- **Messaging:** Twilio (WhatsApp), Discord/Telegram APIs

### Environment Configuration
```bash
# .env
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

### Docker Deployment
```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
```

---

## Error Handling & Resilience

### Circuit Breaker Pattern
```

---

## Security Architecture

### Authentication & Authorization
**JWT Strategy (jsonwebtoken):**
```javascript
import jwt from 'jsonwebtoken';

export function createAccessToken(userId) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

export function createRefreshToken(userId) {
  return jwt.sign({ sub: userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: '30d' });
}
```

**Authorization Middleware (Express):**
```javascript
import jwt from 'jsonwebtoken';

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Missing token' });
  }

  try {
    const token = authHeader.replace('Bearer ', '');
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.sub;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
}
```

### Data Protection
**Encryption at Rest:**
- Supabase handles database encryption
- Sensitive fields (user emails) encrypted at application level

**Encryption in Transit:**
- HTTPS/WSS for all connections
- TLS 1.3 minimum

**Input Sanitization:**
```javascript
import sanitizeHtml from 'sanitize-html';
import { z } from 'zod';

export const sendMessageSchema = z.object({
  sessionId: z.string().uuid(),
  message: z.string().min(1).max(2000)
});

export function sanitizeMessage(content) {
  return sanitizeHtml(content, { allowedTags: [], allowedAttributes: {} });
}
```

---

## Monitoring & Observability

### Logging Strategy
**Structured Logging (Winston):**
```javascript
import winston from 'winston';

export const logger = winston.createLogger({
  level: 'info',
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    })
  ]
});

logger.info('agent_response', {
  userId,
  sessionId,
  agent: 'onboarding',
  latencyMs: responseTime,
  tokensUsed: tokenCount
});
```

**Log Aggregation:**
- Supabase logs for database queries
- Application logs to CloudWatch/DataDog
- Error tracking via Sentry

### Metrics
**Key Metrics to Track:**
- Request latency (p50, p95, p99)
- Agent response time
- LLM token usage
- WebSocket connection count
- Database query performance
- Error rates by endpoint
- User session duration
- Conversion funnel metrics (pain → idea → validation → PRD → launch)

### Health Checks
```python
@app.get("/health")
async def health_check():
    checks = {
        "database": await check_database_health(),
        "redis": await check_redis_health(),
        "llm_provider": await check_llm_health()
    }

    is_healthy = all(checks.values())
    status = 200 if is_healthy else 503

    return Response(
        content=json.dumps({"status": "healthy" if is_healthy else "unhealthy", "checks": checks}),
        status_code=status
    )
```

---

## Deployment Architecture

### Infrastructure (Cloud-Agnostic)
**Recommended Stack:**
- **Compute:** Vercel (frontend), Railway/Render (backend)
- **Database:** Supabase (PostgreSQL + Auth + Storage)
- **Cache:** Upstash Redis
- **LLM:** Anthropic Claude via LiteLLM
- **Search:** Perplexity API
- **Messaging:** Twilio (WhatsApp), Discord/Telegram APIs

### Environment Configuration
```bash
# .env
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

### Docker Deployment
```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
```

---

## Error Handling & Resilience

### Circuit Breaker Pattern
```python
from circuitbreaker import circuit

@circuit(failure_threshold=5, recovery_timeout=60)
async def call_llm(prompt: str):
    return await llm_client.generate(prompt)

async def safe_llm_call(prompt: str):
    try:
        return await call_llm(prompt)
    except CircuitBreakerError:
        logger.warning("LLM circuit breaker open, using fallback")
        return "I'm experiencing high demand. Please try again in a moment."
```

### Retry Strategy
```python
from tenacity import retry, wait_exponential, stop_after_attempt

@retry(wait=wait_exponential(min=1, max=10), stop=stop_after_attempt(3))
async def search_with_retry(query: str):
    return await web_search_tool.search(query)
```

### Graceful Degradation
```python
async def validate_idea(idea: str, context: dict):
    try:
        # Primary: Full market validation with web search
        return await market_analyzer.analyze(idea, context)
    except TimeoutError:
        logger.warning("Validation timeout, using fallback scoring")
        # Fallback: Basic heuristic scoring without web search
        return create_fallback_validation(idea, context)
    except Exception as e:
        logger.error(f"Validation failed: {e}")
        # Last resort: Manual review message
        return {
            "error": True,
            "message": "Market validation temporarily unavailable. Please try again or proceed with manual research."
        }
```

---

## Future Extensibility

### Plugin Architecture for New Agents
```python
class AgentPlugin(ABC):
    @abstractmethod
    def get_name(self) -> str:
        pass

    @abstractmethod
    def get_instruction(self) -> str:
        pass

    @abstractmethod
    async def handle(self, input: str, context: dict) -> AgentResponse:
        pass

# Register plugin
agent_registry.register(MentorAgentPlugin())
```

### Tool Integration Framework
```python
class ToolPlugin(ABC):
    @abstractmethod
    def get_name(self) -> str:
        pass

    @abstractmethod
    async def execute(self, **kwargs) -> Any:
        pass

# Example: Add email tool
class EmailTool(ToolPlugin):
    def get_name(self):
        return "send_email"

    async def execute(self, to: str, subject: str, body: str):
        await email_client.send(to, subject, body)

tool_registry.register(EmailTool())
```

### Multi-Channel Extension
Adding new channels (e.g., Slack):
```python
@app.post("/api/v1/webhooks/slack")
async def slack_webhook(request: Request):
    data = await request.json()

    user = await get_or_create_slack_user(data['user_id'])
    session = await get_or_create_session(user.id, channel='slack')

    response = await agent_manager.handle(
        user_id=user.id,
        session_id=session.id,
        message=data['text']
    )

    await slack_client.post_message(data['channel'], response)

    return Response(status_code=200)
```

---

## Technology Stack Summary

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React + TypeScript + Vite | Web interface |
| **Backend** | FastAPI + Python 3.11 | API server |
| **Database** | Supabase (PostgreSQL) | Primary data store |
| **Cache** | Redis | Memory caching |
| **Auth** | Supabase Auth + JWT | Authentication |
| **LLM** | Claude (Anthropic) via LiteLLM | Agent intelligence |
| **Search** | Perplexity API | Market research |
| **Messaging** | Twilio (WhatsApp) | Multi-channel access |
| **Agent Framework** | Google ADK | Agent orchestration |
| **Real-Time** | WebSockets | Streaming responses |
| **Hosting** | Vercel (frontend), Railway (backend) | Cloud deployment |
| **Monitoring** | Sentry, DataDog | Error tracking, metrics |

---

## Architecture Decision Records (ADRs)

### ADR-001: Multi-Agent Architecture
**Decision:** Use specialized agents instead of single monolithic LLM
**Rationale:** Enables distinct personalities, modular development, and clear responsibility separation
**Trade-offs:** Complexity in agent coordination vs. consistency in single-agent approach

### ADR-002: Supabase as Primary Database
**Decision:** Use Supabase instead of self-hosted PostgreSQL
**Rationale:** Built-in auth, real-time subscriptions, storage, and managed infrastructure
**Trade-offs:** Vendor lock-in vs. reduced operational complexity

### ADR-003: WebSocket for Streaming
**Decision:** Use WebSockets for real-time streaming instead of SSE
**Rationale:** Bi-directional communication, better mobile support, richer protocol
**Trade-offs:** Connection management complexity vs. simpler HTTP-based SSE

### ADR-004: Memory as Database Table
**Decision:** Store agent memory in database table, not in-memory
**Rationale:** Persistence across sessions, multi-device support, scalability
**Trade-offs:** Latency vs. durability (mitigated with Redis caching)

### ADR-005: Frontend-Only Prompts
**Decision:** Prompt engineer generates frontend-only code prompts
**Rationale:** Faster MVP iteration, lower complexity for students, no backend maintenance
**Trade-offs:** Limited functionality vs. rapid prototyping

---

## Appendix: Architecture Diagrams

### Data Flow Diagram
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

---

**END OF ARCHITECTURE DOCUMENT**
