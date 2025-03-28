# Contributing to Feedr

Thank you for your interest in contributing to Feedr! This guide will help you get started with development, testing, and submitting changes.

## Development Setup

1. Clone the repository
   ```bash
   git clone https://github.com/pminkler/feedr.git
   cd feedr
   ```

2. Install dependencies
   ```bash
   pnpm install
   ```

3. Run the development server
   ```bash
   pnpm dev
   ```

## Testing

Feedr uses Vitest for unit testing and code coverage. The following commands are available:

```bash
# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

### Writing Tests

#### Component Tests

Component tests should be placed in the `tests/components` directory, mirroring the structure of the `components` directory. Component tests use Vue Test Utils for mounting components and testing their behavior.

Example:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import MyComponent from '~/components/MyComponent.vue';

describe('MyComponent', () => {
  it('renders correctly', () => {
    const wrapper = mount(MyComponent);
    expect(wrapper.text()).toContain('Expected text');
  });
});
```

#### Composable Tests

Composable tests should be placed in the `tests/composables` directory. For testing composables, you'll need to mock dependencies like Amplify and Nuxt's useState.

Example:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { useMyComposable } from '~/composables/useMyComposable';

// Mock dependencies
vi.mock('dependency', () => ({
  someFunction: vi.fn(),
}));

describe('useMyComposable', () => {
  it('returns expected data', () => {
    const { someValue } = useMyComposable();
    expect(someValue.value).toBe('expected');
  });
});
```

## TypeScript

Type checking is run with:

```bash
pnpm typecheck
```

Always ensure your code passes type checking before submitting a pull request.

## Git Workflow

1. Create a branch for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and commit them:
   ```bash
   git add .
   git commit -m "Your commit message"
   ```

3. Push your branch to GitHub:
   ```bash
   git push origin feature/your-feature-name
   ```

4. Open a pull request on GitHub.

## Continuous Integration

Tests run automatically on GitHub Actions when pushing to main or creating a pull request. The workflow includes:

1. TypeScript type checking
2. Unit tests
3. Code coverage report generation

## Coding Standards

- Follow the project's existing code style
- Use Vue 3 Composition API with `<script setup>` syntax
- Use PascalCase for component names
- Use TypeScript for all new files
- Document public functions and components with JSDoc comments
- Keep components and functions small and focused on a single responsibility
- Write tests for new features and bug fixes

Thank you for contributing to Feedr!