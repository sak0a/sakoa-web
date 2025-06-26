#!/bin/bash

# Node.js Application Restart Script for Plesk
# This script attempts multiple methods to restart the Node.js application

echo "🔄 Attempting to restart Node.js application..."

# Get the current directory
APP_DIR="/var/www/vhosts/sakoa.xyz/httpdocs"
cd "$APP_DIR"

# Method 1: Touch restart file (some Node.js process managers watch for this)
echo "📝 Creating restart trigger files..."
touch .output/server/restart.txt 2>/dev/null || true
touch .restart 2>/dev/null || true
echo "$(date)" > .restart_trigger 2>/dev/null || true

# Method 2: Kill existing Node.js processes gracefully
echo "🔄 Attempting graceful process restart..."
pkill -SIGTERM -f "node.*index.mjs" 2>/dev/null && echo "✅ Sent SIGTERM to Node.js process" || echo "ℹ️  No Node.js process found"
pkill -SIGTERM -f "sakoa.xyz" 2>/dev/null && echo "✅ Sent SIGTERM to domain process" || echo "ℹ️  No domain process found"

# Wait a moment for graceful shutdown
sleep 2

# Method 3: Force kill if still running
echo "🔄 Checking for remaining processes..."
pkill -SIGKILL -f "node.*index.mjs" 2>/dev/null && echo "⚠️  Force killed Node.js process" || echo "✅ No processes to force kill"

# Method 4: Try to start the application (if it's not managed by Plesk)
echo "🚀 Attempting to start application..."
if [ -f ".output/server/index.mjs" ]; then
    # Check if we can start it manually (background process)
    nohup node .output/server/index.mjs > app.log 2>&1 &
    if [ $? -eq 0 ]; then
        echo "✅ Application started manually"
    else
        echo "⚠️  Could not start application manually"
    fi
else
    echo "❌ Application file not found"
fi

echo ""
echo "🎯 Restart attempts completed!"
echo ""
echo "If the application is still not responding:"
echo "1. Go to Plesk Control Panel"
echo "2. Navigate to sakoa.xyz → Node.js"
echo "3. Click 'Restart App' button"
echo "4. Check the application logs for errors"
echo ""
echo "Application should be accessible at: https://sakoa.xyz"
