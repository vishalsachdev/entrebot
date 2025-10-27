# VentureBot API Design Specification

**Version:** 1.0
**Date:** October 2025
**Base URL:** `https://api.venturebot.io/api/v1`

---

## Authentication

All authenticated endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <access_token>
```

### Token Lifecycle
- **Access Token:** 1 hour expiration
- **Refresh Token:** 30 days expiration

---

## API Endpoints

### 1. Authentication Endpoints

#### `POST /auth/register`
Register a new user account.

**Request Body:**
```json
{
  "email": "student@illinois.edu",
  "password": "securePassword123",
  "full_name": "Jane Doe",
  "university": "University of Illinois"
}
```

**Response (201 Created):**
```json
{
  "user": {
    "id": "uuid",
    "email": "student@illinois.edu",
    "full_name": "Jane Doe",
    "university": "University of Illinois"
  },
  "session": {
    "access_token": "jwt_access_token",
    "refresh_token": "jwt_refresh_token",
    "expires_in": 3600
  }
}
```

**Errors:**
- `400 Bad Request` - Invalid email or password
- `409 Conflict` - Email already registered

---

#### `POST /auth/login`
Login existing user.

**Request Body:**
```json
{
  "email": "student@illinois.edu",
  "password": "securePassword123"
}
```

**Response (200 OK):**
```json
{
  "user": {
    "id": "uuid",
    "email": "student@illinois.edu",
    "full_name": "Jane Doe"
  },
  "session": {
    "access_token": "jwt_access_token",
    "refresh_token": "jwt_refresh_token",
    "expires_in": 3600
  }
}
```

**Errors:**
- `401 Unauthorized` - Invalid credentials

---

#### `POST /auth/refresh`
Refresh access token using refresh token.

**Request Body:**
```json
{
  "refresh_token": "jwt_refresh_token"
}
```

**Response (200 OK):**
```json
{
  "access_token": "new_jwt_access_token",
  "expires_in": 3600
}
```

**Errors:**
- `401 Unauthorized` - Invalid or expired refresh token

---

#### `POST /auth/logout`
Logout user and invalidate tokens.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "message": "Logged out successfully"
}
```

---

### 2. User Profile Endpoints

#### `GET /users/{user_id}`
Get user profile.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "email": "student@illinois.edu",
  "full_name": "Jane Doe",
  "university": "University of Illinois",
  "onboarding_completed": true,
  "profile": {
    "interests": "AI, education, productivity",
    "activities": "coding, reading",
    "skills": [
      {
        "skill_name": "Prompt Engineering",
        "proficiency": "intermediate",
        "learned_at": "2025-01-15T10:00:00Z"
      }
    ]
  },
  "created_at": "2025-01-01T12:00:00Z"
}
```

**Errors:**
- `403 Forbidden` - Accessing another user's profile
- `404 Not Found` - User not found

---

#### `PATCH /users/{user_id}`
Update user profile.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "full_name": "Jane Smith",
  "profile": {
    "interests": "AI, SaaS, marketplaces"
  }
}
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "email": "student@illinois.edu",
  "full_name": "Jane Smith",
  "profile": {
    "interests": "AI, SaaS, marketplaces"
  },
  "updated_at": "2025-01-20T14:30:00Z"
}
```

---

### 3. Projects Endpoints

#### `GET /users/{user_id}/projects`
List user's projects.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `status` (optional): Filter by status (`ideation`, `validation`, `building`, `launched`)
- `limit` (optional, default 20): Number of results
- `offset` (optional, default 0): Pagination offset

**Response (200 OK):**
```json
{
  "projects": [
    {
      "id": "uuid",
      "name": "Task Management for Students",
      "description": "Helps students manage coursework deadlines",
      "status": "validation",
      "pain_point": {
        "description": "Students miss assignment deadlines",
        "category": "functional"
      },
      "selected_idea": {
        "idea_text": "AI-powered deadline tracker with smart reminders"
      },
      "created_at": "2025-01-10T08:00:00Z",
      "updated_at": "2025-01-15T16:00:00Z"
    }
  ],
  "total": 3,
  "limit": 20,
  "offset": 0
}
```

