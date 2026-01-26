import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import {
  ValidationError,
  AuthenticationError,
  CommandExecutionError,
  TimeoutError
} from '../utils/errors';

/**
 * Global error handler middleware
 */
export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  logger.error('Error handling request', {
    path: req.path,
    method: req.method,
    error: error.message,
    stack: error.stack
  });

  // Handle known error types
  if (error instanceof ValidationError) {
    res.status(error.statusCode).json({
      success: false,
      error: error.message
    });
    return;
  }

  if (error instanceof AuthenticationError) {
    res.status(error.statusCode).json({
      success: false,
      error: error.message
    });
    return;
  }

  if (error instanceof TimeoutError) {
    res.status(error.statusCode).json({
      success: false,
      error: error.message
    });
    return;
  }

  if (error instanceof CommandExecutionError) {
    res.status(error.statusCode).json({
      success: false,
      error: error.message,
      exitCode: error.exitCode,
      stderr: error.stderr
    });
    return;
  }

  // Handle unknown errors
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
}

/**
 * 404 handler for unknown routes
 */
export function notFoundHandler(req: Request, res: Response): void {
  logger.warn('Route not found', {
    path: req.path,
    method: req.method,
    ip: req.ip
  });

  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
}
