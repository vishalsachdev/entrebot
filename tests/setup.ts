/**
 * Jest Test Setup
 * Global configuration and utilities for all tests
 */

// Extend Jest matchers
expect.extend({
  toBeValidPainPoint(received: any) {
    const pass =
      received &&
      typeof received.description === 'string' &&
      received.description.length > 10 &&
      ['functional', 'social', 'emotional', 'financial'].includes(received.category);

    return {
      pass,
      message: () =>
        pass
          ? `Expected ${JSON.stringify(received)} not to be a valid pain point`
          : `Expected ${JSON.stringify(received)} to be a valid pain point with description and category`
    };
  },

  toBeValidIdea(received: any) {
    const pass =
      received &&
      typeof received.title === 'string' &&
      typeof received.description === 'string' &&
      Array.isArray(received.concepts) &&
      received.concepts.length > 0;

    return {
      pass,
      message: () =>
        pass
          ? `Expected ${JSON.stringify(received)} not to be a valid idea`
          : `Expected ${JSON.stringify(received)} to be a valid idea with title, description, and concepts`
    };
  },

  toBeValidValidationScore(received: any) {
    const pass =
      received &&
      typeof received.market_opportunity === 'number' &&
      typeof received.competitive_landscape === 'number' &&
      typeof received.execution_feasibility === 'number' &&
      typeof received.innovation_potential === 'number' &&
      received.market_opportunity >= 0 && received.market_opportunity <= 1 &&
      received.competitive_landscape >= 0 && received.competitive_landscape <= 1 &&
      received.execution_feasibility >= 0 && received.execution_feasibility <= 1 &&
      received.innovation_potential >= 0 && received.innovation_potential <= 1;

    return {
      pass,
      message: () =>
        pass
          ? `Expected ${JSON.stringify(received)} not to be a valid validation score`
          : `Expected ${JSON.stringify(received)} to be a valid validation score with all dimensions between 0-1`
    };
  }
});

// Global test utilities
global.createMockUser = () => ({
  id: 'test-user-123',
  email: 'test@illinois.edu',
  name: 'Test Student',
  created_at: new Date().toISOString()
});

global.createMockConversation = () => ({
  id: 'conv-123',
  user_id: 'test-user-123',
  agent_type: 'onboarding',
  messages: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
});

// Mock environment variables for tests
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = ':memory:';
process.env.JWT_SECRET = 'test-secret-key';

// Increase timeout for integration tests
jest.setTimeout(10000);

// Suppress console output during tests (unless DEBUG=true)
if (!process.env.DEBUG) {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn()
  };
}
