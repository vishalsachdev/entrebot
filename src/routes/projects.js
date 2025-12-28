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

const router = express.Router();

// Valid project status values
const PROJECT_STATUSES = [
  'ideation',
  'validation',
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
  validateBody(createProjectSchema),
  asyncHandler(async (req, res) => {
    const { userId, name, description } = req.body;

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
 * Query params: userId (required)
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { userId } = req.query;

    if (!userId) {
      const error = new Error('userId query parameter is required');
      error.statusCode = 400;
      throw error;
    }

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

    logger.info(`Fetching project: ${id}`);

    const result = await projectQueries.getById(id);

    if (!result.success) {
      logger.error(`Failed to fetch project: ${result.error}`);
      throw new Error(result.error);
    }

    if (!result.project) {
      logger.info(`Project not found: ${id}`);
      const error = new Error('Project not found');
      error.statusCode = 404;
      throw error;
    }

    // Optionally fetch related sessions
    const sessionsResult = await sessionQueries.getByProjectId(id);
    const sessions = sessionsResult.success ? sessionsResult.sessions : [];

    logger.info(`Project retrieved successfully: ${id}`);

    res.status(200).json({
      success: true,
      data: {
        ...result.project,
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

    logger.info(`Deleting project: ${id}`);

    // First check if project exists
    const existsResult = await projectQueries.getById(id);
    if (!existsResult.success || !existsResult.project) {
      logger.info(`Project not found for deletion: ${id}`);
      const error = new Error('Project not found');
      error.statusCode = 404;
      throw error;
    }

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
