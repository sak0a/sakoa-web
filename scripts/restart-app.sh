#!/bin/bash

# Comprehensive Node.js application restart script for Plesk
# This script tries multiple restart methods to ensure the application restarts

echo "🔄 Starting Node.js application restart process..."
echo "=================================================="

APP_DIR="/var/www/vhosts/sakoa.xyz/httpdocs"
DOMAIN="sakoa.xyz"
SUCCESS=false

# Change to app directory
cd "$APP_DIR" || {
  echo "❌ Failed to change to app directory: $APP_DIR"
  exit 1
}

echo "📁 Working directory: $(pwd)"
echo ""

# Function to test if website is responding
test_website() {
  echo "🌐 Testing website response..."
  local response=$(curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN/" 2>/dev/null)
  if [[ "$response" =~ ^(200|301|302)$ ]]; then
    echo "✅ Website is responding (HTTP $response)"
    return 0
  else
    echo "❌ Website not responding correctly (HTTP $response)"
    return 1
  fi
}

# Function to check for Node.js processes
check_node_processes() {
  echo "🔍 Checking for Node.js processes..."
  local processes=$(pgrep -f "node.*index.mjs" 2>/dev/null | wc -l)
  echo "📋 Found $processes Node.js processes"
  if [ "$processes" -gt 0 ]; then
    pgrep -f "node.*index.mjs" | while read pid; do
      echo "   PID: $pid"
    done
  fi
}

# Initial status check
echo "📊 Initial status check:"
check_node_processes
test_website
echo ""

# Strategy 1: Plesk Node.js restart command
echo "🎯 Strategy 1: Plesk Node.js restart command"
if command -v plesk >/dev/null 2>&1; then
  if plesk bin site --update "$DOMAIN" -nodejs-restart 2>/dev/null; then
    echo "✅ Plesk Node.js restart command executed successfully"
    sleep 3
    if test_website; then
      echo "🎉 Success! Application restarted via Plesk command"
      SUCCESS=true
    fi
  else
    echo "⚠️  Plesk Node.js restart command failed"
  fi
else
  echo "⚠️  Plesk command not available"
fi
echo ""

# Strategy 2: PM2 restart (if PM2 is used)
if [ "$SUCCESS" = false ]; then
  echo "🎯 Strategy 2: PM2 restart"
  if command -v pm2 >/dev/null 2>&1; then
    if pm2 restart sakoa-dodgeball 2>/dev/null || pm2 restart all 2>/dev/null; then
      echo "✅ PM2 restart executed successfully"
      sleep 3
      if test_website; then
        echo "🎉 Success! Application restarted via PM2"
        SUCCESS=true
      fi
    else
      echo "⚠️  PM2 restart failed"
    fi
  else
    echo "⚠️  PM2 not available"
  fi
  echo ""
fi

# Strategy 3: Systemd service restart
if [ "$SUCCESS" = false ]; then
  echo "🎯 Strategy 3: Systemd service restart"
  if systemctl restart sakoa-deployment-watcher 2>/dev/null; then
    echo "✅ Systemd service restart executed successfully"
    sleep 3
    if test_website; then
      echo "🎉 Success! Application restarted via systemd"
      SUCCESS=true
    fi
  else
    echo "⚠️  Systemd service restart failed"
  fi
  echo ""
fi

# Strategy 4: Passenger restart triggers
if [ "$SUCCESS" = false ]; then
  echo "🎯 Strategy 4: Passenger restart triggers"
  touch restart.txt 2>/dev/null || true
  mkdir -p tmp && touch tmp/restart.txt 2>/dev/null || true
  touch .output/server/restart.txt 2>/dev/null || true
  echo "✅ Passenger restart triggers created"
  sleep 5
  if test_website; then
    echo "🎉 Success! Application restarted via Passenger triggers"
    SUCCESS=true
  fi
  echo ""
fi

# Strategy 5: Force kill and let system restart
if [ "$SUCCESS" = false ]; then
  echo "🎯 Strategy 5: Force kill existing processes"
  if pkill -f "node.*index.mjs" 2>/dev/null; then
    echo "✅ Killed existing Node.js processes"
    echo "⏳ Waiting 10 seconds for automatic restart..."
    sleep 10
    if test_website; then
      echo "🎉 Success! Application restarted after process kill"
      SUCCESS=true
    fi
  else
    echo "⚠️  No Node.js processes found to kill"
  fi
  echo ""
fi

# Final status check
echo "📊 Final status check:"
check_node_processes
test_website
echo ""

if [ "$SUCCESS" = true ]; then
  echo "🎉 SUCCESS: Node.js application restart completed successfully!"
  echo "🌐 Website: https://$DOMAIN/"
  exit 0
else
  echo "❌ FAILED: All restart strategies failed"
  echo "🔧 Manual restart may be required via Plesk control panel"
  echo "📋 Troubleshooting steps:"
  echo "   1. Check Plesk Node.js application settings"
  echo "   2. Verify application startup script"
  echo "   3. Check application logs for errors"
  echo "   4. Restart via Plesk control panel"
  exit 1
fi
