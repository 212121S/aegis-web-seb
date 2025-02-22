#!/bin/bash

# Load environment variables from .env if it exists
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# Default environment variables
export NODE_ENV=${NODE_ENV:-production}
export PORT=${PORT:-10000}

# Log environment status
echo "Environment: $NODE_ENV"

# Required environment variables check
if [ "$NODE_ENV" = "production" ]; then
  echo "Checking required environment variables..."
  
  if [ -z "$MONGO_URI" ]; then
    echo "❌ Error: MONGO_URI is required in production"
    echo "Please set MONGO_URI in your Render dashboard:"
    echo "Dashboard > Your Service > Environment Variables"
    exit 1
  fi
  
  if [ -z "$JWT_SECRET" ]; then
    echo "❌ Error: JWT_SECRET is required in production"
    echo "Please set JWT_SECRET in your Render dashboard:"
    echo "Dashboard > Your Service > Environment Variables"
    exit 1
  fi
  
  if [ -z "$STRIPE_SECRET_KEY" ]; then
    echo "⚠️  Warning: STRIPE_SECRET_KEY not set - payment features will be disabled"
  fi

  # Production defaults
  export DOMAIN=${DOMAIN:-'https://aegistestingtech.com'}
  export CLIENT_URL=${CLIENT_URL:-'https://aegistestingtech.com'}
  export CORS_ALLOWED_ORIGINS=${CORS_ALLOWED_ORIGINS:-'https://www.aegistestingtech.com,https://aegistestingtech.com'}
else
  # Development defaults
  export MONGO_URI=${MONGO_URI:-'mongodb://localhost:27017/aegis'}
  export JWT_SECRET=${JWT_SECRET:-'default-jwt-secret-key-for-development'}
  export DOMAIN=${DOMAIN:-'http://localhost:3000'}
  export CLIENT_URL=${CLIENT_URL:-'http://localhost:3000'}
  export CORS_ALLOWED_ORIGINS=${CORS_ALLOWED_ORIGINS:-'http://localhost:3000,http://localhost:3001,http://localhost:3002'}
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
if [ -n "$MONGO_URI" ]; then
  echo "MongoDB: ${MONGO_URI//:\/\/[^@]*@/:\/\/***:***@}"
else
  echo "MongoDB: not set"
fi
echo "--------------------------------"

# Export all environment variables to child processes
export NODE_OPTIONS="--enable-source-maps"

# Start the server with environment variables explicitly passed
env NODE_ENV="$NODE_ENV" \
    PORT="$PORT" \
    MONGO_URI="$MONGO_URI" \
    JWT_SECRET="$JWT_SECRET" \
    STRIPE_SECRET_KEY="$STRIPE_SECRET_KEY" \
    STRIPE_WEBHOOK_SECRET="$STRIPE_WEBHOOK_SECRET" \
    DOMAIN="$DOMAIN" \
    CLIENT_URL="$CLIENT_URL" \
    CORS_ALLOWED_ORIGINS="$CORS_ALLOWED_ORIGINS" \
    node src/app.js
