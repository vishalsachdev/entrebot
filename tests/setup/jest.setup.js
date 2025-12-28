/**
 * Jest Setup File
 * Mocks all external dependencies BEFORE they load to prevent real connections
 * and process.exit calls during testing.
 */

// ============================================================================
// 1. MOCK PROCESS.ENV FIRST - Before any module loads
// ============================================================================
process.env.SUPABASE_URL = 'http://test.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
process.env.OPENAI_API_KEY = 'test-openai-key';
process.env.JWT_SECRET = 'test-jwt-secret-minimum-32-chars-long';
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.LOG_LEVEL = 'silent';
process.env.WHATSAPP_SESSION_PATH = './test_whatsapp_session';
process.env.RATE_LIMIT_WINDOW_MS = '900000';
process.env.RATE_LIMIT_MAX_REQUESTS = '1000';
process.env.OPENAI_MODEL = 'gpt-4-test';

// ============================================================================
// 2. MOCK ../src/config/env.js - Export test config object
// ============================================================================
jest.mock('../../src/config/env.js', () => ({
  config: {
    port: 3001,
    nodeEnv: 'test',
    supabase: {
      url: 'http://test.supabase.co',
      anonKey: 'test-anon-key',
      serviceRoleKey: 'test-service-key'
    },
    openai: {
      apiKey: 'test-openai-key',
      model: 'gpt-4-test',
      maxTokens: 4096,
      temperature: 0.7
    },
    whatsapp: {
      sessionPath: './test_whatsapp_session'
    },
    jwt: {
      secret: 'test-jwt-secret-minimum-32-chars-long'
    },
    rateLimit: {
      windowMs: 900000,
      max: 1000
    },
    logLevel: 'silent'
  },
  default: {
    port: 3001,
    nodeEnv: 'test',
    supabase: {
      url: 'http://test.supabase.co',
      anonKey: 'test-anon-key',
      serviceRoleKey: 'test-service-key'
    },
    openai: {
      apiKey: 'test-openai-key',
      model: 'gpt-4-test',
      maxTokens: 4096,
      temperature: 0.7
    },
    whatsapp: {
      sessionPath: './test_whatsapp_session'
    },
    jwt: {
      secret: 'test-jwt-secret-minimum-32-chars-long'
    },
    rateLimit: {
      windowMs: 900000,
      max: 1000
    },
    logLevel: 'silent'
  }
}));

// ============================================================================
// 3. MOCK ../src/config/logger.js - Suppress logs in tests
// ============================================================================
const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  verbose: jest.fn(),
  silly: jest.fn(),
  log: jest.fn(),
  add: jest.fn(),
  remove: jest.fn(),
  clear: jest.fn(),
  close: jest.fn()
};

jest.mock('../../src/config/logger.js', () => ({
  logger: mockLogger,
  default: mockLogger
}));

// ============================================================================
// 4. MOCK ../src/database/supabase.js - Fake Supabase client
// ============================================================================
const createMockQueryBuilder = () => {
  const builder = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    like: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    contains: jest.fn().mockReturnThis(),
    containedBy: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    textSearch: jest.fn().mockReturnThis(),
    match: jest.fn().mockReturnThis(),
    not: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    and: jest.fn().mockReturnThis(),
    filter: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    csv: jest.fn().mockReturnThis(),
    then: jest.fn((resolve) => resolve({ data: [], error: null }))
  };

  // Make the builder thenable so await works
  builder[Symbol.toStringTag] = 'Promise';

  return builder;
};

