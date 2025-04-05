<template>
  <USlideover
    :open="modelValue"
    :title="t('editRecipe')"
    :timeout="0"
    prevent-close
    data-testid="recipe-edit-slideover"
    @update:open="$emit('update:modelValue', $event)"
  >
    <!-- Body content -->
    <template #body>
      <div class="space-y-6" data-testid="recipe-edit-form">
        <!-- Recipe Title -->
        <div class="w-full">
          <UFormField :label="t('recipeTitle')" class="w-full">
            <UInput
              v-model="editTitleValue"
              type="text"
              placeholder="Recipe Title"
              class="w-full"
              data-test="recipe-title-input"
              data-testid="recipe-title-input"
            />
          </UFormField>
        </div>

        <!-- Recipe Description -->
        <div class="w-full">
          <UFormField :label="t('description')" class="w-full">
            <UTextarea
              v-model="editDescriptionValue"
              placeholder="Recipe Description"
              :rows="3"
              class="w-full"
              data-test="recipe-description-input"
              data-testid="recipe-description-input"
            />
          </UFormField>
        </div>

        <USeparator />

        <!-- Recipe Details -->
        <div data-testid="recipe-details-section">
          <h3 class="text-base font-semibold mb-3">
            {{ t('recipeDetails') }}
          </h3>

          <div class="space-y-4">
            <!-- Prep Time -->
            <UFormField :label="t('prepTime')">
              <div class="flex items-center gap-2">
                <UInput
                  v-model.number="editPrepTimeValue"
                  type="number"
                  min="0"
                  class="w-20"
                  placeholder="0"
                  data-test="prep-time-input"
                  data-testid="recipe-prep-time-input"
                />
                <USelectMenu
                  v-model="editPrepTimeUnit"
                  :items="timeUnitOptions"
                  data-testid="recipe-prep-time-unit-select"
                />
              </div>
            </UFormField>

            <!-- Cook Time -->
            <UFormField :label="t('cookTime')">
              <div class="flex items-center gap-2">
                <UInput
                  v-model.number="editCookTimeValue"
                  type="number"
                  min="0"
                  class="w-20"
                  placeholder="0"
                  data-testid="recipe-cook-time-input"
                />
                <USelectMenu
                  v-model="editCookTimeUnit"
                  :items="timeUnitOptions"
                  data-testid="recipe-cook-time-unit-select"
                />
              </div>
            </UFormField>

            <!-- Servings -->
            <UFormField :label="t('servings')">
              <UInput
                v-model.number="editServingsValue"
                type="number"
                min="1"
                class="w-20"
                placeholder="1"
                data-test="servings-input"
                data-testid="recipe-servings-input"
              />
            </UFormField>
          </div>
        </div>

        <USeparator />

        <!-- Nutritional Information -->
        <div
          v-if="
            recipe
              && recipe.nutritionalInformation
              && recipe.nutritionalInformation.status === 'SUCCESS'
          "
          data-testid="recipe-nutrition-section"
        >
          <h3 class="text-base font-semibold mb-3">
            {{ t('nutritionalInformation') }}
          </h3>

          <div class="space-y-4">
            <!-- Calories -->
            <UFormField :label="t('calories')">
              <div class="flex items-center">
                <UInput
                  v-model="editCalories"
                  type="number"
                  min="0"
                  class="w-20"
                  placeholder="e.g. 350"
                  data-testid="recipe-calories-input"
                />
                <span
                  v-if="recipe?.nutritionalInformation?.calories && getUnitSuffix(recipe.nutritionalInformation.calories)"
                  class="ml-1"
                >
                  {{ getUnitSuffix(recipe.nutritionalInformation.calories) }}
                </span>
              </div>
            </UFormField>

            <!-- Protein -->
            <UFormField :label="t('protein')">
              <div class="flex items-center">
                <UInput
                  v-model="editProtein"
                  type="number"
                  min="0"
                  class="w-20"
                  placeholder="e.g. 25"
                  data-testid="recipe-protein-input"
                />
                <span
                  v-if="recipe?.nutritionalInformation?.protein && getUnitSuffix(recipe.nutritionalInformation.protein)"
                  class="ml-1"
                >
                  {{ getUnitSuffix(recipe.nutritionalInformation.protein) }}
                </span>
              </div>
            </UFormField>

            <!-- Fat -->
            <UFormField :label="t('fat')">
              <div class="flex items-center">
                <UInput
                  v-model="editFat"
                  type="number"
                  min="0"
                  class="w-20"
                  placeholder="e.g. 15"
                  data-testid="recipe-fat-input"
                />
                <span
                  v-if="recipe?.nutritionalInformation?.fat && getUnitSuffix(recipe.nutritionalInformation.fat)"
                  class="ml-1"
                >
                  {{ getUnitSuffix(recipe.nutritionalInformation.fat) }}
                </span>
              </div>
            </UFormField>

            <!-- Carbs -->
            <UFormField :label="t('carbs')">
              <div class="flex items-center">
                <UInput
                  v-model="editCarbs"
                  type="number"
                  min="0"
                  class="w-20"
                  placeholder="e.g. 30"
                  data-testid="recipe-carbs-input"
                />
                <span
                  v-if="recipe?.nutritionalInformation?.carbs && getUnitSuffix(recipe.nutritionalInformation.carbs)"
                  class="ml-1"
                >
                  {{ getUnitSuffix(recipe.nutritionalInformation.carbs) }}
                </span>
              </div>
            </UFormField>
          </div>
        </div>

        <USeparator />

        <!-- Ingredients -->
        <div data-testid="recipe-ingredients-section">
          <h3 class="text-base font-semibold mb-3">
            {{ t('ingredientsSection') }}
          </h3>

          <div class="space-y-3">
            <div
              v-for="(ingredient, index) in editIngredients"
              :key="index"
              class="flex items-center gap-2"
              :data-testid="`recipe-ingredient-row-${index}`"
            >
              <UInput
                v-model.number="ingredient.quantity"
                type="number"
                size="sm"
                class="w-20"
                step="0.01"
                min="0"
                placeholder="Qty"
                :data-testid="`recipe-ingredient-quantity-${index}`"
              />
              <USelectMenu
                v-model="ingredient.unit"
                :items="unitOptions"
                size="sm"
                class="w-32"
                placeholder="Unit"
                searchable
                :data-testid="`recipe-ingredient-unit-${index}`"
              />
              <UInput
                v-model="ingredient.name"
                type="text"
                size="sm"
                class="flex-1"
                placeholder="Ingredient name"
                data-test="ingredient-name-input"
                :data-testid="`recipe-ingredient-name-${index}`"
              />
              <UButton
                icon="i-heroicons-trash"
                color="error"
                variant="ghost"
                size="xs"
                :data-testid="`recipe-ingredient-delete-${index}`"
                @click="removeIngredient(index)"
              />
            </div>

            <!-- Add new ingredient button -->
            <div class="flex justify-center mt-2">
              <UButton
                icon="i-heroicons-plus"
                color="neutral"
                size="sm"
                data-testid="recipe-add-ingredient-button"
                @click="addNewIngredient()"
              >
                {{ t('addIngredient') }}
              </UButton>
            </div>
          </div>
        </div>

        <USeparator />

        <!-- Steps -->
        <div data-testid="recipe-steps-section">
          <h3 class="text-base font-semibold mb-3">
            {{ t('stepsSection') }}
          </h3>

          <div class="space-y-3">
            <div
              v-for="(step, index) in editSteps"
              :key="index"
              class="flex items-start gap-2"
              :data-testid="`recipe-step-row-${index}`"
            >
              <span class="text-sm text-(--ui-text-muted) w-6 mt-2">{{ index + 1 }}.</span>
              <UTextarea
                v-model="editSteps[index]"
                :rows="4"
                class="flex-1"
                placeholder="Step description"
                data-test="step-description-input"
                :data-testid="`recipe-step-description-${index}`"
              />
              <UButton
                icon="i-heroicons-trash"
                color="error"
                variant="ghost"
                size="xs"
                class="mt-2"
                :data-testid="`recipe-step-delete-${index}`"
                @click="removeStep(index)"
              />
            </div>

            <!-- Add new step button -->
            <div class="flex justify-center mt-2">
              <UButton
                icon="i-heroicons-plus"
                color="neutral"
                size="sm"
                data-testid="recipe-add-step-button"
                @click="addNewStep()"
              >
                {{ t('addStep') }}
              </UButton>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Footer with save/cancel buttons -->
    <template #footer>
      <div class="flex justify-between w-full">
        <UButton
          color="neutral"
          variant="outline"
          data-test="cancel-button"
          data-testid="recipe-cancel-button"
          @click="closeSlideOver"
        >
          {{ t('cancel') }}
        </UButton>
        <UButton
          color="primary"
          :loading="isSaving"
          :disabled="isSaving || !props.isOwner"
          data-test="save-button"
          data-testid="recipe-save-button"
          @click="saveAllRecipeChanges()"
        >
          {{ t('save') }}
        </UButton>
      </div>
    </template>
  </USlideover>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { PropType } from 'vue';
