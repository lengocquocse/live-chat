# Live Bash - SSH Deployment Guide for Ubuntu 22.04

This guide covers deploying Live Bash on Ubuntu 22.04 when accessing the server via SSH.

## Prerequisites

- Ubuntu 22.04 LTS server
- SSH access to the server
- Node.js 20+ installed
- npm installed
- Domain name (optional, for remote access)

## Installation on Ubuntu Server

### 1. Connect to Your Server

```bash
ssh username@your-server-ip
```

### 2. Install Node.js 20+ (if not installed)

```bash
# Update package list
sudo apt update

# Install Node.js 20.x from NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version
```

### 3. Clone or Upload Project

**Option A: If using Git:**
```bash
cd ~
git clone <your-repository-url> live-bash
cd live-bash
```

**Option B: Upload via SCP:**
```bash
# From your local machine:
scp -r /path/to/live-bash username@your-server-ip:~/
```

**Option C: Create manually and upload files:**
```bash
mkdir -p ~/live-bash
cd ~/live-bash
# Then upload files via SFTP or SCP
```

### 4. Install Dependencies

```bash
cd ~/live-bash
npm install
```

### 5. Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit configuration
nano .env
```

Update the `.env` file for your server:

```env
# Server Configuration
PORT=3000
NODE_ENV=production

# Security - GENERATE SECURE KEYS!
API_KEYS=$(openssl rand -hex 32),$(openssl rand -hex 32)
ALLOWED_DIRECTORIES=/home,/var/www,/opt

# Execution Configuration
DEFAULT_TIMEOUT=120000
MAX_TIMEOUT=600000
DEFAULT_WORKING_DIR=/home/username

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

Save and exit (Ctrl+X, then Y, then Enter).

### 6. Generate Secure API Keys

```bash
# Generate first key
openssl rand -hex 32

# Generate second key
openssl rand -hex 32

# Copy these keys and update API_KEYS in .env
nano .env
```

## Running the Server

### Option 1: Direct Run (for testing)

```bash
npm run build
npm start
```

The server will run on port 3000 but will stop when you close SSH.

### Option 2: Run with nohup (basic background)

```bash
npm run build
nohup npm start > output.log 2>&1 &

# Check if running
ps aux | grep node

# View logs
tail -f output.log

# Stop server
pkill -f "node dist/index.js"
```

### Option 3: Run with PM2 (recommended)

PM2 is a production process manager for Node.js with built-in load balancer.

```bash
# Install PM2 globally
sudo npm install -g pm2

# Build the project
npm run build

# Start with PM2
pm2 start dist/index.js --name live-bash

# View status
pm2 status

# View logs
pm2 logs live-bash

# Monitor
pm2 monit

# Restart
pm2 restart live-bash

# Stop
pm2 stop live-bash

# Setup PM2 to start on server reboot
pm2 startup systemd
pm2 save

# Delete from PM2
pm2 delete live-bash
```

### Option 4: Run as systemd Service (production)

Create a systemd service file:

```bash
sudo nano /etc/systemd/system/live-bash.service
```

Add the following content (replace `username` with your actual username):

```ini
[Unit]
Description=Live Bash HTTP Control System
After=network.target

[Service]
Type=simple
User=username
WorkingDirectory=/home/username/live-bash
Environment=NODE_ENV=production
ExecStart=/usr/bin/node /home/username/live-bash/dist/index.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=live-bash

[Install]
WantedBy=multi-user.target
```

Save and enable the service:

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable service to start on boot
sudo systemctl enable live-bash

# Start the service
sudo systemctl start live-bash

# Check status
sudo systemctl status live-bash

# View logs
sudo journalctl -u live-bash -f

# Restart
sudo systemctl restart live-bash

# Stop
sudo systemctl stop live-bash
```

## Accessing the Server

### From Local SSH Tunnel (secure)

If you're accessing via SSH, create an SSH tunnel:

```bash
# From your local machine:
ssh -L 3000:localhost:3000 username@your-server-ip
```

Then open your local browser to: `http://localhost:3000`

### From Server Network

If on the same network as the server:

```bash
http://server-ip:3000
```

Make sure firewall allows port 3000:

```bash
# UFW firewall
sudo ufw allow 3000/tcp
sudo ufw reload

# Check status
sudo ufw status
```

### From Internet (with Nginx reverse proxy)

For secure public access, use Nginx with SSL.

## Setting Up Nginx Reverse Proxy

### 1. Install Nginx

```bash
sudo apt update
sudo apt install nginx
```

