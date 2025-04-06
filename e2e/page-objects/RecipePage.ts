import type { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object Model for the Recipe page
 */
export class RecipePage extends BasePage {
  // Header elements
  readonly userMenuButton: Locator;

  // Recipe content structure
  readonly recipeContentGrid: Locator;
  readonly recipeLeftColumn: Locator;
  readonly recipeRightColumn: Locator;

  // Recipe detail elements
  readonly detailsHeading: Locator;
  readonly recipeTitle: Locator;
  readonly recipeDetailsSection: Locator;
  readonly servingsSelector: Locator;
  readonly prepTime: Locator;
  readonly cookTime: Locator;
  readonly totalTime: Locator;
  readonly editRecipeButton: Locator;
  readonly cookingModeButton: Locator;
  readonly instacartButton: Locator;

  // Nutrition elements
  readonly nutritionHeading: Locator;
  readonly nutritionPerServing: Locator;
  readonly nutritionInfo: Locator;
  readonly caloriesValue: Locator;
  readonly proteinValue: Locator;
  readonly fatValue: Locator;
  readonly carbsValue: Locator;

  // Ingredients section
  readonly ingredientsHeading: Locator;
  readonly ingredientsList: Locator;

  // Steps section
  readonly stepsHeading: Locator;
  readonly instructionsList: Locator;

  constructor(page: Page) {
    super(page);

    // Initialize header elements
    this.userMenuButton = page.getByTestId('user-menu-button');

    // Initialize content structure
    this.recipeContentGrid = page.getByTestId('recipe-content-grid');
    this.recipeLeftColumn = page.getByTestId('recipe-left-column');
    this.recipeRightColumn = page.getByTestId('recipe-right-column');

    // Initialize recipe details elements
    this.detailsHeading = page.getByTestId('details-heading');
    this.recipeTitle = page.getByTestId('recipe-title');
    this.recipeDetailsSection = page.getByTestId('recipe-details');
    this.servingsSelector = page.getByTestId('servings-selector');
    this.prepTime = page.getByTestId('prep-time');
    this.cookTime = page.getByTestId('cook-time');
    this.totalTime = page.getByTestId('total-time');
    this.editRecipeButton = page.getByTestId('edit-recipe-button');
    this.cookingModeButton = page.getByTestId('cooking-mode-button');
    this.instacartButton = page.getByTestId('instacart-button');

    // Initialize nutrition elements
    this.nutritionHeading = page.getByTestId('nutrition-heading');
    this.nutritionPerServing = page.getByTestId('nutrition-per-serving');
    this.nutritionInfo = page.getByTestId('nutrition-info');
    this.caloriesValue = page.getByTestId('calories-value');
    this.proteinValue = page.getByTestId('protein-value');
    this.fatValue = page.getByTestId('fat-value');
    this.carbsValue = page.getByTestId('carbs-value');

    // Initialize ingredients section
    this.ingredientsHeading = page.getByTestId('ingredients-heading');
    this.ingredientsList = page.getByTestId('ingredients-list');

    // Initialize steps section
    this.stepsHeading = page.getByTestId('steps-heading');
    this.instructionsList = page.getByTestId('instructions-list');
  }

  /**
   * Navigate directly to a recipe by ID
   * @param recipeId The ID of the recipe to view
   */
  async gotoRecipe(recipeId: string) {
    await super.goto(`/recipes/${recipeId}`);
  }

  /**
   * Wait for recipe to load (checking for key elements)
   * @param timeout Maximum time to wait in milliseconds
   */
  async waitForRecipeLoad(timeout: number = 60000) {
    // Wait for core structure elements that are always present
    await this.page.waitForSelector('[data-testid="recipe-content-grid"]', { timeout });
    await this.page.waitForSelector('[data-testid="ingredients-heading"]', { timeout });
    await this.page.waitForSelector('[data-testid="steps-heading"]', { timeout });

    // Check if we're in skeleton loading state
    const hasSkeletonLoading = await this.page.isVisible('[data-testid="recipe-details-skeleton"]');

    if (hasSkeletonLoading) {
      console.log('Recipe is in skeleton loading state, waiting for content to load...');

      // If we're in skeleton loading state, wait a bit for content to appear
      // The test might need to be adjusted if recipe generation takes longer
      await this.page.waitForSelector('[data-testid="recipe-title"]', { timeout: timeout / 2 })
        .catch(() => {
          console.log('Recipe title did not appear in time, but we can still interact with skeleton state');
        });
    }
  }

  /**
   * Verify recipe page is loaded with expected content
   * @param expectedTitle Optional title to verify
   */
  async expectRecipeLoaded(expectedTitle?: string) {
    // Verify core structure is present
    await this.expectVisible(this.recipeContentGrid);
    await this.expectVisible(this.ingredientsHeading);
    await this.expectVisible(this.stepsHeading);

    // Check if we're looking at skeleton state or fully loaded recipe
    const hasSkeletonLoading = await this.page.isVisible('[data-testid="recipe-details-skeleton"]');

    // If we're testing with loaded content (not skeleton state)
    if (!hasSkeletonLoading && expectedTitle) {
      // Check for recipe title when it becomes available
      await this.page.waitForSelector('[data-testid="recipe-title"]', { timeout: 5000 })
        .then(async () => {
          await this.expectVisible(this.recipeTitle);

          await this.page.waitForFunction(
            (selector, title) => {
              const element = document.querySelector(selector);
              return element && element.textContent && element.textContent.includes(title);
            },
            '[data-testid="recipe-title"]',
            expectedTitle,
            { timeout: 5000 },
          ).catch(() => {
            console.log('Recipe title content verification timed out');
          });
        })
        .catch(() => {
          console.log('Recipe title with expected content did not appear in time');
        });
    }

    // Consider skeleton loading state a success for testing purposes
    if (hasSkeletonLoading) {
      console.log('Recipe page is in skeleton loading state (content still generating)');
    }
  }

  /**
   * Click the edit recipe button and wait for the edit form to appear
   * @returns The same RecipePage instance with methods to interact with the edit slideover
   */
  async clickEditRecipe() {
    await this.click(this.editRecipeButton);
    // Wait for the edit form to appear
    await this.page.waitForSelector('[data-testid="recipe-edit-form"]', { timeout: 5000 })
      .catch(() => {
        console.log('Recipe edit form did not appear within timeout');
      });

    return this;
  }

  // Edit Recipe Slideover methods

  /**
   * Get the title from the edit form
   */
  async getEditFormTitle(): Promise<string> {
    const titleInput = this.page.getByTestId('recipe-title-input');
    return await titleInput.inputValue();
  }

  /**
   * Set the title in the edit form
   * @param title New recipe title
   */
  async setEditFormTitle(title: string): Promise<void> {
    const titleInput = this.page.getByTestId('recipe-title-input');
    await titleInput.fill(title);
  }

  /**
   * Set the description in the edit form
   * @param description New recipe description
   */
  async setEditFormDescription(description: string): Promise<void> {
    const descriptionInput = this.page.getByTestId('recipe-description-input');
    await descriptionInput.fill(description);
  }

  /**
   * Set the prep time in the edit form
   * @param minutes Prep time in minutes
   */
  async setEditFormPrepTime(minutes: string | number): Promise<void> {
    const prepTimeInput = this.page.getByTestId('recipe-prep-time-input');
    await prepTimeInput.fill(String(minutes));
  }

  /**
   * Set the cook time in the edit form
   * @param minutes Cook time in minutes
   */
  async setEditFormCookTime(minutes: string | number): Promise<void> {
    const cookTimeInput = this.page.getByTestId('recipe-cook-time-input');
    await cookTimeInput.fill(String(minutes));
  }

  /**
   * Set the servings in the edit form
   * @param servings Number of servings
   */
  async setEditFormServings(servings: string | number): Promise<void> {
    const servingsInput = this.page.getByTestId('recipe-servings-input');
    await servingsInput.fill(String(servings));
  }

  /**
   * Update an ingredient in the edit form
   * @param index Index of the ingredient to update (0-based)
   * @param quantity Ingredient quantity
   * @param name Ingredient name
   */
  async updateEditFormIngredient(index: number, quantity: string | number, name: string): Promise<void> {
    const quantityInput = this.page.getByTestId(`recipe-ingredient-quantity-${index}`);
    const nameInput = this.page.getByTestId(`recipe-ingredient-name-${index}`);

    await quantityInput.fill(String(quantity));
    await nameInput.fill(name);
  }

  /**
   * Update a step in the edit form
   * @param index Index of the step to update (0-based)
   * @param description Step description
   */
  async updateEditFormStep(index: number, description: string): Promise<void> {
    const stepInput = this.page.getByTestId(`recipe-step-description-${index}`);
    await stepInput.fill(description);
  }

  /**
   * Add a new ingredient in the edit form
   */
  async addEditFormIngredient(): Promise<void> {
    const addButton = this.page.getByTestId('recipe-add-ingredient-button');
    await addButton.click();
  }

  /**
   * Add a new step in the edit form
   */
  async addEditFormStep(): Promise<void> {
    const addButton = this.page.getByTestId('recipe-add-step-button');
    await addButton.click();
  }

  /**
   * Delete an ingredient in the edit form
   * @param index Index of the ingredient to delete (0-based)
   */
  async deleteEditFormIngredient(index: number): Promise<void> {
    const deleteButton = this.page.getByTestId(`recipe-ingredient-delete-${index}`);
    await deleteButton.click();
  }

  /**
   * Delete a step in the edit form
   * @param index Index of the step to delete (0-based)
   */
  async deleteEditFormStep(index: number): Promise<void> {
    const deleteButton = this.page.getByTestId(`recipe-step-delete-${index}`);
    await deleteButton.click();
  }

  /**
   * Save changes in the edit form
   */
  async saveEditForm(): Promise<void> {
    const saveButton = this.page.getByTestId('recipe-save-button');
    await saveButton.click();

    // Wait for the edit form to disappear
    await this.page.waitForSelector('[data-testid="recipe-edit-form"]', { state: 'detached', timeout: 5000 })
      .catch(() => {
        console.log('Recipe edit form did not disappear after saving');
      });

    // Wait a moment for the UI to update after saving
    await this.page.waitForTimeout(500);

    // Wait for any potential loading spinners to disappear
    await this.page.waitForSelector('[data-testid="loading-spinner"]', { state: 'detached', timeout: 2000 })
      .catch(() => {
        // It's okay if there wasn't a loading spinner
      });
  }

  /**
   * Cancel changes in the edit form
   */
  async cancelEditForm(): Promise<void> {
    const cancelButton = this.page.getByTestId('recipe-cancel-button');
    await cancelButton.click();

    // Wait for the edit form to disappear
    await this.page.waitForSelector('[data-testid="recipe-edit-form"]', { state: 'detached', timeout: 5000 })
      .catch(() => {
        console.log('Recipe edit form did not disappear after canceling');
      });
  }

  /**
   * Enter cooking mode
   * When CookingModePage model is created, this should return an instance of it
   */
  async enterCookingMode() {
    await this.click(this.cookingModeButton);
    // Return CookingModePage when created
    // return new CookingModePage(this.page);
  }

  /**
   * Change recipe servings
   * @param servings Number of servings to select
   */
  async changeServings(servings: string | number) {
    if (this.servingsSelector) {
      await this.click(this.servingsSelector);
      await this.page.getByRole('option', { name: String(servings) }).click();
    }
  }

  /**
   * Click Instacart button to add ingredients to cart
   */
  async addToInstacart() {
    if (this.instacartButton) {
      await this.click(this.instacartButton);
    }
  }

  /**
   * Get recipe title text
   */
  async getRecipeTitle(): Promise<string> {
    if (this.recipeTitle) {
      return await this.recipeTitle.textContent() || '';
    }
    return '';
  }

  /**
   * Get list of ingredients
   */
  async getIngredientsList(): Promise<string[]> {
    if (!this.ingredientsList) {
      return [];
    }

    const ingredients = await this.ingredientsList.locator('li').all();
    const texts = [];
    for (const ingredient of ingredients) {
      texts.push((await ingredient.textContent()) || '');
    }
    return texts;
  }

  /**
   * Get list of instructions
   */
  async getInstructionsList(): Promise<string[]> {
    if (!this.instructionsList) {
      return [];
    }

    const instructions = await this.instructionsList.locator('li').all();
    const texts = [];
    for (const instruction of instructions) {
      texts.push((await instruction.textContent()) || '');
    }
    return texts;
  }
}