import type { Recipe as RecipeType, Ingredient, SelectItem, FormIngredient } from '../types/models';
import { useRecipeStore } from '../stores/recipes';

const toast = useToast();
const { t } = useI18n({ useScope: 'local' });
const recipeStore = useRecipeStore();

// Define time unit options
const timeUnitOptions: SelectItem[] = [
  { label: t('timeUnits.minutes'), value: 'minutes' },
  { label: t('timeUnits.hours'), value: 'hours' },
];

const props = defineProps({
  recipe: {
    type: Object as PropType<RecipeType>,
    required: false,
    default: null,
  },
  modelValue: {
    type: Boolean,
    required: true,
  },
  isOwner: {
    type: Boolean,
    required: true,
  },
  client: {
    type: Object,
    required: true,
  },
  getAuthOptions: {
    type: Function as PropType<() => Promise<{ authMode: string; authToken?: string }>>,
    required: true,
  },
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'recipe-updated': [updatedRecipe: RecipeType];
}>();

// Loading state for save operation
const isSaving = ref(false);

// Edit values - time and metadata
const editTitleValue = ref<string>('');
const editDescriptionValue = ref<string>('');
const editPrepTimeValue = ref<number>(0);
const editCookTimeValue = ref<number>(0);
const editServingsValue = ref<number>(0);
const editPrepTimeUnit = ref<SelectItem>({ label: t('timeUnits.minutes'), value: 'minutes' });
const editCookTimeUnit = ref<SelectItem>({ label: t('timeUnits.hours'), value: 'hours' });

// Edit values for ingredients
const editIngredients = ref<FormIngredient[]>([]);

// Edit values for steps
const editSteps = ref<string[]>([]);

// Edit values for nutritional information - numbers only
const editCalories = ref<string>('');
const editProtein = ref<string>('');
const editFat = ref<string>('');
const editCarbs = ref<string>('');

// Predefined units for ingredients
const unitOptions = [
  // Empty option
  { label: '', value: '' },
  // Volume measures
  { label: 'cup', value: 'cup' },
  { label: 'cups', value: 'cups' },
  { label: 'tablespoon', value: 'tablespoon' },
  { label: 'tablespoons', value: 'tablespoons' },
  { label: 'tbsp', value: 'tbsp' },
  { label: 'teaspoon', value: 'teaspoon' },
  { label: 'teaspoons', value: 'teaspoons' },
  { label: 'tsp', value: 'tsp' },
  { label: 'fluid ounce', value: 'fluid ounce' },
  { label: 'fluid ounces', value: 'fluid ounces' },
  { label: 'fl oz', value: 'fl oz' },
  { label: 'milliliter', value: 'milliliter' },
  { label: 'milliliters', value: 'milliliters' },
  { label: 'ml', value: 'ml' },
  { label: 'liter', value: 'liter' },
  { label: 'liters', value: 'liters' },
  { label: 'pint', value: 'pint' },
  { label: 'pints', value: 'pints' },
  { label: 'quart', value: 'quart' },
  { label: 'quarts', value: 'quarts' },
  { label: 'gallon', value: 'gallon' },
  { label: 'gallons', value: 'gallons' },
  // Weight measures
  { label: 'pound', value: 'pound' },
  { label: 'pounds', value: 'pounds' },
  { label: 'lb', value: 'lb' },
  { label: 'lbs', value: 'lbs' },
  { label: 'ounce', value: 'ounce' },
  { label: 'ounces', value: 'ounces' },
  { label: 'oz', value: 'oz' },
  { label: 'gram', value: 'gram' },
  { label: 'grams', value: 'grams' },
  { label: 'g', value: 'g' },
  { label: 'kg', value: 'kg' },
  { label: 'kilogram', value: 'kilogram' },
  { label: 'kilograms', value: 'kilograms' },
  // Other common units
  { label: 'pinch', value: 'pinch' },
  { label: 'pinches', value: 'pinches' },
  { label: 'dash', value: 'dash' },
  { label: 'dashes', value: 'dashes' },
  { label: 'slice', value: 'slice' },
  { label: 'slices', value: 'slices' },
  { label: 'piece', value: 'piece' },
  { label: 'pieces', value: 'pieces' },
  { label: 'clove', value: 'clove' },
  { label: 'cloves', value: 'cloves' },
  { label: 'bunch', value: 'bunch' },
  { label: 'bunches', value: 'bunches' },
  { label: 'sprig', value: 'sprig' },
  { label: 'sprigs', value: 'sprigs' },
  { label: 'leaf', value: 'leaf' },
  { label: 'leaves', value: 'leaves' },
  { label: 'head', value: 'head' },
  { label: 'heads', value: 'heads' },
  { label: 'stalk', value: 'stalk' },
  { label: 'stalks', value: 'stalks' },
  { label: 'can', value: 'can' },
  { label: 'cans', value: 'cans' },
  { label: 'jar', value: 'jar' },
  { label: 'jars', value: 'jars' },
  { label: 'package', value: 'package' },
  { label: 'packages', value: 'packages' },
  { label: 'pkg', value: 'pkg' },
  { label: 'handful', value: 'handful' },
  { label: 'handfuls', value: 'handfuls' },
  { label: 'stick', value: 'stick' },
  { label: 'sticks', value: 'sticks' },
  { label: 'to taste', value: 'to taste' },
];

// Watch for changes in recipe to initialize form values
watch(
  () => props.recipe,
  (newValue) => {
    if (newValue) {
      initializeFormValues();
    }
  },
  { immediate: true },
);

// Also watch modelValue to ensure form is initialized when slideover opens
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue && props.recipe && !editTitleValue.value) {
      initializeFormValues();
    }
  },
);

