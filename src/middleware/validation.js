/**
 * Request Validation Middleware
 */

import Joi from 'joi';
import { logger } from '../config/logger.js';

/**
 * Validate request body against schema
 */
export const validateBody = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => detail.message);
      logger.warn('Validation error:', errors);

      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors
      });
    }

    req.body = value;
    next();
  };
};

/**
 * Common validation schemas
 */
export const schemas = {
  createSession: Joi.object({
    userId: Joi.string().required(),
    metadata: Joi.object().optional()
  }),

  sendMessage: Joi.object({
    sessionId: Joi.string().required(),
    message: Joi.string().required().min(1).max(5000),
    agent: Joi.string().optional().valid('onboarding', 'ideaGenerator', 'validator')
  }),

  selectIdea: Joi.object({
    sessionId: Joi.string().required(),
    ideaNumber: Joi.number().required().min(1).max(5),
    ideaText: Joi.string().required()
  })
};

export default { validateBody, schemas };
