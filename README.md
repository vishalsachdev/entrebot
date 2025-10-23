# VentureBot Backend

AI-powered entrepreneurship coaching platform backend built with Node.js, Express, Supabase, and OpenAI GPT-5.

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
│   └── validator.js
├── services/        # External service integrations
│   ├── anthropic.js
│   └── whatsapp.js
├── routes/          # API endpoints
│   ├── chat.js
│   └── users.js
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
- OpenAI API key (for GPT-5 access)

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your credentials
# SUPABASE_URL, SUPABASE_ANON_KEY, ANTHROPIC_API_KEY
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

## Environment Variables

```env
# Server
PORT=3000
NODE_ENV=development

# Supabase
SUPABASE_URL=your_url
SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# Anthropic
ANTHROPIC_API_KEY=your_key
ANTHROPIC_MODEL=claude-3-5-haiku-20241022

# Security
JWT_SECRET=your_secret

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
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

## Development Notes

### Code Style
- Async/await for all async operations
- Proper error handling with try-catch
- Input validation with Joi schemas
- Parameterized database queries
- Descriptive variable and function names

### Security
- Environment variables validated at startup
- Rate limiting on API endpoints
- Helmet for security headers
- CORS enabled
- No secrets in code

### Testing
- Run `npm test` (tests not yet implemented)
- Manual testing with curl or Postman
- Check logs in `logs/` directory

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

3. **Anthropic API errors**
   - Verify API key is valid
   - Check API rate limits
   - Ensure model name is correct

## License

MIT

## Contact

For questions or support, please open an issue.