### 2. Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/live-bash
```

Add configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Redirect HTTP to HTTPS (after SSL setup)
    # return 301 https://$server_name$request_uri;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # SSE support
        proxy_buffering off;
        proxy_read_timeout 86400;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/live-bash /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 3. Setup SSL with Let's Encrypt (recommended)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Certificate will auto-renew
```

After SSL setup, your site will be available at: `https://your-domain.com`

## Firewall Configuration

### Allow necessary ports

```bash
# Allow SSH (if not already allowed)
sudo ufw allow 22/tcp

# Allow HTTP
sudo ufw allow 80/tcp

# Allow HTTPS
sudo ufw allow 443/tcp

# Allow Live Bash port (only if not using Nginx)
sudo ufw allow 3000/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

## Security Best Practices

### 1. Use Strong API Keys

```bash
# Generate 32-byte keys
openssl rand -hex 32
```

### 2. Restrict Allowed Directories

In `.env`:
```env
ALLOWED_DIRECTORIES=/home/username/projects,/var/www
```

### 3. Setup HTTPS

Always use HTTPS in production (see Nginx SSL setup above).

### 4. Restrict Access by IP (optional)

In Nginx config:
```nginx
location / {
    allow 203.0.113.0/24;  # Your IP range
    deny all;

    proxy_pass http://localhost:3000;
    # ... rest of config
}
```

### 5. Enable Fail2Ban for SSH

```bash
sudo apt install fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 6. Keep System Updated

```bash
sudo apt update && sudo apt upgrade -y
```

## Monitoring and Logs

### Check Application Logs

**If using PM2:**
```bash
pm2 logs live-bash
pm2 logs live-bash --lines 100
```

**If using systemd:**
```bash
sudo journalctl -u live-bash -f
sudo journalctl -u live-bash --since "1 hour ago"
```

**Application logs:**
```bash
tail -f ~/live-bash/logs/app.log
```

### Monitor System Resources

```bash
# CPU and Memory
htop

# Disk usage
df -h

# Service status
sudo systemctl status live-bash

# PM2 monitor
pm2 monit
```

## Testing the Deployment

### 1. Test Health Endpoint

```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2026-01-26T..."
}
```

### 2. Test Command Execution

```bash
curl http://localhost:3000/api/commands/execute \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"command":"uname -a"}'
```

### 3. Access Web UI

Open browser to:
- Local: `http://localhost:3000`
- Remote: `https://your-domain.com`

## Troubleshooting

### Server won't start

```bash
# Check logs
pm2 logs live-bash
# or
sudo journalctl -u live-bash -n 50

# Check if port is already in use
sudo lsof -i :3000

# Kill process on port 3000
sudo kill $(sudo lsof -t -i:3000)
```

### Can't connect from outside

```bash
# Check if server is listening
sudo netstat -tulpn | grep 3000

# Check firewall
sudo ufw status

# Check Nginx
sudo nginx -t
sudo systemctl status nginx
```

### Permission denied errors

```bash
# Fix ownership
sudo chown -R username:username ~/live-bash

# Fix permissions
chmod -R 755 ~/live-bash
```

### High memory usage

```bash
# Check processes
pm2 list
htop

# Restart service
pm2 restart live-bash
# or
sudo systemctl restart live-bash
```

## Updating the Application

### With Git

```bash
cd ~/live-bash
git pull
npm install
npm run build
pm2 restart live-bash
# or
sudo systemctl restart live-bash
```

### Manual upload

```bash
# Upload new files via SCP
cd ~/live-bash
npm install
npm run build
pm2 restart live-bash
```

## Backup

### Backup command history

```bash
# Create backup directory
mkdir -p ~/backups

# Backup history
cp ~/live-bash/data/history.json ~/backups/history-$(date +%Y%m%d).json

# Automated daily backup (add to crontab)
crontab -e
# Add: 0 2 * * * cp ~/live-bash/data/history.json ~/backups/history-$(date +\%Y\%m\%d).json
```

## Uninstalling

### Stop and remove PM2 service

```bash
pm2 stop live-bash
pm2 delete live-bash
pm2 save
```

### Or stop systemd service

```bash
sudo systemctl stop live-bash
sudo systemctl disable live-bash
sudo rm /etc/systemd/system/live-bash.service
sudo systemctl daemon-reload
```

### Remove files

```bash
rm -rf ~/live-bash
```

### Remove Nginx config

```bash
sudo rm /etc/nginx/sites-enabled/live-bash
sudo rm /etc/nginx/sites-available/live-bash
sudo systemctl restart nginx
```

## Support

For issues, check:
1. Application logs: `~/live-bash/logs/app.log`
2. System logs: `sudo journalctl -u live-bash`
3. PM2 logs: `pm2 logs live-bash`
4. README.md for detailed API documentation