const mockSupabaseClient = {
  from: jest.fn(() => createMockQueryBuilder()),
  auth: {
    getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
    getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
    signUp: jest.fn().mockResolvedValue({ data: {}, error: null }),
    signIn: jest.fn().mockResolvedValue({ data: {}, error: null }),
    signInWithPassword: jest.fn().mockResolvedValue({ data: {}, error: null }),
    signOut: jest.fn().mockResolvedValue({ error: null }),
    onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
    refreshSession: jest.fn().mockResolvedValue({ data: {}, error: null }),
    setSession: jest.fn().mockResolvedValue({ data: {}, error: null })
  },
  storage: {
    from: jest.fn(() => ({
      upload: jest.fn().mockResolvedValue({ data: {}, error: null }),
      download: jest.fn().mockResolvedValue({ data: new Blob(), error: null }),
      remove: jest.fn().mockResolvedValue({ data: [], error: null }),
      list: jest.fn().mockResolvedValue({ data: [], error: null }),
      getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'http://test.supabase.co/storage/test' } }))
    }))
  },
  rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
  channel: jest.fn(() => ({
    on: jest.fn().mockReturnThis(),
    subscribe: jest.fn().mockReturnThis(),
    unsubscribe: jest.fn()
  })),
  removeChannel: jest.fn(),
  removeAllChannels: jest.fn()
};

jest.mock('../../src/database/supabase.js', () => ({
  initializeSupabase: jest.fn(() => mockSupabaseClient),
  getSupabase: jest.fn(() => mockSupabaseClient),
  default: {
    initializeSupabase: jest.fn(() => mockSupabaseClient),
    getSupabase: jest.fn(() => mockSupabaseClient)
  }
}));

// Also mock @supabase/supabase-js in case it's imported directly
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabaseClient)
}));

// ============================================================================
// 5. MOCK ../src/database/queries.js - Jest.fn() implementations
// ============================================================================
const mockUserQueries = {
  create: jest.fn().mockResolvedValue({ success: true, user: { id: 'test-user-id', email: 'test@example.com' } }),
  getByEmail: jest.fn().mockResolvedValue({ success: true, user: null }),
  update: jest.fn().mockResolvedValue({ success: true, user: { id: 'test-user-id' } })
};

const mockSessionQueries = {
  create: jest.fn().mockResolvedValue({ success: true, session: { id: 'test-session-id', user_id: 'test-user-id' } }),
  getById: jest.fn().mockResolvedValue({ success: true, session: { id: 'test-session-id' } })
};

const mockConversationQueries = {
  create: jest.fn().mockResolvedValue({ success: true, message: { id: 'test-msg-id', role: 'user', content: 'test' } }),
  getHistory: jest.fn().mockResolvedValue({ success: true, messages: [] })
};

const mockMemoryQueries = {
  set: jest.fn().mockResolvedValue({ success: true, memory: {} }),
  get: jest.fn().mockResolvedValue({ success: true, value: null }),
  getAll: jest.fn().mockResolvedValue({ success: true, memory: {} }),
  getMultiple: jest.fn().mockResolvedValue({ success: true, values: {} }),
  setMultiple: jest.fn().mockResolvedValue({ success: true })
};

const mockBatchQueries = {
  getSessionContext: jest.fn().mockResolvedValue({
    success: true,
    context: { session: null, history: [], memory: {} }
  }),
  storeMessageWithMemory: jest.fn().mockResolvedValue({ success: true, message: {} })
};

jest.mock('../../src/database/queries.js', () => ({
  userQueries: mockUserQueries,
  sessionQueries: mockSessionQueries,
  conversationQueries: mockConversationQueries,
  memoryQueries: mockMemoryQueries,
  batchQueries: mockBatchQueries,
  default: {
    userQueries: mockUserQueries,
    sessionQueries: mockSessionQueries,
    conversationQueries: mockConversationQueries,
    memoryQueries: mockMemoryQueries,
    batchQueries: mockBatchQueries
  }
}));

// ============================================================================
// 6. MOCK ../src/services/openai.js
// ============================================================================
const mockOpenAIClient = {
  chat: {
    completions: {
      create: jest.fn().mockResolvedValue({
        choices: [{ message: { content: 'Test AI response', role: 'assistant' } }],
        usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 }
      })
    }
  },
  models: {
    list: jest.fn().mockResolvedValue({ data: [] })
  }
};

