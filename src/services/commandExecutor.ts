import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';
import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import config from '../config/environment';
import logger from '../utils/logger';
import { ValidationError, TimeoutError, CommandExecutionError } from '../utils/errors';
import {
  CommandRequest,
  CommandResult,
  ParsedCommand,
  ExecutionOptions,
  CommandOutput
} from '../models/command.model';
import { processManager } from './processManager';

export class CommandExecutor {
  private static readonly BLACKLISTED_ENV_VARS = [
    'LD_PRELOAD',
    'LD_LIBRARY_PATH',
    'DYLD_INSERT_LIBRARIES',
    'DYLD_LIBRARY_PATH'
  ];

  private static readonly ENV_VAR_PATTERN = /^[A-Z_][A-Z0-9_]*$/i;

  /**
   * Parse command string into executable and arguments
   * Platform-specific: Use cmd /c (Windows) or /bin/bash -c (Linux) for complex commands
   */
  private parseCommand(commandString: string): ParsedCommand {
    const trimmedCommand = commandString.trim();

    // Check if command contains shell operators that require shell execution
    const needsShell = /[|&><]/.test(trimmedCommand);

    if (needsShell) {
      if (process.platform === 'win32') {
        return {
          cmd: 'cmd',
          args: ['/c', trimmedCommand]
        };
      } else {
        // Linux/Unix: use bash -c
        return {
          cmd: '/bin/bash',
          args: ['-c', trimmedCommand]
        };
      }
    }

    // Simple command parsing - split by spaces, respecting quotes
    const args: string[] = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';

    for (let i = 0; i < trimmedCommand.length; i++) {
      const char = trimmedCommand[i];

      if ((char === '"' || char === "'") && !inQuotes) {
        inQuotes = true;
        quoteChar = char;
      } else if (char === quoteChar && inQuotes) {
        inQuotes = false;
        quoteChar = '';
      } else if (char === ' ' && !inQuotes) {
        if (current) {
          args.push(current);
          current = '';
        }
      } else {
        current += char;
      }
    }

    if (current) {
      args.push(current);
    }

    if (args.length === 0) {
      throw new ValidationError('Command cannot be empty');
    }

    const [cmd, ...restArgs] = args;
    return { cmd, args: restArgs };
  }

  /**
   * Validate working directory exists and is allowed
   */
  private validateWorkingDirectory(dir: string): string {
    const normalizedDir = path.resolve(dir);

    // Check if directory exists
    if (!fs.existsSync(normalizedDir)) {
      throw new ValidationError(`Working directory does not exist: ${normalizedDir}`);
    }

    // Check if it's actually a directory
    const stats = fs.statSync(normalizedDir);
    if (!stats.isDirectory()) {
      throw new ValidationError(`Path is not a directory: ${normalizedDir}`);
    }

    // Check against whitelist if configured
    const allowedDirs = config.security.allowedDirectories;
    if (allowedDirs.length > 0) {
      const isAllowed = allowedDirs.some(allowedDir => {
        const normalized = path.resolve(allowedDir);
        return normalizedDir.startsWith(normalized);
      });

      if (!isAllowed) {
        throw new ValidationError(`Working directory not in allowed list: ${normalizedDir}`);
      }
    }

    // Reject suspicious patterns
    const suspicious = ['..', '~', '$HOME'];
    if (suspicious.some(pattern => normalizedDir.includes(pattern))) {
      throw new ValidationError(`Working directory contains suspicious pattern: ${normalizedDir}`);
    }

    return normalizedDir;
  }

  /**
   * Build environment variables with validation and blacklist filtering
   */
  private buildEnvironment(customEnv?: Record<string, string>): NodeJS.ProcessEnv {
    const baseEnv = { ...process.env };

    if (!customEnv) {
      return baseEnv;
    }

    // Validate and merge custom environment variables
    for (const [key, value] of Object.entries(customEnv)) {
      // Validate variable name
      if (!CommandExecutor.ENV_VAR_PATTERN.test(key)) {
        throw new ValidationError(`Invalid environment variable name: ${key}`);
      }

      // Check blacklist
      if (CommandExecutor.BLACKLISTED_ENV_VARS.includes(key.toUpperCase())) {
        throw new ValidationError(`Environment variable is blacklisted: ${key}`);
      }

      baseEnv[key] = value;
    }

    return baseEnv;
  }

