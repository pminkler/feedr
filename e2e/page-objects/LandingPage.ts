import type { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

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
