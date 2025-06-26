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

# Method 2: Restart Passenger NodeApp processes
echo "🔄 Attempting to restart Passenger NodeApp..."
pkill -SIGTERM -f "Passenger NodeApp.*sakoa.xyz" 2>/dev/null && echo "✅ Sent SIGTERM to Passenger NodeApp" || echo "ℹ️  No Passenger NodeApp found"
pkill -SIGTERM -f "Passenger.*sakoa.xyz" 2>/dev/null && echo "✅ Sent SIGTERM to Passenger process" || echo "ℹ️  No Passenger process found"

# Wait a moment for graceful shutdown
sleep 3

# Method 3: Force kill Passenger processes if still running
echo "🔄 Checking for remaining Passenger processes..."
pkill -SIGKILL -f "Passenger NodeApp.*sakoa.xyz" 2>/dev/null && echo "⚠️  Force killed Passenger NodeApp" || echo "✅ No Passenger processes to force kill"

# Method 4: Create Passenger restart file (standard method)
echo "🚀 Creating Passenger restart file..."
if [ -f ".output/server/index.mjs" ]; then
    # Create restart.txt file that Passenger watches for
    touch .output/server/restart.txt
    touch restart.txt
    echo "✅ Created Passenger restart files"

    # Also try the tmp directory method
    mkdir -p tmp
    touch tmp/restart.txt
    echo "✅ Created tmp/restart.txt for Passenger"
else
    echo "❌ Application file not found"
fi

echo ""
echo "🎯 Passenger restart attempts completed!"
echo ""
echo "Passenger should automatically restart the application when it detects:"
echo "- New restart.txt files"
echo "- Process termination"
echo "- File changes"
echo ""
echo "If the application is still not responding:"
echo "1. Go to Plesk Control Panel"
echo "2. Navigate to sakoa.xyz → Node.js"
echo "3. Click 'Restart App' button"
echo "4. Check the application logs for errors"
echo ""
echo "Application should be accessible at: https://sakoa.xyz"
echo "Passenger process: Passenger NodeApp: /var/www/vhosts/sakoa.xyz/.output/server"
