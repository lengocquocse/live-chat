# Live Bash HTTP Control System

A secure Node.js + Express system that executes bash commands via HTTP with real-time streaming output, API key authentication, and command history tracking.

> **🐧 Ubuntu 22.04 Users**: See [UBUNTU_SETUP.md](UBUNTU_SETUP.md) for quick 5-minute setup guide
>
> **🔐 SSH Users**: See [SSH_DEPLOYMENT.md](SSH_DEPLOYMENT.md) for complete deployment guide with PM2, systemd, and Nginx

## Features

- **🌐 Web UI**: Modern, responsive web interface with dark mode support
- **HTTP Command Execution**: Execute bash/shell commands via REST API
- **Real-time Streaming**: Server-Sent Events (SSE) for live output streaming
- **Security First**: API key authentication, command injection prevention, path traversal protection
- **Command History**: Persistent history with pagination and search
- **Rate Limiting**: Per-API-key rate limiting to prevent abuse
- **Windows Compatible**: Full support for Windows paths and command execution
- **Timeout Control**: Configurable command timeouts with graceful termination
- **Environment Variables**: Pass custom environment variables per command

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd live-bash

# Install dependencies
npm install

# Copy environment template
copy .env.example .env

# Edit .env and set your configuration
# Generate secure API keys with: openssl rand -hex 32

# Start development server
npm run dev

# Or build and start production
npm run build
npm start
```

## Web Interface

Live Bash includes a modern web UI for easy command execution and monitoring.

### Accessing the UI

1. Start the server: `npm run dev`
2. Open your browser to: `http://localhost:3000`
3. Enter commands, view real-time output, and browse history!

### Features

- ⚡ Real-time command execution with streaming output
- 🎨 Dark mode support
- 📊 Execution statistics (exit code, execution time)
- 📝 Command history viewer
- ⚙️ Environment variables configuration
- ⏱️ Custom timeout settings
- 📱 Responsive design (works on mobile)

See [UI_GUIDE.md](UI_GUIDE.md) for detailed documentation.

## Configuration

Edit `.env` file with your settings:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Security - IMPORTANT: Generate secure keys!
API_KEYS=your-secret-key-1,your-secret-key-2
ALLOWED_DIRECTORIES=Q:\Projects

# Execution Configuration
DEFAULT_TIMEOUT=120000
MAX_TIMEOUT=600000
DEFAULT_WORKING_DIR=Q:\Projects\live-bash

# History Configuration
HISTORY_FILE=data/history.json
HISTORY_MAX_SIZE=10485760
MAX_HISTORY_ENTRIES=1000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=30

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log
```

## API Endpoints

### 1. Execute Command (Streaming)

Execute a command with real-time output streaming via Server-Sent Events.

**Endpoint**: `POST /api/commands/execute-stream`

**Headers**:
```
Authorization: Bearer <API_KEY>
Content-Type: application/json
```

**Request Body**:
```json
{
  "command": "npm install",
  "workingDirectory": "/var/www/my-app",
  "timeout": 30000,
  "env": {
    "NODE_ENV": "production"
  }
}
```

**Response**: Server-Sent Events stream

```
event: output
data: {"type":"stdout","data":"Installing packages...\n"}

event: output
data: {"type":"stdout","data":"Done.\n"}

event: complete
data: {"exitCode":0,"executionTime":5234,"historyId":"uuid-123"}
```

**Example (curl)**:
```bash
curl -N http://localhost:3000/api/commands/execute-stream \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"command":"ls -la","workingDirectory":"/var/www"}'
```

### 2. Execute Command (Standard)

Execute a command and return the complete result.

**Endpoint**: `POST /api/commands/execute`

**Headers**:
```
Authorization: Bearer <API_KEY>
Content-Type: application/json
```

**Request Body**:
```json
{
  "command": "echo Hello World",
  "workingDirectory": "/home",
  "timeout": 30000,
  "env": {
    "MY_VAR": "value"
  }
}
```

**Response**:
```json
{
  "success": true,
  "historyId": "uuid-123",
  "exitCode": 0,
  "output": "Hello World\n",
  "executionTime": 234,
  "timestamp": "2026-01-26T10:30:00.000Z"
}
```

**Example (curl)**:
```bash
curl http://localhost:3000/api/commands/execute \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d "{\"command\":\"echo Hello World\"}"
```

### 3. Get Command History

Retrieve paginated command history.

**Endpoint**: `GET /api/history?limit=50&offset=0`

**Headers**:
```
Authorization: Bearer <API_KEY>
```

**Query Parameters**:
- `limit` (optional): Number of entries to return (1-1000, default: 50)
- `offset` (optional): Number of entries to skip (default: 0)

**Response**:
```json
{
  "success": true,
  "total": 150,
  "entries": [
    {
      "id": "uuid-123",
      "command": "echo Hello",
      "workingDirectory": "Q:\\Projects",
      "exitCode": 0,
      "output": "Hello\n",
      "executionTime": 123,
      "timestamp": "2026-01-26T10:30:00.000Z",
      "success": true
    }
  ]
}
```

**Example (curl)**:
```bash
curl http://localhost:3000/api/history?limit=10 \
  -H "Authorization: Bearer your-api-key"
