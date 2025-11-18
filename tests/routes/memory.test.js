/**
 * Memory Routes Tests
 * Comprehensive tests for memory persistence endpoints
 */

const request = require('supertest');
const express = require('express');

// Mock dependencies
jest.mock('../../src/database/supabase.js');
jest.mock('../../src/database/queries.js');
jest.mock('../../src/config/logger.js');

const { memoryQueries } = require('../../src/database/queries.js');
const { getSupabase } = require('../../src/database/supabase.js');

// Mock logger
const logger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
};
require('../../src/config/logger.js').logger = logger;

describe('Memory Routes', () => {
  let app;
  let memoryRoutes;
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
      upsert: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn()
    };

    getSupabase.mockReturnValue(mockSupabase);

    // Import routes after mocks
    const routesModule = await import('../../src/routes/memory.js');
    memoryRoutes = routesModule.default;
    app.use('/api/memory', memoryRoutes);

    // Error handler
    app.use((err, req, res, next) => {
      res.status(500).json({ success: false, error: err.message });
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/memory', () => {
    const validMemoryData = {
      sessionId: 'session-123',
      key: 'user_preferences',
      value: { theme: 'dark', language: 'en' }
    };

    it('should store memory with valid data', async () => {
      const mockMemory = {
        session_id: validMemoryData.sessionId,
        key: validMemoryData.key,
        value: JSON.stringify(validMemoryData.value),
        updated_at: new Date().toISOString()
      };

      memoryQueries.set.mockResolvedValue({
        success: true,
        memory: mockMemory
      });

      const response = await request(app)
        .post('/api/memory')
        .send(validMemoryData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.sessionId).toBe(validMemoryData.sessionId);
      expect(response.body.data.key).toBe(validMemoryData.key);
      expect(response.body.data.stored).toBe(true);
      expect(memoryQueries.set).toHaveBeenCalledWith(
        validMemoryData.sessionId,
        validMemoryData.key,
        validMemoryData.value
      );
    });

    it('should store string values', async () => {
      const stringData = {
        sessionId: 'session-123',
        key: 'username',
        value: 'johndoe'
      };

      memoryQueries.set.mockResolvedValue({
        success: true,
        memory: {}
      });

      const response = await request(app)
        .post('/api/memory')
        .send(stringData);

      expect(response.status).toBe(201);
      expect(memoryQueries.set).toHaveBeenCalledWith(
        stringData.sessionId,
        stringData.key,
        stringData.value
      );
    });

    it('should store number values', async () => {
      const numberData = {
        sessionId: 'session-123',
        key: 'score',
        value: 42
      };

      memoryQueries.set.mockResolvedValue({
        success: true,
        memory: {}
      });

      const response = await request(app)
        .post('/api/memory')
        .send(numberData);

      expect(response.status).toBe(201);
      expect(memoryQueries.set).toHaveBeenCalledWith(
        numberData.sessionId,
        numberData.key,
        numberData.value
      );
    });

    it('should store boolean values', async () => {
      const boolData = {
        sessionId: 'session-123',
        key: 'is_active',
        value: true
      };

      memoryQueries.set.mockResolvedValue({
        success: true,
        memory: {}
      });

      const response = await request(app)
        .post('/api/memory')
        .send(boolData);

      expect(response.status).toBe(201);
    });

    it('should store array values', async () => {
      const arrayData = {
        sessionId: 'session-123',
        key: 'tags',
        value: ['tech', 'startup', 'ai']
      };

      memoryQueries.set.mockResolvedValue({
        success: true,
        memory: {}
      });

      const response = await request(app)
        .post('/api/memory')
        .send(arrayData);

      expect(response.status).toBe(201);
    });

    it('should return 400 when sessionId is missing', async () => {
      const response = await request(app)
        .post('/api/memory')
        .send({ key: 'test', value: 'value' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Session ID is required');
      expect(memoryQueries.set).not.toHaveBeenCalled();
    });

    it('should return 400 when key is missing', async () => {
      const response = await request(app)
        .post('/api/memory')
        .send({ sessionId: 'session-123', value: 'value' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Memory key is required');
    });

    it('should return 400 when value is missing', async () => {
      const response = await request(app)
        .post('/api/memory')
        .send({ sessionId: 'session-123', key: 'test' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Memory value is required');
    });

    it('should return 400 when value is null', async () => {
      const response = await request(app)
        .post('/api/memory')
        .send({ sessionId: 'session-123', key: 'test', value: null });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Memory value is required');
    });

    it('should return 400 when key is not a string', async () => {
      const response = await request(app)
        .post('/api/memory')
        .send({ sessionId: 'session-123', key: 123, value: 'test' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Memory key must be a string');
    });

    it('should validate key format (alphanumeric, dots, underscores, hyphens)', async () => {
      const validKeys = [
        'simple',
        'with_underscore',
        'with-hyphen',
        'with.dot',
        'mixed_key-name.123'
      ];

      memoryQueries.set.mockResolvedValue({
        success: true,
        memory: {}
      });

      for (const key of validKeys) {
        const response = await request(app)
          .post('/api/memory')
          .send({ sessionId: 'session-123', key, value: 'test' });

        expect(response.status).toBe(201);
      }
    });

    it('should reject invalid key formats', async () => {
      const invalidKeys = [
        'key with spaces',
        'key@with#special',
        'key/with/slash',
        'key\\with\\backslash'
      ];

      for (const key of invalidKeys) {
        const response = await request(app)
          .post('/api/memory')
          .send({ sessionId: 'session-123', key, value: 'test' });

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('key can only contain');
      }
    });

    it('should handle upsert behavior (update existing)', async () => {
      memoryQueries.set.mockResolvedValue({
        success: true,
        memory: {}
      });

      // First insert
      await request(app)
        .post('/api/memory')
        .send({ sessionId: 'session-123', key: 'counter', value: 1 });

      // Update (upsert)
      const response = await request(app)
        .post('/api/memory')
        .send({ sessionId: 'session-123', key: 'counter', value: 2 });

      expect(response.status).toBe(201);
      expect(memoryQueries.set).toHaveBeenCalledTimes(2);
    });

    it('should handle database errors', async () => {
      memoryQueries.set.mockResolvedValue({
        success: false,
        error: 'Database connection failed'
      });

      const response = await request(app)
        .post('/api/memory')
        .send(validMemoryData);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/memory/:sessionId/:key', () => {
    it('should retrieve specific memory value', async () => {
      const sessionId = 'session-123';
      const key = 'user_preferences';
      const value = { theme: 'dark', language: 'en' };

      memoryQueries.get.mockResolvedValue({
        success: true,
        value
      });

      const response = await request(app)
        .get(`/api/memory/${sessionId}/${key}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.sessionId).toBe(sessionId);
      expect(response.body.data.key).toBe(key);
      expect(response.body.data.value).toEqual(value);
      expect(memoryQueries.get).toHaveBeenCalledWith(sessionId, key);
    });

    it('should return 404 for non-existent key', async () => {
      memoryQueries.get.mockResolvedValue({
        success: true,
        value: null
      });

      const response = await request(app)
        .get('/api/memory/session-123/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Memory key not found');
    });

    it('should return 400 when sessionId or key is missing', async () => {
      const response = await request(app)
        .get('/api/memory//key');

      expect([400, 404]).toContain(response.status);
    });

    it('should handle database errors', async () => {
      memoryQueries.get.mockResolvedValue({
        success: false,
        error: 'Database error'
      });

      const response = await request(app)
        .get('/api/memory/session-123/test');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });

    it('should handle keys with dots', async () => {
      const key = 'user.settings.theme';
      memoryQueries.get.mockResolvedValue({
        success: true,
        value: 'dark'
      });

      const response = await request(app)
        .get(`/api/memory/session-123/${key}`);

      expect(response.status).toBe(200);
      expect(memoryQueries.get).toHaveBeenCalledWith('session-123', key);
    });
  });

  describe('GET /api/memory/:sessionId', () => {
    it('should get all memory for session', async () => {
      const sessionId = 'session-123';
      const mockMemory = {
        user_preferences: { theme: 'dark' },
        username: 'johndoe',
        score: 42
      };

      memoryQueries.getAll.mockResolvedValue({
        success: true,
        memory: mockMemory
      });

      const response = await request(app)
        .get(`/api/memory/${sessionId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.sessionId).toBe(sessionId);
      expect(response.body.data.memory).toEqual(mockMemory);
      expect(response.body.data.count).toBe(3);
      expect(memoryQueries.getAll).toHaveBeenCalledWith(sessionId);
    });

    it('should return empty object for session with no memory', async () => {
      memoryQueries.getAll.mockResolvedValue({
        success: true,
        memory: {}
      });

      const response = await request(app)
        .get('/api/memory/session-empty');

      expect(response.status).toBe(200);
      expect(response.body.data.memory).toEqual({});
      expect(response.body.data.count).toBe(0);
    });

    it('should return 400 when sessionId is missing', async () => {
      const response = await request(app)
        .get('/api/memory/');

      expect([400, 404]).toContain(response.status);
    });

    it('should handle database errors', async () => {
      memoryQueries.getAll.mockResolvedValue({
        success: false,
        error: 'Database error'
      });

      const response = await request(app)
        .get('/api/memory/session-123');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/memory/:sessionId/:key', () => {
    it('should delete specific memory key', async () => {
      const sessionId = 'session-123';
      const key = 'temp_data';

      mockSupabase.eq.mockResolvedValue({
        error: null
      });

      const response = await request(app)
        .delete(`/api/memory/${sessionId}/${key}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.deleted).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith('memory');
      expect(mockSupabase.delete).toHaveBeenCalled();
    });

    it('should return 400 when sessionId or key is missing', async () => {
      const response = await request(app)
        .delete('/api/memory/session-123/');

      expect([400, 404]).toContain(response.status);
    });

    it('should handle database errors', async () => {
      mockSupabase.eq.mockResolvedValue({
        error: { message: 'Database error' }
      });

      const response = await request(app)
        .delete('/api/memory/session-123/test');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });

    it('should handle deletion of non-existent key gracefully', async () => {
      mockSupabase.eq.mockResolvedValue({
        error: null
      });

      const response = await request(app)
        .delete('/api/memory/session-123/nonexistent');

      // Should succeed even if key doesn't exist
      expect(response.status).toBe(200);
    });
  });

  describe('Edge Cases and Security', () => {
    it('should handle very large JSON objects', async () => {
      const largeObject = {
        data: Array(1000).fill(null).map((_, i) => ({
          id: i,
          value: `item-${i}`,
          metadata: { index: i }
        }))
      };

      memoryQueries.set.mockResolvedValue({
        success: true,
        memory: {}
      });

      const response = await request(app)
        .post('/api/memory')
        .send({
          sessionId: 'session-123',
          key: 'large_data',
          value: largeObject
        });

      expect([201, 413]).toContain(response.status);
    });

    it('should handle nested objects', async () => {
      const nestedObject = {
        level1: {
          level2: {
            level3: {
              value: 'deep'
            }
          }
        }
      };

      memoryQueries.set.mockResolvedValue({
        success: true,
        memory: {}
      });

      const response = await request(app)
        .post('/api/memory')
        .send({
          sessionId: 'session-123',
          key: 'nested',
          value: nestedObject
        });

      expect(response.status).toBe(201);
    });

    it('should handle special characters in values', async () => {
      const specialValue = {
        text: '<script>alert("xss")</script>',
        sql: "'; DROP TABLE memory; --",
        unicode: '你好 🌍 مرحبا'
      };

      memoryQueries.set.mockResolvedValue({
        success: true,
        memory: {}
      });

      const response = await request(app)
        .post('/api/memory')
        .send({
          sessionId: 'session-123',
          key: 'special',
          value: specialValue
        });

      expect(response.status).toBe(201);
    });

    it('should handle concurrent operations on same key', async () => {
      memoryQueries.set.mockResolvedValue({
        success: true,
        memory: {}
      });

      const requests = Array(20).fill(null).map((_, i) =>
        request(app)
          .post('/api/memory')
          .send({
            sessionId: 'session-123',
            key: 'counter',
            value: i
          })
      );

      const responses = await Promise.all(requests);
      responses.forEach(response => {
        expect([201, 500]).toContain(response.status);
      });
    });

    it('should handle value of 0 (falsy but valid)', async () => {
      memoryQueries.set.mockResolvedValue({
        success: true,
        memory: {}
      });

      const response = await request(app)
        .post('/api/memory')
        .send({
          sessionId: 'session-123',
          key: 'zero',
          value: 0
        });

      expect(response.status).toBe(201);
    });

    it('should handle empty string value', async () => {
      memoryQueries.set.mockResolvedValue({
        success: true,
        memory: {}
      });

      const response = await request(app)
        .post('/api/memory')
        .send({
          sessionId: 'session-123',
          key: 'empty',
          value: ''
        });

      expect(response.status).toBe(201);
    });

    it('should handle false boolean value', async () => {
      memoryQueries.set.mockResolvedValue({
        success: true,
        memory: {}
      });

      const response = await request(app)
        .post('/api/memory')
        .send({
          sessionId: 'session-123',
          key: 'false_value',
          value: false
        });

      expect(response.status).toBe(201);
    });

    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/memory')
        .set('Content-Type', 'application/json')
        .send('{ malformed json }');

      expect(response.status).toBe(400);
    });
  });

  describe('Performance', () => {
    it('should handle rapid successive requests', async () => {
      memoryQueries.set.mockResolvedValue({
        success: true,
        memory: {}
      });

      const start = Date.now();
      const requests = Array(100).fill(null).map((_, i) =>
        request(app)
          .post('/api/memory')
          .send({
            sessionId: 'session-123',
            key: `key_${i}`,
            value: `value_${i}`
          })
      );

      await Promise.all(requests);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(5000); // Should complete in less than 5 seconds
    });

    it('should efficiently retrieve large memory sets', async () => {
      const largeMemory = {};
      for (let i = 0; i < 100; i++) {
        largeMemory[`key_${i}`] = `value_${i}`;
      }

      memoryQueries.getAll.mockResolvedValue({
        success: true,
        memory: largeMemory
      });

      const start = Date.now();
      const response = await request(app)
        .get('/api/memory/session-123');
      const duration = Date.now() - start;

      expect(response.status).toBe(200);
      expect(response.body.data.count).toBe(100);
      expect(duration).toBeLessThan(1000);
    });
  });
});
