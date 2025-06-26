#!/bin/bash

# Wrapper script to run Node.js scripts with proper path detection
# Usage: ./run-node-script.sh <script-name> [args...]

SCRIPT_NAME="$1"
shift  # Remove script name from arguments

if [ -z "$SCRIPT_NAME" ]; then
  echo "❌ Usage: $0 <script-name> [args...]"
  exit 1
fi

# Find Node.js executable in common Plesk locations
if command -v node >/dev/null 2>&1; then
  NODE_CMD="node"
elif [ -f "/opt/plesk/node/20/bin/node" ]; then
  NODE_CMD="/opt/plesk/node/20/bin/node"
elif [ -f "/usr/local/psa/var/modules/psa-node/versions/node-20/bin/node" ]; then
  NODE_CMD="/usr/local/psa/var/modules/psa-node/versions/node-20/bin/node"
elif [ -f "/usr/bin/node" ]; then
  NODE_CMD="/usr/bin/node"
else
  echo "❌ Node.js not found. Cannot run $SCRIPT_NAME"
  echo "ℹ️  Checked locations:"
  echo "   - PATH (command -v node)"
  echo "   - /opt/plesk/node/20/bin/node"
  echo "   - /usr/local/psa/var/modules/psa-node/versions/node-20/bin/node"
  echo "   - /usr/bin/node"
  exit 1
fi

echo "✅ Using Node.js: $NODE_CMD"
echo "🚀 Running: $SCRIPT_NAME $@"
echo ""

# Execute the Node.js script
exec "$NODE_CMD" "$SCRIPT_NAME" "$@"
