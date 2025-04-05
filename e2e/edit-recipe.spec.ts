import { test, expect } from './utils/debug-test';

test('edit recipe functionality', async ({ page }) => {
  // Set a longer timeout for this test since it involves recipe generation
  test.setTimeout(120000);

  // Load the landing page
  await page.goto('http://localhost:3000/');
  await page.captureDebug('landing-page-loaded');

  // Submit a recipe URL
  await page.getByTestId('recipe-url-input').click();
  await page
    .getByTestId('recipe-url-input')
    .fill(
      'https://www.allrecipes.com/recipe/21014/good-old-fashioned-pancakes/',
    );
  await page.getByTestId('submit-button').click();
  await page.captureDebug('recipe-submitted');

  // Wait for the recipe to load and the edit button to be visible
  await expect(page.getByTestId('edit-recipe-button')).toBeVisible({
    timeout: 30000,
  });
  await page.captureDebug('edit-button-visible');

  // Click the edit button to open the edit slideover
  await page.getByTestId('edit-recipe-button').click();
  await page.captureDebug('edit-slideover-opened');

  // Edit recipe title
  await page.getByTestId('recipe-title-input').click();
  await page
    .getByTestId('recipe-title-input')
    .fill('Good Old-Fashioned Pancakes - Edited');
  await page.captureDebug('title-edited');

  // Edit recipe description
  await page.getByTestId('recipe-description-input').click();
  await page.getByTestId('recipe-description-input').fill('Edited Description');
  await page.captureDebug('description-edited');

  // Edit prep time
  await page.getByTestId('recipe-prep-time-input').click();
  await page.getByTestId('recipe-prep-time-input').fill('6');
  await page.getByTestId('recipe-prep-time-unit-select').click();
  await page.getByText('Hours').click();
  await page.captureDebug('prep-time-edited');

  // Edit cook time
  await page.getByTestId('recipe-cook-time-input').click();
  await page.getByTestId('recipe-cook-time-input').fill('20');
  await page.getByTestId('recipe-cook-time-unit-select').click();
  await page.getByRole('option', { name: 'Hours' }).click();
  await page.captureDebug('cook-time-edited');

  // Edit servings
  await page.getByTestId('recipe-servings-input').click();
  await page.getByTestId('recipe-servings-input').fill('5');
  await page.captureDebug('servings-edited');

  // Edit nutrition information
  await page.getByTestId('recipe-calories-input').click();
  await page.getByTestId('recipe-calories-input').fill('1100');
  await page.getByTestId('recipe-protein-input').click();
  await page.getByTestId('recipe-protein-input').fill('30');
  await page.getByTestId('recipe-fat-input').click();
  await page.getByTestId('recipe-fat-input').fill('40');
  await page.getByTestId('recipe-carbs-input').click();
  await page.getByTestId('recipe-carbs-input').fill('140');
  await page.captureDebug('nutrition-edited');

  // Edit ingredient quantities
  await page.getByTestId('recipe-ingredient-quantity-0').click();
  await page.getByTestId('recipe-ingredient-quantity-0').fill('1.51');
  await page.getByTestId('recipe-ingredient-quantity-1').click();
  await page.getByTestId('recipe-ingredient-quantity-1').fill('3.51');
  await page.getByTestId('recipe-ingredient-quantity-2').click();
  await page.getByTestId('recipe-ingredient-quantity-2').fill('11');
  await page.getByTestId('recipe-ingredient-quantity-3').click();
  await page.getByTestId('recipe-ingredient-quantity-3').fill('0.251');
  await page.getByTestId('recipe-ingredient-quantity-4').click();
  await page.getByTestId('recipe-ingredient-quantity-4').fill('1.251');
  await page.getByTestId('recipe-ingredient-quantity-5').click();
  await page.getByTestId('recipe-ingredient-quantity-5').fill('31');
  await page.getByTestId('recipe-ingredient-quantity-6').click();
  await page.getByTestId('recipe-ingredient-quantity-6').fill('11');
  await page.captureDebug('ingredient-quantities-edited');

  // Edit ingredient units
  await page.getByTestId('recipe-ingredient-unit-0').click();
  await page.getByText('tablespoons').click();
  await page.getByTestId('recipe-ingredient-unit-1').click();
  await page.getByRole('option', { name: 'cup', exact: true }).click();
  await page.getByTestId('recipe-ingredient-unit-2').click();
  await page.getByRole('option', { name: 'tbsp' }).click();
  await page.getByTestId('recipe-ingredient-unit-3').click();
  await page.getByRole('option', { name: 'tbsp' }).click();
  await page.getByTestId('recipe-ingredient-unit-5').click();
  await page.getByRole('option', { name: 'tbsp' }).click();
  await page.getByTestId('recipe-ingredient-unit-4').click();
  await page.getByRole('option', { name: 'tbsp' }).click();
  await page.getByTestId('recipe-ingredient-unit-6').click();
  await page.getByRole('option', { name: 'tbsp' }).click();
  await page.captureDebug('ingredient-units-edited');

  // Add a new ingredient
  await page.getByTestId('recipe-add-ingredient-button').click();

  // Find the newly added ingredient by using the last recipe-ingredient-name element
  // This approach is more robust than relying on fixed indices
  const allIngredientNames = await page.locator('[data-testid^="recipe-ingredient-name-"]').all();
  const lastIngredientIndex = allIngredientNames.length - 1;

  await page.getByTestId(`recipe-ingredient-name-${lastIngredientIndex}`).click();
  await page.getByTestId(`recipe-ingredient-name-${lastIngredientIndex}`).fill('added');
  await page.getByTestId(`recipe-ingredient-unit-${lastIngredientIndex}`).click();
  await page.getByRole('option', { name: 'cup', exact: true }).click();
  await page.captureDebug('new-ingredient-added');

  // Add and then remove an ingredient
  await page.getByTestId('recipe-add-ingredient-button').click();

  // Find the new last ingredient
  const updatedIngredientNames = await page.locator('[data-testid^="recipe-ingredient-name-"]').all();
  const newLastIngredientIndex = updatedIngredientNames.length - 1;

  await page.getByTestId(`recipe-ingredient-name-${newLastIngredientIndex}`).click();
  await page.getByTestId(`recipe-ingredient-name-${newLastIngredientIndex}`).fill('removed');

  // Click the element and then delete it
  await page.getByTestId(`recipe-ingredient-delete-${newLastIngredientIndex}`).click();
  await page.captureDebug('ingredient-removed');

  // Add a new step
  await page.getByTestId('recipe-add-step-button').click();

  // Find the newly added step by locating all step descriptions and getting the last one
  const allStepDescriptions = await page.locator('[data-testid^="recipe-step-description-"]').all();
  const lastStepIndex = allStepDescriptions.length - 1;

  await page.getByTestId(`recipe-step-description-${lastStepIndex}`).click();
  await page.getByTestId(`recipe-step-description-${lastStepIndex}`).fill('Added step');
  await page.captureDebug('new-step-added');

  // Edit an existing step - use the second-to-last step to ensure we're not depending on specific indices
  const secondLastStepIndex = lastStepIndex - 1;
  if (secondLastStepIndex >= 0) {
    await page.getByTestId(`recipe-step-description-${secondLastStepIndex}`).click();
    await page
      .getByTestId(`recipe-step-description-${secondLastStepIndex}`)
      .fill('Edited step');
    await page.captureDebug('step-edited');
  }

  // Save the changes
  await page.getByTestId('recipe-save-button').click();
  await page.captureDebug('changes-saved');

  // Verify the changes were applied
  await expect(page.getByTestId('recipe-prep-time')).toContainText(
    'Prep time: 6 hours',
  );
  await expect(page.getByTestId('recipe-cook-time')).toContainText(
    'Cook time: 20 hours',
  );
  await expect(page.getByTestId('recipe-servings')).toContainText(
    'Servings: 5',
  );
  await expect(page.getByTestId('nutrition-calories')).toContainText(
    'Calories: 1100',
  );
  await expect(page.getByTestId('nutrition-protein')).toContainText(
    'Protein: 30',
  );
  await expect(page.getByTestId('nutrition-fat')).toContainText('Fat: 40');
  await expect(page.getByTestId('nutrition-carbs')).toContainText(
    'Carbohydrates: 140',
  );

  // Verify that the last step has our added content
  const finalStepElements = await page.locator('[data-testid^="step-item-"]').all();
  await expect(finalStepElements[finalStepElements.length - 1]).toContainText('Added step');

  // Verify ingredients were changed
  await expect(page.getByTestId('ingredient-item-0')).toContainText(
    '1.51 tablespoons all-purpose flour',
  );
  await expect(page.getByTestId('ingredient-item-1')).toContainText(
    '3.51 cup baking powder',
  );
  await expect(page.getByTestId('ingredient-item-2')).toContainText(
    '11 tbsp white sugar',
  );
  await expect(page.getByTestId('ingredient-item-3')).toContainText(
    '0.25 tbsp salt',
  );

  // Verify we can see our added ingredient somewhere in the ingredients list
  // Use a different approach to check for the added ingredient - check if any ingredient contains "added"
  const ingredientElements = await page.locator('[data-testid^="ingredient-item-"]').all();
  let addedIngredientFound = false;
  for (const ingredient of ingredientElements) {
    const text = await ingredient.textContent();
    if (text && text.includes('added')) {
      addedIngredientFound = true;
      break;
    }
  }
  expect(addedIngredientFound).toBeTruthy();

  await page.captureDebug('changes-verified');

  // Verify Instacart button is visible
  await expect(
    page.getByRole('button', { name: 'Instacart Get Recipe' }),
  ).toBeVisible();
  await page.captureDebug('test-completed');
});
