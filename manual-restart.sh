#!/bin/bash

# Quick manual restart script for sakoa.xyz Node.js application
# Run this script directly on the server if automatic restart fails

echo "🔄 Manual restart for sakoa.xyz Node.js application"
echo "=================================================="

cd /var/www/vhosts/sakoa.xyz/httpdocs || {
  echo "❌ Failed to change to app directory"
  exit 1
}

echo "📁 Working in: $(pwd)"

# Try multiple restart methods
echo "🎯 Attempting Plesk Node.js restart..."
plesk bin site --update sakoa.xyz -nodejs-restart 2>/dev/null && echo "✅ Plesk restart executed" || echo "⚠️  Plesk restart failed"

echo "🎯 Creating restart triggers..."
touch restart.txt
mkdir -p tmp && touch tmp/restart.txt
touch .output/server/restart.txt 2>/dev/null || true

echo "🎯 Killing existing processes..."
pkill -f "node.*index.mjs" 2>/dev/null && echo "✅ Processes killed" || echo "ℹ️  No processes found"

echo "⏳ Waiting 5 seconds..."
sleep 5

echo "🌐 Testing website..."
response=$(curl -s -o /dev/null -w "%{http_code}" https://sakoa.xyz/ 2>/dev/null)
if [[ "$response" =~ ^(200|301|302)$ ]]; then
  echo "✅ SUCCESS: Website is responding (HTTP $response)"
  echo "🎉 Manual restart completed successfully!"
else
  echo "❌ Website still not responding (HTTP $response)"
  echo "🔧 You may need to restart via Plesk control panel"
fi

echo ""
echo "📋 If this doesn't work, try:"
echo "   1. Go to Plesk control panel"
echo "   2. Navigate to sakoa.xyz > Node.js"
echo "   3. Click 'Restart App'"
