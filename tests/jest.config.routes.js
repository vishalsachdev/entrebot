/**
 * Jest Configuration for Route Tests
 *
 * Configures Jest to properly mock dependencies and handle ESM modules
 * for testing Express route handlers.
 */

module.exports = {
  // Test environment
  testEnvironment: 'node',

  // Root directory for route tests
  roots: ['<rootDir>/routes'],

  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],

  // Setup file for global mocks and configuration
  setupFilesAfterEnv: ['<rootDir>/setup/jest.setup.js'],

  // Coverage configuration
  collectCoverageFrom: [
    '../src/routes/**/*.js',
    '!../src/routes/index.js'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  coverageReporters: ['text', 'lcov', 'html'],

  // Output configuration
  verbose: true,
  testTimeout: 10000,

  // Mock configuration - reset state between tests
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,

  // Transform ESM to CommonJS for testing
  // This ensures dynamic imports and ESM modules work correctly
  transform: {
    '^.+\\.js$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', {
          targets: { node: 'current' },
          modules: 'commonjs'
        }]
      ]
    }]
  },

  // Allow transforming specific node_modules that use ESM
  transformIgnorePatterns: [
    'node_modules/(?!(supertest|@supabase)/)'
  ],

  // Handle .js extension in imports (ESM compatibility)
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },

  // Module file extensions to consider
  moduleFileExtensions: ['js', 'json', 'node'],

  // Automock configuration - don't automock by default
  automock: false,

  // Force exit after tests complete (useful for route tests with connections)
  forceExit: true,

  // Detect open handles that may prevent Jest from exiting
  detectOpenHandles: true
};