// Initialize form values when the slideover opens
function initializeFormValues() {
  // If recipe is null or undefined, reset form fields and return
  if (!props.recipe) {
    editTitleValue.value = '';
    editDescriptionValue.value = '';
    editPrepTimeValue.value = 0;
    editCookTimeValue.value = 0;
    editServingsValue.value = 1;
    editIngredients.value = [];
    editSteps.value = [];
    editCalories.value = '';
    editProtein.value = '';
    editFat.value = '';
    editCarbs.value = '';
    return;
  }

  // Set title and description values
  editTitleValue.value = props.recipe.title || '';
  editDescriptionValue.value = props.recipe.description || '';

  // Parse prep time
  const prepTimeParts = parseTimeString(props.recipe.prep_time);
  editPrepTimeValue.value = prepTimeParts.value;
  editPrepTimeUnit.value = prepTimeParts.unit;

  // Parse cook time
  const cookTimeParts = parseTimeString(props.recipe.cook_time);
  editCookTimeValue.value = cookTimeParts.value;
  editCookTimeUnit.value = cookTimeParts.unit;

  // Parse servings - take just the numeric part
  const servingsMatch = props.recipe.servings.match(/(\d+)/);
  editServingsValue.value = servingsMatch ? parseInt(servingsMatch[0], 10) : 0;

  // Initialize nutritional information
  if (
    props.recipe.nutritionalInformation
    && props.recipe.nutritionalInformation.status === 'SUCCESS'
  ) {
    editCalories.value = extractNumericValue(props.recipe.nutritionalInformation.calories);
    editProtein.value = extractNumericValue(props.recipe.nutritionalInformation.protein);
    editFat.value = extractNumericValue(props.recipe.nutritionalInformation.fat);
    editCarbs.value = extractNumericValue(props.recipe.nutritionalInformation.carbs);
  }

  // Initialize ingredients with a deep copy of the current ingredients
  const ingredientsCopy = JSON.parse(JSON.stringify(props.recipe.ingredients || []));
  editIngredients.value = ingredientsCopy.map((ingredient: Ingredient) => {
    const originalQuantity = ingredient.quantity;
    const parsedQuantity = originalQuantity === '0' ? 0 : parseFloat(originalQuantity);

    // Convert string unit to SelectItem
    const unit: SelectItem = {
      label: ingredient.unit,
      value: ingredient.unit,
    };

    return {
      name: ingredient.name,
      quantity: isNaN(parsedQuantity) ? '' : parsedQuantity,
      unit,
      stepMapping: ingredient.stepMapping || [],
      _originalQuantity: originalQuantity,
      _originalUnit: ingredient.unit,
    };
  });

  // Initialize steps with a deep copy of the current steps
  editSteps.value = JSON.parse(JSON.stringify(props.recipe.instructions || []));
}

