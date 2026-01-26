export interface CommandRequest {
  command: string;
  workingDirectory?: string;
  timeout?: number;
  env?: Record<string, string>;
}

export interface CommandOutput {
  type: 'stdout' | 'stderr';
  data: string;
}

export interface CommandResult {
  success: boolean;
  historyId: string;
  exitCode: number;
  output: string;
  executionTime: number;
  timestamp: Date;
}

export interface ParsedCommand {
  cmd: string;
  args: string[];
}

export interface ExecutionOptions {
  command: string;
  workingDirectory: string;
  timeout: number;
  env: Record<string, string>;
}
