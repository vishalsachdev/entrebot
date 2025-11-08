# Quick Start Guide - API Route Tests

## 🚀 Get Started in 3 Steps

### 1. Install Dependencies

```bash
cd /home/user/entrebot/tests
npm install
```

This will install:
- jest (test runner)
- supertest (HTTP testing)
- babel-jest (ESM transformation)
- @babel/core & @babel/preset-env (transpilation)

### 2. Run Tests

```bash
# Run all tests
npm test

# Run specific test file
npm run test:users
npm run test:sessions
npm run test:conversations
npm run test:memory

# Run with coverage report
npm run test:coverage
```

### 3. View Results

Tests will output results like:
```
PASS  routes/users.test.js (5.234s)
PASS  routes/sessions.test.js (4.821s)
PASS  routes/conversations.test.js (5.103s)
PASS  routes/memory.test.js (5.672s)

Test Suites: 4 passed, 4 total
Tests:       116 passed, 116 total
Snapshots:   0 total
Time:        20.83s
```

## 📁 File Structure

```
tests/
├── routes/                      # Test files
│   ├── users.test.js           # User API tests (479 lines)
│   ├── sessions.test.js        # Session API tests (505 lines)
│   ├── conversations.test.js   # Conversation API tests (612 lines)
│   ├── memory.test.js          # Memory API tests (694 lines)
│   ├── README.md               # Detailed documentation
│   ├── .babelrc                # Babel config for ESM
│   └── .gitignore              # Git ignore patterns
├── setup/                       # Test utilities
│   ├── testHelpers.js          # Mock factories & helpers
│   └── jest.setup.js           # Global test setup
├── jest.config.routes.js        # Jest configuration
├── package.json                 # Dependencies & scripts
├── TEST_SUMMARY.md             # Comprehensive summary
└── QUICKSTART.md               # This file
```

## 🧪 What's Tested

### Users API (`users.test.js`)
- ✅ Create user (POST /api/users)
- ✅ Get user by email (GET /api/users/:email)
- ✅ Update user (PUT /api/users/:id)
- ✅ Validation, errors, edge cases

### Sessions API (`sessions.test.js`)
- ✅ Create session (POST /api/sessions)
- ✅ Get session (GET /api/sessions/:id)
- ✅ List user sessions (GET /api/users/:userId/sessions)
- ✅ Pagination, metadata handling

### Conversations API (`conversations.test.js`)
- ✅ Add message (POST /api/conversations)
- ✅ Get history (GET /api/conversations/:sessionId)
- ✅ Get summary (GET /api/conversations/:sessionId/summary)
- ✅ Role validation, pagination

### Memory API (`memory.test.js`)
- ✅ Store key-value (POST /api/memory)
- ✅ Get value (GET /api/memory/:sessionId/:key)
- ✅ Get all memory (GET /api/memory/:sessionId)
- ✅ Delete key (DELETE /api/memory/:sessionId/:key)
- ✅ Upsert behavior, all data types

## 📊 Coverage Reports

After running `npm run test:coverage`, view reports at:
- Terminal output: Summary statistics
- `coverage/lcov-report/index.html`: Interactive HTML report
- `coverage/lcov.info`: LCOV format for CI tools

## 🔧 Common Commands

```bash
# Development mode (auto-rerun on changes)
npm run test:watch

# Verbose output (see all test names)
npm run test:verbose

# CI mode (coverage + optimized for pipelines)
npm run test:ci

# Run single test by name
npm test -- -t "should create user"

# Debug a specific test file
node --inspect-brk node_modules/.bin/jest routes/users.test.js
```

## 🎯 Expected Coverage

All tests are configured to meet:
- Statements: >80%
- Branches: >80%
- Functions: >80%
- Lines: >80%

Current estimated coverage: **~85%** across all metrics

## ⚡ Quick Examples

### Run Just User Tests
```bash
npm run test:users
```

### Run with Coverage for Sessions
```bash
npm test -- routes/sessions.test.js --coverage
```

### Watch Mode for Development
```bash
npm run test:watch
# Press 'a' to run all tests
# Press 'p' to filter by filename
# Press 'q' to quit
```

## 🐛 Troubleshooting

### Tests won't run?
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### ESM import errors?
- Check `.babelrc` exists in `routes/` directory
- Verify `transform` setting in `jest.config.routes.js`

### Tests timing out?
- Increase timeout in `jest.config.routes.js`
- Check for unresolved promises in tests

### Coverage not generating?
```bash
# Ensure coverage directory has write permissions
chmod -R 755 coverage/
```

## 📝 Writing New Tests

Use the test helpers for consistency:

```javascript
const {
  createMockUser,
  expectSuccessResponse
} = require('../setup/testHelpers');

it('should create user', async () => {
  const mockUser = createMockUser({
    email: 'test@example.com'
  });

  userQueries.create.mockResolvedValue({
    success: true,
    user: mockUser
  });

  const response = await request(app)
    .post('/api/users')
    .send({ email: 'test@example.com' });

  expectSuccessResponse(response, 201);
  expect(response.body.user).toEqual(mockUser);
});
```

## 🎓 Next Steps

1. **Run the tests**: `npm test`
2. **Check coverage**: `npm run test:coverage`
3. **Read detailed docs**: See `routes/README.md`
4. **Add new tests**: Follow existing patterns
5. **Integrate with CI**: Use `npm run test:ci`

## 📚 Additional Resources

- **Detailed Documentation**: `/tests/routes/README.md`
- **Test Summary**: `/tests/TEST_SUMMARY.md`
- **Jest Docs**: https://jestjs.io/
- **Supertest Docs**: https://github.com/visionmedia/supertest

## ✅ Verification Checklist

After installation, verify everything works:

- [ ] Dependencies installed (`node_modules/` exists)
- [ ] All 4 test files run successfully
- [ ] Coverage reports generate
- [ ] Watch mode works
- [ ] Individual test suites run

Run this to verify:
```bash
npm test && npm run test:coverage
```

If all tests pass and coverage generates, you're ready to go! 🎉

## 💡 Pro Tips

1. **Use watch mode during development** for instant feedback
2. **Run individual suites** to focus on specific areas
3. **Check coverage reports** to find untested code paths
4. **Use verbose mode** to see detailed test output
5. **Keep tests fast** by avoiding real I/O operations

## 🚀 For Production

Before deploying:
```bash
# Run full test suite with coverage
npm run test:coverage

# Verify all tests pass
npm run test:ci

# Check coverage thresholds are met
open coverage/lcov-report/index.html
```

---

**Questions?** Check `/tests/routes/README.md` for detailed documentation.

**Ready to go!** 🎉
