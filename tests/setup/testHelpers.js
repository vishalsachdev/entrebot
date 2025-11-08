/**
 * Test Helpers
 * Shared utilities and fixtures for testing
 */

/**
 * Generate mock user data
 */
function createMockUser(overrides = {}) {
  return {
    id: 'user-' + Math.random().toString(36).substring(7),
    email: `test${Date.now()}@example.com`,
    name: 'Test User',
    phone: '+1234567890',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides
  };
}

/**
 * Generate mock session data
 */
function createMockSession(overrides = {}) {
  return {
    id: 'session-' + Math.random().toString(36).substring(7),
    user_id: 'user-123',
    metadata: {},
    created_at: new Date().toISOString(),
    ...overrides
  };
}

/**
 * Generate mock conversation message
 */
function createMockMessage(overrides = {}) {
  return {
    id: 'msg-' + Math.random().toString(36).substring(7),
    session_id: 'session-123',
    role: 'user',
    content: 'Test message',
    metadata: {},
    created_at: new Date().toISOString(),
    ...overrides
  };
}

/**
 * Generate mock memory entry
 */
function createMockMemory(overrides = {}) {
  return {
    session_id: 'session-123',
    key: 'test_key',
    value: 'test_value',
    updated_at: new Date().toISOString(),
    ...overrides
  };
}

/**
 * Create a mock Supabase client
 */
function createMockSupabaseClient() {
  return {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn(),
    // Add auth mock
    auth: {
      signUp: jest.fn(),
      signIn: jest.fn(),
      signOut: jest.fn(),
      getUser: jest.fn()
    }
  };
}

/**
 * Wait for a specified time
 */
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate random string
 */
function randomString(length = 10) {
  return Math.random().toString(36).substring(2, 2 + length);
}

/**
 * Create bulk test data
 */
function createBulkMessages(count, sessionId = 'session-123') {
  return Array(count).fill(null).map((_, i) => ({
    id: `msg-${i}`,
    session_id: sessionId,
    role: i % 2 === 0 ? 'user' : 'assistant',
    content: `Message ${i}`,
    metadata: {},
    created_at: new Date(Date.now() + i * 1000).toISOString()
  }));
}

/**
 * Create bulk sessions
 */
function createBulkSessions(count, userId = 'user-123') {
  return Array(count).fill(null).map((_, i) => ({
    id: `session-${i}`,
    user_id: userId,
    metadata: { index: i },
    created_at: new Date(Date.now() - (count - i) * 86400000).toISOString()
  }));
}

/**
 * Validate response structure
 */
function expectSuccessResponse(response, statusCode = 200) {
  expect(response.status).toBe(statusCode);
  expect(response.body).toHaveProperty('success', true);
  expect(response.body).toHaveProperty('data');
}

/**
 * Validate error response structure
 */
function expectErrorResponse(response, statusCode = 400) {
  expect(response.status).toBe(statusCode);
  expect(response.body).toHaveProperty('success', false);
  expect(response.body).toHaveProperty('error');
  expect(typeof response.body.error).toBe('string');
}

module.exports = {
  createMockUser,
  createMockSession,
  createMockMessage,
  createMockMemory,
  createMockSupabaseClient,
  wait,
  randomString,
  createBulkMessages,
  createBulkSessions,
  expectSuccessResponse,
  expectErrorResponse
};
