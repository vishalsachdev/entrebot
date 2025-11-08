# API Route Tests

Comprehensive test suite for the 4-table Supabase implementation covering all API endpoints.

## Test Files

1. **users.test.js** - User management endpoints
   - POST /api/users (create user)
   - GET /api/users/:email (get by email)
   - PUT /api/users/:id (update user)
   - Validation and error handling

2. **sessions.test.js** - Session management endpoints
   - POST /api/sessions (create session)
   - GET /api/sessions/:id (get session)
   - GET /api/users/:userId/sessions (list user sessions)
   - Pagination and limits

3. **conversations.test.js** - Conversation/message endpoints
   - POST /api/conversations (add message)
   - GET /api/conversations/:sessionId (get history)
   - GET /api/conversations/:sessionId/summary (get summary)
   - Role validation and pagination

4. **memory.test.js** - Memory persistence endpoints
   - POST /api/memory (store key-value)
   - GET /api/memory/:sessionId/:key (get specific key)
   - GET /api/memory/:sessionId (get all memory)
   - DELETE /api/memory/:sessionId/:key (delete key)
   - Upsert behavior

## Installation

```bash
cd tests
npm install
```

## Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm run test:users
npm run test:sessions
npm run test:conversations
npm run test:memory

# Watch mode for development
npm run test:watch

# CI mode
npm run test:ci

# Verbose output
npm run test:verbose
```

## Test Coverage

Each test suite includes:

### ✅ Happy Path Tests
- Valid data creation
- Successful retrieval
- Proper updates
- Correct responses

### ✅ Validation Tests
- Required field validation
- Data type validation
- Format validation
- Business logic validation

### ✅ Error Handling
- Missing required fields
- Invalid data types
- Database errors
- Non-existent resources

### ✅ Edge Cases
- Empty/null values
- Very long strings
- Special characters
- Unicode and emoji
- SQL injection attempts
- XSS attempts

### ✅ Security Tests
- Authentication requirements
- Input sanitization
- Malicious input handling

### ✅ Performance Tests
- Concurrent requests
- Large data sets
- Pagination efficiency
- Response times

### ✅ Boundary Tests
- Minimum/maximum values
- Limit boundaries
- Empty results
- Large payloads

## Test Structure

Each test file follows this structure:

```javascript
describe('Route Name', () => {
  beforeAll(() => {
    // Setup express app and routes
  });

  beforeEach(() => {
    // Clear mocks
  });

  describe('Endpoint Name', () => {
    it('should handle success case', async () => {
      // Arrange
      // Act
      // Assert
    });

    it('should handle error case', async () => {
      // Arrange
      // Act
      // Assert
    });
  });
});
```

## Mocking Strategy

All tests use mocked dependencies:

- **Supabase client** - Mocked to avoid real database calls
- **Database queries** - Mocked at the query layer
- **Logger** - Mocked to reduce test output noise
- **Authentication** - Mocked to focus on route logic

## Coverage Goals

- **Statements**: >80%
- **Branches**: >80%
- **Functions**: >80%
- **Lines**: >80%

## Test Helpers

Shared utilities in `setup/testHelpers.js`:

- `createMockUser()` - Generate mock user data
- `createMockSession()` - Generate mock session data
- `createMockMessage()` - Generate mock message data
- `createMockMemory()` - Generate mock memory data
- `createMockSupabaseClient()` - Create mock Supabase client
- `createBulkMessages()` - Generate multiple messages
- `createBulkSessions()` - Generate multiple sessions
- `expectSuccessResponse()` - Validate success responses
- `expectErrorResponse()` - Validate error responses

## Example Usage

```javascript
const { createMockUser, expectSuccessResponse } = require('../setup/testHelpers');

it('should create user', async () => {
  const mockUser = createMockUser({ email: 'test@example.com' });
  userQueries.create.mockResolvedValue({ success: true, user: mockUser });

  const response = await request(app)
    .post('/api/users')
    .send({ email: 'test@example.com' });

  expectSuccessResponse(response, 201);
  expect(response.body.user).toEqual(mockUser);
});
```

## Continuous Integration

For CI/CD pipelines:

```yaml
# .github/workflows/test.yml
- name: Run API Route Tests
  run: |
    cd tests
    npm install
    npm run test:ci
```

## Debugging Tests

```bash
# Run single test
npm test -- -t "should create user"

# Debug with Node inspector
node --inspect-brk node_modules/.bin/jest routes/users.test.js
```

## Best Practices

1. **Isolation** - Each test is independent
2. **Clarity** - Test names describe what they test
3. **Arrange-Act-Assert** - Clear test structure
4. **Mock at boundaries** - Mock external dependencies
5. **Test behavior, not implementation** - Focus on outcomes
6. **Fast execution** - Tests run quickly without real I/O
7. **Comprehensive coverage** - Test success, failure, and edge cases

## Troubleshooting

### Tests fail with "Cannot use import statement"
- Check that babel-jest is configured correctly
- Verify `transform` settings in jest.config.js

### Mock not working
- Ensure mock is defined before importing the module
- Use `jest.clearAllMocks()` in `beforeEach()`

### Timeout errors
- Increase timeout in jest.config.js or individual test
- Check for unresolved promises

## Contributing

When adding new endpoints:

1. Create test file in `tests/routes/`
2. Follow existing test structure
3. Include all test categories (happy path, validation, errors, edge cases)
4. Aim for >80% coverage
5. Update this README

## Related Documentation

- [Jest Documentation](https://jestjs.io/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Supabase Documentation](https://supabase.com/docs)
