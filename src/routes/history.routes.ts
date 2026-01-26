import { Router } from 'express';
import { historyController } from '../controllers/history.controller';
import { authenticate } from '../middleware/auth';
import { validate, historyQuerySchema } from '../middleware/validation';

const router = Router();

/**
 * GET /api/history
 * Get paginated history entries
 */
router.get(
  '/',
  authenticate,
  validate(historyQuerySchema, 'query'),
  historyController.getEntries.bind(historyController)
);

/**
 * GET /api/history/:id
 * Get single history entry by ID
 */
router.get(
  '/:id',
  authenticate,
  historyController.getById.bind(historyController)
);

/**
 * DELETE /api/history
 * Clear all history
 */
router.delete(
  '/',
  authenticate,
  historyController.clear.bind(historyController)
);

export default router;
