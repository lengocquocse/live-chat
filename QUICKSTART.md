# Quick Start Guide

> **🐧 Ubuntu 22.04 / SSH Users?** See [UBUNTU_SETUP.md](UBUNTU_SETUP.md) for Ubuntu-specific quick start!

## Installation

1. **Install dependencies**:
```bash
npm install
```

2. **Review configuration** (already set up in `.env`):
   - Default API keys: `dev-api-key-12345` and `dev-api-key-67890`
   - Port: 3000
   - Working directory: Q:\Projects\live-bash

   **⚠️ IMPORTANT**: Change the API keys before deploying to production!

## Running the Server

### Development Mode (with hot reload)
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm start
```

The server will start on http://localhost:3000

## Using the Web UI (Recommended)

The easiest way to interact with Live Bash is through the web interface:

1. **Start the server** (if not already running):
   ```bash
   npm run dev
   ```

2. **Open your browser** and go to:
   ```
   http://localhost:3000
   ```

3. **You'll see the Live Bash Control interface** with:
   - Command execution form
   - Real-time output display
   - Command history viewer
   - Settings panel

4. **Execute your first command**:
   - Enter a command: `echo Hello World`
   - Click **Execute** or press `Ctrl+Enter`
   - Watch the output appear in real-time!

5. **Features**:
   - 🎨 Dark mode toggle
   - ⚡ Real-time streaming output
   - 📝 Command history
   - ⚙️ Environment variables
   - ⏱️ Custom timeouts

📖 **For detailed UI guide, see [UI_GUIDE.md](UI_GUIDE.md)**

## Testing the API (Command Line)

### 1. Health Check
```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2026-01-26T10:30:00.000Z"
}
```

### 2. Execute a Simple Command
```bash
curl http://localhost:3000/api/commands/execute \
  -H "Authorization: Bearer dev-api-key-12345" \
  -H "Content-Type: application/json" \
  -d '{"command":"echo Hello World"}'
```

Expected response:
```json
{
  "success": true,
  "historyId": "uuid-...",
  "exitCode": 0,
  "output": "Hello World\n",
  "executionTime": 123,
  "timestamp": "2026-01-26T..."
}
```

### 3. Execute with Streaming Output
```bash
curl -N http://localhost:3000/api/commands/execute-stream \
  -H "Authorization: Bearer dev-api-key-12345" \
  -H "Content-Type: application/json" \
  -d '{"command":"ls -la"}'
```

You'll see real-time output as Server-Sent Events.

### 4. View Command History
```bash
curl http://localhost:3000/api/history \
  -H "Authorization: Bearer dev-api-key-12345"
```

### 5. Execute in Specific Directory
```bash
curl http://localhost:3000/api/commands/execute \
  -H "Authorization: Bearer dev-api-key-12345" \
  -H "Content-Type: application/json" \
  -d '{"command":"ls -la","workingDirectory":"/var/www"}'
```

### 6. Execute with Environment Variables
```bash
curl http://localhost:3000/api/commands/execute \
  -H "Authorization: Bearer dev-api-key-12345" \
  -H "Content-Type: application/json" \
  -d '{"command":"echo $MY_VAR","env":{"MY_VAR":"test123"}}'
```

## Common Commands to Test

### Linux/Ubuntu Commands
- `echo Hello World` - Simple echo
- `ls -la` - List directory contents (detailed)
- `pwd` - Print working directory
- `uname -a` - Show system information
- `df -h` - Show disk space
- `free -h` - Show memory usage
- `hostname` - Show computer name
- `whoami` - Show current user
- `date` - Show current date/time
- `env` - Show environment variables
- `ps aux | head -20` - Show running processes (top 20)

### With Timeout
```bash
curl http://localhost:3000/api/commands/execute \
  -H "Authorization: Bearer dev-api-key-12345" \
  -H "Content-Type: application/json" \
  -d '{"command":"sleep 30","timeout":2000}'
```
This will timeout after 2 seconds instead of waiting 30 seconds.

## Next Steps

1. ✅ Install dependencies: `npm install`
2. ✅ Review `.env` configuration
3. ✅ Start server: `npm run dev`
4. ✅ Test health endpoint
5. ✅ Execute a test command
6. ✅ View command history
7. 📖 Read full documentation in `README.md`
8. 🔒 Generate secure API keys for production: `openssl rand -hex 32`
9. 🚀 Deploy with PM2 or systemd

## Troubleshooting

### Port Already in Use
Change the port in `.env`:
```env
PORT=3001
```

### API Key Not Working
Make sure you're using the exact key from `.env` and including the `Bearer` prefix:
```
Authorization: Bearer dev-api-key-12345
```

### Command Not Found
Use full path or make sure the command is in your system PATH:
```json
{
  "command": "/usr/bin/node --version"
}
```

### Rate Limit Exceeded
Wait 60 seconds or increase the limit in `.env`:
```env
RATE_LIMIT_MAX_REQUESTS=100
```

## Project Structure Overview

```
live-bash/
├── src/
│   ├── index.ts              # Entry point
│   ├── server.ts             # Express setup
│   ├── config/               # Configuration
│   ├── middleware/           # Auth, validation, errors
│   ├── routes/               # API endpoints
│   ├── controllers/          # Request handlers
│   ├── services/             # Business logic
│   ├── models/               # TypeScript types
│   └── utils/                # Helpers
├── data/                     # Command history (created at runtime)
├── logs/                     # Application logs (created at runtime)
├── .env                      # Configuration (ready to use)
├── package.json              # Dependencies
├── tsconfig.json             # TypeScript config
└── README.md                 # Full documentation
```

## Support

For detailed documentation, see `README.md`.
For issues, check the logs in `logs/app.log`.
