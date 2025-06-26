#!/bin/bash

# Sakoa.xyz Node.js Application Deployment Watcher (Simple Version)
# This script monitors for deployment triggers and restarts the Node.js application using Passenger's built-in mechanisms

APP_DIR="/var/www/vhosts/sakoa.xyz/httpdocs"
TRIGGER_FILE="$APP_DIR/.deployment_trigger"
LOG_FILE="/var/log/sakoa-deployment.log"

# Function to log messages
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# Function to restart the Node.js application using Passenger's native methods
restart_nodejs_app() {
    log_message "🔄 Restarting Node.js application using Passenger restart mechanisms..."
    
    cd "$APP_DIR" || {
        log_message "❌ Failed to change to app directory: $APP_DIR"
        return 1
    }
    
    # Method 1: Use Plesk CLI (most reliable)
    if command -v plesk >/dev/null 2>&1; then
        log_message "🔧 Using Plesk CLI to restart Node.js application..."
        plesk bin site --update sakoa.xyz -nodejs-restart 2>/dev/null && {
            log_message "✅ Plesk CLI restart successful"
            return 0
        } || log_message "⚠️  Plesk CLI restart failed, trying Passenger restart files..."
    fi
    
    # Method 2: Create Passenger restart files (standard Passenger method)
    log_message "🚀 Creating Passenger restart files..."
    
    # Remove old restart files first
    rm -f restart.txt tmp/restart.txt .output/server/restart.txt 2>/dev/null || true
    
    # Wait a moment
    sleep 1
    
    # Create fresh restart files
    echo "$(date)" > restart.txt
    mkdir -p tmp && echo "$(date)" > tmp/restart.txt
    echo "$(date)" > .output/server/restart.txt 2>/dev/null || true
    
    log_message "✅ Passenger restart files created"
    
    # Method 3: Update application file timestamps
    log_message "🔄 Updating application file timestamps..."
    find .output/server -name "*.mjs" -exec touch {} \; 2>/dev/null || true
    
    # Method 4: Send a test request to trigger Passenger reload
    log_message "🌐 Sending test request to trigger Passenger reload..."
    sleep 2
    curl -s -m 15 "https://sakoa.xyz" >/dev/null 2>&1 && {
        log_message "✅ Test request successful - application should be restarted"
    } || {
        log_message "⚠️  Test request failed - application may still be starting"
    }
    
    log_message "✅ Node.js application restart completed"
}

# Function to check if deployment trigger exists
check_deployment_trigger() {
    if [ -f "$TRIGGER_FILE" ]; then
        log_message "🎯 Deployment trigger detected!"
        restart_nodejs_app
        rm -f "$TRIGGER_FILE"
        log_message "🧹 Deployment trigger cleaned up"
        return 0
    fi
    return 1
}

# Main monitoring loop
log_message "🚀 Starting Sakoa.xyz deployment watcher (Simple Version)..."
log_message "📁 Monitoring directory: $APP_DIR"
log_message "🎯 Trigger file: $TRIGGER_FILE"

# Initial check
check_deployment_trigger

# Monitor for changes using inotifywait if available
if command -v inotifywait >/dev/null 2>&1; then
    log_message "👀 Using inotifywait for file monitoring..."
    
    while true; do
        # Monitor for file creation/modification in the app directory
        inotifywait -e create,modify,moved_to "$APP_DIR" -t 30 >/dev/null 2>&1
        
        # Check for deployment trigger
        check_deployment_trigger
        
        # Also check for changes in the .output directory
        if [ -d "$APP_DIR/.output" ]; then
            inotifywait -e create,modify,moved_to "$APP_DIR/.output" -t 5 >/dev/null 2>&1
            check_deployment_trigger
        fi
    done
else
    # Fallback to polling if inotifywait is not available
    log_message "⏰ Using polling for file monitoring (install inotify-tools for better performance)..."
    
    while true; do
        check_deployment_trigger
        sleep 10
    done
fi
