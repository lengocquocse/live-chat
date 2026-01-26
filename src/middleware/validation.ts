import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ValidationError } from '../utils/errors';
import logger from '../utils/logger';

/**
 * Command execution request validation schema
 */
export const commandExecutionSchema = Joi.object({
  command: Joi.string().required().min(1).max(5000).trim(),
  workingDirectory: Joi.string().optional().trim(),
  timeout: Joi.number().optional().integer().min(1000).max(600000),
  env: Joi.object().optional().pattern(
    Joi.string().pattern(/^[A-Z_][A-Z0-9_]*$/i),
    Joi.string()
  )
});

/**
 * History query validation schema
 */
export const historyQuerySchema = Joi.object({
  limit: Joi.number().optional().integer().min(1).max(1000).default(50),
  offset: Joi.number().optional().integer().min(0).default(0)
});

/**
 * Generic validation middleware factory
 */
export function validate(schema: Joi.Schema, target: 'body' | 'query' = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const data = target === 'body' ? req.body : req.query;

    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join('; ');
      logger.warn('Validation error', {
        path: req.path,
        errors: error.details,
        data
      });

      res.status(400).json({
        success: false,
        error: errorMessage,
        details: error.details
      });
      return;
    }

    // Replace the request data with validated and sanitized data
    if (target === 'body') {
      req.body = value;
    } else {
      req.query = value;
    }

    next();
  };
}