  /**
   * Execute command with streaming output via SSE
   */
  async executeWithStream(request: CommandRequest, res: Response): Promise<void> {
    const processId = uuidv4();
    const startTime = Date.now();

    let childProcess: ChildProcess | null = null;
    let outputBuffer = '';
    let exitCode = 0;

    try {
      // Prepare execution options
      const options = this.prepareExecutionOptions(request);
      const parsedCommand = this.parseCommand(options.command);

      logger.info(`Executing command (streaming): ${options.command}`, {
        processId,
        workingDirectory: options.workingDirectory,
        timeout: options.timeout
      });

      // Set up SSE headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();

      // Spawn process
      childProcess = spawn(parsedCommand.cmd, parsedCommand.args, {
        cwd: options.workingDirectory,
        env: this.buildEnvironment(options.env),
        shell: false,
        windowsHide: true
      });

      processManager.register(processId, childProcess);

      // Set up timeout
      const timeoutHandle = setTimeout(() => {
        logger.warn(`Command timeout after ${options.timeout}ms`, { processId });
        processManager.kill(processId, 'SIGTERM');

        // Force kill after 5 seconds if still running
        setTimeout(() => {
          processManager.kill(processId, 'SIGKILL');
        }, 5000);

        const errorData = JSON.stringify({ error: 'Command execution timeout' });
        res.write(`event: error\ndata: ${errorData}\n\n`);
        res.end();
      }, options.timeout);

      // Handle stdout
      childProcess.stdout?.on('data', (data: Buffer) => {
        const output = data.toString();
        outputBuffer += output;

        const eventData: CommandOutput = { type: 'stdout', data: output };
        res.write(`event: output\ndata: ${JSON.stringify(eventData)}\n\n`);
      });

      // Handle stderr
      childProcess.stderr?.on('data', (data: Buffer) => {
        const output = data.toString();
        outputBuffer += output;

        const eventData: CommandOutput = { type: 'stderr', data: output };
        res.write(`event: output\ndata: ${JSON.stringify(eventData)}\n\n`);
      });

      // Handle process exit
      childProcess.on('exit', (code: number | null) => {
        clearTimeout(timeoutHandle);
        exitCode = code ?? 1;

        const executionTime = Date.now() - startTime;
        logger.info(`Command completed`, { processId, exitCode, executionTime });

        const completeData = {
          exitCode,
          executionTime,
          historyId: processId
        };

        res.write(`event: complete\ndata: ${JSON.stringify(completeData)}\n\n`);
        res.end();

        processManager.unregister(processId);
      });

      // Handle process error
      childProcess.on('error', (error: Error) => {
        clearTimeout(timeoutHandle);
        logger.error(`Command execution error`, { processId, error: error.message });

        const errorData = JSON.stringify({ error: error.message });
        res.write(`event: error\ndata: ${errorData}\n\n`);
        res.end();

        processManager.unregister(processId);
      });

      // Handle client disconnect
      res.on('close', () => {
        clearTimeout(timeoutHandle);
        if (childProcess && !childProcess.killed) {
          logger.info(`Client disconnected, killing process`, { processId });
          processManager.kill(processId, 'SIGKILL');
        }
      });

    } catch (error) {
      logger.error(`Command execution setup failed`, { processId, error });

      if (!res.headersSent) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorData = JSON.stringify({ error: errorMessage });
      res.write(`event: error\ndata: ${errorData}\n\n`);
      res.end();

      if (childProcess) {
        processManager.unregister(processId);
      }
    }
  }

  /**
   * Execute command and return full result
   */
  async execute(request: CommandRequest): Promise<CommandResult> {
    const processId = uuidv4();
    const startTime = Date.now();

    try {
      const options = this.prepareExecutionOptions(request);
      const parsedCommand = this.parseCommand(options.command);

      logger.info(`Executing command: ${options.command}`, {
        processId,
        workingDirectory: options.workingDirectory,
        timeout: options.timeout
      });

      return await new Promise<CommandResult>((resolve, reject) => {
        let outputBuffer = '';
        let exitCode = 0;

        const childProcess = spawn(parsedCommand.cmd, parsedCommand.args, {
          cwd: options.workingDirectory,
          env: this.buildEnvironment(options.env),
          shell: false,
          windowsHide: true
        });

        processManager.register(processId, childProcess);

        // Set up timeout
        const timeoutHandle = setTimeout(() => {
          logger.warn(`Command timeout after ${options.timeout}ms`, { processId });
          processManager.kill(processId, 'SIGTERM');

          setTimeout(() => {
            processManager.kill(processId, 'SIGKILL');
          }, 5000);

          reject(new TimeoutError());
        }, options.timeout);

        // Collect stdout
        childProcess.stdout?.on('data', (data: Buffer) => {
          outputBuffer += data.toString();
        });

        // Collect stderr
        childProcess.stderr?.on('data', (data: Buffer) => {
          outputBuffer += data.toString();
        });

        // Handle process exit
        childProcess.on('exit', (code: number | null) => {
          clearTimeout(timeoutHandle);
          exitCode = code ?? 1;

          const executionTime = Date.now() - startTime;
          logger.info(`Command completed`, { processId, exitCode, executionTime });

          processManager.unregister(processId);

          resolve({
            success: exitCode === 0,
            historyId: processId,
            exitCode,
            output: outputBuffer,
            executionTime,
            timestamp: new Date()
          });
        });

        // Handle process error
        childProcess.on('error', (error: Error) => {
          clearTimeout(timeoutHandle);
          logger.error(`Command execution error`, { processId, error: error.message });
          processManager.unregister(processId);

          reject(new CommandExecutionError(error.message));
        });
      });

    } catch (error) {
      logger.error(`Command execution failed`, { processId, error });
      throw error;
    }
  }

  /**
   * Prepare execution options with defaults and validation
   */
  private prepareExecutionOptions(request: CommandRequest): ExecutionOptions {
    const workingDirectory = request.workingDirectory
      ? this.validateWorkingDirectory(request.workingDirectory)
      : config.execution.defaultWorkingDir;

    const timeout = request.timeout
      ? Math.min(request.timeout, config.execution.maxTimeout)
      : config.execution.defaultTimeout;

    if (timeout <= 0) {
      throw new ValidationError('Timeout must be greater than 0');
    }

    return {
      command: request.command,
      workingDirectory,
      timeout,
      env: request.env || {}
    };
  }
}

export const commandExecutor = new CommandExecutor();