```

### 4. Get Single History Entry

Retrieve a specific command history entry.

**Endpoint**: `GET /api/history/:id`

**Headers**:
```
Authorization: Bearer <API_KEY>
```

**Response**:
```json
{
  "success": true,
  "entry": {
    "id": "uuid-123",
    "command": "echo Hello",
    "workingDirectory": "Q:\\Projects",
    "exitCode": 0,
    "output": "Hello\n",
    "executionTime": 123,
    "timestamp": "2026-01-26T10:30:00.000Z",
    "success": true
  }
}
```

**Example (curl)**:
```bash
curl http://localhost:3000/api/history/uuid-123 \
  -H "Authorization: Bearer your-api-key"
```

### 5. Clear History

Delete all command history.

**Endpoint**: `DELETE /api/history`

**Headers**:
```
Authorization: Bearer <API_KEY>
```

**Response**:
```json
{
  "success": true,
  "message": "History cleared successfully"
}
```

**Example (curl)**:
```bash
curl -X DELETE http://localhost:3000/api/history \
  -H "Authorization: Bearer your-api-key"
```

### 6. Health Check

Check if the server is running.

**Endpoint**: `GET /api/health`

**Response**:
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2026-01-26T10:30:00.000Z"
}
```

**Example (curl)**:
```bash
curl http://localhost:3000/api/health
```

## Security Features

### 1. API Key Authentication

- All endpoints (except health check) require API key authentication
- Keys are passed via `Authorization: Bearer <key>` header
- Timing-safe comparison prevents timing attacks
- Multiple API keys supported for rotation
- Keys are hashed in logs

### 2. Command Injection Prevention

- **Never uses `shell: true`** - commands are parsed into executable + args
- Uses `cmd /c` wrapper only for complex commands with pipes/redirects
- All arguments are properly escaped

### 3. Path Traversal Protection

- Working directories are normalized with `path.resolve()`
- Directory existence validation
- Optional whitelist of allowed directories
- Rejects suspicious patterns (`..`, `~`, `$HOME`)

### 4. Environment Variable Security

- Blacklisted dangerous variables (LD_PRELOAD, DYLD_INSERT_LIBRARIES, etc.)
- Variable name validation with regex
- Sensitive variables never logged

### 5. Rate Limiting

- Per-API-key tracking
- Default: 30 requests per 60 seconds
- Configurable via environment variables

### 6. Security Headers (Helmet)

- Content Security Policy
- HSTS (HTTP Strict Transport Security)
- X-Frame-Options, X-Content-Type-Options

## Platform-Specific Handling

### Command Parsing

The system automatically detects the platform and handles shell operators:

**Linux/Ubuntu:**
```bash
# Commands with pipes/redirects use /bin/bash -c
"ls | grep .txt"  // → /bin/bash -c "ls | grep .txt"

# Simple commands are parsed directly
"echo Hello"  // → echo ["Hello"]
```

**Windows:**
```bash
# Commands with pipes/redirects use cmd /c
"dir | findstr .txt"  // → cmd /c "dir | findstr .txt"

# Simple commands are parsed directly
"echo Hello"  // → echo ["Hello"]
```

### Path Handling

**Linux/Ubuntu:**
- Forward slashes: `/home/user/project`
- Absolute paths: `/var/www/html`
- Tilde expansion handled by shell: `~/project`
- Relative paths: `./script.sh`

**Windows:**
- Backslashes: `Q:\Projects\my-app`
- UNC paths: `\\server\share\folder`
- Drive letters: `C:`, `D:`, `Q:`

### Process Termination

**Linux/Ubuntu:**
- SIGTERM sent first for graceful shutdown
- SIGKILL used after 5-second grace period
- Standard Unix signal handling

