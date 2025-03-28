# Cypress E2E Testing Guidelines

This document outlines the conventions and best practices for writing Cypress tests in the Feedr project.

## Test Setup

Cypress tests are automatically run as part of the Amplify build process, but can also be run locally:

```bash
# Install dependencies
pnpm install

# Start the app in development mode
pnpm dev

# In a separate terminal:
# Run tests in headless mode
pnpm cypress:run

# Or open the Cypress UI
pnpm cypress:open
```

## Test Organization

- All tests live in the `cypress/e2e` directory
- Name test files with `.cy.js` extension (e.g., `landing.cy.js`, `auth.cy.js`)
- Group tests logically by feature or page

## Test Conventions

### Structure

- Use descriptive `describe` and `it` blocks
- Keep tests focused on a single functionality
- Follow the Arrange-Act-Assert pattern

Example:

```javascript
describe('Feature Name', () => {
  beforeEach(() => {
    // Setup code (e.g., visit the page)
    cy.visit('/path');
  });

  it('should perform a specific action', () => {
    // Arrange - Set up test data or conditions
    
    // Act - Perform actions
    cy.get('button').click();
    
    // Assert - Check outcomes
    cy.url().should('include', '/expected-path');
  });
});
```

### Selectors

In order of preference, use:

1. Data attributes (e.g., `data-cy="submit-button"`)
2. Unique IDs (e.g., `#features`)
3. Semantic selectors (e.g., `button[type="submit"]`)
4. Content text (e.g., `cy.contains('Submit')`)

Avoid using:
- Class names (they change often)
- Complex CSS selectors
- Hardcoded indexes

### Testing Authentication

For authenticated tests, you can:

1. Use a dedicated test account in the dev environment
2. Use environment variables for credentials

```javascript
// In test file
it('logs in successfully', () => {
  cy.get('input[name="email"]').type(Cypress.env('TEST_USER'));
  cy.get('input[name="password"]').type(Cypress.env('TEST_PASSWORD'), { log: false });
  cy.get('button').contains('Continue').click();
});
```

### Test Environment Variables

Store sensitive data (like test credentials) as environment variables in Amplify. For local development, you can use a `cypress.env.json` file (excluded from git).

## Coverage Recommendations

At minimum, we should have tests for:

1. Landing page functionality ✅
2. Authentication (login, signup, logout) ✅ (login implemented)
3. Recipe viewing
4. Recipe creation/editing 
5. My recipes page

## Implemented Tests

### Landing Page Tests (`e2e/landing.cy.js`)
- Verifies main components display correctly
- Checks for expected sections and content

### Login Tests (`e2e/login.cy.js`)
- Verifies login form displays correctly
- Tests validation for empty fields
- Tests error handling for invalid email formats
- Tests error handling for incorrect credentials
- Tests successful login with valid credentials

## Best Practices

- Don't rely on previous tests - each test should be independent
- Avoid unnecessary waits - use Cypress's automatic waiting
- Add comments for complex assertions
- Keep tests simple and focused
- Add retry logic for flaky operations
- Use intercepts for network-dependent tests

## Troubleshooting

If tests fail in Amplify but pass locally:
- Check environment variables
- Look at test artifacts (screenshots, videos)
- Check if selectors need to be updated
- Verify test timing for async operations