// Close the slideover
function closeSlideOver() {
  emit('update:modelValue', false);
}

// Add a new empty ingredient
function addNewIngredient() {
  editIngredients.value.push({
    name: '',
    quantity: 1,
    unit: { label: '', value: '' },
    stepMapping: [],
    _originalQuantity: '1',
    _originalUnit: '',
  });
}

// Remove an ingredient at specific index
function removeIngredient(index: number) {
  editIngredients.value.splice(index, 1);
}

// Add a new empty step
function addNewStep() {
  editSteps.value.push('');
}

// Remove a step at specific index
function removeStep(index: number) {
  editSteps.value.splice(index, 1);
}

// Function to parse time strings like "30 minutes" or "2 hours"
function parseTimeString(timeStr: string): {
  value: number;
  unit: SelectItem;
} {
  const minutesMatch = timeStr.match(/(\d+)\s*min/i);
  if (minutesMatch && minutesMatch[1]) {
    return {
      value: parseInt(minutesMatch[1], 10),
      unit: { label: t('timeUnits.minutes'), value: 'minutes' },
    };
  }

  const hoursMatch = timeStr.match(/(\d+)\s*hour/i);
  if (hoursMatch && hoursMatch[1]) {
    return {
      value: parseInt(hoursMatch[1], 10),
      unit: { label: t('timeUnits.hours'), value: 'hours' },
    };
  }

  // Default case if no pattern matches
  const numberMatch = timeStr.match(/(\d+)/);
  return {
    value: numberMatch ? parseInt(numberMatch[0], 10) : 0,
    unit: timeStr.toLowerCase().includes('hour')
      ? { label: t('timeUnits.hours'), value: 'hours' }
      : { label: t('timeUnits.minutes'), value: 'minutes' },
  };
}