**Windows:**
- SIGTERM emulated but not fully supported
- Uses `taskkill /F /T` for force termination
- Fallback to `process.kill('SIGKILL')`

## Error Handling

### HTTP Status Codes

- **200**: Success
- **400**: Validation error (invalid request data)
- **403**: Authentication error (invalid API key)
- **404**: Not found (route or history entry)
- **408**: Timeout (command execution timeout)
- **429**: Too many requests (rate limit exceeded)
- **500**: Server error (command execution failed)

### Error Response Format

```json
{
  "success": false,
  "error": "Error message",
  "details": {}
}
```

## Usage Examples

### Execute a Simple Command

```bash
curl http://localhost:3000/api/commands/execute \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"command":"echo Hello World"}'
```

### Execute with Working Directory

```bash
curl http://localhost:3000/api/commands/execute \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"command":"ls -la","workingDirectory":"/var/www"}'
```

### Execute with Environment Variables

```bash
curl http://localhost:3000/api/commands/execute \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"command":"echo $MY_VAR","env":{"MY_VAR":"test123"}}'
```

### Execute with Timeout

```bash
curl http://localhost:3000/api/commands/execute \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"command":"sleep 30","timeout":2000}'
```

### Stream Command Output

```bash
curl -N http://localhost:3000/api/commands/execute-stream \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"command":"npm install express"}'
```

### View Command History

```bash
curl http://localhost:3000/api/history?limit=10 \
  -H "Authorization: Bearer your-api-key"
```

## Development

### Scripts

```bash
# Development with hot reload
npm run dev

# Build TypeScript
npm run build

# Start production server
npm start

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Project Structure

```
src/
├── index.ts              # Application entry point
├── server.ts             # Express server setup
├── config/
│   └── environment.ts    # Configuration management
├── middleware/
│   ├── auth.ts           # API key authentication
│   ├── errorHandler.ts   # Global error handling
│   └── validation.ts     # Request validation
├── routes/
│   ├── index.ts          # Route aggregation
│   ├── command.routes.ts # Command endpoints
│   └── history.routes.ts # History endpoints
├── controllers/
│   ├── command.controller.ts  # Command logic
│   └── history.controller.ts  # History logic
├── services/
│   ├── commandExecutor.ts     # Core execution
│   ├── historyManager.ts      # History persistence
│   └── processManager.ts      # Process lifecycle
├── models/
│   ├── command.model.ts       # Command types
│   └── history.model.ts       # History types
└── utils/
    ├── logger.ts              # Winston logger
    └── errors.ts              # Custom errors
```

## Production Deployment

### Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Generate secure API keys: `openssl rand -hex 32`
- [ ] Configure HTTPS with reverse proxy (nginx/caddy)
- [ ] Set up firewall rules
- [ ] Enable log rotation
- [ ] Use process manager (PM2 or systemd)
- [ ] Configure monitoring/alerting
- [ ] Set allowed directories whitelist
- [ ] Regularly rotate API keys
- [ ] Set up automatic backups

### Using PM2

```bash
# Install PM2
npm install -g pm2

# Build the project
npm run build

# Start with PM2
pm2 start dist/index.js --name live-bash

# View logs
pm2 logs live-bash

# Restart
pm2 restart live-bash

# Stop
pm2 stop live-bash
```

### Nginx Reverse Proxy

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

## Troubleshooting

### Command Not Found

Make sure the command is in your system's PATH or use absolute path:

```json
{
  "command": "C:\\Program Files\\nodejs\\node.exe --version"
}
```

### Working Directory Access Denied

Check that the directory exists and is in the allowed directories list:

```env
ALLOWED_DIRECTORIES=Q:\Projects,C:\Users\YourUser
```

### Command Timeout

Increase the timeout for long-running commands:

```json
{
  "command": "npm install",
  "timeout": 300000
}
```

### Rate Limit Exceeded

Wait for the rate limit window to reset or increase the limit:

```env
RATE_LIMIT_MAX_REQUESTS=100
```

## License

ISC

## Security Notes

- Always use HTTPS in production
- Rotate API keys regularly
- Restrict allowed directories to minimum needed
- Monitor command execution logs for suspicious activity
- Set appropriate timeout limits
- Use firewall rules to restrict access to trusted IPs only
- Never expose this service directly to the internet without proper security measures

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## Support

For issues and questions, please open an issue on GitHub.
