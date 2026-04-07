#!/bin/sh
set -e

DATA_DIR="/app/server/data"
DEFAULTS_DIR="/app/data-defaults"

# Seed the persistent volume with defaults on first boot
if [ -d "$DEFAULTS_DIR" ]; then
  for file in "$DEFAULTS_DIR"/*.json; do
    filename=$(basename "$file")
    if [ ! -f "$DATA_DIR/$filename" ]; then
      echo "Seeding $filename into $DATA_DIR"
      cp "$file" "$DATA_DIR/$filename"
    fi
  done
fi

exec "$@"
