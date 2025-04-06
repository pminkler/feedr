# Page Object Models

This directory contains Page Object Models (POM) for Feedr's E2E tests using Playwright.

## What are Page Object Models?

Page Object Models are a design pattern for structuring test code that:

- Separates page interaction logic from test logic
- Improves test maintainability by centralizing element selectors
- Makes tests more readable and easier to maintain
- Reduces code duplication across tests

Learn more: [Playwright Page Object Models](https://playwright.dev/docs/pom)

## Structure

- `BasePage.ts` - Base class with common methods for all pages
- `LandingPage.ts` - POM for the landing page with recipe submission functionality
- `RecipePage.ts` - POM for the recipe details page

## Page Transitions

Our implementation uses the fluent API pattern to handle page transitions. This means that methods that cause navigation return an instance of the next page's POM:

```typescript
// From LandingPage.ts
async submitRecipeAndWaitForResult(url: string): Promise<RecipePage> {
  await this.fillInput(this.recipeUrlInput, url);
  await this.click(this.submitButton);
  
  // Wait for navigation to recipe page
  await this.page.waitForURL(/\/recipes\/[a-zA-Z0-9-]+/);
  
  // Create and return the next page object
  const recipePage = new RecipePage(this.page);
  await recipePage.waitForRecipeLoad();
  
  return recipePage;
}
```

## How to Use

### 1. Import the Page Object in your test:

```typescript
import { test } from '@playwright/test';
import { LandingPage } from './page-objects/LandingPage';
```

### 2. Create an instance in your test:

```typescript
test('landing page works', async ({ page }) => {
  const landingPage = new LandingPage(page);
  
  // Navigate to the page
  await landingPage.goto();
  
  // Interact with the page using high-level methods
  await landingPage.submitRecipeUrl('https://example.com/recipe');
});
```

### 3. Handle Page Transitions:

```typescript
test('recipe flow', async ({ page }) => {
  const landingPage = new LandingPage(page);
  await landingPage.goto();
  
  // Submit recipe URL and follow to recipe page
  const recipePage = await landingPage.submitRecipeAndWaitForResult(
    'https://example.com/recipe'
  );
  
  // Now we're on the recipe page and can interact with it
  await recipePage.expectRecipeLoaded();
  const title = await recipePage.getRecipeTitle();
  console.log('Recipe title:', title);
});
```

### 4. Creating New Page Objects

To create a new page object for another page:

1. Create a new file in this directory, e.g., `RecipePage.ts`
2. Extend the `BasePage` class
3. Define page-specific locators and interaction methods

Example:

```typescript
import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class RecipePage extends BasePage {
  // Page locators
  readonly title: Locator;
  readonly ingredients: Locator;
  
  constructor(page: Page) {
    super(page);
    this.title = page.getByTestId('recipe-title');
    this.ingredients = page.getByTestId('ingredients-list');
  }
  
  // Page-specific methods
  async expectRecipeLoaded(expectedTitle: string) {
    await this.expectVisible(this.title);
    await this.expectTextContent(this.title, expectedTitle);
  }
}
```

## Handling Loading States

Our implementation handles both fully loaded pages and skeleton loading states, making tests more robust:

```typescript
async expectRecipeLoaded(expectedTitle?: string) {
  // Verify core structure is present
  await this.expectVisible(this.recipeContentGrid);
  
  // Check if we're looking at skeleton state or fully loaded recipe
  const hasSkeletonLoading = await this.page.isVisible('[data-testid="recipe-details-skeleton"]');
  
  if (hasSkeletonLoading) {
    console.log('Recipe page is in skeleton loading state (content still generating)');
  } else {
    // Additional verifications for fully loaded state
  }
}
```

## Best Practices

1. **Use data-testid attributes** for stable element selection
2. Add methods that represent user interactions, not just element interactions
3. Add fluent navigation methods that return the next page object
4. Handle loading states and transitions gracefully
5. Keep assertions in test files when possible, use page objects for interactions
6. Add page-specific helper methods to make test code more concise
7. Maintain a clean separation between test logic and page interaction code

## Capturing DOM State for Page Object Development

Every page object includes a `captureDOMState()` method inherited from BasePage that you can use to extract DOM structure and elements with test IDs. This is extremely helpful when developing new page objects or enhancing existing ones.

### How to Use DOM Capture

1. Create a development test file (e.g., `edit-recipe-development.spec.ts`)
2. Navigate to the page or state you want to capture
3. Call the `captureDOMState()` method with a descriptive prefix
4. Run the test
5. Examine the captured files in the `dom-captures` directory
6. Update your page object models with the correct selectors

```typescript
// Example development test
test('capture edit recipe form structure', async ({ page }) => {
  const landingPage = new LandingPage(page);
  await landingPage.goto();
  
  // Navigate to recipe page
  const recipePage = await landingPage.submitRecipeAndWaitForResult(
    'https://example.com/recipe'
  );
  
  // Capture the initial recipe page state
  await recipePage.captureDOMState('recipe-page');
  
  // Open edit form
  await page.click('[data-testid="edit-recipe-button"]');
  
  // Capture DOM state of the edit form
  await recipePage.captureDOMState('edit-recipe-form');
  
  // Continue test development using the captured DOM information
  // ...
});
```

### Captured Files

For each capture, three files are generated:
- `{prefix}-dom.html` - Complete HTML of the page
- `{prefix}-testids.json` - All elements with data-testid attributes
- `{prefix}-form-elements.json` - All form elements (inputs, buttons, etc.)

Use these files to identify selectors when building your page objects. This approach allows for incremental test development as you explore the application's UI structure.