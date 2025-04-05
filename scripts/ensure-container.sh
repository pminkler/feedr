#!/bin/bash

# Check if container is running
if ! docker-compose ps | grep -q 'playwright.*Up'; then
  echo "Playwright container is not running. Starting it now..."
  docker-compose up -d
  
  # Wait for container to be ready
  echo "Waiting for container to be ready..."
  sleep 3
fi

# Execute the command
docker-compose exec -T playwright "$@"