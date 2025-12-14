#!/bin/bash
# Startup script for PM2 that loads .env file before starting server
# This ensures all environment variables are available

cd "$(dirname "$0")"

# Check if .env exists
if [ ! -f .env ]; then
    echo "ERROR: .env file not found in $(pwd)"
    exit 1
fi

# Load environment variables from .env file
export $(cat .env | grep -v '^#' | xargs)

# Start the server
exec node backend/server.js

