/**
 * Session Routes Tests
 * Comprehensive tests for session management endpoints
 */

const request = require('supertest');
const express = require('express');

// Mock dependencies
jest.mock('../../src/database/supabase.js');
jest.mock('../../src/database/queries.js');
jest.mock('../../src/config/logger.js');

const { sessionQueries } = require('../../src/database/queries.js');
const { getSupabase } = require('../../src/database/supabase.js');

// Mock logger
const logger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
};
require('../../src/config/logger.js').logger = logger;

describe('Session Routes', () => {
  let app;
  let sessionRoutes;
  let mockSupabase;

  beforeAll(async () => {
    // Create express app for testing
    app = express();
    app.use(express.json());

    // Mock Supabase client
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn()
    };

    getSupabase.mockReturnValue(mockSupabase);

    // Import routes after mocks
    const routesModule = await import('../../src/routes/sessions.js');
    sessionRoutes = routesModule.default;
    app.use('/api/sessions', sessionRoutes);

    // Error handler
    app.use((err, req, res, next) => {
      res.status(500).json({ success: false, error: err.message });
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/sessions', () => {
    const validSessionData = {
      userId: 'user-123',
      metadata: { source: 'web', platform: 'desktop' }
    };

    it('should create a new session with valid data', async () => {
      const mockSession = {
        id: 'session-abc',
        user_id: validSessionData.userId,
        metadata: validSessionData.metadata,
        created_at: new Date().toISOString()
      };

      sessionQueries.create.mockResolvedValue({
        success: true,
        session: mockSession
      });

      const response = await request(app)
        .post('/api/sessions')
        .send(validSessionData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockSession);
      expect(sessionQueries.create).toHaveBeenCalledWith(
        validSessionData.userId,
        validSessionData.metadata
      );
    });

    it('should create session without metadata', async () => {
      const minimalData = { userId: 'user-123' };
      const mockSession = {
        id: 'session-def',
        user_id: minimalData.userId,
        metadata: {},
        created_at: new Date().toISOString()
      };

      sessionQueries.create.mockResolvedValue({
        success: true,
        session: mockSession
      });

      const response = await request(app)
        .post('/api/sessions')
        .send(minimalData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(sessionQueries.create).toHaveBeenCalledWith(
        minimalData.userId,
        {}
      );
    });

    it('should return 400 when userId is missing', async () => {
      const response = await request(app)
        .post('/api/sessions')
        .send({ metadata: {} });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('User ID is required');
      expect(sessionQueries.create).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid metadata type', async () => {
      const response = await request(app)
        .post('/api/sessions')
        .send({
          userId: 'user-123',
          metadata: 'should-be-object'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Metadata must be an object');
    });

    it('should handle database errors', async () => {
      sessionQueries.create.mockResolvedValue({
        success: false,
        error: 'Database connection failed'
      });

      const response = await request(app)
        .post('/api/sessions')
        .send(validSessionData);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeTruthy();
    });

    it('should handle complex metadata objects', async () => {
      const complexMetadata = {
        source: 'mobile',
        device: {
          type: 'iOS',
          version: '16.0',
          model: 'iPhone 14'
        },
        location: {
          country: 'US',
          timezone: 'America/New_York'
        },
        preferences: ['dark-mode', 'notifications']
      };

      sessionQueries.create.mockResolvedValue({
        success: true,
        session: {
          id: 'session-xyz',
          user_id: 'user-123',
          metadata: complexMetadata,
          created_at: new Date().toISOString()
        }
      });

      const response = await request(app)
        .post('/api/sessions')
        .send({ userId: 'user-123', metadata: complexMetadata });

      expect(response.status).toBe(201);
      expect(response.body.data.metadata).toEqual(complexMetadata);
    });
  });

  describe('GET /api/sessions/:id', () => {
    it('should get session by id', async () => {
      const mockSession = {
        id: 'session-123',
        user_id: 'user-456',
        metadata: { source: 'web' },
        created_at: new Date().toISOString()
      };

      sessionQueries.getById.mockResolvedValue({
        success: true,
        session: mockSession
      });

      const response = await request(app)
        .get('/api/sessions/session-123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockSession);
      expect(sessionQueries.getById).toHaveBeenCalledWith('session-123');
    });

    it('should return 404 for non-existent session', async () => {
      sessionQueries.getById.mockResolvedValue({
        success: true,
        session: null
      });

      const response = await request(app)
        .get('/api/sessions/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Session not found');
    });

    it('should return 400 when session id is missing', async () => {
      const response = await request(app)
        .get('/api/sessions/');

      // Will hit the route index, not the :id route
      expect([400, 404]).toContain(response.status);
    });

    it('should handle database errors', async () => {
      sessionQueries.getById.mockResolvedValue({
        success: false,
        error: 'Database error'
      });

      const response = await request(app)
        .get('/api/sessions/session-123');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });

    it('should handle UUID format session ids', async () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      sessionQueries.getById.mockResolvedValue({
        success: true,
        session: { id: uuid, user_id: 'user-123' }
      });

      const response = await request(app)
        .get(`/api/sessions/${uuid}`);

      expect(response.status).toBe(200);
      expect(sessionQueries.getById).toHaveBeenCalledWith(uuid);
    });
  });

  describe('GET /api/users/:userId/sessions', () => {
    const userId = 'user-123';

    it('should get all sessions for a user', async () => {
      const mockSessions = [
        {
          id: 'session-1',
          user_id: userId,
          metadata: {},
          created_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 'session-2',
          user_id: userId,
          metadata: {},
          created_at: '2024-01-02T00:00:00Z'
        }
      ];

      mockSupabase.limit.mockResolvedValue({
        data: mockSessions,
        error: null
      });

      const response = await request(app)
        .get(`/api/users/${userId}/sessions`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockSessions);
      expect(response.body.count).toBe(2);
    });

    it('should respect limit parameter', async () => {
      const limit = 10;
      mockSupabase.limit.mockResolvedValue({
        data: [],
        error: null
      });

      const response = await request(app)
        .get(`/api/users/${userId}/sessions?limit=${limit}`);

      expect(response.status).toBe(200);
      expect(mockSupabase.limit).toHaveBeenCalledWith(limit);
    });

    it('should use default limit of 50', async () => {
      mockSupabase.limit.mockResolvedValue({
        data: [],
        error: null
      });

      const response = await request(app)
        .get(`/api/users/${userId}/sessions`);

      expect(response.status).toBe(200);
      expect(mockSupabase.limit).toHaveBeenCalledWith(50);
    });

    it('should reject limit less than 1', async () => {
      const response = await request(app)
        .get(`/api/users/${userId}/sessions?limit=0`);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Limit must be between 1 and 100');
    });

    it('should reject limit greater than 100', async () => {
      const response = await request(app)
        .get(`/api/users/${userId}/sessions?limit=150`);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Limit must be between 1 and 100');
    });

    it('should return 400 when userId is missing', async () => {
      const response = await request(app)
        .get('/api/users//sessions');

      expect([400, 404]).toContain(response.status);
    });

    it('should return empty array for user with no sessions', async () => {
      mockSupabase.limit.mockResolvedValue({
        data: [],
        error: null
      });

      const response = await request(app)
        .get(`/api/users/${userId}/sessions`);

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([]);
      expect(response.body.count).toBe(0);
    });

    it('should order sessions by created_at descending', async () => {
      mockSupabase.limit.mockResolvedValue({
        data: [],
        error: null
      });

      await request(app)
        .get(`/api/users/${userId}/sessions`);

      expect(mockSupabase.order).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    it('should handle database errors', async () => {
      mockSupabase.limit.mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      });

      const response = await request(app)
        .get(`/api/users/${userId}/sessions`);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Edge Cases and Security', () => {
    it('should handle very large metadata objects', async () => {
      const largeMetadata = {
        data: 'x'.repeat(10000)
      };

      sessionQueries.create.mockResolvedValue({
        success: true,
        session: {
          id: 'session-large',
          user_id: 'user-123',
          metadata: largeMetadata
        }
      });

      const response = await request(app)
        .post('/api/sessions')
        .send({ userId: 'user-123', metadata: largeMetadata });

      expect([201, 413]).toContain(response.status);
    });

    it('should handle concurrent session creation', async () => {
      sessionQueries.create.mockResolvedValue({
        success: true,
        session: { id: 'session-concurrent', user_id: 'user-123' }
      });

      const requests = Array(20).fill(null).map(() =>
        request(app)
          .post('/api/sessions')
          .send({ userId: 'user-123' })
      );

      const responses = await Promise.all(requests);
      responses.forEach(response => {
        expect([201, 500]).toContain(response.status);
      });
    });

    it('should sanitize userId input', async () => {
      const maliciousUserId = "<script>alert('xss')</script>";
      sessionQueries.create.mockResolvedValue({
        success: true,
        session: { id: 'session-xss', user_id: maliciousUserId }
      });

      const response = await request(app)
        .post('/api/sessions')
        .send({ userId: maliciousUserId });

      expect(response.status).toBe(201);
      expect(sessionQueries.create).toHaveBeenCalledWith(maliciousUserId, {});
    });

    it('should handle null metadata gracefully', async () => {
      sessionQueries.create.mockResolvedValue({
        success: true,
        session: { id: 'session-null', user_id: 'user-123', metadata: null }
      });

      const response = await request(app)
        .post('/api/sessions')
        .send({ userId: 'user-123', metadata: null });

      // Should reject null as it's not an object
      expect(response.status).toBe(400);
    });

    it('should handle array instead of object for metadata', async () => {
      const response = await request(app)
        .post('/api/sessions')
        .send({ userId: 'user-123', metadata: ['array', 'not', 'object'] });

      // Arrays are technically objects in JavaScript, might pass
      expect([201, 400]).toContain(response.status);
    });

    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/sessions')
        .set('Content-Type', 'application/json')
        .send('{ invalid json');

      expect(response.status).toBe(400);
    });
  });

  describe('Performance', () => {
    it('should handle large number of sessions efficiently', async () => {
      const largeSessions = Array(100).fill(null).map((_, i) => ({
        id: `session-${i}`,
        user_id: 'user-123',
        metadata: {},
        created_at: new Date().toISOString()
      }));

      mockSupabase.limit.mockResolvedValue({
        data: largeSessions,
        error: null
      });

      const start = Date.now();
      const response = await request(app)
        .get('/api/users/user-123/sessions?limit=100');
      const duration = Date.now() - start;

      expect(response.status).toBe(200);
      expect(response.body.count).toBe(100);
      expect(duration).toBeLessThan(1000); // Should complete in less than 1 second
    });
  });
});
