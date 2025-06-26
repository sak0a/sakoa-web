#!/bin/bash

# Manual trigger script for restarting the Node.js application
# This script creates a deployment trigger that the systemd service will detect

APP_DIR="/var/www/vhosts/sakoa.xyz/httpdocs"
TRIGGER_FILE="$APP_DIR/.deployment_trigger"

echo "🎯 Triggering Node.js application restart..."

# Create the trigger file
echo "$(date '+%Y-%m-%d %H:%M:%S') - Manual restart triggered" > "$TRIGGER_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Deployment trigger created successfully"
    echo "📁 Trigger file: $TRIGGER_FILE"
    echo ""
    echo "The systemd service 'sakoa-deployment-watcher' will detect this trigger"
    echo "and restart the Node.js application within a few seconds."
    echo ""
    echo "To monitor the restart process:"
    echo "  journalctl -u sakoa-deployment-watcher.service -f"
    echo "  tail -f /var/log/sakoa-deployment.log"
else
    echo "❌ Failed to create deployment trigger"
    echo "Make sure you have write permissions to: $APP_DIR"
    exit 1
fi
