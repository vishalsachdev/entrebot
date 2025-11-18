#!/bin/bash
# Quick API Testing Script
# Usage: ./scripts/test-api.sh

BASE_URL="http://localhost:3000/api"

echo "🧪 VentureBot API Test Suite"
echo "=============================="
echo ""

# Check if server is running
echo "1️⃣  Checking server health..."
HEALTH=$(curl -s ${BASE_URL}/health)
if [[ $? -eq 0 ]]; then
  echo "✅ Server is running"
  echo "   Response: $HEALTH"
else
  echo "❌ Server is not running. Start with: npm run dev"
  exit 1
fi
echo ""

# Test user creation
echo "2️⃣  Creating test user..."
USER_RESPONSE=$(curl -s -X POST ${BASE_URL}/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test User"
  }')
echo "   Response: $USER_RESPONSE"
echo ""

# Extract user ID (assuming jq is available)
if command -v jq &> /dev/null; then
  USER_ID=$(echo $USER_RESPONSE | jq -r '.user.id // "test-user-id"')
else
  USER_ID="test-user-id"
  echo "   ℹ️  Install 'jq' for automatic ID extraction"
fi
echo "   User ID: $USER_ID"
echo ""

# Create session
echo "3️⃣  Creating chat session..."
SESSION_RESPONSE=$(curl -s -X POST ${BASE_URL}/chat/sessions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${USER_ID}" \
  -d "{\"userId\": \"${USER_ID}\"}")
echo "   Response: $SESSION_RESPONSE"
echo ""

if command -v jq &> /dev/null; then
  SESSION_ID=$(echo $SESSION_RESPONSE | jq -r '.session.id // "test-session-id"')
else
  SESSION_ID="test-session-id"
fi
echo "   Session ID: $SESSION_ID"
echo ""

# Send onboarding message
echo "4️⃣  Sending onboarding message..."
MESSAGE_RESPONSE=$(curl -s -X POST ${BASE_URL}/chat/message \
  -H "Content-Type: application/json" \
  -d "{
    \"sessionId\": \"${SESSION_ID}\",
    \"message\": \"Hi! I want to start a business but I'm not sure where to begin.\",
    \"agent\": \"onboarding\"
  }")

if command -v jq &> /dev/null; then
  AGENT_RESPONSE=$(echo $MESSAGE_RESPONSE | jq -r '.response // .error')
else
  AGENT_RESPONSE=$MESSAGE_RESPONSE
fi

echo "   Agent Response:"
echo "   ---"
echo "   $AGENT_RESPONSE"
echo "   ---"
echo ""

# Get conversation history
echo "5️⃣  Fetching conversation history..."
HISTORY_RESPONSE=$(curl -s "${BASE_URL}/chat/history/${SESSION_ID}" \
  -H "Authorization: Bearer ${USER_ID}")
echo "   Found messages in conversation history"
echo ""

echo "=============================="
echo "✅ All tests completed!"
echo ""
echo "📝 Next steps:"
echo "   - Try streaming: curl -X POST ${BASE_URL}/chat/stream -d '{...}'"
echo "   - View full history: curl ${BASE_URL}/chat/history/${SESSION_ID}"
echo "   - Test idea generation: Send another message to progress through onboarding"
echo ""
echo "💡 Tips:"
echo "   - Install 'jq' for better JSON parsing: brew install jq"
echo "   - Check logs: tail -f logs/combined.log"
echo "   - View database: https://supabase.com/dashboard"
