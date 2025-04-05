import { expect } from '@playwright/test';
import { claudeTest, captureHtml, createTestReport, suggestSelectors, debugLog } from './utils/claude';

// Claude-enhanced test suite for recipe URL generation
claudeTest.describe('Recipe URL Generation Test', () => {
  claudeTest.beforeEach(async ({ page }) => {
    // Visit the landing page before each test
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Capture the initial state of the page with Claude's enhanced capture
    await captureHtml(page, 'recipe-url-initial', {
      screenshot: true,
      annotate: [{ selector: 'h1', text: 'Landing page heading' }],
    });

    // Create a comprehensive report of the initial page state
    await createTestReport(page, 'recipe-url-landing-page');
  });

  claudeTest('can generate recipe from a real recipe URL', async ({ page }) => {
    // Wait for the page to be fully loaded and stable
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('form', { state: 'visible' });

    // Use Claude's tools to capture the form
    await captureHtml(page, 'recipe-url-form-inspect', {
      screenshot: true,
      highlight: 'form',
      annotate: [{ selector: 'form', text: 'Recipe form inspection' }],
    });

    // Capture the form state before interaction
    await captureHtml(page, 'recipe-url-form-initial', {
      screenshot: true,
      highlight: 'form',
      annotate: [{ selector: 'form', text: 'Recipe URL input form' }],
    });

    // Get form elements using Playwright's recommended selectors
    const urlInput = page.getByPlaceholder('Recipe URL');
    const submitButton = page.getByRole('button', { name: /Get Recipe|Obtén la receta|Obtenez la recette/i });

    // Verify that the input and button are visible
    await expect(urlInput).toBeVisible();
    await expect(submitButton).toBeVisible();

    // Fill the input with a real recipe URL
    await urlInput.fill('https://www.allrecipes.com/recipe/21014/good-old-fashioned-pancakes/');

    // Verify the input has the correct value
    await expect(urlInput).toHaveValue('https://www.allrecipes.com/recipe/21014/good-old-fashioned-pancakes/');

    // Capture the form state after filling the URL
    await captureHtml(page, 'recipe-url-form-filled', {
      screenshot: true,
      highlight: 'input',
      annotate: [{ selector: 'input', text: 'Real recipe URL entered' }],
    });

    // Create a detailed report of the form state before submission
    await createTestReport(page, 'recipe-url-before-submission');

    // Click the submit button to start the recipe generation
    await submitButton.click();

    // Capture immediately after clicking to document any loading indicators
    await captureHtml(page, 'recipe-url-submission-loading', {
      screenshot: true,
      annotate: [{ selector: 'body', text: 'State immediately after submission' }],
    });

    // Wait for navigation to the recipe page
    await page.waitForURL(/\/recipes\//, { timeout: 60000 });

    // Wait for the recipe page to load fully
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('h1', { state: 'visible' });

    // Capture the result page to document what we got
    await captureHtml(page, 'recipe-url-result-page', {
      screenshot: true,
    });

    // Create a comprehensive report of the recipe page
    await createTestReport(page, 'recipe-url-result-detail');

    // Get suggestions for element selectors to improve test reliability
    const titleSelectorInfo = await suggestSelectors(page, 'h1');
    debugLog('Title selector suggestions:', titleSelectorInfo);

    // Check for recipe title
    const recipeTitle = page.locator('h1').first();
    await expect(recipeTitle).toBeVisible();

    // Capture the title with context
    await captureHtml(page, 'recipe-url-result-title', {
      screenshot: true,
      highlight: 'h1',
      annotate: [{ selector: 'h1', text: 'Generated recipe title' }],
    });

    // Get and log the actual title text
    const titleText = await recipeTitle.textContent();
    debugLog('Recipe title:', titleText);

    // Since we can't guarantee exactly what the title will be (AI generation may vary),
    // we'll just verify that we have some content in the title
    expect(titleText).toBeTruthy();
    expect(titleText?.length).toBeGreaterThan(3);

    // Find ingredients list using multiple possible selectors for resilience
    // This handles different possible DOM structures
    const ingredientsSection = page.locator('h2, h3, h4').filter({ hasText: /ingredients/i }).first();

    if (await ingredientsSection.isVisible()) {
      // Capture the ingredients section
      await captureHtml(page, 'recipe-url-result-ingredients', {
        screenshot: true,
        highlight: await ingredientsSection.evaluate((el) => {
          // Find the closest parent that contains both the heading and the list
          let parent = el.parentElement;
          while (parent && !parent.querySelector('ul, ol, div > ul, div > ol')) {
            parent = parent.parentElement;
          }
          return parent ? parent.tagName.toLowerCase() + (parent.id ? '#' + parent.id : '') : 'body';
        }),
      });
    }

    // Find instructions section
    const instructionsSection = page.locator('h2, h3, h4').filter({ hasText: /instructions|directions|steps/i }).first();

    if (await instructionsSection.isVisible()) {
      // Capture the instructions section
      await captureHtml(page, 'recipe-url-result-instructions', {
        screenshot: true,
        highlight: await instructionsSection.evaluate((el) => {
          // Find the closest parent that contains both the heading and the content
          let parent = el.parentElement;
          while (parent && !parent.querySelector('ol, div > ol, p, div > p')) {
            parent = parent.parentElement;
          }
          return parent ? parent.tagName.toLowerCase() + (parent.id ? '#' + parent.id : '') : 'body';
        }),
      });
    }

    // Final comprehensive report after validation
    await createTestReport(page, 'recipe-url-final-validation');
  });

  claudeTest('verifies recipe creation with loading states and final display', async ({ page }) => {
    // Wait for the page to be fully loaded and stable
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('form', { state: 'visible' });

    // Get form elements
    const urlInput = page.getByPlaceholder('Recipe URL');
    const submitButton = page.getByRole('button', { name: /Get Recipe|Obtén la receta|Obtenez la recette/i });

    // Fill the form with a recipe URL
    await urlInput.fill('https://www.allrecipes.com/recipe/21014/good-old-fashioned-pancakes/');
    await expect(urlInput).toHaveValue('https://www.allrecipes.com/recipe/21014/good-old-fashioned-pancakes/');

    // Capture the form state before submission
    await captureHtml(page, 'recipe-loading-form-filled', {
      screenshot: true,
      highlight: 'form',
      annotate: [{ selector: 'form', text: 'Form with URL ready to submit' }],
    });

    // Click submit and track navigation
    await Promise.all([
      page.waitForURL(/\/recipes\//, { timeout: 60000 }),
      submitButton.click(),
    ]);

    // Verify we've navigated to the recipe detail page
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/recipes\//);

    // Immediately capture the loading state
    await captureHtml(page, 'recipe-loading-initial-state', {
      screenshot: true,
      annotate: [{ selector: 'body', text: 'Recipe page loading state' }],
    });

    // Check for loading indicators - loading message or animation
    const loadingMessageElement = page.locator('.animate-pulse').first();
    if (await loadingMessageElement.isVisible()) {
      // Capture the loading message
      await captureHtml(page, 'recipe-loading-message', {
        screenshot: true,
        highlight: '.animate-pulse',
        annotate: [{ selector: '.animate-pulse', text: 'Loading message or animation' }],
      });

      // Verify the loading element exists - it might be an animation without text
      await expect(loadingMessageElement).toBeVisible();

      // Log the message if it has text
      try {
        const message = await loadingMessageElement.textContent();
        if (message && message.trim().length > 0) {
          debugLog(`Loading message displayed: ${message}`);
        }
        else {
          debugLog('Loading animation visible (no text content)');
        }
      }
      catch {
        debugLog('Loading element visible but could not extract text');
      }
    }

    // Check for loading skeletons
    const skeletons = page.locator('.h-4.w-full');
    if (await skeletons.count() > 0) {
      // Capture the skeletons
      await captureHtml(page, 'recipe-loading-skeletons', {
        screenshot: true,
        highlight: '.h-4.w-full',
        annotate: [{ selector: '.h-4.w-full', text: 'Loading skeleton' }],
      });

      debugLog(`Found ${await skeletons.count()} skeleton loaders`);
      await expect(skeletons.first()).toBeVisible();
    }

    // Verify progress indicator
    const progressBar = page.locator('div:has(> .progress)');
    if (await progressBar.isVisible()) {
      await captureHtml(page, 'recipe-loading-progress', {
        screenshot: true,
        highlight: '.progress',
        annotate: [{ selector: '.progress', text: 'Progress indicator' }],
      });

      await expect(progressBar).toBeVisible();
    }

    // Wait for recipe to finish loading
    await page.waitForSelector('.list-disc.list-inside', { timeout: 120000 });

    // Create report of the fully loaded state
    await createTestReport(page, 'recipe-loading-complete-state');

    // Verify recipe content is loaded
    const ingredientsList = page.locator('.list-disc.list-inside').first();
    await expect(ingredientsList).toBeVisible();

    // Verify recipe steps are loaded
    const instructionsList = page.locator('.list-decimal.list-inside').first();
    await expect(instructionsList).toBeVisible();

    // Capture the loaded recipe
    await captureHtml(page, 'recipe-loading-completed', {
      screenshot: true,
      highlight: '#recipeDetails',
      annotate: [
        { selector: '.list-disc.list-inside', text: 'Ingredients list' },
        { selector: '.list-decimal.list-inside', text: 'Instructions list' },
      ],
    });

    // Verify that main content is visible and loading is complete
    // Rather than check that no loading elements exist (they might be hidden in DOM),
    // we'll verify that the main content elements are present and visible

    // Check for ingredients list
    await expect(page.locator('.list-disc.list-inside li').first()).toBeVisible();

    // Check for steps list
    await expect(page.locator('.list-decimal.list-inside li').first()).toBeVisible();

    // Check for recipe details
    await expect(page.locator('.text-base.font-semibold').first()).toBeVisible();

    // Final verification
    debugLog('Recipe generation complete and content displayed successfully');
  });
});
