/**
 * Jest Configuration for Route Tests
 */

module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/routes'],
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],
  setupFilesAfterEnv: ['<rootDir>/setup/jest.setup.js'],
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
