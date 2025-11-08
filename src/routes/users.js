/**
 * User Routes
 * User management endpoints
 */

import express from 'express';
import { asyncHandler } from '../middleware/error.js';
import { authenticate } from '../middleware/auth.js';
import { userQueries } from '../database/queries.js';
import { logger } from '../config/logger.js';
import Joi from 'joi';
import { validateBody } from '../middleware/validation.js';

const router = express.Router();

const createUserSchema = Joi.object({
  email: Joi.string().email().required(),
  name: Joi.string().optional(),
  phone: Joi.string().optional()
});

const updateUserSchema = Joi.object({
  name: Joi.string().optional(),
  phone: Joi.string().optional()
});

/**
 * Create new user
 * POST /api/users
 */
router.post('/', validateBody(createUserSchema), asyncHandler(async (req, res) => {
  const { email, name, phone } = req.body;

  logger.info(`Creating user with email: ${email}`);

  const result = await userQueries.create(email, { name, phone });

  if (!result.success) {
    logger.error(`Failed to create user: ${result.error}`);
    throw new Error(result.error);
  }

  logger.info(`User created successfully: ${result.user.id}`);

  res.status(201).json({
    success: true,
    data: result.user
  });
}));

/**
 * Get user by email
 * GET /api/users/:email
 */
router.get('/:email', authenticate, asyncHandler(async (req, res) => {
  const { email } = req.params;

  logger.info(`Fetching user by email: ${email}`);

  const result = await userQueries.getByEmail(email);

  if (!result.success) {
    logger.error(`Failed to fetch user: ${result.error}`);
    throw new Error(result.error);
  }

  if (!result.user) {
    logger.info(`User not found: ${email}`);
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  logger.info(`User retrieved successfully: ${result.user.id}`);

  res.json({
    success: true,
    data: result.user
  });
}));

/**
 * Update user profile
 * PUT /api/users/:userId
 */
router.put('/:userId', authenticate, validateBody(updateUserSchema), asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const updates = req.body;

  logger.info(`Updating user ${userId} with data:`, updates);

  const result = await userQueries.update(userId, updates);

  if (!result.success) {
    logger.error(`Failed to update user: ${result.error}`);
    throw new Error(result.error);
  }

  if (!result.user) {
    logger.info(`User not found for update: ${userId}`);
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  logger.info(`User updated successfully: ${userId}`);

  res.json({
    success: true,
    data: result.user
  });
}));

export default router;
