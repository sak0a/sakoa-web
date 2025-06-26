#!/bin/bash

# Installation script for Sakoa.xyz deployment watcher (Simple Version)
# This script must be run as root

if [ "$EUID" -ne 0 ]; then
    echo "❌ This script must be run as root"
    echo "Usage: sudo ./install-deployment-watcher-simple.sh"
    exit 1
fi

echo "🚀 Installing Sakoa.xyz deployment watcher (Simple Version)..."

# Stop and disable the old service if it exists
if systemctl is-active --quiet sakoa-deployment-watcher.service; then
    echo "🛑 Stopping old deployment watcher service..."
    systemctl stop sakoa-deployment-watcher.service
    systemctl disable sakoa-deployment-watcher.service
fi

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

# Install curl if not present (for test requests)
if ! command -v curl >/dev/null 2>&1; then
    echo "📦 Installing curl..."
    if command -v apt-get >/dev/null 2>&1; then
        apt-get install -y curl
    elif command -v yum >/dev/null 2>&1; then
        yum install -y curl
    elif command -v dnf >/dev/null 2>&1; then
        dnf install -y curl
    else
        echo "⚠️  Could not install curl automatically. Please install manually."
    fi
fi

# Copy the watcher script to /usr/local/bin
echo "📋 Installing simple watcher script..."
cp sakoa-deployment-watcher-simple.sh /usr/local/bin/
chmod +x /usr/local/bin/sakoa-deployment-watcher-simple.sh

# Copy the systemd service file
echo "🔧 Installing systemd service..."
cp deployment-watcher-simple.service /etc/systemd/system/sakoa-deployment-watcher-simple.service

# Create log directory
mkdir -p /var/log
touch /var/log/sakoa-deployment.log
chmod 644 /var/log/sakoa-deployment.log

# Reload systemd and enable the service
echo "⚙️  Configuring systemd service..."
systemctl daemon-reload
systemctl enable sakoa-deployment-watcher-simple.service
systemctl start sakoa-deployment-watcher-simple.service

# Check service status
echo ""
echo "📊 Service status:"
systemctl status sakoa-deployment-watcher-simple.service --no-pager -l

echo ""
echo "✅ Installation completed!"
echo ""
echo "📋 Service management commands:"
echo "  Start:   systemctl start sakoa-deployment-watcher-simple.service"
echo "  Stop:    systemctl stop sakoa-deployment-watcher-simple.service"
echo "  Restart: systemctl restart sakoa-deployment-watcher-simple.service"
echo "  Status:  systemctl status sakoa-deployment-watcher-simple.service"
echo "  Logs:    journalctl -u sakoa-deployment-watcher-simple.service -f"
echo ""
echo "📁 Log file: /var/log/sakoa-deployment.log"
echo ""
echo "🎯 To trigger a deployment restart, create the file:"
echo "   /var/www/vhosts/sakoa.xyz/httpdocs/.deployment_trigger"
echo ""
echo "Example: touch /var/www/vhosts/sakoa.xyz/httpdocs/.deployment_trigger"