// Format time value with unit
function formatTimeWithUnit(value: number, unit: SelectItem): string {
  if (value <= 0) return '0 minutes';

  const unitValue = unit.value as 'minutes' | 'hours';
  const unitText
    = unitValue === 'hours' ? (value === 1 ? 'hour' : 'hours') : value === 1 ? 'minute' : 'minutes';

  return `${value} ${unitText}`;
}

// Extract only the numeric part from a string (e.g., "25g" -> "25")
function extractNumericValue(valueStr: string | undefined): string {
  if (!valueStr || typeof valueStr !== 'string') return '';
  // Match one or more digits at the start of the string
  const match = valueStr.match(/^(\d+)/);
  return match && match[1] ? match[1] : '';
}

// Get the unit suffix from a nutritional value (e.g., "25g" -> "g")
function getUnitSuffix(valueStr: string): string {
  if (!valueStr || typeof valueStr !== 'string') return '';
  // Match any non-digit characters after the initial digits
  // This makes sure pure number values (like "140") return an empty string suffix
  const match = valueStr.match(/^\d+([a-zA-Z].*)$/);
  return match && match[1] ? match[1] : '';
}

// Save all recipe changes from the edit slideover
async function saveAllRecipeChanges() {
  if (!props.recipe || !props.isOwner) return;

  try {
    // Show loading state
    isSaving.value = true;

    // Format the time strings properly
    const prepTimeStr = formatTimeWithUnit(editPrepTimeValue.value, editPrepTimeUnit.value);
    const cookTimeStr = formatTimeWithUnit(editCookTimeValue.value, editCookTimeUnit.value);
    const servingsStr = `${editServingsValue.value}`;

    // Process nutritional information
    let nutritionalInfo = props.recipe.nutritionalInformation;
    if (nutritionalInfo && nutritionalInfo.status === 'SUCCESS') {
      // Get the original unit suffixes
      const caloriesSuffix = getUnitSuffix(nutritionalInfo.calories || '');
      const proteinSuffix = getUnitSuffix(nutritionalInfo.protein || '');
      const fatSuffix = getUnitSuffix(nutritionalInfo.fat || '');
      const carbsSuffix = getUnitSuffix(nutritionalInfo.carbs || '');

      nutritionalInfo = {
        ...nutritionalInfo,
        calories: editCalories.value + caloriesSuffix,
        protein: editProtein.value + proteinSuffix,
        fat: editFat.value + fatSuffix,
        carbs: editCarbs.value + carbsSuffix,
      };
    }

    // Process ingredients
    const processedIngredients = editIngredients.value
      .filter((ingredient) => ingredient.name.trim() !== '')
      .map((ingredient) => {
        // Check if the ingredient was modified
        const wasQuantityModified = String(ingredient.quantity) !== ingredient._originalQuantity;
        const wasUnitModified = ingredient.unit.value !== ingredient._originalUnit;

        // Only format and convert the quantity if it was modified
        let finalQuantity;
        if (wasQuantityModified) {
          // For modified quantities, apply formatting
          if (ingredient.quantity === '' || ingredient.quantity === null) {
            // Keep empty or null values as "0"
            finalQuantity = '0';
          }
          else {
            // Round to 2 decimal places for display
            const quantity
              = typeof ingredient.quantity === 'number'
                ? ingredient.quantity
                : parseFloat(String(ingredient.quantity || 0));
            const formattedValue = Math.round(quantity * 100) / 100;
            finalQuantity = formattedValue.toString();
          }
        }
        else {
          // For unmodified quantities, use the original value
          finalQuantity = ingredient._originalQuantity;
        }

        // Process unit: extract the value property, but only if modified
        let finalUnit: string;
        if (wasUnitModified) {
          finalUnit = ingredient.unit.value;
        }
        else {
          finalUnit = ingredient._originalUnit || '';
        }

        // Create the final ingredient object without the temporary properties
        const finalIngredient = {
          name: ingredient.name.trim().toLowerCase(),
          unit: finalUnit,
          quantity: finalQuantity,
          stepMapping: ingredient.stepMapping ?? [],
        };

        return finalIngredient;
      });

    // Process steps
    const processedSteps = editSteps.value
      .filter((step) => step.trim() !== '')
      .map((step) => step.trim());

    // Create an update object with all fields being changed
    const updateData = {
      id: props.recipe.id,
      title: editTitleValue.value,
      description: editDescriptionValue.value,
      prep_time: prepTimeStr,
      cook_time: cookTimeStr,
      servings: servingsStr,
      nutritionalInformation: nutritionalInfo,
      ingredients: processedIngredients,
      instructions: processedSteps,
    };

    console.log('Saving all recipe changes:', updateData);

    // Update the recipe using the store's updateRecipe function
    // which has proper error handling for GraphQL errors
    const updatedRecipeData = await recipeStore.updateRecipe(props.recipe.id, updateData);

    if (updatedRecipeData) {
      // Create updated recipe object with proper typing
      const updatedRecipe: RecipeType = {
        ...props.recipe,
        title: editTitleValue.value,
        description: editDescriptionValue.value,
        prep_time: prepTimeStr,
        cook_time: cookTimeStr,
        servings: servingsStr,
        nutritionalInformation: nutritionalInfo,
        ingredients: processedIngredients.map((ing) => ({
          name: ing.name,
          quantity: ing.quantity || '', // Default to empty string if undefined
          unit: typeof ing.unit === 'object' ? (ing.unit as SelectItem).value : ing.unit || '',
          stepMapping: ing.stepMapping || [],
        })),
        instructions: processedSteps,
      };

      // Emit event with updated recipe
      emit('recipe-updated', updatedRecipe);

      // Show success toast
      toast.add({
        id: 'update-recipe-success',
        title: t('successTitle'),
        description: t('allChangesSuccessDescription'),
        icon: 'material-symbols:check',
        duration: 3000,
      });

      // Close the slideover
      closeSlideOver();
    }
  }
  catch (err) {
    console.error('Error updating recipe:', err);
    toast.add({
      id: 'update-recipe-error',
      title: t('errorTitle'),
      description: t('allChangesErrorDescription'),
      icon: 'material-symbols:error',
      color: 'error',
      duration: 3000,
    });
  }
  finally {
    // Reset loading state
    isSaving.value = false;
  }
}
</script>