---

#### `POST /users/{user_id}/projects`
Create new project.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "name": "My Startup Idea",
  "description": "Optional initial description"
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "name": "My Startup Idea",
  "description": "Optional initial description",
  "status": "ideation",
  "created_at": "2025-01-20T10:00:00Z"
}
```

---

#### `GET /users/{user_id}/projects/{project_id}`
Get project details.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "name": "Task Management for Students",
  "status": "product_planning",
  "pain_point": {
    "description": "Students miss assignment deadlines",
    "category": "functional",
    "frequency": "weekly",
    "severity": 8,
    "who_experiences": "College students taking 4+ classes"
  },
  "ideas": [
    {
      "id": "uuid",
      "idea_text": "AI-powered deadline tracker",
      "selected": true
    }
  ],
  "validation": {
    "overall_score": 0.73,
    "market_opportunity_score": 0.85,
    "competitive_landscape_score": 0.60,
    "execution_feasibility_score": 0.75,
    "innovation_potential_score": 0.70,
    "recommendations": [
      "Focus on university-specific integrations",
      "Differentiate through AI-powered prioritization"
    ]
  },
  "product": {
    "overview": "AI-powered task manager for students...",
    "user_stories": [
      "As a student, I want to sync my syllabi..."
    ],
    "launched": false
  },
  "created_at": "2025-01-10T08:00:00Z",
  "updated_at": "2025-01-18T14:00:00Z"
}
```

---

#### `PATCH /users/{user_id}/projects/{project_id}`
Update project.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "name": "Updated Project Name",
  "status": "building",
  "description": "Updated description"
}
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "name": "Updated Project Name",
  "status": "building",
  "updated_at": "2025-01-20T15:00:00Z"
}
```

---

#### `DELETE /users/{user_id}/projects/{project_id}`
Delete project.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (204 No Content)**

---

### 4. Conversation & Agent Endpoints

#### `POST /apps/manager/users/{user_id}/sessions/{session_id}/run`
Main conversation endpoint - send message to VentureBot.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "content": "I've noticed students often forget assignment deadlines",
  "project_id": "uuid"
}
```

**Response (200 OK):**
```json
{
  "message": {
    "id": "uuid",
    "role": "assistant",
    "content": "That's a great pain point to explore! Tell me more—how often does this happen? Daily? Weekly?",
    "agent_name": "onboarding_agent",
    "created_at": "2025-01-20T10:05:00Z"
  },
  "memory_updates": {
    "USER_PAIN": {
      "description": "Students often forget assignment deadlines",
      "category": "functional"
    },
    "journey_stage": "onboarding"
  },
  "next_action": "continue_conversation"
}
```

**Streaming Response (via WebSocket):**
See WebSocket section below.

**Errors:**
- `400 Bad Request` - Invalid request body
- `404 Not Found` - Session not found
- `500 Internal Server Error` - Agent processing error

---

#### `GET /users/{user_id}/sessions`
List user's conversation sessions.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `project_id` (optional): Filter by project
- `active` (optional): Filter by active status
- `limit` (optional, default 20)
- `offset` (optional, default 0)

**Response (200 OK):**
```json
{
  "sessions": [
    {
      "id": "uuid",
      "project_id": "uuid",
      "title": "Initial onboarding",
      "channel": "web",
      "journey_stage": "validation",
      "active": true,
      "message_count": 23,
      "created_at": "2025-01-10T08:00:00Z",
      "updated_at": "2025-01-18T16:30:00Z"
    }
  ],
  "total": 5,
  "limit": 20,
  "offset": 0
}
```

---

#### `GET /users/{user_id}/sessions/{session_id}`
Get session details with messages.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `limit` (optional, default 50): Number of messages
- `before` (optional): Get messages before this message_id (pagination)

