#!/bin/bash

# Make sure the container is up
echo "Starting Playwright container..."
docker-compose up -d

# Give the container a moment to fully start
echo "Waiting for container to initialize..."
sleep 2

# Check if container is running
CONTAINER_ID=$(docker-compose ps -q playwright)
if [ -z "$CONTAINER_ID" ]; then
  echo "Error: Playwright container failed to start"
  exit 1
fi

# Run Playwright UI mode
echo "Starting Playwright UI mode on http://localhost:9323..."
docker-compose exec -T playwright bash -c "npx playwright test --ui"

# Keep this script running to maintain port forwarding
echo "Playwright UI is running. Press Ctrl+C to stop."
wait