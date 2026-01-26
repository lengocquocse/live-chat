import { ChildProcess } from 'child_process';
import logger from '../utils/logger';

export class ProcessManager {
  private processes: Map<string, ChildProcess> = new Map();

  register(processId: string, process: ChildProcess): void {
    this.processes.set(processId, process);
    logger.debug(`Process registered: ${processId}`);
  }

  unregister(processId: string): void {
    this.processes.delete(processId);
    logger.debug(`Process unregistered: ${processId}`);
  }

  kill(processId: string, signal: NodeJS.Signals = 'SIGTERM'): boolean {
    const process = this.processes.get(processId);
    if (!process) {
      return false;
    }

    try {
      // Windows doesn't handle SIGTERM gracefully, use taskkill for force termination
      if (process.pid && process.platform === 'win32' && signal === 'SIGKILL') {
        const { execSync } = require('child_process');
        execSync(`taskkill /F /T /PID ${process.pid}`, { stdio: 'ignore' });
        logger.info(`Process ${processId} force killed with taskkill`);
      } else {
        process.kill(signal);
        logger.info(`Process ${processId} killed with ${signal}`);
      }
      return true;
    } catch (error) {
      logger.error(`Failed to kill process ${processId}:`, error);
      return false;
    }
  }

  killAll(signal: NodeJS.Signals = 'SIGTERM'): void {
    logger.info(`Killing all ${this.processes.size} processes`);
    this.processes.forEach((_, processId) => {
      this.kill(processId, signal);
    });
    this.processes.clear();
  }

  getActiveCount(): number {
    return this.processes.size;
  }
}

export const processManager = new ProcessManager();
