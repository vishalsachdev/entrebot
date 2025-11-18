# VentureBot Setup Guide

Complete setup instructions for the VentureBot backend.

## Prerequisites

- **Node.js** >= 18.0.0
- **npm** or **yarn**
- **Supabase account** (free tier works)
- **Anthropic API key** (Claude API access)

## Step-by-Step Setup

### 1. Install Dependencies

```bash
cd /Users/vishal/Desktop/entrebot
npm install
```

### 2. Environment Configuration

Create `.env` file from example:

```bash
cp .env.example .env
```

Edit `.env` and add your credentials:

```env
# Server
PORT=3000
NODE_ENV=development

# Supabase - Get from https://supabase.com/dashboard/project/_/settings/api
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Anthropic - Get from https://console.anthropic.com/
ANTHROPIC_API_KEY=sk-ant-your-key-here
ANTHROPIC_MODEL=claude-3-5-haiku-20241022

# Security (change in production)
JWT_SECRET=your-random-secret-here

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
```

### 3. Database Setup (Supabase)

#### Option A: Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Create new project (or use existing)
3. Navigate to **SQL Editor**
4. Copy contents of `src/database/schema.sql`
5. Paste and run in SQL Editor
6. Verify tables created in **Table Editor**

#### Option B: Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

### 4. Verify Setup

```bash
# Run the server
npm run dev

# In another terminal, test health endpoint
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2025-01-15T12:00:00.000Z"
}
```

### 5. Test the System

#### Create a User

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test User"
  }'
```

#### Create a Session

```bash
curl -X POST http://localhost:3000/api/chat/sessions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-user-id" \
  -d '{
    "userId": "test-user-id"
  }'
```

#### Send a Message

```bash
curl -X POST http://localhost:3000/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "your-session-id",
    "message": "Hi! I want to start a business but I am not sure where to begin.",
    "agent": "onboarding"
  }'
```

## Troubleshooting

### Server Won't Start

**Error: Missing environment variables**
- Check `.env` file exists
- Verify all required variables are set
- No trailing spaces in variable values

**Error: EADDRINUSE (port already in use)**
```bash
# Find and kill process using port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm run dev
```

### Database Connection Issues

**Error: Invalid Supabase URL**
- Verify URL format: `https://your-project.supabase.co`
- Check project is not paused in Supabase dashboard
- Ensure API keys are copied correctly (no extra spaces)

**Error: Table does not exist**
- Run `src/database/schema.sql` in Supabase SQL Editor
- Check table names are lowercase in queries
- Verify UUID extension is enabled

### Anthropic API Errors

**Error: Invalid API key**
- Verify key starts with `sk-ant-`
- Check key has not expired
- Ensure billing is set up in Anthropic console

**Error: Rate limit exceeded**
- Wait 60 seconds and retry
- Consider upgrading Anthropic plan
- Implement request queuing

### Memory/Session Issues

**Error: Session not found**
- Verify session was created successfully
- Check session ID is correct UUID format
- Ensure database connection is working

**Error: Memory not persisting**
- Check memory table exists in database
- Verify session_id foreign key is valid
- Review database logs in Supabase

## Development Tips

### Enable Debug Logging

```env
LOG_LEVEL=debug
```

### Watch for File Changes

```bash
npm run dev  # Uses --watch flag
```

### Check Database Directly

```bash
# Using Supabase Studio
# https://supabase.com/dashboard/project/_/editor

# Or using SQL Editor
SELECT * FROM users;
SELECT * FROM sessions;
SELECT * FROM conversations;
SELECT * FROM memory;
```

### Monitor API Requests

```bash
# Watch logs in real-time
tail -f logs/combined.log

# Filter for errors only
tail -f logs/error.log
```

## Production Deployment

### Environment Variables

Update for production:

```env
NODE_ENV=production
PORT=443
JWT_SECRET=<strong-random-secret>
LOG_LEVEL=warn
```

### Security Checklist

- [ ] Change JWT_SECRET to strong random value
- [ ] Enable HTTPS/TLS
- [ ] Configure CORS for specific origins
- [ ] Set up proper authentication (not just Bearer token)
- [ ] Enable Supabase Row Level Security
- [ ] Set up monitoring and alerts
- [ ] Configure rate limiting per user
- [ ] Enable request logging
- [ ] Set up automated backups
- [ ] Review security headers (Helmet config)

### Deployment Options

#### Option 1: Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy
railway up
```

#### Option 2: Render

1. Connect GitHub repo
2. Set environment variables
3. Deploy automatically on push

#### Option 3: DigitalOcean App Platform

1. Create new app from GitHub
2. Configure environment variables
3. Deploy

#### Option 4: Docker

```dockerfile
# Dockerfile (create this)
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
EXPOSE 3000
CMD ["node", "src/server.js"]
```

```bash
# Build and run
docker build -t venturebot .
docker run -p 3000:3000 --env-file .env venturebot
```

## Next Steps

1. **Run Tests**: Set up test suite with tester agent
2. **Add Features**: Implement Product Manager and Prompt Engineer agents
3. **Web Integration**: Build frontend to consume API
4. **WhatsApp Bot**: Complete WhatsApp service integration
5. **Market Research**: Add web search to Validator agent
6. **Analytics**: Track usage metrics and agent performance

## Getting Help

- Check logs in `logs/` directory
- Review API documentation in README.md
- Test with curl commands from examples
- Open issue if you find bugs

## Additional Resources

- [Anthropic Documentation](https://docs.anthropic.com/)
- [Supabase Documentation](https://supabase.com/docs)
- [Express.js Guide](https://expressjs.com/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
