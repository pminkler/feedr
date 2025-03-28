# Feedr

A recipe management and meal planning application built with Nuxt.

## Setup

Make sure to install dependencies:

```bash
# pnpm (recommended)
pnpm install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
pnpm dev
```

## Production

Build the application for production:

```bash
pnpm build
```

Locally preview production build:

```bash
pnpm preview
```

## Testing

Feedr uses both Vitest for unit testing and Cypress for end-to-end testing.

### Unit Tests

Vitest is used for unit testing and code coverage. The following commands are available:

```bash
# Run unit tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

#### Writing Unit Tests

##### Component Tests

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

##### Composable Tests

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

### End-to-End Tests

Cypress is used for end-to-end testing. The following commands are available:

```bash
# Open Cypress Test Runner
pnpm cypress:open

# Run Cypress tests headlessly
pnpm cypress:run
```

#### Writing E2E Tests

End-to-end tests are located in the `cypress/e2e` directory. For detailed guidelines on writing Cypress tests, refer to the [Cypress testing documentation](cypress/TESTING.md).

Current implemented tests:
- Landing page functionality
- Login functionality (email/password authentication)
- My Recipes page (authenticated access)

#### Test Credentials

For tests requiring authentication, configure test user credentials in `cypress.config.js` or use environment variables in CI/CD:

```javascript
// Example cypress.config.js
env: {
  TEST_USER_EMAIL: "testuser@example.com",
  TEST_USER_PASSWORD: "your-test-password"
}
```

**Important**: Never commit real passwords to the repository. For CI/CD, configure test credentials as environment variables.

## TypeScript

Run TypeScript type checking:

```bash
pnpm typecheck
```

## Continuous Integration

Tests run automatically on GitHub Actions when pushing to main or creating a pull request. The workflow includes:

1. TypeScript type checking
2. Unit tests
3. Code coverage report generation

Coverage reports are uploaded as artifacts in the GitHub Actions workflow.

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.
