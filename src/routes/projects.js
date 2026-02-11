/**
 * Project Routes
 * REST API endpoints for project management
 */

import express from 'express';
import { asyncHandler } from '../middleware/error.js';
import { authenticate } from '../middleware/auth.js';
import { projectQueries, sessionQueries } from '../database/queries.js';
import { logger } from '../config/logger.js';
import Joi from 'joi';
import { validateBody } from '../middleware/validation.js';
import { requireProjectOwnership, resolveAuthenticatedAppUserId } from '../utils/authz.js';

const router = express.Router();

// Valid project status values
const PROJECT_STATUSES = [
  'ideation',
  'validation',
  'strategy',
  'planning',
  'building',
  'launched',
  'active',
  'paused',
  'abandoned'
];

// Validation schemas
const createProjectSchema = Joi.object({
  userId: Joi.string().uuid().required(),
  name: Joi.string().min(1).max(255).required(),
  description: Joi.string().max(2000).optional().allow('', null)
});

const updateProjectSchema = Joi.object({
  name: Joi.string().min(1).max(255).optional(),
  description: Joi.string().max(2000).optional().allow('', null),
  status: Joi.string()
    .valid(...PROJECT_STATUSES)
    .optional()
});

/**
 * POST /api/v1/projects
 * Create new project
 */
router.post(
  '/',
  authenticate,
  validateBody(createProjectSchema),
  asyncHandler(async (req, res) => {
    const { userId, name, description } = req.body;
    const authenticatedUserId = await resolveAuthenticatedAppUserId(req);
    if (userId !== authenticatedUserId) {
      const error = new Error('You can only create projects for your own account');
      error.statusCode = 403;
      throw error;
    }

    logger.info(`Creating project "${name}" for user: ${userId}`);

    const result = await projectQueries.create(userId, name, description);

    if (!result.success) {
      logger.error(`Failed to create project: ${result.error}`);
      throw new Error(result.error);
    }

    logger.info(`Project created successfully: ${result.project.id}`);

    res.status(201).json({
      success: true,
      data: result.project
    });
  })
);

/**
 * GET /api/v1/projects
 * List projects for a user
 * Query params: userId (optional; must match authenticated user if provided)
 */
router.get(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    const authenticatedUserId = await resolveAuthenticatedAppUserId(req);
    const requestedUserId = typeof req.query.userId === 'string' ? req.query.userId : null;
    if (requestedUserId && requestedUserId !== authenticatedUserId) {
      const error = new Error('You can only access your own projects');
      error.statusCode = 403;
      throw error;
    }
    const userId = requestedUserId || authenticatedUserId;

    logger.info(`Fetching projects for user: ${userId}`);

    const result = await projectQueries.getByUserId(userId);

    if (!result.success) {
      logger.error(`Failed to fetch projects: ${result.error}`);
      throw new Error(result.error);
    }

    logger.info(`Retrieved ${result.projects.length} projects for user: ${userId}`);

    res.status(200).json({
      success: true,
      data: result.projects,
      count: result.projects.length
    });
  })
);

/**
 * GET /api/v1/projects/:id
 * Get single project by ID
 */
router.get(
  '/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = await resolveAuthenticatedAppUserId(req);

    logger.info(`Fetching project: ${id}`);

    const project = await requireProjectOwnership(id, userId, 'access');

    // Optionally fetch related sessions
    const sessionsResult = await sessionQueries.getByProjectId(id);
    const sessions = sessionsResult.success ? sessionsResult.sessions : [];

    logger.info(`Project retrieved successfully: ${id}`);

    res.status(200).json({
      success: true,
      data: {
        ...project,
        sessions
      }
    });
  })
);

/**
 * PUT /api/v1/projects/:id
 * Update project
 */
router.put(
  '/:id',
  authenticate,
  validateBody(updateProjectSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const userId = await resolveAuthenticatedAppUserId(req);
    await requireProjectOwnership(id, userId, 'update');

    logger.info(`Updating project ${id} with:`, updates);

    const result = await projectQueries.update(id, updates);

    if (!result.success) {
      logger.error(`Failed to update project: ${result.error}`);
      throw new Error(result.error);
    }

    if (!result.project) {
      logger.info(`Project not found for update: ${id}`);
      const error = new Error('Project not found');
      error.statusCode = 404;
      throw error;
    }

    logger.info(`Project updated successfully: ${id}`);

    res.status(200).json({
      success: true,
      data: result.project
    });
  })
);

/**
 * DELETE /api/v1/projects/:id
 * Delete project (sessions will have project_id set to NULL)
 */
router.delete(
  '/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = await resolveAuthenticatedAppUserId(req);

    logger.info(`Deleting project: ${id}`);

    await requireProjectOwnership(id, userId, 'delete');

    const result = await projectQueries.delete(id);

    if (!result.success) {
      logger.error(`Failed to delete project: ${result.error}`);
      throw new Error(result.error);
    }

    logger.info(`Project deleted successfully: ${id}`);

    res.status(200).json({
      success: true,
      data: { id, deleted: true }
    });
  })
);

/**
 * GET /api/v1/projects/:id/sessions
 * Get all sessions for a project
 */
router.get(
  '/:id/sessions',
  authenticate,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = await resolveAuthenticatedAppUserId(req);
    await requireProjectOwnership(id, userId, 'access');

    logger.info(`Fetching sessions for project: ${id}`);

    const result = await sessionQueries.getByProjectId(id);

    if (!result.success) {
      logger.error(`Failed to fetch project sessions: ${result.error}`);
      throw new Error(result.error);
    }

    logger.info(`Retrieved ${result.sessions.length} sessions for project: ${id}`);

    res.status(200).json({
      success: true,
      data: result.sessions,
      count: result.sessions.length
    });
  })
);

export default router;
