# Git Hooks

This directory contains Git hooks used in the Feedr project.

## Available Hooks

- `pre-commit`: Runs automatically before each commit
  - Formats code with Prettier
  - Fixes linting issues with ESLint

- `pre-push`: Runs automatically before pushing to remote
  - Runs the full check (lint + typecheck)
  - Prevents pushing if there are linting errors or TypeScript errors

## Running Checks Manually

You can run the checks manually with:

```bash
npm run check
```

This runs both linting and typechecking in sequence.