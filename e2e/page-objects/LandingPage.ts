import type { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { RecipePage } from './RecipePage';

/**
 * Page Object Model for the Feedr landing page
 */
export class LandingPage extends BasePage {
  // Page elements
  readonly heading: Locator;
  readonly recipeUrlInput: Locator;
  readonly submitButton: Locator;
  readonly browseImageButton: Locator;
  readonly takePhotoButton: Locator;
  readonly fileInput: Locator;
  readonly cameraInput: Locator;
  readonly signUpButton: Locator;
  readonly signInButton: Locator;
  readonly featuresGrid: Locator;
  readonly faqSection: Locator;
  readonly faqAccordion: Locator;

  constructor(page: Page) {
    super(page);

    // Initialize page elements
    this.heading = page.getByRole('heading', { name: 'Your Recipes, Simplified' });
    this.recipeUrlInput = page.getByTestId('recipe-url-input');
    this.submitButton = page.getByTestId('submit-button');
    this.browseImageButton = page.getByTestId('browse-image-button');
    this.takePhotoButton = page.getByTestId('take-photo-button');
    this.fileInput = page.getByTestId('file-input');
    this.cameraInput = page.getByTestId('camera-input');
    this.signUpButton = page.getByRole('button', { name: 'Sign Up' });
    this.signInButton = page.getByRole('button', { name: 'Sign In' });
    this.featuresGrid = page.getByTestId('features-grid');
    this.faqSection = page.getByTestId('faq-section');
    this.faqAccordion = page.getByTestId('faq-accordion');
  }

  /**
   * Navigate to the landing page
   */
  async goto() {
    await super.goto('/');
  }

  /**
   * Submit a recipe URL
   * @param url URL to submit
   */
  async submitRecipeUrl(url: string) {
    await this.fillInput(this.recipeUrlInput, url);
    await this.click(this.submitButton);
  }

  /**
   * Submit recipe URL and wait for the recipe page to load
   * @param url Recipe URL to submit
   * @returns RecipePage instance representing the loaded recipe page
   */
  async submitRecipeAndWaitForResult(url: string): Promise<RecipePage> {
    await this.fillInput(this.recipeUrlInput, url);
    await this.click(this.submitButton);

    // Wait for navigation to recipe page
    // Recipe URL format is /recipes/[id]
    await this.page.waitForURL(/\/recipes\/[a-zA-Z0-9-]+/, { timeout: 60000 });

    // Create the RecipePage instance
    const recipePage = new RecipePage(this.page);

    // Wait for recipe content to load
    await recipePage.waitForRecipeLoad();

    // Return the recipe page
    return recipePage;
  }

  /**
   * Upload image and wait for the recipe page to load
   * @param filePath Path to the image file to upload
   * @returns RecipePage instance representing the loaded recipe page
   */
  async uploadImageAndWaitForResult(filePath: string): Promise<RecipePage> {
    await this.fileInput.setInputFiles(filePath);

    // Wait for navigation to recipe page
    // Recipe URL format is /recipes/[id]
    await this.page.waitForURL(/\/recipes\/[a-zA-Z0-9-]+/, { timeout: 60000 });

    // Create the RecipePage instance
    const recipePage = new RecipePage(this.page);

    // Wait for recipe content to load
    await recipePage.waitForRecipeLoad();

    // Return the recipe page
    return recipePage;
  }

  /**
   * Open the browse image dialog
   */
  async openBrowseImageDialog() {
    await this.click(this.browseImageButton);
  }

  /**
   * Open the camera capture dialog
   */
  async openCameraDialog() {
    await this.click(this.takePhotoButton);
  }

  /**
   * Upload an image file
   * @param filePath Path to the image file
   */
  async uploadImage(filePath: string) {
    await this.fileInput.setInputFiles(filePath);
  }

  /**
   * Click on a FAQ item to expand it
   * @param question The FAQ question text
   */
  async expandFaqItem(question: string) {
    await this.click(this.page.getByRole('button', { name: question }));
  }

  /**
   * Check if a FAQ answer is visible
   * @param answerText Text to look for in the answer
   */
  async expectFaqAnswerVisible(answerText: string) {
    await this.expectVisible(this.page.getByText(answerText));
  }

  /**
   * Verify that all essential landing page elements are visible
   */
  async expectPageLoaded() {
    await this.expectVisible(this.heading);
    await this.expectVisible(this.recipeUrlInput);
    await this.expectVisible(this.submitButton);
    await this.expectVisible(this.signUpButton);
    await this.expectVisible(this.signInButton);
    await this.expectVisible(this.featuresGrid);
  }
}
