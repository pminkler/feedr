import { test } from '@playwright/test';
import { LandingPage } from './page-objects/LandingPage';

test('landing page loads correctly and FAQ works', async ({ page }) => {
  const landingPage = new LandingPage(page);

  // Navigate to landing page
  await landingPage.goto();

  // Verify page is loaded with all essential elements
  await landingPage.expectPageLoaded();

  // Use a more reliable selector approach
  try {
    // First try to click the FAQ item using the page object method with improved selectors
    await landingPage.expandFaqItem('How does Feedr work?');
  }
  catch (e) {
    console.log('Could not click FAQ item using page object method, trying direct selector');
    // Fallback approach - try to find and click the FAQ button directly
    const faqItems = page.locator('button').filter({ hasText: 'How does Feedr work?' }).first();
    await faqItems.click();
  }

  // Verify answer is visible with a more flexible approach
  await landingPage.expectFaqAnswerVisible('Feedr uses advanced AI');
});
