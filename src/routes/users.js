/**
 * User Routes
 * User management endpoints
 */

import express from 'express';
import { asyncHandler } from '../middleware/error.js';
import { authenticate } from '../middleware/auth.js';
import { userQueries } from '../database/queries.js';
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

  const result = await userQueries.create(email, { name, phone });

  if (!result.success) {
    throw new Error(result.error);
  }

  res.status(201).json({
    success: true,
    user: result.user
  });
}));

/**
 * Get user by email
 * GET /api/users/:email
 */
router.get('/:email', authenticate, asyncHandler(async (req, res) => {
  const { email } = req.params;

  const result = await userQueries.getByEmail(email);

  if (!result.success) {
    throw new Error(result.error);
  }

  res.json({
    success: true,
    user: result.user
  });
}));

/**
 * Update user profile
 * PUT /api/users/:userId
 */
router.put('/:userId', authenticate, validateBody(updateUserSchema), asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const updates = req.body;

  const result = await userQueries.update(userId, updates);

  if (!result.success) {
    throw new Error(result.error);
  }

  res.json({
    success: true,
    user: result.user
  });
}));

export default router;
