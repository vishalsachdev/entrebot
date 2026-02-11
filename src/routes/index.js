/**
 * Routes Index
 * Aggregates all route modules
 */

import express from 'express';
import { logger } from '../config/logger.js';
import authRoutes from './auth.js';
import chatRoutes from './chat.js';
import sharedRoutes from './shared.js';
import userRoutes from './users.js';
import projectRoutes from './projects.js';
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
      auth: '/api/v1/auth',
      chat: '/api/v1/chat',
      users: '/api/v1/users',
      projects: '/api/v1/projects',
      sessions: '/api/v1/sessions',
      conversations: '/api/v1/conversations',
      shared: '/api/v1/shared',
      memory: '/api/v1/memory'
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
router.use('/auth', authRoutes);
router.use('/chat', chatRoutes);
router.use('/users', userRoutes);
router.use('/projects', projectRoutes);
router.use('/sessions', sessionRoutes);
router.use('/conversations', conversationRoutes);
router.use('/shared', sharedRoutes);
router.use('/memory', memoryRoutes);

export default router;
