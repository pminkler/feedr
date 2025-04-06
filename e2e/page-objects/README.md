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

### 3. Creating New Page Objects

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

## Best Practices

1. **Use data-testid attributes** for stable element selection
2. Add methods that represent user interactions, not just element interactions
3. Keep assertions in test files when possible, use page objects for interactions
4. Add page-specific helper methods to make test code more concise
5. Maintain a clean separation between test logic and page interaction code