**Response (200 OK):**
```json
{
  "session": {
    "id": "uuid",
    "project_id": "uuid",
    "title": "Idea validation discussion",
    "journey_stage": "validation",
    "active": true
  },
  "messages": [
    {
      "id": "uuid",
      "role": "user",
      "content": "I want to validate my deadline tracker idea",
      "created_at": "2025-01-15T10:00:00Z"
    },
    {
      "id": "uuid",
      "role": "assistant",
      "content": "Great! Let me research the market...",
      "agent_name": "validator_agent",
      "created_at": "2025-01-15T10:00:05Z"
    }
  ],
  "has_more": false
}
```

---

#### `DELETE /users/{user_id}/sessions/{session_id}`
Delete conversation session.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (204 No Content)**

---

### 5. Memory Endpoints

#### `GET /users/{user_id}/memory/{key}`
Retrieve memory value.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `session_id` (required): Session context

**Response (200 OK):**
```json
{
  "key": "USER_PAIN",
  "value": {
    "description": "Students miss assignment deadlines",
    "category": "functional"
  },
  "updated_at": "2025-01-15T12:00:00Z"
}
```

**Errors:**
- `404 Not Found` - Memory key not found

---

#### `POST /users/{user_id}/memory`
Store memory value.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "session_id": "uuid",
  "key": "USER_PREFERENCES",
  "value": {
    "interests": "AI, SaaS",
    "activities": "coding, learning"
  }
}
```

**Response (201 Created):**
```json
{
  "key": "USER_PREFERENCES",
  "value": {
    "interests": "AI, SaaS",
    "activities": "coding, learning"
  },
  "created_at": "2025-01-20T10:00:00Z"
}
```

---

#### `DELETE /users/{user_id}/memory/{key}`
Delete memory value.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `session_id` (required)

**Response (204 No Content)**

---

### 6. Validation Endpoints

#### `GET /users/{user_id}/validations/{validation_id}`
Get validation results.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "idea": {
    "id": "uuid",
    "idea_text": "AI-powered deadline tracker for students"
  },
  "scores": {
    "market_opportunity": 0.85,
    "competitive_landscape": 0.60,
    "execution_feasibility": 0.75,
    "innovation_potential": 0.70,
    "overall_score": 0.73,
    "confidence": 0.80
  },
  "market_intelligence": {
    "competitors": [
      {
        "name": "Todoist",
        "type": "Task manager",
        "positioning": "General productivity",
        "users": "25M+"
      }
    ],
    "market_gaps": [
      "No AI-powered prioritization specific to student workload",
      "Limited integration with university LMS systems"
    ],
    "trends": [
      "Growing adoption of AI in education tech",
      "Increasing student stress and time management needs"
    ],
    "barriers": [
      "Competitive market with established players",
      "Need for university partnerships"
    ],
    "recommendations": [
      "Focus on AI-powered features competitors lack",
      "Start with single university pilot program",
      "Integrate with Canvas/Blackboard LMS"
    ]
  },
  "created_at": "2025-01-15T14:00:00Z"
}
```

---

### 7. Product Endpoints

#### `GET /users/{user_id}/products/{product_id}`
Get product PRD and details.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "project_id": "uuid",
  "overview": "AI-powered task management system for university students that syncs with LMS...",
  "user_stories": [
    "As a student, I want to automatically import syllabus deadlines so I don't have to enter them manually",
    "As a student, I want AI-suggested study schedules based on my workload"
  ],
  "functional_requirements": [
    "Sync with Canvas and Blackboard APIs",
    "AI priority scoring algorithm",
    "Push notifications 24h and 1h before deadlines"
  ],
  "nonfunctional_requirements": [
    "Mobile-responsive web interface",
    "< 2s page load time",
    "99% uptime"
  ],
  "success_metrics": [
    "80% of students sync at least one syllabus in first session",
    "50% weekly active users after 1 month",
    "Average 3 tasks completed per user per week"
  ],
  "builder_prompt": "Build a responsive web application for university students...",
  "builder_tool": "bolt.new",
  "launched": false,
  "created_at": "2025-01-18T10:00:00Z"
}
```

---

#### `PATCH /users/{user_id}/products/{product_id}`
Update product (e.g., mark as launched).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "launched": true,
  "launch_date": "2025-02-01T00:00:00Z",
  "product_url": "https://studentdeadlines.app"
}
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "launched": true,
  "launch_date": "2025-02-01T00:00:00Z",
  "product_url": "https://studentdeadlines.app",
  "updated_at": "2025-02-01T10:00:00Z"
}
```

