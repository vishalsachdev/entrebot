# VentureBot - Quick Start Guide

Welcome to **VentureBot**, your AI-powered entrepreneurship coaching platform! This guide will get you up and running in minutes.

## 🚀 What is VentureBot?

VentureBot is a full-stack AI coaching platform that guides aspiring solopreneurs (especially university students) through their entrepreneurial journey from pain point discovery to launching AI-enabled startups.

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + Supabase + OpenAI GPT-4
- **Database**: PostgreSQL (via Supabase)
- **AI**: OpenAI GPT-4 with specialized coaching agents

---

## ✅ Prerequisites

- **Node.js** v18 or higher (v22.21.1 recommended)
- **npm** v10 or higher
- *Optional for production*: Supabase account and OpenAI API key

---

## 🎯 Quick Start (Demo Mode)

The application is already configured to run in **demo mode** with localStorage. You can start using it immediately!

### 1. Install Dependencies

```bash
# Install backend dependencies
cd /home/user/entrebot
npm install

# Install frontend dependencies
cd frontend
npm install
```

### 2. Start the Application

**Option A: Run both servers (recommended)**

Open two terminal windows:

```bash
# Terminal 1 - Backend Server
cd /home/user/entrebot
npm start

# Terminal 2 - Frontend Dev Server
cd /home/user/entrebot/frontend
npm run dev
```

**Option B: Run frontend only (demo mode)**

```bash
cd /home/user/entrebot/frontend
npm run dev
```

### 3. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000/api/health

### 4. Login/Register

The app runs in demo mode with mock authentication:
- Use any email/password to register
- Data is stored in localStorage
- No backend required for basic functionality

---

## 🔧 Production Setup (Optional)

To enable full AI coaching features, configure these services:

### 1. Get API Keys

**Supabase** (Database):
1. Sign up at https://supabase.com
2. Create a new project
3. Copy your project URL and keys from Settings > API

**OpenAI** (AI Agents):
1. Sign up at https://platform.openai.com
2. Generate an API key from API Keys section
3. Add billing to enable GPT-4 access

### 2. Configure Environment

Edit `/home/user/entrebot/.env`:

```bash
# Database (Supabase)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# AI (OpenAI)
OPENAI_API_KEY=sk-your_openai_api_key_here
OPENAI_MODEL=gpt-4

# Security
JWT_SECRET=your_secure_random_string_here
```

### 3. Setup Database

Run the schema in Supabase SQL editor:

```bash
cat src/database/schema.sql
```

Copy and execute in: Supabase Dashboard > SQL Editor

### 4. Restart Backend

```bash
cd /home/user/entrebot
npm start
```

---

## 📚 Available Scripts

### Backend (`/home/user/entrebot`)
```bash
npm start       # Start production server
npm run dev     # Start with auto-reload
```

### Frontend (`/home/user/entrebot/frontend`)
```bash
npm run dev         # Start dev server
npm run build       # Build for production
npm run preview     # Preview production build
npm run lint        # Run ESLint
npm run format      # Format code with Prettier
npm run type-check  # Check TypeScript types
```

---

## 🎨 Features

### For Users
- **Onboarding Agent**: Socratic questioning to discover pain points
- **Idea Generator**: AI-powered business idea generation
- **Validator Agent**: Market validation and scoring
- **Project Management**: Track multiple startup projects
- **Progress Dashboard**: Visual journey through 7 entrepreneurship phases
- **Chat Interface**: Real-time conversations with AI agents

### For Developers
- **Type-Safe**: Full TypeScript coverage
- **Modern Stack**: React 18, Vite 7, Node 22
- **Production-Ready**: Security headers, rate limiting, error handling
- **Well-Tested**: Comprehensive test suite (Jest + Supertest)
- **AI-Powered**: Claude Code integration with 54+ specialized agents

---

## 🔍 Project Structure

