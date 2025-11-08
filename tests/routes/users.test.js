/**
 * User Routes Tests
 * Comprehensive tests for user API endpoints
 */

const request = require('supertest');
const express = require('express');

// Mock dependencies
jest.mock('../../src/database/supabase.js');
jest.mock('../../src/database/queries.js');
jest.mock('../../src/middleware/auth.js');
jest.mock('../../src/config/logger.js');

const { userQueries } = require('../../src/database/queries.js');
const { authenticate } = require('../../src/middleware/auth.js');

// Mock logger to prevent console spam
const logger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
};
require('../../src/config/logger.js').logger = logger;

describe('User Routes', () => {
  let app;
  let userRoutes;

  beforeAll(async () => {
    // Create express app for testing
    app = express();
    app.use(express.json());

    // Mock authenticate middleware to pass through
    authenticate.mockImplementation((req, res, next) => {
      req.userId = 'test-user-id';
      next();
    });

    // Import routes after mocks are set up
    const routesModule = await import('../../src/routes/users.js');
    userRoutes = routesModule.default;
    app.use('/api/users', userRoutes);

    // Add error handler
    app.use((err, req, res, next) => {
      res.status(500).json({ success: false, error: err.message });
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/users', () => {
    const validUserData = {
      email: 'test@example.com',
      name: 'Test User',
      phone: '+1234567890'
    };

    it('should create a new user with valid data', async () => {
      const mockUser = {
        id: 'user-123',
        email: validUserData.email,
        name: validUserData.name,
        phone: validUserData.phone,
        created_at: new Date().toISOString()
      };

      userQueries.create.mockResolvedValue({
        success: true,
        user: mockUser
      });

      const response = await request(app)
        .post('/api/users')
        .send(validUserData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.user).toEqual(mockUser);
      expect(userQueries.create).toHaveBeenCalledWith(
        validUserData.email,
        { name: validUserData.name, phone: validUserData.phone }
      );
    });

    it('should create user with only email (optional fields)', async () => {
      const minimalData = { email: 'minimal@example.com' };
      const mockUser = {
        id: 'user-124',
        email: minimalData.email,
        name: null,
        phone: null,
        created_at: new Date().toISOString()
      };

      userQueries.create.mockResolvedValue({
        success: true,
        user: mockUser
      });

      const response = await request(app)
        .post('/api/users')
        .send(minimalData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(userQueries.create).toHaveBeenCalledWith(
        minimalData.email,
        { name: undefined, phone: undefined }
      );
    });

    it('should return 400 when email is missing', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({ name: 'Test User' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(userQueries.create).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid email format', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({ email: 'not-an-email', name: 'Test' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(userQueries.create).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      userQueries.create.mockResolvedValue({
        success: false,
        error: 'Database connection failed'
      });

      const response = await request(app)
        .post('/api/users')
        .send(validUserData);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeTruthy();
    });

    it('should handle duplicate email errors', async () => {
      userQueries.create.mockResolvedValue({
        success: false,
        error: 'User with this email already exists'
      });

      const response = await request(app)
        .post('/api/users')
        .send(validUserData);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('already exists');
    });

    it('should sanitize input data', async () => {
      const dataWithExtraFields = {
        email: 'test@example.com',
        name: 'Test',
        phone: '123',
        malicious: '<script>alert("xss")</script>',
        admin: true
      };

      userQueries.create.mockResolvedValue({
        success: true,
        user: { id: 'user-125', email: dataWithExtraFields.email }
      });

      const response = await request(app)
        .post('/api/users')
        .send(dataWithExtraFields);

      expect(response.status).toBe(201);
      // Should only pass allowed fields
      expect(userQueries.create).toHaveBeenCalledWith(
        dataWithExtraFields.email,
        { name: dataWithExtraFields.name, phone: dataWithExtraFields.phone }
      );
    });
  });

  describe('GET /api/users/:email', () => {
    it('should get user by email', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        phone: '+1234567890',
        created_at: new Date().toISOString()
      };

      userQueries.getByEmail.mockResolvedValue({
        success: true,
        user: mockUser
      });

      const response = await request(app)
        .get('/api/users/test@example.com');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user).toEqual(mockUser);
      expect(userQueries.getByEmail).toHaveBeenCalledWith('test@example.com');
    });

    it('should handle non-existent user', async () => {
      userQueries.getByEmail.mockResolvedValue({
        success: true,
        user: null
      });

      const response = await request(app)
        .get('/api/users/nonexistent@example.com');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user).toBeNull();
    });

    it('should handle database errors', async () => {
      userQueries.getByEmail.mockResolvedValue({
        success: false,
        error: 'Database error'
      });

      const response = await request(app)
        .get('/api/users/test@example.com');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });

    it('should handle special characters in email', async () => {
      const email = 'test+tag@example.com';
      userQueries.getByEmail.mockResolvedValue({
        success: true,
        user: { id: 'user-126', email }
      });

      const response = await request(app)
        .get(`/api/users/${encodeURIComponent(email)}`);

      expect(response.status).toBe(200);
      expect(userQueries.getByEmail).toHaveBeenCalledWith(email);
    });
  });

  describe('PUT /api/users/:userId', () => {
    const userId = 'user-123';
    const updateData = {
      name: 'Updated Name',
      phone: '+9876543210'
    };

    it('should update user profile', async () => {
      const mockUpdatedUser = {
        id: userId,
        email: 'test@example.com',
        name: updateData.name,
        phone: updateData.phone,
        updated_at: new Date().toISOString()
      };

      userQueries.update.mockResolvedValue({
        success: true,
        user: mockUpdatedUser
      });

      const response = await request(app)
        .put(`/api/users/${userId}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user).toEqual(mockUpdatedUser);
      expect(userQueries.update).toHaveBeenCalledWith(userId, updateData);
    });

    it('should update only name', async () => {
      const partialUpdate = { name: 'New Name Only' };
      userQueries.update.mockResolvedValue({
        success: true,
        user: { id: userId, name: partialUpdate.name }
      });

      const response = await request(app)
        .put(`/api/users/${userId}`)
        .send(partialUpdate);

      expect(response.status).toBe(200);
      expect(userQueries.update).toHaveBeenCalledWith(userId, partialUpdate);
    });

    it('should update only phone', async () => {
      const partialUpdate = { phone: '+1111111111' };
      userQueries.update.mockResolvedValue({
        success: true,
        user: { id: userId, phone: partialUpdate.phone }
      });

      const response = await request(app)
        .put(`/api/users/${userId}`)
        .send(partialUpdate);

      expect(response.status).toBe(200);
      expect(userQueries.update).toHaveBeenCalledWith(userId, partialUpdate);
    });

    it('should return 400 for empty update', async () => {
      const response = await request(app)
        .put(`/api/users/${userId}`)
        .send({});

      expect(response.status).toBe(400);
      expect(userQueries.update).not.toHaveBeenCalled();
    });

    it('should handle non-existent user', async () => {
      userQueries.update.mockResolvedValue({
        success: false,
        error: 'User not found'
      });

      const response = await request(app)
        .put(`/api/users/nonexistent-id`)
        .send(updateData);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });

    it('should not allow email update', async () => {
      const invalidUpdate = {
        name: 'Test',
        email: 'newemail@example.com'
      };

      userQueries.update.mockResolvedValue({
        success: true,
        user: { id: userId, name: 'Test' }
      });

      const response = await request(app)
        .put(`/api/users/${userId}`)
        .send(invalidUpdate);

      // Email should be filtered out by validation
      expect(response.status).toBe(200);
      expect(userQueries.update).toHaveBeenCalledWith(
        userId,
        expect.not.objectContaining({ email: expect.anything() })
      );
    });

    it('should handle validation errors', async () => {
      const invalidData = {
        name: 123, // Should be string
        phone: true // Should be string
      };

      const response = await request(app)
        .put(`/api/users/${userId}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(userQueries.update).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases and Security', () => {
    it('should handle very long email addresses', async () => {
      const longEmail = 'a'.repeat(100) + '@example.com';
      userQueries.create.mockResolvedValue({
        success: true,
        user: { id: 'user-127', email: longEmail }
      });

      const response = await request(app)
        .post('/api/users')
        .send({ email: longEmail });

      // Should either accept or reject based on validation rules
      expect([201, 400]).toContain(response.status);
    });

    it('should handle concurrent requests', async () => {
      userQueries.create.mockResolvedValue({
        success: true,
        user: { id: 'user-128', email: 'concurrent@example.com' }
      });

      const requests = Array(10).fill(null).map(() =>
        request(app)
          .post('/api/users')
          .send({ email: 'concurrent@example.com' })
      );

      const responses = await Promise.all(requests);
      responses.forEach(response => {
        expect([201, 500]).toContain(response.status);
      });
    });

    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }');

      expect(response.status).toBe(400);
    });

    it('should handle SQL injection attempts in email', async () => {
      const sqlInjection = "admin@example.com'; DROP TABLE users; --";
      userQueries.getByEmail.mockResolvedValue({
        success: true,
        user: null
      });

      const response = await request(app)
        .get(`/api/users/${encodeURIComponent(sqlInjection)}`);

      expect(response.status).toBe(200);
      expect(userQueries.getByEmail).toHaveBeenCalledWith(sqlInjection);
    });

    it('should handle extremely long names', async () => {
      const longName = 'A'.repeat(1000);
      userQueries.update.mockResolvedValue({
        success: true,
        user: { id: 'user-129', name: longName }
      });

      const response = await request(app)
        .put('/api/users/user-129')
        .send({ name: longName });

      expect([200, 400]).toContain(response.status);
    });
  });

  describe('Authentication', () => {
    it('should require authentication for GET requests', async () => {
      authenticate.mockImplementationOnce((req, res, next) => {
        res.status(401).json({ success: false, error: 'Unauthorized' });
      });

      const response = await request(app)
        .get('/api/users/test@example.com');

      expect(response.status).toBe(401);
    });

    it('should require authentication for PUT requests', async () => {
      authenticate.mockImplementationOnce((req, res, next) => {
        res.status(401).json({ success: false, error: 'Unauthorized' });
      });

      const response = await request(app)
        .put('/api/users/user-123')
        .send({ name: 'Test' });

      expect(response.status).toBe(401);
    });
  });
});