jest.mock('../../src/services/openai.js', () => ({
  initializeOpenAI: jest.fn(() => mockOpenAIClient),
  getOpenAI: jest.fn(() => mockOpenAIClient),
  sendMessage: jest.fn().mockResolvedValue({
    success: true,
    response: {
      choices: [{ message: { content: 'Test AI response', role: 'assistant' } }]
    }
  }),
  streamMessage: jest.fn().mockImplementation(async (messages, systemPrompt, onChunk) => {
    const testResponse = 'Test streaming response';
    if (onChunk) {
      for (const char of testResponse) {
        await onChunk(char);
      }
    }
    return { success: true, text: testResponse };
  }),
  default: {
    initializeOpenAI: jest.fn(() => mockOpenAIClient),
    getOpenAI: jest.fn(() => mockOpenAIClient),
    sendMessage: jest.fn().mockResolvedValue({
      success: true,
      response: {
        choices: [{ message: { content: 'Test AI response', role: 'assistant' } }]
      }
    }),
    streamMessage: jest.fn().mockResolvedValue({ success: true, text: 'Test streaming response' })
  }
}));

// Also mock openai package directly
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => mockOpenAIClient);
});

// ============================================================================
// 7. MOCK ../src/services/whatsapp.js (if exists)
// ============================================================================
jest.mock('../../src/services/whatsapp.js', () => ({
  initializeWhatsApp: jest.fn().mockResolvedValue({}),
  sendWhatsAppMessage: jest.fn().mockResolvedValue({ success: true }),
  getWhatsAppClient: jest.fn(() => ({})),
  default: {
    initializeWhatsApp: jest.fn().mockResolvedValue({}),
    sendWhatsAppMessage: jest.fn().mockResolvedValue({ success: true }),
    getWhatsAppClient: jest.fn(() => ({}))
  }
}), { virtual: true });

// ============================================================================
// 8. MOCK ../src/services/chat.js (if exists)
// ============================================================================
jest.mock('../../src/services/chat.js', () => ({
  handleChatMessage: jest.fn().mockResolvedValue({ success: true, response: 'Test response' }),
  processMessage: jest.fn().mockResolvedValue({ success: true, response: 'Test response' }),
  default: {
    handleChatMessage: jest.fn().mockResolvedValue({ success: true, response: 'Test response' }),
    processMessage: jest.fn().mockResolvedValue({ success: true, response: 'Test response' })
  }
}), { virtual: true });

// ============================================================================
// 9. MOCK winston to prevent file system access
// ============================================================================
jest.mock('winston', () => {
  const mockFormat = {
    combine: jest.fn(() => ({})),
    timestamp: jest.fn(() => ({})),
    printf: jest.fn(() => ({})),
    colorize: jest.fn(() => ({})),
    errors: jest.fn(() => ({})),
    json: jest.fn(() => ({})),
    simple: jest.fn(() => ({}))
  };

  const mockTransport = jest.fn();

  return {
    createLogger: jest.fn(() => mockLogger),
    format: mockFormat,
    transports: {
      Console: mockTransport,
      File: mockTransport,
      Stream: mockTransport
    }
  };
});

// ============================================================================
// 10. MOCK dotenv to prevent .env loading
// ============================================================================
jest.mock('dotenv', () => ({
  config: jest.fn()
}));

// ============================================================================
// EXPORTED TEST HELPERS
// ============================================================================

/**
 * Reset all mocks to initial state
 */
export const resetAllMocks = () => {
  jest.clearAllMocks();
};

/**
 * Get the mock Supabase client for test assertions
 */
export const getMockSupabase = () => mockSupabaseClient;

/**
 * Get the mock logger for test assertions
 */
export const getMockLogger = () => mockLogger;

/**
 * Get all query mocks for test assertions
 */
export const getMockQueries = () => ({
  userQueries: mockUserQueries,
  sessionQueries: mockSessionQueries,
  conversationQueries: mockConversationQueries,
  memoryQueries: mockMemoryQueries,
  batchQueries: mockBatchQueries
});

/**
 * Get the mock OpenAI client for test assertions
 */
export const getMockOpenAI = () => mockOpenAIClient;

/**
 * Create a mock query builder with custom responses
 */
