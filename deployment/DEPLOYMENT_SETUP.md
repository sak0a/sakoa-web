# Sakoa.xyz Deployment Setup

This document describes the deployment system for the Sakoa.xyz TF2 Dodgeball Server website.

## Overview

The deployment system uses a combination of:
1. **GitHub Actions** for automated building and file transfer
2. **Systemd service** for monitoring and restarting the Node.js application
3. **Plesk/Passenger** for serving the Node.js application

## Files

- `deployment-watcher.service` - Systemd service definition
- `sakoa-deployment-watcher.sh` - Main watcher script that monitors for deployment triggers
- `install-deployment-watcher.sh` - Installation script for the systemd service
- `trigger-restart.sh` - Manual trigger script for restarting the application
- `.github/workflows/deploy.yml` - GitHub Actions workflow for automated deployment

## Installation (One-time setup on server)

1. **Upload the deployment files to your server:**
   ```bash
   scp deployment-watcher.service sakoa-deployment-watcher.sh install-deployment-watcher.sh root@your-server:/tmp/
   ```

2. **Run the installation script as root:**
   ```bash
   ssh root@your-server
   cd /tmp
   chmod +x install-deployment-watcher.sh
   ./install-deployment-watcher.sh
   ```

3. **Verify the service is running:**
   ```bash
   systemctl status sakoa-deployment-watcher.service
   ```

## How It Works

### Automated Deployment (GitHub Actions)
1. When you push to the `main` or `master` branch, GitHub Actions triggers
2. The workflow builds the Nuxt application
3. Files are uploaded to the Plesk server via SSH/SCP
4. A deployment trigger file (`.deployment_trigger`) is created
5. The systemd service detects this trigger and restarts the Node.js application

### Manual Restart
You can manually trigger a restart using:
```bash
./trigger-restart.sh
```

Or by creating the trigger file manually:
```bash
touch /var/www/vhosts/sakoa.xyz/httpdocs/.deployment_trigger
```

## Monitoring

### Service Status
```bash
systemctl status sakoa-deployment-watcher.service
```

### Real-time Logs
```bash
# Systemd journal
journalctl -u sakoa-deployment-watcher.service -f

# Application log file
tail -f /var/log/sakoa-deployment.log
```

### Service Management
```bash
# Start the service
systemctl start sakoa-deployment-watcher.service

# Stop the service
systemctl stop sakoa-deployment-watcher.service

# Restart the service
systemctl restart sakoa-deployment-watcher.service

# Enable auto-start on boot
systemctl enable sakoa-deployment-watcher.service
```

## Troubleshooting

### Service Not Starting
1. Check the service status: `systemctl status sakoa-deployment-watcher.service`
2. Check the logs: `journalctl -u sakoa-deployment-watcher.service`
3. Verify file permissions: `ls -la /usr/local/bin/sakoa-deployment-watcher.sh`

### Application Not Restarting
1. Check if the trigger file is being created: `ls -la /var/www/vhosts/sakoa.xyz/httpdocs/.deployment_trigger`
2. Monitor the watcher logs: `tail -f /var/log/sakoa-deployment.log`
3. Manually trigger a restart: `./trigger-restart.sh`

### GitHub Actions Deployment Failing
1. Check the GitHub Actions logs in your repository
2. Verify SSH credentials in GitHub Secrets
3. Test SSH connection manually: `ssh username@your-server`

## Directory Structure

```
/var/www/vhosts/sakoa.xyz/httpdocs/
├── .output/                    # Nuxt build output
│   ├── public/                 # Static files
│   └── server/                 # Server files
│       ├── index.mjs           # Main server file
│       └── .env                # Environment variables
├── .deployment_trigger         # Trigger file for restarts
├── restart.txt                 # Passenger restart trigger
└── tmp/
    └── restart.txt             # Alternative Passenger restart trigger
```

## Security Notes

- The systemd service runs as root to have permission to restart Passenger processes
- Environment variables are stored in `/var/www/vhosts/sakoa.xyz/httpdocs/.output/server/.env`
- The `.env` file has restricted permissions (600) for security

## Benefits of This Approach

1. **Reliable Restarts**: Systemd service has root privileges to properly restart Passenger
2. **Automated Monitoring**: Continuous monitoring for deployment triggers
3. **Fallback Methods**: Multiple restart methods ensure reliability
4. **Logging**: Comprehensive logging for troubleshooting
5. **Manual Control**: Easy manual restart capability
