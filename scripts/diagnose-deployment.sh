#!/bin/bash

echo "🔍 Diagnosing Plesk deployment issues..."
echo "========================================"

# Check if we're in the right directory
if [ ! -d ".output" ]; then
    echo "❌ Error: .output directory not found. Are you in the httpdocs directory?"
    exit 1
fi

echo "📁 Checking directory structure..."
ls -la .output/
echo ""

echo "📁 Checking server directory..."
ls -la .output/server/
echo ""

echo "📁 Checking public directory..."
ls -la .output/public/
echo ""

echo "🔧 Checking environment file..."
if [ -f ".output/server/.env" ]; then
    echo "✅ .env file exists"
    echo "📋 Environment variables (without values):"
    grep -o '^[^=]*' .output/server/.env
else
    echo "❌ .env file missing"
fi
echo ""

echo "📦 Checking package.json..."
if [ -f ".output/server/package.json" ]; then
    echo "✅ package.json exists"
    cat .output/server/package.json
else
    echo "❌ package.json missing"
fi
echo ""

echo "🚀 Checking if server can start..."
cd .output/server
echo "Current directory: $(pwd)"

echo "📋 Attempting to start server (will timeout after 10 seconds)..."
timeout 10s node index.mjs 2>&1 || echo "Server start attempt completed/timed out"
echo ""

echo "🔍 Checking for any error logs..."
if [ -f "error.log" ]; then
    echo "📋 Error log contents:"
    tail -20 error.log
else
    echo "ℹ️ No error.log file found"
fi

echo ""
echo "🔍 Checking file permissions..."
echo "Server directory permissions:"
ls -la ../server/
echo ""
echo "Public directory permissions:"
ls -la ../public/
echo ""

echo "🔍 Checking for Node.js and npm..."
which node || echo "❌ Node.js not found"
node --version 2>/dev/null || echo "❌ Cannot get Node.js version"
which npm || echo "❌ npm not found"
npm --version 2>/dev/null || echo "❌ Cannot get npm version"

echo ""
echo "🔍 Checking system resources..."
df -h . || echo "❌ Cannot check disk space"
free -h 2>/dev/null || echo "ℹ️ Cannot check memory (not available on this system)"

echo ""
echo "✅ Diagnosis complete!"
echo "📋 If the server failed to start, check the error messages above."
echo "📋 Common issues:"
echo "   - Missing environment variables"
echo "   - Database connection issues"
echo "   - File permission problems"
echo "   - Node.js version compatibility"
