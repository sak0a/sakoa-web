#!/bin/bash

# Deployment Diagnosis Script for Sakoa.xyz
# This script helps diagnose deployment and restart issues

APP_DIR="/var/www/vhosts/sakoa.xyz/httpdocs"

echo "🔍 Sakoa.xyz Deployment Diagnosis"
echo "=================================="
echo ""

# Check if we're running as root
if [ "$EUID" -eq 0 ]; then
    echo "✅ Running as root - can check all processes and services"
else
    echo "⚠️  Running as non-root user - some checks may be limited"
fi
echo ""

# Check application directory
echo "📁 Application Directory Check:"
if [ -d "$APP_DIR" ]; then
    echo "✅ App directory exists: $APP_DIR"
    ls -la "$APP_DIR" | head -10
else
    echo "❌ App directory not found: $APP_DIR"
fi
echo ""

# Check .output directory
echo "📦 Build Output Check:"
if [ -d "$APP_DIR/.output" ]; then
    echo "✅ .output directory exists"
    ls -la "$APP_DIR/.output/"
    if [ -f "$APP_DIR/.output/server/index.mjs" ]; then
        echo "✅ Server file exists: index.mjs"
    else
        echo "❌ Server file missing: index.mjs"
    fi
else
    echo "❌ .output directory not found"
fi
echo ""

# Check environment file
echo "🔐 Environment File Check:"
if [ -f "$APP_DIR/.output/server/.env" ]; then
    echo "✅ .env file exists"
    echo "📋 .env file permissions: $(ls -la "$APP_DIR/.output/server/.env" | awk '{print $1}')"
else
    echo "❌ .env file not found"
fi
echo ""

# Check Passenger processes
echo "🚀 Passenger Process Check:"
PASSENGER_PROCESSES=$(pgrep -f "Passenger.*sakoa.xyz" 2>/dev/null)
if [ -n "$PASSENGER_PROCESSES" ]; then
    echo "✅ Passenger processes found:"
    ps aux | grep -E "Passenger.*sakoa.xyz" | grep -v grep
else
    echo "❌ No Passenger processes found for sakoa.xyz"
fi
echo ""

# Check Node.js processes
echo "🟢 Node.js Process Check:"
NODE_PROCESSES=$(pgrep -f "node.*sakoa.xyz\|index.mjs" 2>/dev/null)
if [ -n "$NODE_PROCESSES" ]; then
    echo "✅ Node.js processes found:"
    ps aux | grep -E "node.*sakoa.xyz|index.mjs" | grep -v grep
else
    echo "❌ No Node.js processes found"
fi
echo ""

# Check systemd service
echo "⚙️  Systemd Service Check:"
if systemctl list-units --type=service | grep -q "sakoa-deployment-watcher"; then
    echo "✅ Deployment watcher service found"
    systemctl status sakoa-deployment-watcher*.service --no-pager -l
else
    echo "❌ No deployment watcher service found"
fi
echo ""

# Check restart trigger files
echo "🎯 Restart Trigger Files:"
for file in "$APP_DIR/.deployment_trigger" "$APP_DIR/restart.txt" "$APP_DIR/tmp/restart.txt" "$APP_DIR/.output/server/restart.txt"; do
    if [ -f "$file" ]; then
        echo "✅ Found: $file ($(stat -c %y "$file"))"
    else
        echo "❌ Missing: $file"
    fi
done
echo ""

# Check Plesk CLI
echo "🔧 Plesk CLI Check:"
if command -v plesk >/dev/null 2>&1; then
    echo "✅ Plesk CLI available"
    plesk version 2>/dev/null || echo "⚠️  Could not get Plesk version"
else
    echo "❌ Plesk CLI not found"
fi
echo ""

# Check website accessibility
echo "🌐 Website Accessibility Check:"
if command -v curl >/dev/null 2>&1; then
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -m 10 "https://sakoa.xyz" 2>/dev/null)
    if [ "$HTTP_STATUS" = "200" ]; then
        echo "✅ Website accessible (HTTP $HTTP_STATUS)"
    else
        echo "⚠️  Website returned HTTP $HTTP_STATUS"
    fi
else
    echo "⚠️  curl not available for website check"
fi
echo ""

# Check logs
echo "📋 Recent Log Entries:"
if [ -f "/var/log/sakoa-deployment.log" ]; then
    echo "✅ Deployment log found - last 10 entries:"
    tail -10 /var/log/sakoa-deployment.log
else
    echo "❌ Deployment log not found"
fi
echo ""

# Recommendations
echo "💡 Recommendations:"
echo "==================="

if [ ! -d "$APP_DIR/.output" ]; then
    echo "❗ Build output missing - run deployment first"
fi

if [ -z "$PASSENGER_PROCESSES" ] && [ -z "$NODE_PROCESSES" ]; then
    echo "❗ No application processes running - try manual restart:"
    echo "   touch $APP_DIR/.deployment_trigger"
    echo "   OR"
    echo "   touch $APP_DIR/restart.txt"
fi

if ! systemctl list-units --type=service | grep -q "sakoa-deployment-watcher"; then
    echo "❗ Deployment watcher service not installed - run installation script"
fi

echo ""
echo "🔍 Diagnosis completed!"
echo ""
echo "📋 Manual restart commands:"
echo "  Trigger restart: touch $APP_DIR/.deployment_trigger"
echo "  Passenger restart: touch $APP_DIR/restart.txt"
echo "  Service logs: journalctl -u sakoa-deployment-watcher*.service -f"
