# Beeidea.pragyaa.ai Setup Guide

This guide will help you set up `beeidea.pragyaa.ai` to run on port 3002 using nginx and tmux.

## Prerequisites

1. **DNS 'A' Record:** Ensure you have a DNS 'A' record for `beeidea.pragyaa.ai` pointing to `34.100.243.161`.
2. **Application Ready:** Make sure your Gemini HMS application is ready to run on port `3002`.
3. **Nginx Installed:** Nginx should be installed on your server.
4. **Certbot Installed:** Certbot should be installed for SSL certificate management.

## Step-by-Step Setup

### Step 1: Run the Setup Script

The setup script will configure nginx for you:

```bash
./setup-beeidea.sh
```

This script will:
- Copy the nginx configuration to `/etc/nginx/sites-available/beeidea`
- Create a symbolic link in `sites-enabled`
- Test the nginx configuration
- Reload nginx

### Step 2: Get SSL Certificate

After the nginx configuration is set up, run Certbot to get the SSL certificate:

```bash
sudo certbot --nginx -d beeidea.pragyaa.ai
```

When prompted:
- **Choose option 2** to redirect HTTP traffic to HTTPS
- Follow the prompts to complete the SSL setup

### Step 3: Start the Application in Tmux

Once SSL is configured, start your application using the tmux script:

```bash
./start-gemini-tmux.sh
```

This will:
- Create a new tmux session named `gemini-hms`
- Start the application on port 3002
- Attach you to the session

### Manual Tmux Commands

If you prefer to manage tmux manually:

**Start the application:**
```bash
tmux new-session -d -s gemini-hms 'npm start'
```

**Attach to the session:**
```bash
tmux attach-session -t gemini-hms
```

**Detach from session:**
- Press `Ctrl+B`, then `D`

**Kill the session:**
```bash
tmux kill-session -t gemini-hms
```

**List all sessions:**
```bash
tmux list-sessions
```

## Verification

After setup, you should be able to access:
- **HTTPS:** `https://beeidea.pragyaa.ai`
- **HTTP:** `http://beeidea.pragyaa.ai` (will redirect to HTTPS)

## Troubleshooting

### Check if the application is running:
```bash
tmux list-sessions
curl http://localhost:3002
```

### Check nginx status:
```bash
sudo systemctl status nginx
sudo nginx -t
```

### View nginx error logs:
```bash
sudo tail -f /var/log/nginx/error.log
```

### View application logs in tmux:
```bash
tmux attach-session -t gemini-hms
# Then scroll to see logs
```

## Files Created

- `nginx-beeidea.conf` - Nginx configuration file
- `setup-beeidea.sh` - Automated setup script
- `start-gemini-tmux.sh` - Tmux startup script

## Nginx Configuration Details

The nginx configuration includes:
- WebSocket support for real-time communication
- Audio streaming optimizations (no buffering, long timeouts)
- Static file caching for `/_next/static` files
- Proper proxy headers for forwarding client information
