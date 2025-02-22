#!/bin/bash

# Load environment variables from .env if it exists
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# Default environment variables
export NODE_ENV=${NODE_ENV:-production}
export PORT=${PORT:-10000}

# Required environment variables check
if [ "$NODE_ENV" = "production" ]; then
  if [ -z "$MONGODB_URI" ]; then
    echo "❌ Error: MONGODB_URI is required in production"
    exit 1
  fi
  
  if [ -z "$JWT_SECRET" ]; then
    echo "❌ Error: JWT_SECRET is required in production"
    exit 1
  fi
  
  if [ -z "$STRIPE_SECRET_KEY" ]; then
    echo "⚠️  Warning: STRIPE_SECRET_KEY not set - payment features will be disabled"
  fi
fi

# Development fallbacks
if [ "$NODE_ENV" = "development" ]; then
  export MONGODB_URI=${MONGODB_URI:-'mongodb://localhost:27017/aegis'}
  export JWT_SECRET=${JWT_SECRET:-'default-jwt-secret-key-for-development'}
  export DOMAIN=${DOMAIN:-'http://localhost:3000'}
  export CLIENT_URL=${CLIENT_URL:-'http://localhost:3000'}
  export CORS_ALLOWED_ORIGINS=${CORS_ALLOWED_ORIGINS:-'http://localhost:3000,http://localhost:3001,http://localhost:3002'}
fi

# Production defaults
if [ "$NODE_ENV" = "production" ]; then
  export DOMAIN=${DOMAIN:-'https://www.aegistestingtech.com'}
  export CLIENT_URL=${CLIENT_URL:-'https://www.aegistestingtech.com'}
  export CORS_ALLOWED_ORIGINS=${CORS_ALLOWED_ORIGINS:-'https://www.aegistestingtech.com,https://aegistestingtech.com'}
fi

# Function to find an available port
find_available_port() {
  local port=$1
  while lsof -i:$port >/dev/null 2>&1; do
    port=$((port + 1))
  done
  echo $port
}

# Find available port starting from PORT
export PORT=$(find_available_port $PORT)

echo "Starting server with configuration:"
echo "--------------------------------"
echo "NODE_ENV: $NODE_ENV"
echo "PORT: $PORT"
echo "DOMAIN: $DOMAIN"
echo "CLIENT_URL: $CLIENT_URL"
echo "CORS_ALLOWED_ORIGINS: $CORS_ALLOWED_ORIGINS"
echo "MongoDB: ${MONGODB_URI/\:\/\/*@/:\/\/***:***@}"
echo "--------------------------------"

# Start the server
node src/app.js
