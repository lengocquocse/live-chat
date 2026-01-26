# Live Bash Web UI Guide

## Overview

The Live Bash HTTP Control System includes a modern, responsive web interface for executing commands, viewing real-time output, and managing command history.

## Accessing the UI

1. **Start the server**:
   ```bash
   npm run dev
   ```

2. **Open your browser** and navigate to:
   ```
   http://localhost:3000
   ```

The web UI will be served automatically from the `/public` directory.

## Features

### 🎨 Modern Interface
- Clean, intuitive design
- Dark mode support (toggle with the moon/sun icon)
- Responsive layout (works on desktop and mobile)
- Real-time status updates

### ⚡ Command Execution
- **Command Input**: Multi-line text area for complex commands
- **Working Directory**: Optional directory path for command execution
- **Timeout**: Set custom timeout (in milliseconds)
- **Environment Variables**: Add custom key-value pairs
- **Streaming Mode**: Toggle between real-time streaming and standard execution

### 📊 Output Display
- **Real-time Streaming**: See command output as it happens
- **Color-coded Output**:
  - Regular output (stdout) in primary color
  - Error output (stderr) in red
  - Success messages in green
- **Execution Stats**: View exit code and execution time
- **Auto-scroll**: Output automatically scrolls to show latest content

### 📝 Command History
- **Recent Commands**: View last 20 executed commands
- **Quick Replay**: Click any history item to populate the form
- **Execution Details**: See exit code, timestamp, and success status
- **Clear History**: Remove all command history with one click

### ⚙️ Settings
- **API Key Configuration**: Set your API key for authentication
- **Server URL**: Configure the backend server URL
- **Persistent Storage**: Settings saved in browser localStorage

## Using the Interface

### 1. Configure Settings

First time setup:

1. Click the **Settings** tab in the right panel
2. Enter your API key (default: `dev-api-key-12345`)
3. Verify the server URL (default: `http://localhost:3000`)
4. Click **Save Settings**

### 2. Execute a Command

Basic command execution:

1. Enter your command in the **Command** text area
   ```
   echo Hello World
   ```

2. (Optional) Set working directory:
   ```
   Q:\Projects\my-app
   ```

3. (Optional) Set timeout in milliseconds:
   ```
   30000
   ```

4. Click **Execute** button or press `Ctrl+Enter`

5. Watch the output appear in real-time!

### 3. Advanced Options

#### Environment Variables

Add custom environment variables:

1. Click **+ Add Variable** button
2. Enter key name (e.g., `NODE_ENV`)
3. Enter value (e.g., `production`)
4. Add more variables as needed
5. Execute your command

Example:
```
KEY: MY_VAR
VALUE: test123

Command: echo $MY_VAR
```

#### Streaming vs Standard Mode

- **Streaming Mode** (default): See output line-by-line as command runs
- **Standard Mode**: Get complete output when command finishes

Toggle the checkbox to switch modes.

### 4. View Command History

1. Click the **History** tab
2. See list of recent commands
3. Click any entry to:
   - Populate the command form
   - View the output
   - See execution details

### 5. Dark Mode

Click the theme toggle button in the header to switch between light and dark themes. Your preference is saved automatically.

## Keyboard Shortcuts

- **Ctrl + Enter**: Execute command (when in command input)
- **Escape**: Stop focusing on current input

## Example Commands

### Linux/Ubuntu Commands

```bash
# List directory contents (detailed)
ls -la

# Show system information
uname -a

# Show disk space
df -h

# Show memory usage
free -h

# Current date and time
date

# Environment variables
env

# Show current user
whoami

# Show processes
ps aux | head -20

# Network configuration
ip addr show

# Ping a server
ping -c 4 google.com

# Find files
find /home -name "*.log" | head -10
```

### With Working Directory

```bash
Command: npm install
Working Directory: /var/www/my-app
```

### With Environment Variables

```bash
Command: node --version && echo $NODE_ENV
Environment Variables:
  NODE_ENV = production
```

### With Timeout

```bash
Command: sleep 30
Timeout: 2000
(Command will be killed after 2 seconds)
```

## Troubleshooting

### Connection Failed

If you see connection errors:

