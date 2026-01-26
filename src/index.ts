import { createServer } from './server';
import config from './config/environment';
import logger from './utils/logger';
import { processManager } from './services/processManager';

const app = createServer();

const server = app.listen(config.server.port, () => {
  logger.info(`Live Bash HTTP Control System started`, {
    port: config.server.port,
    env: config.server.env,
    nodeVersion: process.version
  });
});

// Graceful shutdown
const shutdown = async (signal: string) => {
  logger.info(`${signal} received, starting graceful shutdown`);

  // Stop accepting new connections
  server.close(() => {
    logger.info('HTTP server closed');
  });

  // Kill all running processes
  processManager.killAll('SIGTERM');

  // Wait for processes to terminate
  setTimeout(() => {
    processManager.killAll('SIGKILL');
    logger.info('All processes terminated');
    process.exit(0);
  }, 5000);
};

// Handle shutdown signals
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught exception', { error: error.message, stack: error.stack });
  shutdown('uncaughtException');
});

process.on('unhandledRejection', (reason: any) => {
  logger.error('Unhandled rejection', { reason });
  shutdown('unhandledRejection');
});

export default app;
