import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

export interface Config {
  server: {
    port: number;
    env: string;
  };
  security: {
    apiKeys: string[];
    allowedDirectories: string[];
  };
  execution: {
    defaultTimeout: number;
    maxTimeout: number;
    defaultWorkingDir: string;
  };
  history: {
    filePath: string;
    maxSize: number;
    maxEntries: number;
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  logging: {
    level: string;
    filePath: string;
  };
}

const parseApiKeys = (keys: string | undefined): string[] => {
  if (!keys) {
    throw new Error('API_KEYS environment variable is required');
  }
  return keys.split(',').map(key => key.trim()).filter(key => key.length > 0);
};

const parseAllowedDirectories = (dirs: string | undefined): string[] => {
  if (!dirs) return [];
  return dirs.split(',').map(dir => dir.trim()).filter(dir => dir.length > 0);
};

const config: Config = {
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    env: process.env.NODE_ENV || 'development'
  },
  security: {
    apiKeys: parseApiKeys(process.env.API_KEYS),
    allowedDirectories: parseAllowedDirectories(process.env.ALLOWED_DIRECTORIES)
  },
  execution: {
    defaultTimeout: parseInt(process.env.DEFAULT_TIMEOUT || '120000', 10),
    maxTimeout: parseInt(process.env.MAX_TIMEOUT || '600000', 10),
    defaultWorkingDir: process.env.DEFAULT_WORKING_DIR || process.cwd()
  },
  history: {
    filePath: path.resolve(process.cwd(), process.env.HISTORY_FILE || 'data/history.json'),
    maxSize: parseInt(process.env.HISTORY_MAX_SIZE || '10485760', 10),
    maxEntries: parseInt(process.env.MAX_HISTORY_ENTRIES || '1000', 10)
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '30', 10)
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    filePath: process.env.LOG_FILE || 'logs/app.log'
  }
};

// Validate configuration
if (config.execution.defaultTimeout > config.execution.maxTimeout) {
  throw new Error('DEFAULT_TIMEOUT cannot exceed MAX_TIMEOUT');
}

if (config.security.apiKeys.length === 0) {
  throw new Error('At least one API key must be configured');
}

export default config;
