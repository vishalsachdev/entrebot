/**
 * Jest Configuration for Unit Tests
 */

module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/unit'],
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],
  setupFilesAfterEnv: ['<rootDir>/setup/jest.setup.js'],
  collectCoverageFrom: [
    '../src/orchestrator/**/*.js',
    '../src/agents/**/*.js',
    '!../src/**/*.d.ts',
    '!../src/**/*.spec.js',
    '!../src/**/*.test.js',
    '!**/node_modules/**'
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
  verbose: true,
  testTimeout: 10000,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  // Transform ESM to CommonJS for testing
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
  transformIgnorePatterns: [
    'node_modules/(?!(supertest|@supabase)/)'
  ],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  }
};
