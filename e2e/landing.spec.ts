import { test } from '@playwright/test';
import { LandingPage } from './page-objects/LandingPage';

test('landing page loads correctly and FAQ works', async ({ page }) => {
  const landingPage = new LandingPage(page);

  // Navigate to landing page
  await landingPage.goto();

  // Verify page is loaded with all essential elements
  await landingPage.expectPageLoaded();

  // Test FAQ functionality
  await landingPage.expandFaqItem('How does Feedr work?');
  await landingPage.expectFaqAnswerVisible('Feedr uses advanced AI to');
});
