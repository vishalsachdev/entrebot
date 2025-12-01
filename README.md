# VentureBot Backend

AI-powered entrepreneurship coaching platform backend built with Node.js, Express, Supabase, and OpenAI.

## Features

- 🤖 **Multi-Agent System**: Specialized AI agents for different coaching phases
- 💬 **Conversation Management**: Persistent chat sessions with memory
- 📊 **Market Validation**: Real-time idea validation and scoring
- 🔐 **Authentication**: Simple JWT-based auth for MVP
- 📱 **WhatsApp Integration**: Ready for WhatsApp chatbot (placeholder)
- ⚡ **Streaming Responses**: Server-Sent Events for real-time streaming
- 🗄️ **Supabase Backend**: PostgreSQL database with real-time capabilities

## Architecture

```
src/
├── config/          # Environment and logging configuration
├── database/        # Supabase client and queries
├── agents/          # AI agent implementations
│   ├── base.js      # Base agent class
│   ├── onboarding.js
│   ├── idea-generator.js
│   ├── validator.js
│   ├── builder.js   # PRD and builder prompt generation
│   └── index.js     # Agent registry
├── orchestrator/    # Agent orchestration and flow control
│   └── index.js
├── services/        # External service integrations
│   ├── openai.js    # OpenAI API integration
│   └── whatsapp.js
├── routes/          # API endpoints
│   ├── chat.js
│   ├── conversations.js
│   ├── memory.js
│   ├── sessions.js
│   ├── users.js
│   └── index.js
├── middleware/      # Express middleware
│   ├── auth.js
│   ├── error.js
│   └── validation.js
├── utils/           # Helper functions
└── server.js        # Main entry point
```

## Quick Start

### Prerequisites

- Node.js >= 18.0.0
- Supabase account
- OpenAI API key (GPT-4)

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your credentials
# SUPABASE_URL, SUPABASE_ANON_KEY, OPENAI_API_KEY
```

### Database Setup

1. Create a new Supabase project
2. Run the schema in Supabase SQL Editor:

```bash
# Copy contents of src/database/schema.sql to Supabase SQL Editor
```

### Running the Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

Server will start on http://localhost:3000

## API Endpoints

### Health Check
```
GET /api/health
```

### Users
```
POST /api/users              # Create user
GET /api/users/:email        # Get user
PUT /api/users/:userId       # Update user
```

### Chat
```
POST /api/chat/sessions           # Create session
GET /api/chat/sessions/:sessionId # Get session
POST /api/chat/message            # Send message (non-streaming)
POST /api/chat/stream             # Send message (streaming SSE)
GET /api/chat/history/:sessionId  # Get conversation history
POST /api/chat/select-idea        # Select idea for validation
```

## Agents

### 1. Onboarding Agent
- Guides users through pain point discovery
- Collects user profile and preferences
- Uses Socratic questioning approach
- Stores structured data in memory

### 2. Idea Generator Agent
- Generates 5 business ideas from pain points
- Incorporates BADM 350 technical concepts
- Creates concise, actionable ideas
- Enables user selection

### 3. Validator Agent
- Multi-dimensional market validation
- Scores feasibility, innovation, market opportunity
- Provides data-driven recommendations
- Stores validation results

### 4. Builder Agent
- Generates comprehensive PRD documents
- Creates user stories and acceptance criteria
- Produces builder prompts for implementation
- Stores PRD and builder artifacts in memory

## Environment Variables

```env
# Server
PORT=3000
NODE_ENV=development

# Supabase
SUPABASE_URL=your_url
SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# OpenAI
OPENAI_API_KEY=your_key
OPENAI_MODEL=gpt-4

# WhatsApp (optional)
WHATSAPP_SESSION_PATH=./whatsapp_session

# Security
JWT_SECRET=your_secret

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
```

## Memory System

The system uses a persistent memory layer stored in Supabase:

```javascript
// Memory keys used by agents
USER_PROFILE: { name: string }
USER_PAIN: { description: string, category: string }
USER_PAIN_DEEP: { frequency, severity, ... }
USER_PREFERENCES: { interests, activities }
IdeaCoach: [{ id, idea }, ...]
SelectedIdea: { id, idea }
Validator: { feasibility, innovation, score, notes }
PRD: { prd, user_stories, ... }
BuilderPrompt: string
```

## Example Usage

### Create Session and Chat

```bash
# Create user
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"email": "student@example.com", "name": "John"}'

