# Quick Setup for Ubuntu 22.04

This is a quick reference guide for setting up Live Bash on Ubuntu 22.04 over SSH.

## Quick Start (5 minutes)

```bash
# 1. Install Node.js 20+ (if not installed)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 2. Navigate to project (or upload/clone it first)
cd ~/live-bash

# 3. Install dependencies
npm install

# 4. Configure environment
cp .env.example .env
nano .env  # Edit API keys and paths

# 5. Build project
npm run build

# 6. Start server
npm start
```

Server will be running on `http://localhost:3000`

## Access from Your Computer

### Option 1: SSH Tunnel (Secure)

```bash
# From your local computer:
ssh -L 3000:localhost:3000 user@server-ip

# Then open browser to:
http://localhost:3000
```

### Option 2: Open Port (Less Secure)

```bash
# On server:
sudo ufw allow 3000/tcp

# Then open browser to:
http://server-ip:3000
```

### Option 3: Nginx + SSL (Production)

See [SSH_DEPLOYMENT.md](SSH_DEPLOYMENT.md) for full setup.

## Generate Secure API Keys

```bash
# Generate keys
openssl rand -hex 32
openssl rand -hex 32

# Update .env file
nano .env
# Replace API_KEYS with generated keys
```

## Run in Background

### Quick & Simple (PM2)

```bash
# Install PM2
sudo npm install -g pm2

# Start server
pm2 start dist/index.js --name live-bash

# View logs
pm2 logs live-bash

# Auto-start on reboot
pm2 startup systemd
pm2 save

# Control commands
pm2 restart live-bash  # Restart
pm2 stop live-bash     # Stop
pm2 status             # Check status
```

## Test It's Working

```bash
# Test health endpoint
curl http://localhost:3000/api/health

# Test command execution
curl http://localhost:3000/api/commands/execute \
  -H "Authorization: Bearer dev-api-key-12345" \
  -H "Content-Type: application/json" \
  -d '{"command":"uname -a"}'
```

## Common Linux Commands to Try

Once you access the Web UI at `http://localhost:3000`:

**System Information:**
- `uname -a` - System info
- `hostname` - Server name
- `whoami` - Current user
- `date` - Current date/time

**File Operations:**
- `ls -la` - List files
- `pwd` - Current directory
- `df -h` - Disk space
- `du -sh *` - Directory sizes

**Process Management:**
- `ps aux | head -20` - Running processes
- `free -h` - Memory usage
- `uptime` - System uptime

**Networking:**
- `ip addr show` - Network interfaces
- `ping -c 4 google.com` - Ping test
- `curl ifconfig.me` - Public IP

## Configuration for Ubuntu

The `.env` file is already configured with Linux paths:

```env
PORT=3000
NODE_ENV=development

# Update these!
API_KEYS=dev-api-key-12345,dev-api-key-67890
ALLOWED_DIRECTORIES=/home,/var/www,/tmp

DEFAULT_TIMEOUT=120000
DEFAULT_WORKING_DIR=/home
```

## File Locations

- **Configuration**: `~/live-bash/.env`
- **Application logs**: `~/live-bash/logs/app.log`
- **Command history**: `~/live-bash/data/history.json`
- **Source code**: `~/live-bash/src/`
- **Built files**: `~/live-bash/dist/`

## Troubleshooting

### Port already in use
```bash
# Find what's using port 3000
sudo lsof -i :3000

# Kill it
sudo kill $(sudo lsof -t -i:3000)
```

### Permission errors
```bash
# Fix ownership
sudo chown -R $USER:$USER ~/live-bash

# Fix permissions
chmod -R 755 ~/live-bash
```

### Can't connect remotely
```bash
# Check if server is listening
sudo netstat -tulpn | grep 3000

# Allow port in firewall
sudo ufw allow 3000/tcp
sudo ufw reload
```

### Server stops when SSH disconnects
Use PM2 or systemd (see [SSH_DEPLOYMENT.md](SSH_DEPLOYMENT.md))

## View Logs

```bash
# Application logs
tail -f ~/live-bash/logs/app.log

# PM2 logs (if using PM2)
pm2 logs live-bash

# System logs (if using systemd)
sudo journalctl -u live-bash -f
```

## Update Application

```bash
cd ~/live-bash
git pull  # or upload new files
npm install
npm run build
pm2 restart live-bash  # or systemctl restart live-bash
```

## Security Recommendations

1. ✅ **Generate secure API keys** (32 bytes): `openssl rand -hex 32`
2. ✅ **Use HTTPS** in production (setup Nginx with SSL)
3. ✅ **Restrict allowed directories** in `.env`
4. ✅ **Enable firewall**: `sudo ufw enable`
5. ✅ **Keep system updated**: `sudo apt update && sudo apt upgrade`
6. ✅ **Use SSH tunnel** for remote access instead of opening ports

## Need More Help?

- **Full deployment guide**: See [SSH_DEPLOYMENT.md](SSH_DEPLOYMENT.md)
- **API documentation**: See [README.md](README.md)
- **Quick start**: See [QUICKSTART.md](QUICKSTART.md)
- **Web UI guide**: See [UI_GUIDE.md](UI_GUIDE.md)

## Platform Changes Made

This system has been optimized for Ubuntu/Linux:

- ✅ Command parsing uses `/bin/bash -c` for complex commands
- ✅ Linux-style paths (`/home`, `/var/www`, etc.)
- ✅ Linux command examples throughout documentation
- ✅ SSH deployment instructions
- ✅ systemd and PM2 configuration
- ✅ Nginx reverse proxy setup
- ✅ Ubuntu firewall (UFW) configuration

The system still works on Windows, but all examples and defaults are now Linux-focused for Ubuntu 22.04.