---

### 8. Sharing Endpoints

#### `POST /conversations/{conversation_id}/share`
Create public share link.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "title": "My Journey from Pain Point to Validated Idea",
  "description": "How I discovered and validated a solution for student deadline management",
  "allow_forking": true
}
```

**Response (201 Created):**
```json
{
  "share_id": "abc123xyz",
  "url": "https://venturebot.io/shared/abc123xyz",
  "title": "My Journey from Pain Point to Validated Idea",
  "created_at": "2025-01-20T10:00:00Z"
}
```

---

#### `GET /shared/{share_id}`
Get shared conversation (public).

**No authentication required**

**Response (200 OK):**
```json
{
  "share_id": "abc123xyz",
  "title": "My Journey from Pain Point to Validated Idea",
  "description": "How I discovered and validated...",
  "author": {
    "name": "Jane Doe",
    "university": "University of Illinois"
  },
  "messages": [
    {
      "role": "assistant",
      "content": "Hi! I'm VentureBot...",
      "agent_name": "onboarding_agent",
      "created_at": "2025-01-10T08:00:00Z"
    }
  ],
  "project_summary": {
    "pain_point": "Students miss assignment deadlines",
    "idea": "AI-powered deadline tracker",
    "validation_score": 0.73
  },
  "view_count": 157,
  "created_at": "2025-01-20T10:00:00Z"
}
```

**Errors:**
- `404 Not Found` - Share link not found or revoked

---

#### `DELETE /shared/{share_id}`
Revoke shared conversation.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (204 No Content)**

---

### 9. IllinoisHunt Listings

#### `GET /hunt/listings`
Get public product listings.

**No authentication required**

**Query Parameters:**
- `status` (optional, default `active`): Filter by status
- `featured` (optional): Show only featured listings
- `limit` (optional, default 20)
- `offset` (optional, default 0)

**Response (200 OK):**
```json
{
  "listings": [
    {
      "id": "uuid",
      "name": "Student Deadline Tracker",
      "tagline": "Never miss an assignment again",
      "product_url": "https://studentdeadlines.app",
      "founder": {
        "name": "Jane Doe",
        "university": "University of Illinois"
      },
      "tags": ["EdTech", "AI", "Productivity"],
      "metrics": {
        "users": 150,
        "launch_date": "2025-02-01"
      },
      "featured": false,
      "created_at": "2025-02-01T10:00:00Z"
    }
  ],
  "total": 47,
  "limit": 20,
  "offset": 0
}
```

---

#### `POST /hunt/listings`
Create new listing (authenticated).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "product_id": "uuid",
  "name": "Student Deadline Tracker",
  "tagline": "Never miss an assignment again",
  "description": "AI-powered task manager that syncs with your university's LMS...",
  "product_url": "https://studentdeadlines.app",
  "venturebot_journey_url": "https://venturebot.io/shared/abc123",
  "tags": ["EdTech", "AI", "Productivity"]
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "name": "Student Deadline Tracker",
  "product_url": "https://studentdeadlines.app",
  "status": "active",
  "created_at": "2025-02-01T10:00:00Z"
}
```

---

### 10. Learning & Progress Endpoints