# Create session
curl -X POST http://localhost:3000/api/chat/sessions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer user-id" \
  -d '{"userId": "user-id"}'

# Send message
curl -X POST http://localhost:3000/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session-id",
    "message": "Hi, I want to start a business",
    "agent": "onboarding"
  }'

# Stream message (SSE)
curl -X POST http://localhost:3000/api/chat/stream \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session-id",
    "message": "Generate ideas for my pain point"
  }'
```

## Frontend Stack

The frontend is a separate React application located in `frontend/`:

```
React 18 + TypeScript + Vite
├── UI: Tailwind CSS + Headless UI
├── State: React Context + React Query
├── Routing: React Router v6
├── Animations: Framer Motion
└── Icons: Lucide React
```

**Frontend Development:**
```bash
cd frontend
npm install
npm run dev  # Starts on http://localhost:5173
```

See `frontend/README.md` for detailed frontend documentation.

## Contributing

### Code Style & Naming Conventions
- **Language**: Node.js (ES modules), Node >= 18
- **Indentation**: 2 spaces; use semicolons; single quotes
- **Filenames**: kebab-case (`idea-generator.js`); directories lower-case
- **Identifiers**: camelCase for vars/functions; PascalCase for classes
- **Imports**: group built-ins → third-party → local
- **Comments**: add concise JSDoc for exported functions and classes
- **Async/await**: for all async operations
- **Error handling**: proper try-catch blocks
- **Validation**: input validation with Joi schemas
- **Database**: parameterized queries only
- **Naming**: descriptive variable and function names

### Testing Guidelines
- **Framework**: Jest via `ts-jest` (in `tests/`)
- **Structure**: `tests/unit`, `tests/integration`, `tests/e2e`
- **File naming**: `*.test.ts`
- **Coverage target**: 80% global (`npm run test:coverage`)
- **Fixtures**: add under `tests/fixtures/` when helpful
- **Network calls**: avoid in unit tests
- **Commands**: `cd tests && npm install && npm test`

### Commit & Pull Request Guidelines
- Use Conventional Commits: `feat:`, `fix:`, `docs:`, `chore:`, etc.
- PRs must include: clear description, linked issue, test plan (commands or curl), and any config/doc updates
- Keep diffs focused; update or add tests for behavior changes

### Security Best Practices
- Copy `.env.example` → `.env`; never commit secrets
- Required envs: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`
- Enable Supabase RLS in production (see notes in `schema.sql`)
- Don't log sensitive data; use `logger` with appropriate levels
- Environment variables validated at startup
- Rate limiting on API endpoints
- Helmet for security headers
- CORS enabled

### Adding New Agents
- Add a new agent under `src/agents/<name>.js` extending `BaseAgent`
- Register it in `src/agents/index.js` and reference by key (e.g., `onboarding`, `ideaGenerator`)
- Persist context via `memoryQueries` with uppercase keys (e.g., `USER_PROFILE`)
- For new endpoints, create a router in `src/routes/`, validate with `Joi` schemas, wrap with `asyncHandler`, and mount in `routes/index.js`

## Deployment

### Frontend Deployment
```bash
cd frontend
npm run build
# Upload dist/ folder to:
# - Vercel
# - Netlify
# - AWS S3 + CloudFront
# - Any static hosting
```

### Backend Deployment
```bash
# Deploy to:
# - Heroku
# - Railway
# - AWS EC2/ECS
# - DigitalOcean
# - Render
```

### Current Hosting Status

- **Backend**: Deployed on Render (auto-deploy from `main`)
- **Frontend**: Pending deployment to Vercel (needs static build setup)

## Future Enhancements

- [ ] WhatsApp integration
- [ ] Web search for market validation
- [ ] Product Manager agent
- [ ] Prompt Engineer agent
- [ ] Public chat sharing
- [ ] JWT authentication
- [ ] Comprehensive test suite
- [ ] Rate limiting per user
- [ ] Analytics and tracking

## Troubleshooting

### Common Issues

1. **"Missing required environment variables"**
   - Ensure all required vars in `.env` are set
   - Check `.env.example` for reference

2. **Database connection errors**
   - Verify Supabase URL and keys
   - Check if database schema is created
   - Ensure network connectivity

3. **OpenAI API errors**
   - Verify API key is valid
   - Check API rate limits
   - Ensure model name is correct (default: gpt-4)

## License

MIT

## Contact

For questions or support, please open an issue.
