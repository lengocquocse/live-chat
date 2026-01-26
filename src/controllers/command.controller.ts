import { Request, Response, NextFunction } from 'express';
import { commandExecutor } from '../services/commandExecutor';
import { historyManager } from '../services/historyManager';
import { CommandRequest } from '../models/command.model';
import { HistoryEntry } from '../models/history.model';
import logger from '../utils/logger';

export class CommandController {
  /**
   * Execute command with streaming output (SSE)
   */
  async executeStream(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const request: CommandRequest = req.body;

      // Store original res.write and res.end to intercept and save to history
      let historyId = '';
      let exitCode = 0;
      let output = '';
      let executionTime = 0;
      const startTime = Date.now();

      const originalWrite = res.write.bind(res);
      const originalEnd = res.end.bind(res);

      res.write = function (chunk: any, ...args: any[]): boolean {
        // Capture output for history
        if (typeof chunk === 'string') {
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.substring(6));
                if (data.data) {
                  output += data.data;
                } else if (data.exitCode !== undefined) {
                  exitCode = data.exitCode;
                  executionTime = data.executionTime;
                  historyId = data.historyId;
                }
              } catch (e) {
                // Ignore parse errors
              }
            }
          }
        }
        return originalWrite(chunk, ...args);
      };

      res.end = function (...args: any[]): any {
        // Save to history when response ends
        if (historyId) {
          const entry: HistoryEntry = {
            id: historyId,
            command: request.command,
            workingDirectory: request.workingDirectory || process.cwd(),
            exitCode,
            output: output.trim(),
            executionTime,
            timestamp: new Date(),
            success: exitCode === 0
          };

          historyManager.addEntry(entry).catch(error => {
            logger.error('Failed to save history entry', { error, historyId });
          });
        }

        return originalEnd(...args);
      };

      await commandExecutor.executeWithStream(request, res);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Execute command and return full result
   */
  async execute(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const request: CommandRequest = req.body;

      const result = await commandExecutor.execute(request);

      // Save to history
      const entry: HistoryEntry = {
        id: result.historyId,
        command: request.command,
        workingDirectory: request.workingDirectory || process.cwd(),
        exitCode: result.exitCode,
        output: result.output.trim(),
        executionTime: result.executionTime,
        timestamp: result.timestamp,
        success: result.success
      };

      await historyManager.addEntry(entry);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const commandController = new CommandController();