#### `GET /users/{user_id}/milestones`
Get user's achieved milestones.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `project_id` (optional): Filter by project

**Response (200 OK):**
```json
{
  "milestones": [
    {
      "id": "uuid",
      "milestone_type": "pain_articulated",
      "description": "Identified pain point: Students miss deadlines",
      "achieved_at": "2025-01-10T10:00:00Z"
    },
    {
      "id": "uuid",
      "milestone_type": "idea_validated",
      "description": "Validated idea with score 0.73",
      "achieved_at": "2025-01-15T14:00:00Z"
    },
    {
      "id": "uuid",
      "milestone_type": "prd_completed",
      "description": "Created comprehensive PRD",
      "achieved_at": "2025-01-18T16:00:00Z"
    }
  ]
}
```

---

#### `GET /users/{user_id}/skills`
Get user's learned skills.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "skills": [
    {
      "skill_name": "Prompt Engineering",
      "skill_category": "prompt_engineering",
      "proficiency": "intermediate",
      "evidence": [
        "Generated optimized prompt for Bolt.new",
        "Created 3 successful builder prompts"
      ],
      "learned_at": "2025-01-15T10:00:00Z"
    },
    {
      "skill_name": "Market Validation",
      "skill_category": "market_validation",
      "proficiency": "beginner",
      "evidence": [
        "Completed validation for Student Deadline Tracker"
      ],
      "learned_at": "2025-01-15T14:00:00Z"
    }
  ]
}
```

---

#### `GET /learning/resources`
Get recommended learning resources.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `skill_category` (optional): Filter by category
- `difficulty` (optional): Filter by difficulty

**Response (200 OK):**
```json
{
  "resources": [
    {
      "id": "uuid",
      "title": "Prompt Engineering Guide",
      "description": "Learn to write effective prompts...",
      "url": "https://example.com/prompt-guide",
      "resource_type": "article",
      "skill_category": "prompt_engineering",
      "difficulty": "beginner",
      "estimated_time_minutes": 15,
      "user_progress": {
        "status": "completed",
        "completed_at": "2025-01-14T12:00:00Z"
      }
    }
  ]
}
```

---

### 11. Webhook Endpoints (Channel Integrations)

#### `POST /webhooks/whatsapp`
WhatsApp webhook (Twilio).

**No authentication** (verified via Twilio signature)

**Request Body (form-data):**
```
From: whatsapp:+15551234567
Body: I want to validate my idea
MediaUrl0: https://api.twilio.com/... (optional voice message)
```

**Response (200 OK):**
Empty response (Twilio doesn't require response body)

---

#### `POST /webhooks/discord`
Discord bot webhook.

**No authentication** (verified via Discord signature)

**Request Body:**
```json
{
  "type": 1,
  "data": {
    "name": "validate",
    "options": [
      {
        "name": "idea",
        "value": "AI-powered deadline tracker"
      }
    ]
  },
  "user": {
    "id": "discord_user_id"
  }
}
```

**Response (200 OK):**
```json
{
  "type": 4,
  "data": {
    "content": "🔍 Validating your idea: AI-powered deadline tracker..."
  }
}
```

---

#### `POST /webhooks/telegram`
Telegram bot webhook.

**No authentication** (verified via Telegram token)

**Request Body:**
```json
{
  "message": {
    "from": {
      "id": 12345678
    },
    "text": "I need help with my startup idea"
  }
}
```

**Response (200 OK):**
Empty response (responses sent via Telegram API)

---

## WebSocket Protocol

### Connection
```
wss://api.venturebot.io/ws/chat
```

### Authentication
Send authentication message immediately after connection:
```json
{
  "type": "auth",
  "access_token": "jwt_access_token"
}
```

**Response:**
```json
{
  "type": "auth_success",
  "user_id": "uuid"
}
```

### Send Message
```json
{
  "type": "message",
  "user_id": "uuid",
  "session_id": "uuid",
  "content": "I want to validate my idea"
}
```

### Receive Streaming Response
**Chunk:**
```json
{
  "type": "chunk",
  "content": "Great! Let me",
  "agent_name": "validator_agent"
}
```

**Complete:**
```json
{
  "type": "complete",
  "message_id": "uuid",
  "memory_updates": {
    "journey_stage": "validation"
  }
}
```

**Error:**
```json
{
  "type": "error",
  "error": "Agent processing failed",
  "code": "AGENT_ERROR"
}
```

### Ping/Pong (Keep-Alive)
**Client → Server:**
```json
{"type": "ping"}
```

**Server → Client:**
```json
{"type": "pong"}
```

---

## Rate Limits

| Endpoint Pattern | Limit | Window |
|-----------------|-------|--------|
| `/auth/*` | 10 requests | 1 minute |
| `/apps/manager/*/run` | 100 requests | 1 minute |
| `/apps/manager/validate` | 10 requests | 1 minute |
| All other endpoints | 1000 requests | 1 hour |
| WebSocket messages | 100 messages | 1 minute |

**Rate Limit Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642694400
```

