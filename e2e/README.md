# Feedr E2E Testing with Playwright

This directory contains end-to-end tests for the Feedr application using Playwright and the Page Object Model pattern.

## Table of Contents

- [Overview](#overview)
- [Directory Structure](#directory-structure)
- [Page Object Model](#page-object-model)
- [Iterative Test Development Process](#iterative-test-development-process)
- [Running Tests](#running-tests)
- [Best Practices](#best-practices)

## Overview

The E2E tests in this directory are designed to verify the core user journeys through the Feedr application, ensuring that features work correctly from the user's perspective. We use Playwright with TypeScript and follow the Page Object Model (POM) pattern to create maintainable, reusable test code.

## Directory Structure

```
e2e/
├── page-objects/        # Page Object Model classes
│   ├── BasePage.ts      # Base class with common methods
│   ├── LandingPage.ts   # Landing page object
│   ├── RecipePage.ts    # Recipe page object
│   └── ...              # Other page objects
├── utils/               # Testing utilities
│   ├── dom-capture.ts   # DOM capture utility for dev
│   └── ...              # Other utilities
├── *.spec.ts            # Regular test specifications
├── *.development.spec.ts # Development tests (ignored in regular runs)
└── README.md            # This file
```

## Page Object Model

We follow the Page Object Model pattern to encapsulate page behavior and provide a clean API for tests:

- **BasePage**: Contains common methods for all pages (navigation, element interaction)
- **LandingPage**: Represents the landing page with recipe submission functionality
- **RecipePage**: Represents the recipe page and edit slideover
- Each page object provides a fluent API for interacting with the page

Benefits of this approach:
- **Maintainability**: Changes to UI only require updates in one place
- **Readability**: Tests describe user actions, not technical details
- **Reusability**: Page objects can be reused across multiple tests
- **Fluent Transitions**: Methods that navigate between pages return the next page object

## Iterative Test Development Process

We use an iterative process for developing tests, especially for pages and components that change frequently or have complex interactions:

1. **Create Development Tests**: Files named `*.development.spec.ts` are used for development and are ignored in regular test runs
2. **Capture Initial State**: Navigate to a point where DOM state needs to be analyzed
3. **DOM Capture**: Use `captureDOMState()` to extract information about the page structure
4. **Review DOM Output**: Check the content in the `dom-captures` directory
5. **Identify Brittle Locators**: Look for elements without `data-testid` attributes or with complex selectors
6. **Update Components**: Edit the Vue components to add appropriate `data-testid` attributes to make tests more robust
7. **Update Page Model**: Extend the page object model with new methods and locators that use the data-testid attributes
8. **Advance Test**: Move the test one step further and repeat the process
9. **Finalize**: Once the entire flow is covered, create proper tests in `*.spec.ts` files

### DOM Capture Utility

The DOM capture utility (`dom-capture.ts`) extracts useful information from the page:
- Full HTML content
- Elements with data-testid attributes
- Form elements (inputs, buttons)

Files are saved to the `dom-captures` directory for analysis:
- `*-dom.html`: Full HTML content
- `*-testids.json`: Elements with data-testid attributes
- `*-form-elements.json`: Form elements

Example usage:
```typescript
// Capture DOM state with a descriptive prefix
await recipePage.captureDOMState('edit-recipe-form');
```

## Running Tests

Regular tests:
```
npm run test:e2e        # Run all tests
npm run test:e2e:ui     # Run with Playwright UI
npm run test:e2e:debug  # Run with extra debugging
npm run test:e2e:fast   # Run with minimal reporting
```

Development tests:
```
npx playwright test edit-recipe.development.spec.ts  # Run a specific development test
```

## Best Practices

1. **Use data-testid attributes**: Add `data-testid` attributes to elements in components to make tests more robust
   - Example: `<button data-testid="recipe-save-button">Save</button>`
   - Prefer to edit the components directly rather than using more brittle selectors
   - Use descriptive names that indicate the component's function, not just its type

2. **Adding data-testid to components**:
   - Add attributes to actionable elements (buttons, inputs, links)
   - Add attributes to elements used for verification (headings, text displays)
   - Use a consistent naming scheme: `component-function-element`
   - Example: `recipe-title-input`, `recipe-add-ingredient-button`

3. **Create step methods**: Page objects should provide methods that represent user actions, not just raw element interactions
   - Example: `editRecipe()` instead of `clickEditButton()`

4. **Fluent API**: Methods that navigate to another page should return that page's object

5. **Error handling**: Use Promise.catch() for handling timeouts and other errors gracefully

6. **Independent tests**: Each test should be independent and not rely on state from other tests

7. **Descriptive names**: Use clear, intention-revealing method and test names

8. **Comments**: Document complex interactions and edge cases

9. **Avoid tight coupling**: Don't make tests depend on implementation details that might change