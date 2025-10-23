/**
 * Routes Index
 * Aggregates all route modules
 */

import express from 'express';
import chatRoutes from './chat.js';
import userRoutes from './users.js';

const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Mount routes
router.use('/chat', chatRoutes);
router.use('/users', userRoutes);

export default router;
