/**
 * Conversation Routes Tests
 * Comprehensive tests for conversation/message endpoints
 */

const request = require('supertest');
const express = require('express');

// Mock dependencies
jest.mock('../../src/database/supabase.js');
jest.mock('../../src/database/queries.js');
jest.mock('../../src/config/logger.js');

const { conversationQueries } = require('../../src/database/queries.js');

// Mock logger
const logger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
};
require('../../src/config/logger.js').logger = logger;

describe('Conversation Routes', () => {
  let app;
  let conversationRoutes;

  beforeAll(async () => {
    // Create express app for testing
    app = express();
    app.use(express.json());

    // Import routes after mocks
    const routesModule = await import('../../src/routes/conversations.js');
    conversationRoutes = routesModule.default;
    app.use('/api/conversations', conversationRoutes);

    // Error handler
    app.use((err, req, res, next) => {
      res.status(500).json({ success: false, error: err.message });
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/conversations', () => {
    const validMessageData = {
      sessionId: 'session-123',
      role: 'user',
      content: 'Hello, how are you?',
      metadata: { timestamp: Date.now() }
    };

    it('should create a new message with valid data', async () => {
      const mockMessage = {
        id: 'msg-123',
        session_id: validMessageData.sessionId,
        role: validMessageData.role,
        content: validMessageData.content,
        metadata: validMessageData.metadata,
        created_at: new Date().toISOString()
      };

      conversationQueries.create.mockResolvedValue({
        success: true,
        message: mockMessage
      });

      const response = await request(app)
        .post('/api/conversations')
        .send(validMessageData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockMessage);
      expect(conversationQueries.create).toHaveBeenCalledWith(
        validMessageData.sessionId,
        validMessageData.role,
        validMessageData.content,
        validMessageData.metadata
      );
    });

    it('should create message without metadata', async () => {
      const minimalData = {
        sessionId: 'session-123',
        role: 'assistant',
        content: 'I am fine, thank you!'
      };

      conversationQueries.create.mockResolvedValue({
        success: true,
        message: { id: 'msg-124', ...minimalData }
      });

      const response = await request(app)
        .post('/api/conversations')
        .send(minimalData);

      expect(response.status).toBe(201);
      expect(conversationQueries.create).toHaveBeenCalledWith(
        minimalData.sessionId,
        minimalData.role,
        minimalData.content,
        {}
      );
    });

    it('should accept system role messages', async () => {
      const systemMessage = {
        sessionId: 'session-123',
        role: 'system',
        content: 'System initialization complete'
      };

      conversationQueries.create.mockResolvedValue({
        success: true,
        message: { id: 'msg-125', ...systemMessage }
      });

      const response = await request(app)
        .post('/api/conversations')
        .send(systemMessage);

      expect(response.status).toBe(201);
    });

    it('should return 400 when sessionId is missing', async () => {
      const response = await request(app)
        .post('/api/conversations')
        .send({ role: 'user', content: 'Test' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Session ID is required');
    });

    it('should return 400 when role is missing', async () => {
      const response = await request(app)
        .post('/api/conversations')
        .send({ sessionId: 'session-123', content: 'Test' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Role is required');
    });

    it('should return 400 when content is missing', async () => {
      const response = await request(app)
        .post('/api/conversations')
        .send({ sessionId: 'session-123', role: 'user' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Content is required');
    });

    it('should return 400 for invalid role', async () => {
      const response = await request(app)
        .post('/api/conversations')
        .send({
          sessionId: 'session-123',
          role: 'hacker',
          content: 'Test'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Role must be one of');
    });

    it('should return 400 when content is not a string', async () => {
      const response = await request(app)
        .post('/api/conversations')
        .send({
          sessionId: 'session-123',
          role: 'user',
          content: { text: 'Should be string' }
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Content must be a string');
    });

    it('should return 400 for invalid metadata type', async () => {
      const response = await request(app)
        .post('/api/conversations')
        .send({
          sessionId: 'session-123',
          role: 'user',
          content: 'Test',
          metadata: 'should-be-object'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Metadata must be an object');
    });

    it('should handle very long messages', async () => {
      const longContent = 'A'.repeat(10000);
      conversationQueries.create.mockResolvedValue({
        success: true,
        message: {
          id: 'msg-long',
          session_id: 'session-123',
          role: 'user',
          content: longContent
        }
      });

      const response = await request(app)
        .post('/api/conversations')
        .send({
          sessionId: 'session-123',
          role: 'user',
          content: longContent
        });

      expect([201, 413]).toContain(response.status);
    });

    it('should handle database errors', async () => {
      conversationQueries.create.mockResolvedValue({
        success: false,
        error: 'Database connection failed'
      });

      const response = await request(app)
        .post('/api/conversations')
        .send(validMessageData);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/conversations/:sessionId', () => {
    const sessionId = 'session-123';

    it('should get conversation history', async () => {
      const mockMessages = [
        {
          id: 'msg-1',
          session_id: sessionId,
          role: 'user',
          content: 'Hello',
          created_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 'msg-2',
          session_id: sessionId,
          role: 'assistant',
          content: 'Hi there!',
          created_at: '2024-01-01T00:00:01Z'
        }
      ];

      conversationQueries.getHistory.mockResolvedValue({
        success: true,
        messages: mockMessages
      });

      const response = await request(app)
        .get(`/api/conversations/${sessionId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockMessages);
      expect(response.body.count).toBe(2);
      expect(conversationQueries.getHistory).toHaveBeenCalledWith(sessionId, 50);
    });

    it('should respect limit parameter', async () => {
      conversationQueries.getHistory.mockResolvedValue({
        success: true,
        messages: []
      });

      const response = await request(app)
        .get(`/api/conversations/${sessionId}?limit=100`);

      expect(response.status).toBe(200);
      expect(conversationQueries.getHistory).toHaveBeenCalledWith(sessionId, 100);
    });

    it('should cap limit at 200', async () => {
      conversationQueries.getHistory.mockResolvedValue({
        success: true,
        messages: []
      });

      const response = await request(app)
        .get(`/api/conversations/${sessionId}?limit=500`);

      expect(response.status).toBe(200);
      expect(conversationQueries.getHistory).toHaveBeenCalledWith(sessionId, 200);
    });

    it('should use default limit of 50', async () => {
      conversationQueries.getHistory.mockResolvedValue({
        success: true,
        messages: []
      });

      const response = await request(app)
        .get(`/api/conversations/${sessionId}`);

      expect(response.status).toBe(200);
      expect(conversationQueries.getHistory).toHaveBeenCalledWith(sessionId, 50);
    });

    it('should return 400 for limit less than 1', async () => {
      const response = await request(app)
        .get(`/api/conversations/${sessionId}?limit=0`);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Limit must be at least 1');
    });

    it('should return 400 when sessionId is missing', async () => {
      const response = await request(app)
        .get('/api/conversations/');

      expect([400, 404]).toContain(response.status);
    });

    it('should return empty array for session with no messages', async () => {
      conversationQueries.getHistory.mockResolvedValue({
        success: true,
        messages: []
      });

      const response = await request(app)
        .get(`/api/conversations/${sessionId}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([]);
      expect(response.body.count).toBe(0);
    });

    it('should handle database errors', async () => {
      conversationQueries.getHistory.mockResolvedValue({
        success: false,
        error: 'Database error'
      });

      const response = await request(app)
        .get(`/api/conversations/${sessionId}`);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/conversations/:sessionId/summary', () => {
    const sessionId = 'session-123';

    it('should generate conversation summary', async () => {
      const mockMessages = [
        {
          id: 'msg-1',
          session_id: sessionId,
          role: 'user',
          content: 'Hello',
          created_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 'msg-2',
          session_id: sessionId,
          role: 'assistant',
          content: 'Hi there!',
          created_at: '2024-01-01T00:00:01Z'
        },
        {
          id: 'msg-3',
          session_id: sessionId,
          role: 'user',
          content: 'How are you?',
          created_at: '2024-01-01T00:00:02Z'
        }
      ];

      conversationQueries.getHistory.mockResolvedValue({
        success: true,
        messages: mockMessages
      });

      const response = await request(app)
        .get(`/api/conversations/${sessionId}/summary`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        sessionId,
        totalMessages: 3,
        messagesByRole: {
          user: 2,
          assistant: 1,
          system: 0
        }
      });
      expect(response.body.data.firstMessage).toEqual(mockMessages[0]);
      expect(response.body.data.lastMessage).toEqual(mockMessages[2]);
    });

    it('should calculate statistics correctly', async () => {
      const mockMessages = [
        { id: '1', role: 'user', content: 'A'.repeat(100), created_at: '2024-01-01T00:00:00Z' },
        { id: '2', role: 'assistant', content: 'B'.repeat(50), created_at: '2024-01-01T00:00:01Z' }
      ];

      conversationQueries.getHistory.mockResolvedValue({
        success: true,
        messages: mockMessages
      });

      const response = await request(app)
        .get(`/api/conversations/${sessionId}/summary`);

      expect(response.status).toBe(200);
      expect(response.body.data.totalCharacters).toBe(150);
      expect(response.body.data.averageMessageLength).toBe(75);
    });

    it('should handle empty conversation', async () => {
      conversationQueries.getHistory.mockResolvedValue({
        success: true,
        messages: []
      });

      const response = await request(app)
        .get(`/api/conversations/${sessionId}/summary`);

      expect(response.status).toBe(200);
      expect(response.body.data).toMatchObject({
        sessionId,
        totalMessages: 0,
        firstMessage: null,
        lastMessage: null,
        averageMessageLength: 0
      });
    });

    it('should return 400 when sessionId is missing', async () => {
      const response = await request(app)
        .get('/api/conversations//summary');

      expect([400, 404]).toContain(response.status);
    });

    it('should handle database errors', async () => {
      conversationQueries.getHistory.mockResolvedValue({
        success: false,
        error: 'Database error'
      });

      const response = await request(app)
        .get(`/api/conversations/${sessionId}/summary`);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Edge Cases and Security', () => {
    it('should handle XSS attempts in content', async () => {
      const xssContent = '<script>alert("XSS")</script>';
      conversationQueries.create.mockResolvedValue({
        success: true,
        message: {
          id: 'msg-xss',
          session_id: 'session-123',
          role: 'user',
          content: xssContent
        }
      });

      const response = await request(app)
        .post('/api/conversations')
        .send({
          sessionId: 'session-123',
          role: 'user',
          content: xssContent
        });

      expect(response.status).toBe(201);
      // Content should be stored as-is, sanitization happens on display
      expect(conversationQueries.create).toHaveBeenCalledWith(
        'session-123',
        'user',
        xssContent,
        {}
      );
    });

    it('should handle unicode and emoji in content', async () => {
      const unicodeContent = '你好 🌍 مرحبا Здравствуйте';
      conversationQueries.create.mockResolvedValue({
        success: true,
        message: {
          id: 'msg-unicode',
          session_id: 'session-123',
          role: 'user',
          content: unicodeContent
        }
      });

      const response = await request(app)
        .post('/api/conversations')
        .send({
          sessionId: 'session-123',
          role: 'user',
          content: unicodeContent
        });

      expect(response.status).toBe(201);
      expect(conversationQueries.create).toHaveBeenCalledWith(
        'session-123',
        'user',
        unicodeContent,
        {}
      );
    });

    it('should handle concurrent message creation', async () => {
      conversationQueries.create.mockResolvedValue({
        success: true,
        message: { id: 'msg-concurrent', session_id: 'session-123' }
      });

      const requests = Array(50).fill(null).map((_, i) =>
        request(app)
          .post('/api/conversations')
          .send({
            sessionId: 'session-123',
            role: 'user',
            content: `Message ${i}`
          })
      );

      const responses = await Promise.all(requests);
      responses.forEach(response => {
        expect([201, 500]).toContain(response.status);
      });
    });

    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/conversations')
        .set('Content-Type', 'application/json')
        .send('{ malformed json }');

      expect(response.status).toBe(400);
    });

    it('should handle empty string content', async () => {
      const response = await request(app)
        .post('/api/conversations')
        .send({
          sessionId: 'session-123',
          role: 'user',
          content: ''
        });

      // Empty strings might be rejected
      expect(response.status).toBe(400);
    });

    it('should handle whitespace-only content', async () => {
      conversationQueries.create.mockResolvedValue({
        success: true,
        message: { id: 'msg-whitespace', content: '   ' }
      });

      const response = await request(app)
        .post('/api/conversations')
        .send({
          sessionId: 'session-123',
          role: 'user',
          content: '   '
        });

      // Should accept or reject based on validation
      expect([201, 400]).toContain(response.status);
    });
  });

  describe('Pagination Performance', () => {
    it('should efficiently handle large conversation histories', async () => {
      const largeHistory = Array(200).fill(null).map((_, i) => ({
        id: `msg-${i}`,
        session_id: 'session-123',
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: `Message ${i}`,
        created_at: new Date(Date.now() + i * 1000).toISOString()
      }));

      conversationQueries.getHistory.mockResolvedValue({
        success: true,
        messages: largeHistory
      });

      const start = Date.now();
      const response = await request(app)
        .get('/api/conversations/session-123?limit=200');
      const duration = Date.now() - start;

      expect(response.status).toBe(200);
      expect(response.body.count).toBe(200);
      expect(duration).toBeLessThan(1000);
    });
  });
});