<i18n lang="json">
{
  "en": {
    "editRecipe": "Edit Recipe",
    "recipeTitle": "Recipe Title",
    "description": "Description",
    "recipeDetails": "Recipe Details",
    "prepTime": "Prep Time",
    "cookTime": "Cook Time",
    "servings": "Servings",
    "nutritionalInformation": "Nutritional Information",
    "calories": "Calories",
    "protein": "Protein",
    "fat": "Fat",
    "carbs": "Carbohydrates",
    "ingredientsSection": "Ingredients",
    "stepsSection": "Steps",
    "addIngredient": "Add Ingredient",
    "addStep": "Add Step",
    "save": "Save",
    "cancel": "Cancel",
    "timeUnits": {
      "minutes": "Minutes",
      "hours": "Hours"
    },
    "successTitle": "Updated",
    "errorTitle": "Error",
    "allChangesSuccessDescription": "Recipe updated successfully.",
    "allChangesErrorDescription": "Failed to update recipe."
  },
  "fr": {
    "editRecipe": "Modifier la recette",
    "recipeTitle": "Titre de la recette",
    "description": "Description",
    "recipeDetails": "Détails de la recette",
    "prepTime": "Temps de préparation",
    "cookTime": "Temps de cuisson",
    "servings": "Portions",
    "nutritionalInformation": "Informations nutritionnelles",
    "calories": "Calories",
    "protein": "Protéines",
    "fat": "Matières grasses",
    "carbs": "Glucides",
    "ingredientsSection": "Ingrédients",
    "stepsSection": "Étapes",
    "addIngredient": "Ajouter un ingrédient",
    "addStep": "Ajouter une étape",
    "save": "Sauvegarder",
    "cancel": "Annuler",
    "timeUnits": {
      "minutes": "Minutes",
      "hours": "Heures"
    },
    "successTitle": "Mis à jour",
    "errorTitle": "Erreur",
    "allChangesSuccessDescription": "Recette mise à jour avec succès.",
    "allChangesErrorDescription": "Échec de la mise à jour de la recette."
  },
  "es": {
    "editRecipe": "Editar receta",
    "recipeTitle": "Título de la receta",
    "description": "Descripción",
    "recipeDetails": "Detalles de la receta",
    "prepTime": "Tiempo de preparación",
    "cookTime": "Tiempo de cocción",
    "servings": "Porciones",
    "nutritionalInformation": "Información nutricional",
    "calories": "Calorías",
    "protein": "Proteínas",
    "fat": "Grasas",
    "carbs": "Carbohidratos",
    "ingredientsSection": "Ingredientes",
    "stepsSection": "Pasos",
    "addIngredient": "Añadir ingrediente",
    "addStep": "Añadir paso",
    "save": "Guardar",
    "cancel": "Cancelar",
    "timeUnits": {
      "minutes": "Minutos",
      "hours": "Horas"
    },
    "successTitle": "Actualizado",
    "errorTitle": "Error",
    "allChangesSuccessDescription": "Receta actualizada con éxito.",
    "allChangesErrorDescription": "Error al actualizar la receta."
  }
}
</i18n>
