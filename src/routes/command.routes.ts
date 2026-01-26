import { Router } from 'express';
import { commandController } from '../controllers/command.controller';
import { authenticate } from '../middleware/auth';
import { validate, commandExecutionSchema } from '../middleware/validation';

const router = Router();

/**
 * POST /api/commands/execute-stream
 * Execute command with streaming output via SSE
 */
router.post(
  '/execute-stream',
  authenticate,
  validate(commandExecutionSchema, 'body'),
  commandController.executeStream.bind(commandController)
);

/**
 * POST /api/commands/execute
 * Execute command and return full result
 */
router.post(
  '/execute',
  authenticate,
  validate(commandExecutionSchema, 'body'),
  commandController.execute.bind(commandController)
);

export default router;
