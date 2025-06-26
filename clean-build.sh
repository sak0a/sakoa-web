#!/bin/bash

# Clean build script for Sakoa.xyz
# This script cleans all build artifacts and rebuilds the application

echo "🧹 Cleaning Sakoa.xyz build artifacts..."

# Remove build directories
echo "📁 Removing build directories..."
rm -rf .nuxt
rm -rf .output
rm -rf dist
rm -rf node_modules/.cache

# Remove lock files to ensure fresh dependency resolution
echo "🔒 Cleaning dependency locks..."
rm -f package-lock.json
rm -f yarn.lock
rm -f pnpm-lock.yaml

# Clear npm cache
echo "💾 Clearing npm cache..."
npm cache clean --force 2>/dev/null || true

# Reinstall dependencies
echo "📦 Reinstalling dependencies..."
npm install

# Build the application
echo "🔨 Building application..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully!"
    echo ""
    echo "📋 Build output:"
    ls -la .output/
    echo ""
    echo "🚀 Ready for deployment!"
else
    echo "❌ Build failed!"
    exit 1
fi
