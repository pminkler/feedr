#!/bin/bash

# Script to run tests in a CI-like environment (Chromium only)
# This helps verify that tests will pass in GitHub Actions

echo "Running CI-compatible E2E tests (Chromium only)..."
CI=true npx playwright test --project=chromium