/**
 * Jest Setup File
 * Global configuration and setup for all tests
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.SUPABASE_URL = 'http://localhost:54321';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';
process.env.OPENAI_API_KEY = 'test-openai-key';
process.env.PORT = '3001';

// Increase test timeout for integration tests
jest.setTimeout(10000);

// Mock console methods to reduce noise in test output
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Global setup before all tests
beforeAll(() => {
  // Any global setup
});

// Global teardown after all tests
afterAll(() => {
  // Any global cleanup
});

// Reset mocks between tests
afterEach(() => {
  jest.clearAllMocks();
});
