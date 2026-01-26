import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import config from '../config/environment';
import logger from '../utils/logger';
import { AuthenticationError } from '../utils/errors';

/**
 * Timing-safe string comparison to prevent timing attacks
 */
function timingSafeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  const bufferA = Buffer.from(a, 'utf8');
  const bufferB = Buffer.from(b, 'utf8');

  return crypto.timingSafeEqual(bufferA, bufferB);
}

/**
 * Hash API key for logging (never log full keys)
 */
function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex').substring(0, 16);
}

/**
 * Authentication middleware - validates API key from Bearer token
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      logger.warn('Missing Authorization header', {
        ip: req.ip,
        path: req.path
      });
      throw new AuthenticationError('Missing Authorization header');
    }

    // Extract Bearer token
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      logger.warn('Invalid Authorization header format', {
        ip: req.ip,
        path: req.path
      });
      throw new AuthenticationError('Invalid Authorization header format');
    }

    const token = parts[1];

    // Validate against configured API keys using timing-safe comparison
    const validKeys = config.security.apiKeys;
    const isValid = validKeys.some(validKey => timingSafeCompare(token, validKey));

    if (!isValid) {
      logger.warn('Invalid API key', {
        ip: req.ip,
        path: req.path,
        keyHash: hashApiKey(token)
      });
      throw new AuthenticationError('Invalid API key');
    }

    logger.debug('Authentication successful', {
      ip: req.ip,
      path: req.path,
      keyHash: hashApiKey(token)
    });

    next();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
}
