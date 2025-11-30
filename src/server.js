/**
 * VentureBot Backend Server
 * Main entry point for the application
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import fs from 'fs';
import path from 'path';
import { config } from './config/env.js';
import { logger } from './config/logger.js';
import { initializeSupabase } from './database/supabase.js';
import { initializeOpenAI } from './services/openai.js';
import routes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';

const app = express();

/**
 * Middleware
 */
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * Static frontend (public/)
 */
const publicDir = path.join(process.cwd(), 'public');
const distDir = path.join(process.cwd(), 'frontend', 'dist');
const hasBuiltFrontend = fs.existsSync(path.join(distDir, 'index.html'));

// Serve built frontend when available (keeps legacy public/ fallback for MVP UI)
app.use(express.static(hasBuiltFrontend ? distDir : publicDir));

/**
 * Rate limiting
 */
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: 'Too many requests from this IP, please try again later.'
});

app.use('/api/', limiter);

/**
 * Routes
 */
app.use('/api', routes);

// SPA fallback for frontend routes
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }

  const target = hasBuiltFrontend
    ? path.join(distDir, 'index.html')
    : path.join(publicDir, 'index.html');

  res.sendFile(target);
});

/**
 * Error handling
 */
app.use(notFoundHandler);
app.use(errorHandler);

/**
 * Initialize services and start server
 */
const startServer = async () => {
  try {
    logger.info('🚀 Starting VentureBot Backend...');

    // Initialize services
    initializeSupabase();
    initializeOpenAI();

    // Create logs directory
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    // Start server
    app.listen(config.port, () => {
      logger.info(`✅ Server running on port ${config.port}`);
      logger.info(`📝 Environment: ${config.nodeEnv}`);
      logger.info(`🤖 Model: ${config.openai.model}`);
      logger.info(`🔗 Health check: http://localhost:${config.port}/api/health`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle uncaught errors
process.on('unhandledRejection', error => {
  logger.error('Unhandled rejection:', error);
  process.exit(1);
});

process.on('uncaughtException', error => {
  logger.error('Uncaught exception:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

startServer();

export default app;
