#!/bin/bash

# Sakoa.xyz Node.js Application Deployment Watcher
# This script monitors for deployment triggers and restarts the Node.js application

APP_DIR="/var/www/vhosts/sakoa.xyz/httpdocs"
TRIGGER_FILE="$APP_DIR/.deployment_trigger"
LOG_FILE="/var/log/sakoa-deployment.log"

# Function to log messages
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# Function to restart the Node.js application
restart_nodejs_app() {
    log_message "🔄 Restarting Node.js application..."
    
    cd "$APP_DIR" || {
        log_message "❌ Failed to change to app directory: $APP_DIR"
        return 1
    }
    
    # Method 1: Kill existing Passenger processes
    log_message "🔄 Stopping existing Passenger processes..."
    pkill -SIGTERM -f "Passenger NodeApp.*sakoa.xyz" 2>/dev/null && log_message "✅ Sent SIGTERM to Passenger NodeApp" || log_message "ℹ️  No Passenger NodeApp found"
    pkill -SIGTERM -f "Passenger.*sakoa.xyz" 2>/dev/null && log_message "✅ Sent SIGTERM to Passenger process" || log_message "ℹ️  No Passenger process found"
    
    # Wait for graceful shutdown
    sleep 3
    
    # Force kill if still running
    pkill -SIGKILL -f "Passenger NodeApp.*sakoa.xyz" 2>/dev/null && log_message "⚠️  Force killed Passenger NodeApp" || log_message "✅ No processes to force kill"
    
    # Method 2: Create Passenger restart triggers
    log_message "🚀 Creating Passenger restart triggers..."
    touch "$APP_DIR/restart.txt" 2>/dev/null || true
    touch "$APP_DIR/tmp/restart.txt" 2>/dev/null || true
    touch "$APP_DIR/.output/server/restart.txt" 2>/dev/null || true
    
    # Method 3: Update file timestamps to trigger reload
    find "$APP_DIR/.output/server" -name "*.mjs" -exec touch {} \; 2>/dev/null || true
    
    # Method 4: Use Plesk CLI if available
    if command -v plesk >/dev/null 2>&1; then
        log_message "🔧 Attempting Plesk CLI restart..."
        plesk bin site --update sakoa.xyz -nodejs-restart 2>/dev/null && log_message "✅ Plesk CLI restart successful" || log_message "⚠️  Plesk CLI restart failed"
    fi
    
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
log_message "🚀 Starting Sakoa.xyz deployment watcher..."
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