export const createMockQueryBuilderWithData = (data, error = null) => {
  const builder = createMockQueryBuilder();
  builder.single = jest.fn().mockResolvedValue({ data, error });
  builder.then = jest.fn((resolve) => resolve({ data: Array.isArray(data) ? data : [data], error }));
  return builder;
};

/**
 * Configure mock Supabase to return specific data for a table
 */
export const configureMockSupabaseTable = (tableName, data, error = null) => {
  const builder = createMockQueryBuilderWithData(data, error);
  mockSupabaseClient.from.mockImplementation((table) => {
    if (table === tableName) {
      return builder;
    }
    return createMockQueryBuilder();
  });
  return builder;
};

/**
 * Configure mock user queries response
 */
export const configureMockUserQueries = (overrides = {}) => {
  Object.entries(overrides).forEach(([method, response]) => {
    if (mockUserQueries[method]) {
      mockUserQueries[method].mockResolvedValue(response);
    }
  });
};

/**
 * Configure mock session queries response
 */
export const configureMockSessionQueries = (overrides = {}) => {
  Object.entries(overrides).forEach(([method, response]) => {
    if (mockSessionQueries[method]) {
      mockSessionQueries[method].mockResolvedValue(response);
    }
  });
};

/**
 * Configure mock conversation queries response
 */
export const configureMockConversationQueries = (overrides = {}) => {
  Object.entries(overrides).forEach(([method, response]) => {
    if (mockConversationQueries[method]) {
      mockConversationQueries[method].mockResolvedValue(response);
    }
  });
};

/**
 * Configure mock memory queries response
 */
export const configureMockMemoryQueries = (overrides = {}) => {
  Object.entries(overrides).forEach(([method, response]) => {
    if (mockMemoryQueries[method]) {
      mockMemoryQueries[method].mockResolvedValue(response);
    }
  });
};

/**
 * Configure mock OpenAI response
 */
export const configureMockOpenAIResponse = (content, options = {}) => {
  const response = {
    choices: [{
      message: { content, role: 'assistant' },
      ...options.choiceOverrides
    }],
    usage: options.usage || { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 }
  };
  mockOpenAIClient.chat.completions.create.mockResolvedValue(response);
  return response;
};

/**
 * Configure mock OpenAI to throw an error
 */
export const configureMockOpenAIError = (errorMessage) => {
  mockOpenAIClient.chat.completions.create.mockRejectedValue(new Error(errorMessage));
};

/**
 * Create test user data
 */
export const createTestUser = (overrides = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  phone: null,
  created_at: new Date().toISOString(),
  updated_at: null,
  ...overrides
});

/**
 * Create test session data
 */
export const createTestSession = (overrides = {}) => ({
  id: 'test-session-id',
  user_id: 'test-user-id',
  metadata: {},
  created_at: new Date().toISOString(),
  ...overrides
});

/**
 * Create test conversation message
 */
export const createTestMessage = (overrides = {}) => ({
  id: 'test-message-id',
  session_id: 'test-session-id',
  role: 'user',
  content: 'Test message content',
  metadata: {},
  created_at: new Date().toISOString(),
  ...overrides
});

/**
 * Create test memory entry
 */
export const createTestMemory = (overrides = {}) => ({
  session_id: 'test-session-id',
  key: 'test-key',
  value: 'test-value',
  updated_at: new Date().toISOString(),
  ...overrides
});

// ============================================================================
// GLOBAL TEST SETUP
// ============================================================================

// Increase timeout for async tests
jest.setTimeout(10000);

// Clear all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});

// Console override to suppress noise during tests (optional)
// Uncomment if you want completely silent tests
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
//   error: jest.fn()
// };

export default {
  resetAllMocks,
  getMockSupabase,
  getMockLogger,
  getMockQueries,
  getMockOpenAI,
  createMockQueryBuilderWithData,
  configureMockSupabaseTable,
  configureMockUserQueries,
  configureMockSessionQueries,
  configureMockConversationQueries,
  configureMockMemoryQueries,
  configureMockOpenAIResponse,
  configureMockOpenAIError,
  createTestUser,
  createTestSession,
  createTestMessage,
  createTestMemory
};
