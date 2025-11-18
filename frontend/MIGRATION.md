# Getting Started Guide

## Overview

This is a new React-based frontend for VentureBot. No migration needed - this is a fresh implementation.

## Quick Start

```bash
# Install dependencies
cd frontend
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Local Development

The app runs at `http://localhost:5173/` with hot reload enabled.

### Demo Mode

The app currently runs in demo mode with:
- Mock authentication (any email/password works)
- Local storage for data persistence
- Simulated agent responses

### Connecting to Backend

Update `.env` to connect to your backend:

```env
VITE_API_URL=http://localhost:5000/api
```

## Data Storage

All data is stored in browser localStorage:

```javascript
{
  "user": { "id": "...", "email": "...", "name": "..." },
  "auth_token": "...",
  "projects": [...],
  "journeyPhases": [...],
  "milestones": [...]
}
```

## API Integration

The frontend is ready to integrate with the backend API:

- Uses endpoints: `/api/users`, `/api/sessions`, `/api/conversations`, `/api/memory`
- JWT token authentication
- React Query for data fetching and caching

### Backend Requirements

The backend should provide these endpoints:
- `POST /api/users` - Create user
- `POST /api/sessions` - Create session
- `GET /api/sessions/:id/conversations` - Get messages
- `POST /api/conversations` - Send message
- `GET/POST /api/memory` - Session memory

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy

```bash
# Build
npm run build

# Deploy dist folder to your hosting service
# The app is a static SPA - works with any static host
```

## Features Implemented

✅ Authentication (Login/Register)
✅ Project Management
✅ Multi-Agent Chat Interface
✅ Progress Tracking (7-phase journey)
✅ Coaching Dashboard
✅ Mobile-Responsive Design
✅ PWA Support

## Next Steps

1. **Connect Backend**: Update API URL in `.env`
2. **Test Integration**: Verify API endpoints work
3. **Deploy**: Follow deployment guide
4. **Monitor**: Set up error tracking (optional)
