#!/bin/bash

# Installation script for Sakoa.xyz deployment watcher
# This script must be run as root

if [ "$EUID" -ne 0 ]; then
    echo "❌ This script must be run as root"
    echo "Usage: sudo ./install-deployment-watcher.sh"
    exit 1
fi

echo "🚀 Installing Sakoa.xyz deployment watcher..."

# Install inotify-tools if not present (for better file monitoring)
if ! command -v inotifywait >/dev/null 2>&1; then
    echo "📦 Installing inotify-tools..."
    if command -v apt-get >/dev/null 2>&1; then
        apt-get update && apt-get install -y inotify-tools
    elif command -v yum >/dev/null 2>&1; then
        yum install -y inotify-tools
    elif command -v dnf >/dev/null 2>&1; then
        dnf install -y inotify-tools
    else
        echo "⚠️  Could not install inotify-tools automatically. Please install manually for better performance."
    fi
fi

# Copy the watcher script to /usr/local/bin
echo "📋 Installing watcher script..."
cp sakoa-deployment-watcher.sh /usr/local/bin/
chmod +x /usr/local/bin/sakoa-deployment-watcher.sh

# Copy the systemd service file
echo "🔧 Installing systemd service..."
cp deployment-watcher.service /etc/systemd/system/sakoa-deployment-watcher.service

# Create log directory
mkdir -p /var/log
touch /var/log/sakoa-deployment.log
chmod 644 /var/log/sakoa-deployment.log

# Reload systemd and enable the service
echo "⚙️  Configuring systemd service..."
systemctl daemon-reload
systemctl enable sakoa-deployment-watcher.service
systemctl start sakoa-deployment-watcher.service

# Check service status
echo ""
echo "📊 Service status:"
systemctl status sakoa-deployment-watcher.service --no-pager -l

echo ""
echo "✅ Installation completed!"
echo ""
echo "📋 Service management commands:"
echo "  Start:   systemctl start sakoa-deployment-watcher.service"
echo "  Stop:    systemctl stop sakoa-deployment-watcher.service"
echo "  Restart: systemctl restart sakoa-deployment-watcher.service"
echo "  Status:  systemctl status sakoa-deployment-watcher.service"
echo "  Logs:    journalctl -u sakoa-deployment-watcher.service -f"
echo ""
echo "📁 Log file: /var/log/sakoa-deployment.log"
echo ""
echo "🎯 To trigger a deployment restart, create the file:"
echo "   /var/www/vhosts/sakoa.xyz/httpdocs/.deployment_trigger"
echo ""
echo "Example: touch /var/www/vhosts/sakoa.xyz/httpdocs/.deployment_trigger"
