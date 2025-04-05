# Docker Setup for Playwright Testing

This directory contains Docker configuration for running Playwright E2E tests in an isolated environment.

## Usage

### Local Development Testing

Simply run the E2E tests with Docker:

```
npm run test:e2e
```

This command:
1. Starts the Docker container if not running
2. Executes Playwright tests in the container
3. Returns results to your terminal

### Running Playwright UI Mode

To run Playwright in interactive UI mode:

```
npm run test:e2e:ui
```

This will:
1. Start the Docker container if not running
2. Launch Playwright UI mode
3. Make it accessible at http://localhost:9323

### CI Environment

For CI environments, use:

```
npm run test:e2e:ci
```

This runs Playwright tests directly without Docker, assuming Playwright is already installed in the CI environment or container.

## Benefits

- Consistent environment across all developers
- No system-level Playwright dependencies required for local development
- Isolated from your local system
- All test artifacts are written to the host filesystem

## Troubleshooting

If you encounter issues:

1. Make sure Docker is running
2. Try rebuilding the container: `docker-compose up -d --build`
3. Check container logs: `docker-compose logs playwright`
4. Manually manage containers:
   ```
   # Start container
   docker-compose up -d
   
   # Stop container
   docker-compose down
   ```