import { Router } from 'express';
import commandRoutes from './command.routes';
import historyRoutes from './history.routes';

const router = Router();

// Mount routes
router.use('/commands', commandRoutes);
router.use('/history', historyRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

export default router;
