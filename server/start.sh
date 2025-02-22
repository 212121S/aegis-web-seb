#!/bin/bash

# Default environment variables
export NODE_ENV=${NODE_ENV:-production}
export PORT=${PORT:-10000}
export JWT_SECRET=${JWT_SECRET:-'default-jwt-secret-key-for-development'}
export DOMAIN=${DOMAIN:-'https://www.aegistestingtech.com'}
export CLIENT_URL=${CLIENT_URL:-'https://www.aegistestingtech.com'}
export CORS_ALLOWED_ORIGINS=${CORS_ALLOWED_ORIGINS:-'https://www.aegistestingtech.com,https://aegistestingtech.com,https://api.aegistestingtech.com'}

# Function to find an available port
find_available_port() {
    local port=$1
    while ! nc -z localhost $port 2>/dev/null; do
        return $port
    done
    find_available_port $((port + 1))
}

# Find available port starting from PORT
export PORT=$(find_available_port $PORT)

echo "Starting server on port $PORT..."

# Start the server
node src/app.js
