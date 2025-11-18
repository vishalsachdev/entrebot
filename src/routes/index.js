/**
 * Routes Index
 * Aggregates all route modules
 */

import express from 'express';
import { logger } from '../config/logger.js';
import chatRoutes from './chat.js';
import userRoutes from './users.js';
import sessionRoutes from './sessions.js';
import conversationRoutes from './conversations.js';
import memoryRoutes from './memory.js';

const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API version info
router.get('/version', (req, res) => {
  res.status(200).json({
    success: true,
    version: '1.0.0',
    name: 'Entrebot API',
    endpoints: {
      chat: '/api/chat',
      users: '/api/users',
      sessions: '/api/sessions',
      conversations: '/api/conversations',
      memory: '/api/memory'
    }
  });
});

// Request logging middleware
router.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip
    });
  });

  next();
});

// Mount routes
router.use('/chat', chatRoutes);
router.use('/users', userRoutes);
router.use('/sessions', sessionRoutes);
router.use('/conversations', conversationRoutes);
router.use('/memory', memoryRoutes);

export default router;