1. Check that the server is running (`npm run dev`)
2. Verify the server URL in Settings
3. Check the browser console for errors (F12)

### Authentication Failed

If you get "Invalid API key" errors:

1. Go to Settings tab
2. Verify your API key matches the one in `.env`
3. Click Save Settings
4. Try executing again

### Command Not Executing

If the Execute button doesn't work:

1. Make sure the command field is not empty
2. Check browser console for JavaScript errors (F12)
3. Verify your API key is set correctly
4. Try refreshing the page

### Output Not Appearing

If you don't see output:

1. Check the status badge (should say "Executing...")
2. Wait for the command to complete
3. Check if streaming mode is enabled
4. Look for error messages in red

### History Not Loading

If command history doesn't show:

1. Click the Refresh button (🔄)
2. Check your API key in Settings
3. Verify the server is running
4. Check browser console for errors

## Browser Compatibility

The UI works best in modern browsers:

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ⚠️ Internet Explorer: Not supported

## Security Notes

### API Key Storage

- API keys are stored in browser's localStorage
- They are NOT transmitted over the network except in Authorization headers
- Clear your browser data to remove stored API keys

### HTTPS Recommendation

For production use:

1. Always use HTTPS
2. Set up a reverse proxy (nginx/caddy)
3. Use strong, randomly generated API keys
4. Restrict access with firewall rules

### Content Security Policy

The server includes security headers to protect against:

- Cross-Site Scripting (XSS)
- Clickjacking
- MIME type sniffing

## Customization

### Changing Theme Colors

Edit the CSS variables in `public/index.html`:

```css
:root {
    --primary: #3b82f6;        /* Primary color */
    --success: #10b981;        /* Success color */
    --danger: #ef4444;         /* Error color */
    /* ... more variables ... */
}
```

### Adding Custom Features

The UI is a single HTML file with embedded CSS and JavaScript, making it easy to customize:

1. Open `public/index.html`
2. Find the `<script>` section
3. Add your custom JavaScript
4. Reload the page

## Mobile Usage

The UI is fully responsive and works on mobile devices:

- Touch-friendly buttons and inputs
- Responsive grid layout
- Mobile-optimized typography
- Vertical stacking on small screens

## Tips & Tricks

1. **Quick Command Repeat**: Click a history entry to instantly repopulate the form

2. **Multi-line Commands**: Use the command text area for complex multi-line scripts

3. **Environment Variables**: Use the `+ Add Variable` button to pass runtime configuration

4. **Timeout Safety**: Set reasonable timeouts to prevent long-running commands from hanging

5. **Dark Mode**: Enable dark mode for comfortable late-night command execution

6. **Ctrl+Enter**: Quick shortcut to execute without clicking the button

7. **Clear Output**: Use the "Clear Output" button to reset the output panel before running a new command

## Support

For issues with the web UI:

1. Check the browser console (F12) for errors
2. Check the server logs in `logs/app.log`
3. Verify your network connection
4. Try a different browser
5. Clear browser cache and reload

## Technical Details

### Technology Stack

- **Frontend**: Vanilla JavaScript (no frameworks)
- **Styling**: Custom CSS with CSS variables
- **Communication**: Fetch API + Server-Sent Events (SSE)
- **Storage**: Browser localStorage

### API Integration

The UI communicates with these endpoints:

- `POST /api/commands/execute-stream` - Streaming execution
- `POST /api/commands/execute` - Standard execution
- `GET /api/history` - List command history
- `GET /api/history/:id` - Get single history entry
- `DELETE /api/history` - Clear all history

### Local Storage Keys

The UI stores these keys in localStorage:

- `theme` - Selected theme (light/dark)
- `apiKey` - API key for authentication
- `serverUrl` - Backend server URL

To reset all settings:

```javascript
// In browser console (F12)
localStorage.clear();
location.reload();
```

## Future Enhancements

Possible future features:

- [ ] Command favorites/bookmarks
- [ ] Search in command history
- [ ] Export history to file
- [ ] Command templates
- [ ] Syntax highlighting
- [ ] Terminal-like autocomplete
- [ ] Multi-tab support
- [ ] Collaborative command execution
- [ ] File upload/download support

## License

Same as the main project (ISC)
