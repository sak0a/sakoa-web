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

    # Method 1: Create Passenger restart triggers FIRST (before killing processes)
    log_message "🚀 Creating Passenger restart triggers..."
    mkdir -p tmp
    touch restart.txt 2>/dev/null || true
    touch tmp/restart.txt 2>/dev/null || true
    touch .output/server/restart.txt 2>/dev/null || true

    # Update file timestamps to trigger reload
    find .output/server -name "*.mjs" -exec touch {} \; 2>/dev/null || true

    # Method 2: Use Plesk CLI restart (preferred method)
    if command -v plesk >/dev/null 2>&1; then
        log_message "🔧 Attempting Plesk CLI restart..."
        plesk bin site --update sakoa.xyz -nodejs-restart 2>/dev/null && {
            log_message "✅ Plesk CLI restart successful"
            sleep 5
            return 0
        } || log_message "⚠️  Plesk CLI restart failed, trying alternative methods..."
    fi

    # Method 3: Graceful process restart (only if Plesk CLI failed)
    log_message "🔄 Attempting graceful process restart..."

    # Send SIGUSR1 to Passenger processes (graceful restart signal)
    pkill -SIGUSR1 -f "Passenger.*sakoa.xyz" 2>/dev/null && log_message "✅ Sent graceful restart signal to Passenger" || log_message "ℹ️  No Passenger processes found for graceful restart"

    # Wait for graceful restart
    sleep 5

    # Method 4: If graceful restart didn't work, try process termination
    if pgrep -f "Passenger NodeApp.*sakoa.xyz" >/dev/null 2>&1; then
        log_message "🔄 Graceful restart didn't work, stopping processes..."
        pkill -SIGTERM -f "Passenger NodeApp.*sakoa.xyz" 2>/dev/null && log_message "✅ Sent SIGTERM to Passenger NodeApp" || log_message "ℹ️  No Passenger NodeApp found"

        # Wait for graceful shutdown
        sleep 3

        # Force kill if still running
        pkill -SIGKILL -f "Passenger NodeApp.*sakoa.xyz" 2>/dev/null && log_message "⚠️  Force killed Passenger NodeApp" || log_message "✅ No processes to force kill"
    fi

    # Method 5: Ensure restart triggers are fresh
    log_message "🔄 Refreshing restart triggers..."
    rm -f restart.txt tmp/restart.txt .output/server/restart.txt 2>/dev/null || true
    sleep 1
    touch restart.txt
    mkdir -p tmp && touch tmp/restart.txt
    touch .output/server/restart.txt 2>/dev/null || true

    # Method 6: Try to trigger a request to wake up Passenger
    log_message "🌐 Attempting to wake up Passenger with HTTP request..."
    curl -s -m 10 "https://sakoa.xyz" >/dev/null 2>&1 && log_message "✅ HTTP request sent successfully" || log_message "⚠️  HTTP request failed"

    log_message "✅ Node.js application restart sequence completed"
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
