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
import { resolveAuthenticatedAppUserId } from '../utils/authz.js';

const router = express.Router();

const createUserSchema = Joi.object({
  email: Joi.string().email().required(),
  name: Joi.string().optional(),
  phone: Joi.string().optional(),
  phone_number: Joi.string().optional()
});

const updateUserSchema = Joi.object({
  name: Joi.string().optional(),
  phone: Joi.string().optional(),
  phone_number: Joi.string().optional()
});

const formatUser = user => ({
  ...user,
  phone_number: user?.phone || ''
});

/**
 * Create new user or return existing
 * POST /api/users
 */
router.post(
  '/',
  authenticate,
  validateBody(createUserSchema),
  asyncHandler(async (req, res) => {
    const { email, name, phone, phone_number } = req.body;
    const authenticatedEmail = (req.user?.email || '').toLowerCase();
    if (email.toLowerCase() !== authenticatedEmail) {
      const error = new Error('You can only create your own user profile');
      error.statusCode = 403;
      throw error;
    }

    logger.info(`Creating or getting user with email: ${email}`);

    // Try to create user
    const result = await userQueries.create(email, { name, phone: phone || phone_number });

    if (result.success) {
      logger.info(`User created successfully: ${result.user.id}`);
      return res.status(201).json({
        success: true,
        data: formatUser(result.user)
      });
    }

    // If duplicate key error, get existing user
    if (result.error?.includes('duplicate key')) {
      logger.info(`User exists, fetching: ${email}`);
      const existingResult = await userQueries.getByEmail(email);
      if (existingResult.success && existingResult.user) {
        return res.status(200).json({
          success: true,
          data: formatUser(existingResult.user)
        });
      }
    }

    logger.error(`Failed to create user: ${result.error}`);
    throw new Error(result.error);
  })
);

/**
 * Get user by email
 * GET /api/users/email/:email
 */
router.get(
  '/email/:email',
  authenticate,
  asyncHandler(async (req, res) => {
    const { email } = req.params;
    const authenticatedEmail = (req.user?.email || '').toLowerCase();
    if (email.toLowerCase() !== authenticatedEmail) {
      const error = new Error('You can only access your own user profile');
      error.statusCode = 403;
      throw error;
    }

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
      data: formatUser(result.user)
    });
  })
);

/**
 * Get user by ID
 * GET /api/users/:userId
 */
router.get(
  '/:userId',
  authenticate,
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const authenticatedUserId = await resolveAuthenticatedAppUserId(req);
    if (userId !== authenticatedUserId) {
      const error = new Error('You can only access your own user profile');
      error.statusCode = 403;
      throw error;
    }

    logger.info(`Fetching user by id: ${userId}`);

    const result = await userQueries.getById(userId);

    if (!result.success) {
      logger.error(`Failed to fetch user: ${result.error}`);
      throw new Error(result.error);
    }

    if (!result.user) {
      logger.info(`User not found: ${userId}`);
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    res.json({
      success: true,
      data: formatUser(result.user)
    });
  })
);

/**
 * Update user profile
 * PUT /api/users/:userId
 */
router.put(
  '/:userId',
  authenticate,
  validateBody(updateUserSchema),
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const updates = req.body;
    const authenticatedUserId = await resolveAuthenticatedAppUserId(req);
    if (userId !== authenticatedUserId) {
      const error = new Error('You can only update your own user profile');
      error.statusCode = 403;
      throw error;
    }

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
      data: formatUser(result.user)
    });
  })
);

/**
 * Delete user profile
 * DELETE /api/users/:userId
 */
router.delete(
  '/:userId',
  authenticate,
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const authenticatedUserId = await resolveAuthenticatedAppUserId(req);
    if (userId !== authenticatedUserId) {
      const error = new Error('You can only delete your own user profile');
      error.statusCode = 403;
      throw error;
    }

    logger.info(`Deleting user: ${userId}`);

    const result = await userQueries.delete(userId);

    if (!result.success) {
      logger.error(`Failed to delete user: ${result.error}`);
      throw new Error(result.error);
    }

    if (!result.deleted) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    res.json({
      success: true,
      data: { id: userId, deleted: true }
    });
  })
);

export default router;
