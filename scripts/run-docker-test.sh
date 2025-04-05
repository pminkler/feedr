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

CONTAINER_RUNNING=$(docker inspect --format="{{.State.Running}}" $CONTAINER_ID 2>/dev/null)
if [ "$CONTAINER_RUNNING" != "true" ]; then
  echo "Error: Playwright container is not running"
  echo "Attempting to restart..."
  docker-compose down
  docker-compose up -d
  sleep 3
fi

# Run the test command
echo "Running Playwright tests..."
docker-compose exec -T playwright bash -c "npx playwright test --project=chromium --reporter=line --max-failures=1"

# Check exit code
TEST_EXIT_CODE=$?
if [ $TEST_EXIT_CODE -ne 0 ]; then
  echo "Tests failed with exit code $TEST_EXIT_CODE"
else
  echo "Tests completed successfully"
fi

exit $TEST_EXIT_CODE