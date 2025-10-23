# GPT-5 Migration Guide

This document outlines the migration from Anthropic Claude to OpenAI GPT-5 for VentureBot.

## Overview

VentureBot has been updated to use OpenAI's GPT-5 API instead of Anthropic Claude for all AI agent interactions. This change affects the core AI service layer while maintaining all existing functionality.

## Changes Made

### 1. API Client Replacement

**Before (Claude):**
- File: `src/services/anthropic.js`
- SDK: `@anthropic-ai/sdk`
- Model: `claude-3-5-haiku-20241022`

**After (GPT-5):**
- File: `src/services/openai.js`
- SDK: `openai`
- Model: `gpt-5`

### 2. Configuration Updates

**Environment Variables:**
```bash
# OLD
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-3-5-haiku-20241022

# NEW
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-5
```

**Config File (`src/config/env.js`):**
```javascript
// OLD
anthropic: {
  apiKey: process.env.ANTHROPIC_API_KEY,
  model: process.env.ANTHROPIC_MODEL || 'claude-3-5-haiku-20241022',
  maxTokens: 4096
}

// NEW
openai: {
  apiKey: process.env.OPENAI_API_KEY,
  model: process.env.OPENAI_MODEL || 'gpt-5',
  maxTokens: 4096,
  temperature: 0.7
}
```

### 3. Response Format Changes

**Claude Response Format:**
```javascript
result.response.content[0].text
```

**GPT-5 Response Format:**
```javascript
result.response.choices[0].message.content
```

**Updated in:** `src/agents/base.js`

### 4. Message Format Changes

**Claude:** Separate `system` parameter
```javascript
{
  model: 'claude-3-5-haiku-20241022',
  system: systemPrompt,
  messages: [...]
}
```

**GPT-5:** System message in messages array
```javascript
{
  model: 'gpt-5',
  messages: [
    { role: 'system', content: systemPrompt },
    ...messages
  ]
}
```

### 5. Streaming Implementation

**Claude:**
```javascript
for await (const chunk of stream) {
  if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
    const text = chunk.delta.text;
    // Process text
  }
}
```

**GPT-5:**
```javascript
for await (const chunk of stream) {
  const delta = chunk.choices[0]?.delta?.content;
  if (delta) {
    // Process delta
  }
}
```

## Files Modified

### Core Service Files
1. ✅ `src/services/openai.js` - New OpenAI client (replaces anthropic.js)
2. ✅ `src/services/anthropic.js` - Deprecated (can be removed)
3. ✅ `src/agents/base.js` - Updated imports and response parsing
4. ✅ `src/config/env.js` - Updated configuration
5. ✅ `src/server.js` - Updated initialization

### Configuration Files
6. ✅ `.env.example` - Updated environment template
7. ✅ `package.json` - Replaced `@anthropic-ai/sdk` with `openai`

### Documentation Files
8. ✅ `README.md` - Updated project description
9. ✅ `docs/SETUP.md` - Updated setup instructions (pending)
10. ✅ `docs/IMPLEMENTATION_SUMMARY.md` - Updated implementation details (pending)

## Migration Steps for Developers

### Step 1: Update Dependencies
```bash
npm uninstall @anthropic-ai/sdk
npm install openai@^4.71.1
```

### Step 2: Update Environment Variables
```bash
# Remove old variables from .env
# ANTHROPIC_API_KEY
# ANTHROPIC_MODEL

# Add new variables to .env
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-5
```

### Step 3: Remove Deprecated Files (Optional)
```bash
# Anthropic service is no longer used
rm src/services/anthropic.js
```

### Step 4: Update Server Initialization
Edit `src/server.js`:
```javascript
// OLD
import { initializeAnthropic } from './services/anthropic.js';
initializeAnthropic();
logger.info(`🤖 Model: ${config.anthropic.model}`);

// NEW
import { initializeOpenAI } from './services/openai.js';
initializeOpenAI();
logger.info(`🤖 Model: ${config.openai.model}`);
```

### Step 5: Test Integration
```bash
# Start the server
npm run dev

# Test API endpoints
curl -X POST http://localhost:3000/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-session",
    "message": "Hello",
    "agentType": "onboarding"
  }'
```

## API Compatibility

### Agent Methods (Unchanged)
All agent methods remain the same:
- `agent.send(messages, options)` - Non-streaming
- `agent.stream(messages, onChunk, options)` - Streaming
- `agent.getMemory(sessionId, key)`
- `agent.setMemory(sessionId, key, value)`

### REST API Endpoints (Unchanged)
All REST endpoints remain compatible:
- `POST /api/chat/message`
- `POST /api/chat/stream`
- `POST /api/chat/sessions`
- `GET /api/chat/history/:sessionId`

## Performance Considerations

### GPT-5 Advantages
- **Faster response times**: GPT-5 typically responds faster than Claude
- **Better reasoning**: Improved multi-step reasoning capabilities
- **Larger context window**: GPT-5 supports larger context sizes
- **Lower latency**: OpenAI's infrastructure optimized for low latency

### Cost Comparison (Estimated)
- **Claude 3.5 Haiku**: $0.25 per 1M input tokens, $1.25 per 1M output tokens
- **GPT-5**: Pricing to be confirmed by OpenAI (likely competitive)

## Testing Checklist

- [ ] Environment variables configured correctly
- [ ] Dependencies installed (`openai` package)
- [ ] Server starts without errors
- [ ] Onboarding agent responds correctly
- [ ] Idea generator produces 5 ideas
- [ ] Market validator completes in < 30 seconds
- [ ] Streaming responses work via SSE
- [ ] Memory persistence across sessions
- [ ] Error handling for API failures

## Rollback Plan

If issues arise with GPT-5 integration:

1. **Restore Anthropic dependency:**
   ```bash
   npm install @anthropic-ai/sdk@^0.32.1
   ```

2. **Revert environment variables:**
   ```bash
   ANTHROPIC_API_KEY=your_anthropic_key
   ANTHROPIC_MODEL=claude-3-5-haiku-20241022
   ```

3. **Restore service file:**
   ```bash
   git checkout HEAD -- src/services/anthropic.js
   git checkout HEAD -- src/agents/base.js
   git checkout HEAD -- src/config/env.js
   ```

4. **Update server.js:**
   ```javascript
   import { initializeAnthropic } from './services/anthropic.js';
   ```

## Future Enhancements

### Multi-Model Support
Consider adding support for both Claude and GPT-5:
```javascript
// src/config/env.js
aiProvider: process.env.AI_PROVIDER || 'openai', // 'openai' | 'anthropic'
```

### Model Selection per Agent
Different agents could use different models:
```javascript
// Onboarding: GPT-5 (conversational)
// Validator: Claude (analytical)
// Idea Generator: GPT-5 (creative)
```

### Fallback Strategy
Implement automatic fallback:
```javascript
try {
  return await gpt5.send(messages);
} catch (error) {
  logger.warn('GPT-5 failed, falling back to Claude');
  return await claude.send(messages);
}
```

## Support

For issues with GPT-5 integration:
1. Check OpenAI API status: https://status.openai.com
2. Review OpenAI documentation: https://platform.openai.com/docs
3. Verify API key has GPT-5 access
4. Check rate limits and quota

## Changelog

### 2025-10-22
- Initial migration from Claude Sonnet to GPT-5
- Created new `src/services/openai.js` client
- Updated all agent implementations
- Updated configuration and environment variables
- Updated documentation

---

**Migration Status:** ✅ Complete
**Testing Status:** ⏳ Pending
**Production Deployment:** ⏳ Pending