```
/home/user/entrebot/
├── frontend/              # React frontend
│   ├── src/
│   │   ├── pages/        # 8 main pages
│   │   ├── components/   # 50+ React components
│   │   ├── contexts/     # State management
│   │   ├── services/     # API integration
│   │   └── hooks/        # Custom React hooks
│   └── dist/             # Production build
├── src/                  # Backend
│   ├── server.js         # Entry point
│   ├── agents/           # AI coaching agents
│   ├── routes/           # API endpoints
│   ├── services/         # External services
│   ├── database/         # Database layer
│   └── middleware/       # Express middleware
├── tests/                # Test suite
└── docs/                 # Documentation
```

---

## 🌐 API Endpoints

### Health & Info
- `GET /api/health` - Health check
- `GET /api/version` - API version

### Authentication (Demo Mode)
- Frontend handles auth with localStorage
- Backend has JWT middleware (configured but not required for demo)

### Users
- `POST /api/users` - Create user
- `GET /api/users/:email` - Get user
- `PUT /api/users/:userId` - Update user

### Sessions
- `POST /api/sessions` - Create session
- `GET /api/sessions/:id` - Get session
- `GET /api/users/:userId/sessions` - List user sessions

### Chat (AI Agents)
- `POST /api/chat/message` - Send message to agent
- `POST /api/chat/stream` - Stream response (SSE)
- `GET /api/chat/history/:sessionId` - Get chat history

### Memory (Agent Context)
- `POST /api/memory` - Store key-value
- `GET /api/memory/:sessionId/:key` - Get value
- `GET /api/memory/:sessionId` - Get all session memory

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

### Dependencies Not Installing
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Errors
```bash
# Rebuild TypeScript
cd frontend
npm run type-check
```

### Database Connection Fails
- Verify Supabase credentials in `.env`
- Check Supabase project is active
- Ensure database schema is created

### OpenAI API Errors
- Verify API key is valid
- Check billing is enabled
- Ensure GPT-4 access is granted

---

## 📊 Application Status

### ✅ Working Features (Demo Mode)
- User authentication (localStorage)
- Project management
- Agent selection
- Progress tracking
- Chat interface (UI only)
- History and settings

### 🔧 Requires Configuration
- Real database persistence (Supabase)
- AI agent responses (OpenAI)
- WhatsApp integration (optional)

### 🎯 Production Readiness
- **Frontend**: ✅ Fully functional in demo mode
- **Backend**: ✅ Server starts, requires API keys for full features
- **Database**: ⚠️ Schema provided, requires Supabase setup
- **AI Agents**: ⚠️ Implemented, requires OpenAI API key

---

## 🚦 Next Steps

1. **Explore the Demo**
   - Register a new account
   - Create a project
   - Chat with agents (demo mode)
   - Track progress

2. **Configure Production**
   - Set up Supabase database
   - Add OpenAI API key
   - Deploy to hosting platform

3. **Customize**
   - Modify AI agent personalities
   - Add new coaching phases
   - Extend API endpoints

---

## 📖 Additional Documentation

- **[README.md](../README.md)** - Backend overview
- **[PRD.md](../PRD.md)** - Product requirements (45KB detailed spec)
- **[APPLICATION_STATUS.md](../APPLICATION_STATUS.md)** - Current implementation status
- **[AGENTS.md](../AGENTS.md)** - AI agent documentation
- **[COACHING_BEST_PRACTICES.md](../COACHING_BEST_PRACTICES.md)** - Coaching methodology
- **[frontend/README.md](../frontend/README.md)** - Frontend documentation
- **[frontend/DEPLOYMENT.md](../frontend/DEPLOYMENT.md)** - Deployment guide

---

## 🆘 Support

- **Issues**: Create an issue in the repository
- **Documentation**: Check the `/docs` directory
- **API Reference**: See backend `/src/routes` for endpoint details

---

## 📝 License

[Add your license here]

---

**Built with ❤️ for aspiring entrepreneurs**
