export class ValidationError extends Error {
  public readonly statusCode: number = 400;

  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class AuthenticationError extends Error {
  public readonly statusCode: number = 403;

  constructor(message: string = 'Invalid API key') {
    super(message);
    this.name = 'AuthenticationError';
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

export class CommandExecutionError extends Error {
  public readonly statusCode: number = 500;
  public readonly exitCode?: number;
  public readonly stderr?: string;

  constructor(message: string, exitCode?: number, stderr?: string) {
    super(message);
    this.name = 'CommandExecutionError';
    this.exitCode = exitCode;
    this.stderr = stderr;
    Object.setPrototypeOf(this, CommandExecutionError.prototype);
  }
}

export class TimeoutError extends Error {
  public readonly statusCode: number = 408;

  constructor(message: string = 'Command execution timeout') {
    super(message);
    this.name = 'TimeoutError';
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}