**Rate Limit Error (429 Too Many Requests):**
```json
{
  "error": "Rate limit exceeded",
  "retry_after": 42
}
```

---

## Error Responses

### Standard Error Format
```json
{
  "error": "Error description",
  "code": "ERROR_CODE",
  "details": {
    "field": "email",
    "reason": "Invalid email format"
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|------------|-------------|
| `INVALID_REQUEST` | 400 | Malformed request body |
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource already exists |
| `RATE_LIMITED` | 429 | Too many requests |
| `AGENT_ERROR` | 500 | Agent processing failed |
| `DATABASE_ERROR` | 500 | Database operation failed |
| `EXTERNAL_SERVICE_ERROR` | 502 | External API failed |
| `TIMEOUT` | 504 | Request timeout |

---

## Pagination

Endpoints that return lists support pagination:

**Query Parameters:**
- `limit` (default 20, max 100)
- `offset` (default 0)

**Response Format:**
```json
{
  "data": [...],
  "total": 157,
  "limit": 20,
  "offset": 40,
  "has_more": true
}
```

---

## API Versioning

API version specified in URL path: `/api/v1/...`

**Deprecation:** Older versions supported for 6 months after new version release.

**Version Header:**
```
X-API-Version: 1.0
```

---

## CORS Configuration

**Allowed Origins:**
- `https://venturebot.io`
- `https://*.venturebot.io`
- `http://localhost:*` (development)

**Allowed Methods:**
```
GET, POST, PATCH, DELETE, OPTIONS
```

**Allowed Headers:**
```
Authorization, Content-Type, X-API-Version
```

---

## SDK Examples

### JavaScript/TypeScript
```typescript
import { VentureBotClient } from '@venturebot/sdk';

const client = new VentureBotClient({
  apiKey: 'your_api_key',
  baseUrl: 'https://api.venturebot.io/api/v1'
});

// Send message
const response = await client.conversation.send({
  userId: 'user_uuid',
  sessionId: 'session_uuid',
  content: 'I want to validate my idea'
});

// Stream response
client.conversation.stream({
  userId: 'user_uuid',
  sessionId: 'session_uuid',
  content: 'Tell me more',
  onChunk: (chunk) => console.log(chunk),
  onComplete: (message) => console.log('Done:', message)
});
```

### Python
```python
from venturebot import VentureBotClient

client = VentureBotClient(
    api_key='your_api_key',
    base_url='https://api.venturebot.io/api/v1'
)

# Send message
response = client.conversation.send(
    user_id='user_uuid',
    session_id='session_uuid',
    content='I want to validate my idea'
)

# Stream response
for chunk in client.conversation.stream(
    user_id='user_uuid',
    session_id='session_uuid',
    content='Tell me more'
):
    print(chunk, end='', flush=True)
```

---

**END OF API DESIGN SPECIFICATION**
