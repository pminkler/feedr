<script setup lang="ts">
import { ref, computed, onMounted, watch, onBeforeUnmount } from "vue";
import { useRecipe } from "~/composables/useRecipe";
import { generateClient } from "aws-amplify/data";
import { useI18n } from "vue-i18n";
import LoadingMessages from "~/components/LoadingMessages.vue";
import { useAuth } from "~/composables/useAuth";

// Assume you have a toast composable available
const toast = useToast();

// Create your AWS Amplify client (adjust Schema type as needed)
import type { Schema } from "@/amplify/data/resource";
import type { AuthMode } from "@aws-amplify/data-schema-types";
import RecipeCookingMode from "./RecipeCookingMode.vue";
const client = generateClient<Schema>();

const { t } = useI18n({ useScope: "local" });
const { currentUser } = useAuth();

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
});

// Recipe state and flags
const recipe = ref<any>(null);
const loading = ref(true);
const error = ref<any>(null);
const waitingForProcessing = ref(false);
const cookingMode = ref(false);

// Edit mode flags
const editingPrepTime = ref(false);
const editingCookTime = ref(false);
const editingServings = ref(false);

// Edit values - time numbers
const editPrepTimeValue = ref<number>(0);
const editCookTimeValue = ref<number>(0);
const editServingsValue = ref<number>(0);

// Edit unit values (minutes or hours)
const editPrepTimeUnit = ref<"minutes" | "hours">("minutes");
const editCookTimeUnit = ref<"minutes" | "hours">("minutes");

// Loading state for save operation
const isSaving = ref(false);

// Editing mode state
const isEditing = ref(false);
const editingNutrition = ref(false); // Separate edit state for nutritional information
const editingIngredients = ref(false); // Separate edit state for ingredients
const editingSteps = ref(false); // Separate edit state for steps

// Edit values for ingredients
const editIngredients = ref<{ name: string; quantity: number; unit: string }[]>(
  [],
);

// Edit values for steps
const editSteps = ref<string[]>([]);

// Predefined units for ingredients
const unitOptions = [
  // Measured Items
  { label: "", value: "" },
  { label: "cup", value: "cup" },
  { label: "cups", value: "cups" },
  { label: "c", value: "c" },
  { label: "fl oz", value: "fl oz" },
  { label: "fl oz can", value: "fl oz can" },
  { label: "fl oz container", value: "fl oz container" },
  { label: "fl oz jar", value: "fl oz jar" },
  { label: "fl oz pouch", value: "fl oz pouch" },
  { label: "gallon", value: "gallon" },
  { label: "gallons", value: "gallons" },
  { label: "gal", value: "gal" },
  { label: "milliliter", value: "milliliter" },
  { label: "milliliters", value: "milliliters" },
  { label: "ml", value: "ml" },
  { label: "liter", value: "liter" },
  { label: "liters", value: "liters" },
  { label: "l", value: "l" },
  { label: "pint", value: "pint" },
  { label: "pints", value: "pints" },
  { label: "pt", value: "pt" },
  { label: "pt container", value: "pt container" },
  { label: "quart", value: "quart" },
  { label: "quarts", value: "quarts" },
  { label: "qt", value: "qt" },
  { label: "tablespoon", value: "tablespoon" },
  { label: "tablespoons", value: "tablespoons" },
  { label: "tbsp", value: "tbsp" },
  { label: "tbs", value: "tbs" },
  { label: "teaspoon", value: "teaspoon" },
  { label: "teaspoons", value: "teaspoons" },
  { label: "tsp", value: "tsp" },

  // Weighed Items
  { label: "gram", value: "gram" },
  { label: "grams", value: "grams" },
  { label: "g", value: "g" },
  { label: "kilogram", value: "kilogram" },
  { label: "kilograms", value: "kilograms" },
  { label: "kg", value: "kg" },
  { label: "lb bag", value: "lb bag" },
  { label: "lb can", value: "lb can" },
  { label: "lb container", value: "lb container" },
  { label: "per lb", value: "per lb" },
  { label: "ounce", value: "ounce" },
  { label: "ounces", value: "ounces" },
  { label: "oz", value: "oz" },
  { label: "oz bag", value: "oz bag" },
  { label: "oz can", value: "oz can" },
  { label: "oz container", value: "oz container" },
  { label: "pound", value: "pound" },
  { label: "pounds", value: "pounds" },
  { label: "lb", value: "lb" },
  { label: "lbs", value: "lbs" },

  // Countable Items
  { label: "bunch", value: "bunch" },
  { label: "bunches", value: "bunches" },
  { label: "can", value: "can" },
  { label: "cans", value: "cans" },
  { label: "each", value: "each" },
  { label: "ears", value: "ears" },
  { label: "head", value: "head" },
  { label: "heads", value: "heads" },
  { label: "large", value: "large" },
  { label: "medium", value: "medium" },
  { label: "small", value: "small" },
  { label: "package", value: "package" },
  { label: "packages", value: "packages" },
  { label: "packet", value: "packet" },
];

// Edit values for nutritional information - numbers only
const editCalories = ref<string>("");
const editProtein = ref<string>("");
const editFat = ref<string>("");
const editCarbs = ref<string>("");

// Scaling state:
const scale = ref(1);
const desiredServings = ref<number>(1);

// Controls whether the configuration slideover is open
const isSlideoverOpen = ref(false);
// Which scaling method to use: "ingredients" or "servings"
const scalingMethod = ref<"ingredients" | "servings">("ingredients");

const recipeStore = useRecipe();

let subscription: { unsubscribe: () => void } | null = null;

// NEW: State to store the SavedRecipe (if any) for this recipe.
const savedRecipe = ref<any>(null);

// Fetch the recipe as before
const fetchRecipe = async () => {
  loading.value = true;
  error.value = null;
  const response = await recipeStore.getRecipeById(props.id);
  if (response && response.status === "SUCCESS") {
    recipe.value = response;
    loading.value = false;
  } else if (response && response.status === "FAILED") {
    recipe.value = response;
    loading.value = false;
  } else {
    waitingForProcessing.value = true;
  }
  // After fetching the recipe, if user is logged in, also query for a matching SavedRecipe.
  if (currentUser.value) {
    await fetchSavedRecipe();
  }
};

// NEW: Query for an existing SavedRecipe for this recipe and the current user.
const fetchSavedRecipe = async () => {
  try {
    const response = await client.models.SavedRecipe.list({
      filter: {
        recipeId: { eq: props.id },
      },
      authMode: "userPool",
    });
    // Assume only one record per user/recipe pair.
    if (response.data && response.data.length > 0) {
      savedRecipe.value = response.data[0];
    } else {
      savedRecipe.value = null;
    }
  } catch (err) {
    console.error("Error fetching saved recipe:", err);
  }
};

// Extract the first number from recipe.servings (if possible)
const originalServingsNumber = computed(() => {
  if (!recipe.value || !recipe.value.servings) return NaN;
  // If the servings string contains a range, ignore it for scaling-by-servings purposes
  if (/[–\-—]/.test(recipe.value.servings)) return NaN;
  const match = recipe.value.servings.match(/(\d+(\.\d+)?)/);
  if (match) {
    return parseFloat(match[0]);
  }
  return NaN;
});

const canScaleByServings = computed(() => !isNaN(originalServingsNumber.value));

watch(
  originalServingsNumber,
  (val) => {
    if (!isNaN(val)) {
      desiredServings.value = val;
    } else {
      scalingMethod.value = "ingredients";
    }
  },
  { immediate: true },
);

const scalingFactor = computed(() => {
  if (scalingMethod.value === "ingredients") {
    return scale.value;
  } else {
    const orig = originalServingsNumber.value;
    if (!isNaN(orig) && orig > 0) {
      return desiredServings.value / orig;
    }
    return 1;
  }
});

// Updated computed property: map over the ingredients and update each quantity.
const scaledIngredients = computed(() => {
  if (!recipe.value || !recipe.value.ingredients) return [];
  return recipe.value.ingredients.map((ingredient: any) => {
    // Assuming ingredient.quantity is a number. Adjust if it's a string.
    return {
      ...ingredient,
      quantity: ingredient.quantity * scalingFactor.value,
    };
  });
});

// When scaling by ingredients, multiply each distinct number in the servings string by the scale factor.
// When scaling by servings, simply display the desired servings value.
const scaledServingsText = computed(() => {
  if (!recipe.value || !recipe.value.servings) return "";
  if (scalingMethod.value === "servings") {
    return desiredServings.value.toString();
  }
  const factor = scale.value;
  return recipe.value.servings.replace(/(\d+(\.\d+)?)/g, (match: string) => {
    const num = parseFloat(match);
    const scaled = num * factor;
    return Number.isInteger(scaled) ? scaled.toString() : scaled.toFixed(1);
  });
});

const ingredientScaleLabel = computed(() => {
  const val = scale.value;
  if (val === 0.5) return t("recipe.configuration.scale.half");
  if (val === 1) return t("recipe.configuration.scale.full");
  if (val === 2) return t("recipe.configuration.scale.double");
  return t("recipe.configuration.scale.custom", { value: val });
});

// Concise label showing only the original serving size as a subtitle.
const servingsScaleLabel = computed(() => {
  const orig = originalServingsNumber.value;
  if (!isNaN(orig)) {
    return t("recipe.configuration.servings.original", { original: orig });
  }
  return "";
});

function shareRecipe() {
  if (!recipe.value) return;
  const shareData = {
    title: recipe.value.title,
    text: recipe.value.description || t("recipe.share.defaultText"),
    url: recipe.value.url,
  };

  if (navigator.share) {
    navigator
      .share(shareData)
      .then(() => {
        toast.add({
          id: "share-success",
          title: t("recipe.share.successTitle"),
          description: t("recipe.share.successDescription"),
          icon: "material-symbols:share",
          timeout: 3000,
        });
      })
      .catch((err) => {
        toast.add({
          id: "share-error",
          color: "red",
          title: t("recipe.share.errorTitle"),
          description: t("recipe.share.errorDescription"),
          icon: "material-symbols:error",
          timeout: 3000,
        });
        console.error("Share failed:", err);
      });
  } else {
    navigator.clipboard
      .writeText(recipe.value.url)
      .then(() => {
        toast.add({
          id: "share-copied",
          title: t("recipe.share.copiedTitle"),
          description: t("recipe.share.copiedDescription"),
          icon: "material-symbols:share",
          timeout: 3000,
        });
      })
      .catch(() => {
        toast.add({
          id: "share-clipboard-error",
          title: t("recipe.share.clipboardErrorTitle"),
          description: t("recipe.share.clipboardErrorDescription"),
          icon: "material-symbols:error",
          timeout: 3000,
          color: "red",
        });
      });
  }
}

const subscribeToChanges = async () => {
  if (subscription) {
    subscription.unsubscribe();
    subscription = null;
  }
  // Conditionally include authMode only if a user is logged in.
  const options = currentUser.value ? { authMode: "userPool" as AuthMode } : {};
  subscription = client.models.Recipe.onUpdate({
    filter: { id: { eq: props.id } },
    ...options,
  }).subscribe({
    next: (updatedRecipe) => {
      if (updatedRecipe.id === props.id) {
        recipe.value = updatedRecipe;
        loading.value = false;
        waitingForProcessing.value = false;
      }
    },
    error: (err) => console.error("Error subscribing to recipe updates:", err),
  });
};

onMounted(async () => {
  await fetchRecipe();
  await subscribeToChanges();
});

watch(() => props.id, fetchRecipe);

// (Existing scaling, servings, and other computed properties…)
// [Your existing computed properties here remain unchanged]

// NEW: Computed property for bookmark state.
const isBookmarked = computed(() => !!savedRecipe.value);

// NEW: Toggle bookmark: save if not bookmarked, unsave if already bookmarked.
async function toggleBookmark() {
  if (!currentUser.value) {
    toast.add({
      id: "bookmark-error",
      title: t("recipe.bookmark.errorTitle"),
      description: t("recipe.bookmark.errorNotLoggedIn"),
      icon: "material-symbols:error",
      timeout: 3000,
      color: "red",
    });
    return;
  }
  if (isBookmarked.value) {
    // Unsave recipe.
    const result = await recipeStore.unsaveRecipe(props.id);
    if (result) {
      savedRecipe.value = null;
      toast.add({
        id: "bookmark-removed",
        title: t("recipe.bookmark.removedTitle"),
        description: t("recipe.bookmark.removedDescription"),
        icon: "material-symbols:bookmark-outline",
        timeout: 3000,
      });
    }
  } else {
    // Save recipe.
    const result = await recipeStore.saveRecipe(props.id);
    if (result) {
      savedRecipe.value = result;
      toast.add({
        id: "bookmark-added",
        title: t("recipe.bookmark.addedTitle"),
        description: t("recipe.bookmark.addedDescription"),
        icon: "material-symbols:bookmark",
        timeout: 3000,
      });
    }
  }
}

// Cleanup subscriptions and listeners.
const handleVisibilityChange = async () => {
  if (document.visibilityState === "visible") {
    await fetchRecipe();
    await subscribeToChanges();
  }
};

document.addEventListener("visibilitychange", handleVisibilityChange);

// Toggle edit mode for all fields
function toggleEditMode() {
  if (!recipe.value || !currentUser.value) return;

  // Parse prep time
  const prepTimeParts = parseTimeString(recipe.value.prep_time);
  editPrepTimeValue.value = prepTimeParts.value;
  editPrepTimeUnit.value = prepTimeParts.unit;

  // Parse cook time
  const cookTimeParts = parseTimeString(recipe.value.cook_time);
  editCookTimeValue.value = cookTimeParts.value;
  editCookTimeUnit.value = cookTimeParts.unit;

  // Parse servings - take just the numeric part
  const servingsMatch = recipe.value.servings.match(/(\d+)/);
  editServingsValue.value = servingsMatch ? parseInt(servingsMatch[0], 10) : 0;

  // Set editing mode
  isEditing.value = true;
}

// Toggle edit mode for nutritional information
function toggleNutritionEditMode() {
  if (!recipe.value || !currentUser.value) return;

  if (
    recipe.value.nutritionalInformation &&
    recipe.value.nutritionalInformation.status === "SUCCESS"
  ) {
    // Extract only the numeric part for each nutritional value
    editCalories.value = extractNumericValue(
      recipe.value.nutritionalInformation.calories,
    );
    editProtein.value = extractNumericValue(
      recipe.value.nutritionalInformation.protein,
    );
    editFat.value = extractNumericValue(
      recipe.value.nutritionalInformation.fat,
    );
    editCarbs.value = extractNumericValue(
      recipe.value.nutritionalInformation.carbs,
    );
  }

  // Toggle edit mode
  editingNutrition.value = !editingNutrition.value;
}

// Extract only the numeric part from a string (e.g., "25g" -> "25")
function extractNumericValue(valueStr: string): string {
  if (!valueStr) return "";
  // Match one or more digits at the start of the string
  const match = valueStr.match(/^(\d+)/);
  return match ? match[1] : "";
}

// Get the unit suffix from a nutritional value (e.g., "25g" -> "g")
function getUnitSuffix(valueStr: string): string {
  if (!valueStr) return "";
  // Match any non-digit characters after the initial digits
  // This makes sure pure number values (like "140") return an empty string suffix
  const match = valueStr.match(/^\d+([a-zA-Z].*)$/);
  return match && match[1] ? match[1] : "";
}

// Function to parse time strings like "30 minutes" or "2 hours"
function parseTimeString(timeStr: string): {
  value: number;
  unit: "minutes" | "hours";
} {
  const minutesMatch = timeStr.match(/(\d+)\s*min/i);
  if (minutesMatch) {
    return { value: parseInt(minutesMatch[1], 10), unit: "minutes" };
  }

  const hoursMatch = timeStr.match(/(\d+)\s*hour/i);
  if (hoursMatch) {
    return { value: parseInt(hoursMatch[1], 10), unit: "hours" };
  }

  // Default case if no pattern matches
  const numberMatch = timeStr.match(/(\d+)/);
  return {
    value: numberMatch ? parseInt(numberMatch[0], 10) : 0,
    unit: timeStr.toLowerCase().includes("hour") ? "hours" : "minutes",
  };
}

// Cancel all edits
function cancelAllEdits() {
  isEditing.value = false;
}

// Cancel nutritional information edit
function cancelNutritionEdit() {
  editingNutrition.value = false;
}

// Toggle edit mode for ingredients
function toggleIngredientsEditMode() {
  if (!recipe.value || !currentUser.value) return;

  // Initialize edit values with a deep copy of the current ingredients
  const ingredientsCopy = JSON.parse(
    JSON.stringify(recipe.value.ingredients || []),
  );

  // Convert string quantities to numbers
  editIngredients.value = ingredientsCopy.map((ingredient) => ({
    ...ingredient,
    quantity: parseFloat(ingredient.quantity) || 1, // Convert to number, default to 1 if NaN
  }));

  // Toggle edit mode
  editingIngredients.value = !editingIngredients.value;
}

// Cancel ingredients edit
function cancelIngredientsEdit() {
  editingIngredients.value = false;
}

// Add a new empty ingredient
function addNewIngredient() {
  editIngredients.value.push({ name: "", quantity: 1, unit: "" });
}

// Remove an ingredient at specific index
function removeIngredient(index: number) {
  editIngredients.value.splice(index, 1);
}

// Toggle edit mode for steps
function toggleStepsEditMode() {
  if (!recipe.value || !currentUser.value) return;

  // Initialize edit values with a deep copy of the current steps
  editSteps.value = JSON.parse(JSON.stringify(recipe.value.instructions || []));

  // Toggle edit mode
  editingSteps.value = !editingSteps.value;
}

// Cancel steps edit
function cancelStepsEdit() {
  editingSteps.value = false;
}

// Add a new empty step
function addNewStep() {
  editSteps.value.push("");
}

// Remove a step at specific index
function removeStep(index: number) {
  editSteps.value.splice(index, 1);
}

// Save ingredients changes
async function saveIngredients() {
  if (!recipe.value || !currentUser.value) return;

  try {
    // Show loading state
    isSaving.value = true;

    // Filter out any empty ingredients and format quantities
    const validIngredients = editIngredients.value
      .filter((ingredient) => ingredient.name.trim() !== "")
      .map((ingredient) => {
        // Round to 2 decimal places for display
        const formattedQuantity =
          Math.round((ingredient.quantity || 1) * 100) / 100;

        return {
          name: ingredient.name.trim(),
          unit: ingredient.unit,
          // Convert numbers to strings to match the model
          quantity: formattedQuantity.toString(),
          stepMapping: ingredient.stepMapping ?? [],
        };
      });

    console.log("Saving ingredients:", validIngredients);

    // Create an update object with ingredients
    const updateData = {
      id: props.id,
      ingredients: validIngredients,
    };

    // Update the recipe in the database
    const response = await client.models.Recipe.update(updateData, {
      authMode: "userPool" as AuthMode,
    });

    if (response) {
      // Update the local recipe object with the new values
      recipe.value.ingredients = validIngredients;

      // Show success toast
      toast.add({
        id: "update-ingredients-success",
        title: t("recipe.edit.successTitle"),
        description: t("recipe.edit.ingredientsSuccessDescription"),
        icon: "material-symbols:check",
        timeout: 3000,
      });

      // Exit edit mode
      cancelIngredientsEdit();
    }
  } catch (err) {
    console.error("Error updating ingredients:", err);
    toast.add({
      id: "update-ingredients-error",
      title: t("recipe.edit.errorTitle"),
      description: t("recipe.edit.ingredientsErrorDescription"),
      icon: "material-symbols:error",
      color: "red",
      timeout: 3000,
    });
  } finally {
    // Reset loading state
    isSaving.value = false;
  }
}

// Save steps changes
async function saveSteps() {
  if (!recipe.value || !currentUser.value) return;

  try {
    // Show loading state
    isSaving.value = true;

    // Filter out any empty steps
    const validSteps = editSteps.value
      .filter((step) => step.trim() !== "")
      .map((step) => step.trim());

    console.log("Saving steps:", validSteps);

    // Create an update object with steps
    const updateData = {
      id: props.id,
      instructions: validSteps,
    };

    // Update the recipe in the database
    const response = await client.models.Recipe.update(updateData, {
      authMode: "userPool" as AuthMode,
    });

    if (response) {
      // Update the local recipe object with the new values
      recipe.value.instructions = validSteps;

      // Show success toast
      toast.add({
        id: "update-steps-success",
        title: t("recipe.edit.successTitle"),
        description: t("recipe.edit.stepsSuccessDescription"),
        icon: "material-symbols:check",
        timeout: 3000,
      });

      // Exit edit mode
      cancelStepsEdit();
    }
  } catch (err) {
    console.error("Error updating steps:", err);
    toast.add({
      id: "update-steps-error",
      title: t("recipe.edit.errorTitle"),
      description: t("recipe.edit.stepsErrorDescription"),
      icon: "material-symbols:error",
      color: "red",
      timeout: 3000,
    });
  } finally {
    // Reset loading state
    isSaving.value = false;
  }
}

// Format time value with unit
function formatTimeWithUnit(value: number, unit: "minutes" | "hours"): string {
  if (value <= 0) return "0 minutes";

  const unitText =
    unit === "hours"
      ? value === 1
        ? "hour"
        : "hours"
      : value === 1
        ? "minute"
        : "minutes";

  return `${value} ${unitText}`;
}

// Save all changes at once
async function saveAllChanges() {
  if (!recipe.value || !currentUser.value) return;

  try {
    // Show loading state
    isSaving.value = true;

    // Format the time strings properly
    const prepTimeStr = formatTimeWithUnit(
      editPrepTimeValue.value,
      editPrepTimeUnit.value,
    );
    const cookTimeStr = formatTimeWithUnit(
      editCookTimeValue.value,
      editCookTimeUnit.value,
    );
    const servingsStr = `${editServingsValue.value}`;

    // Create an update object with all fields being changed
    const updateData = {
      id: props.id,
      prep_time: prepTimeStr,
      cook_time: cookTimeStr,
      servings: servingsStr,
    };

    // Update the recipe in the database
    const response = await client.models.Recipe.update(updateData, {
      authMode: "userPool" as AuthMode,
    });

    if (response) {
      // Update the local recipe object with the new values
      recipe.value.prep_time = prepTimeStr;
      recipe.value.cook_time = cookTimeStr;
      recipe.value.servings = servingsStr;

      // Show success toast
      toast.add({
        id: "update-details-success",
        title: t("recipe.edit.successTitle"),
        description: t("recipe.edit.successDescription"),
        icon: "material-symbols:check",
        timeout: 3000,
      });

      // Exit edit mode
      cancelAllEdits();
    }
  } catch (err) {
    console.error("Error updating recipe details:", err);
    toast.add({
      id: "update-details-error",
      title: t("recipe.edit.errorTitle"),
      description: t("recipe.edit.errorDescription"),
      icon: "material-symbols:error",
      color: "red",
      timeout: 3000,
    });
  } finally {
    // Reset loading state
    isSaving.value = false;
  }
}

// Save nutritional information
async function saveNutritionalInfo() {
  if (!recipe.value || !currentUser.value) return;

  try {
    // Show loading state
    isSaving.value = true;

    // Get the original unit suffixes
    const caloriesSuffix = getUnitSuffix(
      recipe.value.nutritionalInformation.calories,
    );
    const proteinSuffix = getUnitSuffix(
      recipe.value.nutritionalInformation.protein,
    );
    const fatSuffix = getUnitSuffix(recipe.value.nutritionalInformation.fat);
    const carbsSuffix = getUnitSuffix(
      recipe.value.nutritionalInformation.carbs,
    );

    // Create an update object with nutritional information with units preserved
    const updateData = {
      id: props.id,
      nutritionalInformation: {
        ...recipe.value.nutritionalInformation,
        calories: editCalories.value + caloriesSuffix,
        protein: editProtein.value + proteinSuffix,
        fat: editFat.value + fatSuffix,
        carbs: editCarbs.value + carbsSuffix,
      },
    };

    // Update the recipe in the database
    const response = await client.models.Recipe.update(updateData, {
      authMode: "userPool" as AuthMode,
    });

    if (response) {
      // Update the local recipe object with the new values
      recipe.value.nutritionalInformation.calories =
        editCalories.value + caloriesSuffix;
      recipe.value.nutritionalInformation.protein =
        editProtein.value + proteinSuffix;
      recipe.value.nutritionalInformation.fat = editFat.value + fatSuffix;
      recipe.value.nutritionalInformation.carbs = editCarbs.value + carbsSuffix;

      // Show success toast
      toast.add({
        id: "update-nutrition-success",
        title: t("recipe.edit.successTitle"),
        description: t("recipe.edit.nutritionSuccessDescription"),
        icon: "material-symbols:check",
        timeout: 3000,
      });

      // Exit edit mode
      cancelNutritionEdit();
    }
  } catch (err) {
    console.error("Error updating nutritional information:", err);
    toast.add({
      id: "update-nutrition-error",
      title: t("recipe.edit.errorTitle"),
      description: t("recipe.edit.nutritionErrorDescription"),
      icon: "material-symbols:error",
      color: "red",
      timeout: 3000,
    });
  } finally {
    // Reset loading state
    isSaving.value = false;
  }
}

// Update a single field (keeping this for future use if needed)
async function updateRecipeDetails(
  field: "prep_time" | "cook_time" | "servings",
  value: string,
) {
  if (!recipe.value || !currentUser.value) return;

  try {
    // Create an update object with only the field being changed
    const updateData = {
      id: props.id,
      [field]: value,
    };

    // Update the recipe in the database
    const response = await client.models.Recipe.update(updateData, {
      authMode: "userPool" as AuthMode,
    });

    if (response) {
      // Update the local recipe object with the new value
      recipe.value[field] = value;

      // Show success toast
      toast.add({
        id: `update-${field}-success`,
        title: t("recipe.edit.successTitle"),
        description: t("recipe.edit.successDescription"),
        icon: "material-symbols:check",
        timeout: 3000,
      });

      // Reset edit mode
      switch (field) {
        case "prep_time":
          editingPrepTime.value = false;
          break;
        case "cook_time":
          editingCookTime.value = false;
          break;
        case "servings":
          editingServings.value = false;
          break;
      }
    }
  } catch (err) {
    console.error(`Error updating recipe ${field}:`, err);
    toast.add({
      id: `update-${field}-error`,
      title: t("recipe.edit.errorTitle"),
      description: t("recipe.edit.errorDescription"),
      icon: "material-symbols:error",
      color: "red",
      timeout: 3000,
    });
  }
}

onBeforeUnmount(() => {
  document.removeEventListener("visibilitychange", handleVisibilityChange);
  if (subscription) {
    subscription.unsubscribe();
  }
});
</script>

<template>
  <div class="space-y-4">
    <!-- Global Error Alert -->
    <UAlert
      v-if="error"
      icon="material-symbols:error"
      color="red"
      :actions="[
        {
          variant: 'solid',
          color: 'gray',
          label: t('recipe.error.action'),
          click: fetchRecipe,
        },
      ]"
      :title="t('recipe.error.title')"
      :description="t('recipe.error.description')"
    />

    <!-- NEW: Alert when recipe.status is FAILED -->
    <template v-else-if="recipe && recipe.status === 'FAILED'">
      <UAlert
        icon="i-heroicons-command-line"
        color="red"
        variant="solid"
        :title="t('recipe.error.failedTitle')"
        :description="t('recipe.error.failedDescription')"
      />
    </template>

    <template v-if="waitingForProcessing">
      <LoadingMessages />
      <UProgress />
    </template>

    <!-- Page Header (only rendered when recipe data exists) -->
    <UPageHeader
      v-if="recipe && recipe.status !== 'FAILED'"
      :title="recipe.title"
      :links="[
        {
          icon: isBookmarked
            ? 'material-symbols:bookmark'
            : 'material-symbols:bookmark-outline',
          variant: 'ghost',
          color: 'primary',
          click: toggleBookmark,
        },
        {
          icon: 'material-symbols:share',
          variant: 'ghost',
          click: shareRecipe,
          color: 'primary',
        },
        {
          icon: 'heroicons-solid:arrows-pointing-out',
          color: 'primary',
          variant: 'ghost',
          click: () => {
            cookingMode = true;
          },
        },
        {
          icon: 'heroicons-solid:adjustments-horizontal',
          color: 'primary',
          variant: 'ghost',
          click: () => {
            isSlideoverOpen = true;
          },
        },
        ...(recipe.instacart && recipe.instacart.status === 'SUCCESS'
          ? [
              {
                icon: 'cib:instacart',
                color: 'orange',
                variant: 'ghost',
                to: recipe.instacart.url,
              },
            ]
          : []),
      ]"
    />

    <!-- Grid Layout -->
    <div
      class="grid grid-cols-1 lg:grid-cols-2 gap-4"
      v-if="waitingForProcessing || recipe?.status === 'SUCCESS'"
    >
      <!-- Column 1: Details, Nutritional Information, Ingredients -->
      <div class="space-y-4">
        <!-- Recipe Details Card with Edit button in header -->
        <UDashboardCard
          :ui="{
            header: {
              padding: 'px-4 py-3 sm:px-6',
            },
          }"
        >
          <template #header>
            <div class="flex justify-between items-center w-full">
              <h3 class="text-base font-semibold leading-6">
                {{ t("recipe.details.title") }}
              </h3>
              <div v-if="currentUser" class="flex space-x-2">
                <template v-if="!isEditing">
                  <UButton
                    size="xs"
                    icon="i-heroicons-pencil"
                    color="gray"
                    variant="ghost"
                    @click="toggleEditMode()"
                  />
                </template>
                <template v-else>
                  <UButton
                    size="xs"
                    icon="i-heroicons-check"
                    color="gray"
                    variant="ghost"
                    :loading="isSaving"
                    :disabled="isSaving"
                    @click="saveAllChanges()"
                  />
                  <UButton
                    size="xs"
                    icon="i-heroicons-x-mark"
                    color="gray"
                    variant="ghost"
                    :disabled="isSaving"
                    @click="cancelAllEdits()"
                  />
                </template>
              </div>
            </div>
          </template>

          <template v-if="recipe && recipe.status === 'SUCCESS'">
            <ul class="list-disc list-inside space-y-4">
              <!-- Prep Time -->
              <li>
                <template v-if="!isEditing">
                  {{ t("recipe.details.prepTime") }} {{ recipe.prep_time }}
                </template>
                <template v-else>
                  <div class="inline-flex items-center">
                    <span>{{ t("recipe.details.prepTime") }}</span>
                    <div class="flex items-center ml-2 gap-1">
                      <UInput
                        v-model.number="editPrepTimeValue"
                        type="number"
                        min="0"
                        size="sm"
                        class="w-16"
                        placeholder="0"
                      />
                      <USelectMenu
                        v-model="editPrepTimeUnit"
                        size="sm"
                        :options="[
                          { label: t('recipe.edit.minutes'), value: 'minutes' },
                          { label: t('recipe.edit.hours'), value: 'hours' },
                        ]"
                        class="w-24"
                      />
                    </div>
                  </div>
                </template>
              </li>

              <!-- Cook Time -->
              <li>
                <template v-if="!isEditing">
                  {{ t("recipe.details.cookTime") }} {{ recipe.cook_time }}
                </template>
                <template v-else>
                  <div class="inline-flex items-center">
                    <span>{{ t("recipe.details.cookTime") }}</span>
                    <div class="flex items-center ml-2 gap-1">
                      <UInput
                        v-model.number="editCookTimeValue"
                        type="number"
                        min="0"
                        size="sm"
                        class="w-16"
                        placeholder="0"
                      />
                      <USelectMenu
                        v-model="editCookTimeUnit"
                        size="sm"
                        :options="[
                          { label: t('recipe.edit.minutes'), value: 'minutes' },
                          { label: t('recipe.edit.hours'), value: 'hours' },
                        ]"
                        class="w-24"
                      />
                    </div>
                  </div>
                </template>
              </li>

              <!-- Servings -->
              <li>
                <template v-if="!isEditing">
                  {{ t("recipe.details.servings") }} {{ scaledServingsText }}
                </template>
                <template v-else>
                  <div class="inline-flex items-center">
                    <span>{{ t("recipe.details.servings") }}</span>
                    <UInput
                      v-model.number="editServingsValue"
                      type="number"
                      min="1"
                      size="sm"
                      class="ml-2 w-16"
                      placeholder="1"
                    />
                  </div>
                </template>
              </li>
            </ul>
          </template>
          <template v-else>
            <!-- Skeleton: 3 full-length lines -->
            <div class="space-y-2">
              <USkeleton class="h-4 w-full" v-for="i in 3" :key="i" />
            </div>
          </template>
        </UDashboardCard>

        <!-- Nutritional Information Card with Edit button in header -->
        <UDashboardCard
          :ui="{
            header: {
              padding: 'px-4 py-3 sm:px-6',
            },
          }"
        >
          <template #header>
            <div class="flex justify-between items-center w-full">
              <div>
                <h3 class="text-base font-semibold leading-6">
                  {{ t("recipe.nutritionalInformation.title") }}
                </h3>
                <p class="text-sm text-gray-500">
                  {{ t("recipe.nutritionalInformation.per_serving") }}
                </p>
              </div>
              <div v-if="currentUser" class="flex space-x-2">
                <template v-if="!editingNutrition">
                  <UButton
                    size="xs"
                    icon="i-heroicons-pencil"
                    color="gray"
                    variant="ghost"
                    @click="toggleNutritionEditMode()"
                  />
                </template>
                <template v-else>
                  <UButton
                    size="xs"
                    icon="i-heroicons-check"
                    color="gray"
                    variant="ghost"
                    :loading="isSaving"
                    :disabled="isSaving"
                    @click="saveNutritionalInfo()"
                  />
                  <UButton
                    size="xs"
                    icon="i-heroicons-x-mark"
                    color="gray"
                    variant="ghost"
                    :disabled="isSaving"
                    @click="cancelNutritionEdit()"
                  />
                </template>
              </div>
            </div>
          </template>

          <template
            v-if="
              recipe &&
              recipe.nutritionalInformation &&
              recipe.nutritionalInformation.status === 'SUCCESS'
            "
          >
            <ul class="list-disc list-inside space-y-4">
              <!-- Calories -->
              <li>
                <template v-if="!editingNutrition">
                  {{ t("recipe.nutritionalInformation.calories") }}:
                  {{ recipe.nutritionalInformation.calories }}
                </template>
                <template v-else>
                  <div class="inline-flex items-center">
                    <span
                      >{{ t("recipe.nutritionalInformation.calories") }}:</span
                    >
                    <UInput
                      v-model="editCalories"
                      type="number"
                      min="0"
                      size="sm"
                      class="ml-2 w-20"
                      placeholder="e.g. 350"
                    />
                    <span
                      class="ml-1"
                      v-if="
                        getUnitSuffix(recipe.nutritionalInformation.calories)
                      "
                    >
                      {{
                        getUnitSuffix(recipe.nutritionalInformation.calories)
                      }}
                    </span>
                  </div>
                </template>
              </li>

              <!-- Protein -->
              <li>
                <template v-if="!editingNutrition">
                  {{ t("recipe.nutritionalInformation.protein") }}:
                  {{ recipe.nutritionalInformation.protein }}
                </template>
                <template v-else>
                  <div class="inline-flex items-center">
                    <span
                      >{{ t("recipe.nutritionalInformation.protein") }}:</span
                    >
                    <UInput
                      v-model="editProtein"
                      type="number"
                      min="0"
                      size="sm"
                      class="ml-2 w-20"
                      placeholder="e.g. 25"
                    />
                    <span
                      class="ml-1"
                      v-if="
                        getUnitSuffix(recipe.nutritionalInformation.protein)
                      "
                    >
                      {{ getUnitSuffix(recipe.nutritionalInformation.protein) }}
                    </span>
                  </div>
                </template>
              </li>

              <!-- Fat -->
              <li>
                <template v-if="!editingNutrition">
                  {{ t("recipe.nutritionalInformation.fat") }}:
                  {{ recipe.nutritionalInformation.fat }}
                </template>
                <template v-else>
                  <div class="inline-flex items-center">
                    <span>{{ t("recipe.nutritionalInformation.fat") }}:</span>
                    <UInput
                      v-model="editFat"
                      type="number"
                      min="0"
                      size="sm"
                      class="ml-2 w-20"
                      placeholder="e.g. 15"
                    />
                    <span
                      class="ml-1"
                      v-if="getUnitSuffix(recipe.nutritionalInformation.fat)"
                    >
                      {{ getUnitSuffix(recipe.nutritionalInformation.fat) }}
                    </span>
                  </div>
                </template>
              </li>

              <!-- Carbs -->
              <li>
                <template v-if="!editingNutrition">
                  {{ t("recipe.nutritionalInformation.carbs") }}:
                  {{ recipe.nutritionalInformation.carbs }}
                </template>
                <template v-else>
                  <div class="inline-flex items-center">
                    <span>{{ t("recipe.nutritionalInformation.carbs") }}:</span>
                    <UInput
                      v-model="editCarbs"
                      type="number"
                      min="0"
                      size="sm"
                      class="ml-2 w-20"
                      placeholder="e.g. 30"
                    />
                    <span
                      class="ml-1"
                      v-if="getUnitSuffix(recipe.nutritionalInformation.carbs)"
                    >
                      {{ getUnitSuffix(recipe.nutritionalInformation.carbs) }}
                    </span>
                  </div>
                </template>
              </li>
            </ul>
          </template>
          <template v-else>
            <!-- Skeleton: 4 full-length lines -->
            <div class="space-y-2">
              <USkeleton class="h-4 w-full" v-for="i in 4" :key="i" />
            </div>
          </template>
        </UDashboardCard>

        <!-- Ingredients Card with Edit button in header -->
        <UDashboardCard
          :ui="{
            header: {
              padding: 'px-4 py-3 sm:px-6',
            },
          }"
        >
          <template #header>
            <div class="flex justify-between items-center w-full">
              <h3 class="text-base font-semibold leading-6">
                {{ t("recipe.sections.ingredients") }}
              </h3>
              <div v-if="currentUser" class="flex space-x-2">
                <template v-if="!editingIngredients">
                  <UButton
                    size="xs"
                    icon="i-heroicons-pencil"
                    color="gray"
                    variant="ghost"
                    @click="toggleIngredientsEditMode()"
                  />
                </template>
                <template v-else>
                  <UButton
                    size="xs"
                    icon="i-heroicons-check"
                    color="gray"
                    variant="ghost"
                    :loading="isSaving"
                    :disabled="isSaving"
                    @click="saveIngredients()"
                  />
                  <UButton
                    size="xs"
                    icon="i-heroicons-x-mark"
                    color="gray"
                    variant="ghost"
                    :disabled="isSaving"
                    @click="cancelIngredientsEdit()"
                  />
                </template>
              </div>
            </div>
          </template>

          <template v-if="recipe && recipe.status === 'SUCCESS'">
            <!-- Display mode -->
            <ul
              v-if="!editingIngredients"
              class="list-disc list-inside space-y-4"
            >
              <li
                v-for="ingredient in scaledIngredients"
                :key="ingredient.name"
              >
                {{ ingredient.quantity }} {{ ingredient.unit }}
                {{ ingredient.name }}
              </li>
            </ul>

            <!-- Edit mode -->
            <div v-else class="space-y-4">
              <div
                v-for="(ingredient, index) in editIngredients"
                :key="index"
                class="flex items-center gap-2"
              >
                <UInput
                  v-model.number="ingredient.quantity"
                  type="number"
                  size="sm"
                  class="w-20"
                  step="0.01"
                  min="0"
                  placeholder="Qty"
                />
                <USelectMenu
                  v-model="ingredient.unit"
                  :options="unitOptions"
                  size="sm"
                  class="w-32"
                  placeholder="Unit"
                  searchable
                />
                <UInput
                  v-model="ingredient.name"
                  type="text"
                  size="sm"
                  class="flex-1"
                  placeholder="Ingredient name"
                />
                <UButton
                  icon="i-heroicons-trash"
                  color="red"
                  variant="ghost"
                  size="xs"
                  @click="removeIngredient(index)"
                />
              </div>

              <!-- Add new ingredient button -->
              <div class="flex justify-center mt-4">
                <UButton
                  icon="i-heroicons-plus"
                  color="gray"
                  size="sm"
                  @click="addNewIngredient()"
                >
                  {{ t("recipe.edit.addIngredient") }}
                </UButton>
              </div>
            </div>
          </template>

          <template v-else>
            <!-- Skeleton: 10 full-length lines -->
            <div class="space-y-2">
              <USkeleton class="h-4 w-full" v-for="i in 10" :key="i" />
            </div>
          </template>
        </UDashboardCard>
      </div>

      <!-- Column 2: Steps -->
      <div>
        <UDashboardCard
          :ui="{
            header: {
              padding: 'px-4 py-3 sm:px-6',
            },
          }"
        >
          <template #header>
            <div class="flex justify-between items-center w-full">
              <h3 class="text-base font-semibold leading-6">
                {{ t("recipe.sections.steps") }}
              </h3>
              <div v-if="currentUser" class="flex space-x-2">
                <template v-if="!editingSteps">
                  <UButton
                    size="xs"
                    icon="i-heroicons-pencil"
                    color="gray"
                    variant="ghost"
                    @click="toggleStepsEditMode()"
                  />
                </template>
                <template v-else>
                  <UButton
                    size="xs"
                    icon="i-heroicons-check"
                    color="gray"
                    variant="ghost"
                    :loading="isSaving"
                    :disabled="isSaving"
                    @click="saveSteps()"
                  />
                  <UButton
                    size="xs"
                    icon="i-heroicons-x-mark"
                    color="gray"
                    variant="ghost"
                    :disabled="isSaving"
                    @click="cancelStepsEdit()"
                  />
                </template>
              </div>
            </div>
          </template>

          <template v-if="recipe && recipe.status === 'SUCCESS'">
            <!-- Display mode -->
            <ol v-if="!editingSteps" class="list-decimal list-inside space-y-4">
              <li v-for="instruction in recipe.instructions" :key="instruction">
                {{ instruction }}
              </li>
            </ol>

            <!-- Edit mode -->
            <div v-else class="space-y-4">
              <div
                v-for="(step, index) in editSteps"
                :key="index"
                class="flex items-center gap-2"
              >
                <span class="text-sm text-gray-500 w-8">{{ index + 1 }}.</span>
                <UTextarea
                  v-model="editSteps[index]"
                  :rows="2"
                  class="flex-1"
                  placeholder="Step description"
                />
                <UButton
                  icon="i-heroicons-trash"
                  color="red"
                  variant="ghost"
                  size="xs"
                  @click="removeStep(index)"
                />
              </div>

              <!-- Add new step button -->
              <div class="flex justify-center mt-4">
                <UButton
                  icon="i-heroicons-plus"
                  color="gray"
                  size="sm"
                  @click="addNewStep()"
                >
                  {{ t("recipe.edit.addStep") }}
                </UButton>
              </div>
            </div>
          </template>
          <template v-else>
            <!-- Skeleton: 5 paragraph-looking blocks -->
            <div class="space-y-4">
              <USkeleton class="h-20 w-full" v-for="i in 5" :key="i" />
            </div>
          </template>
        </UDashboardCard>
      </div>
    </div>

    <!-- Link to Original Recipe -->
    <div
      class="flex w-full justify-center"
      v-if="recipe && recipe.url && recipe.status !== 'FAILED'"
    >
      <ULink :to="recipe.url">
        <UButton variant="ghost" block>
          {{ t("recipe.buttons.originalRecipe") }}
        </UButton>
      </ULink>
    </div>
  </div>

  <!-- Cooking Mode and Configuration Slideover -->
  <RecipeCookingMode
    v-model:is-open="cookingMode"
    :recipe="recipe"
    :scaled-ingredients="scaledIngredients"
  />

  <USlideover v-model="isSlideoverOpen">
    <div class="p-4 flex-1 relative">
      <UButton
        color="gray"
        variant="ghost"
        size="sm"
        icon="i-heroicons-x-mark-20-solid"
        class="flex sm:hidden absolute end-5 top-5 z-10"
        square
        padded
        @click="isSlideoverOpen = false"
      />
      <div class="space-y-4">
        <h2 class="text-xl font-bold mb-4">
          {{ t("recipe.configuration.title") }}
        </h2>

        <UDivider :label="t('recipe.configuration.divider.scaling')" />

        <div v-if="canScaleByServings">
          <label class="block mb-2 font-bold">
            {{ t("recipe.configuration.method.label") }}
          </label>
          <USelect
            v-model="scalingMethod"
            :options="[
              {
                label: t('recipe.configuration.method.ingredients'),
                value: 'ingredients',
              },
              {
                label: t('recipe.configuration.method.servings'),
                value: 'servings',
              },
            ]"
          />
        </div>

        <div v-if="scalingMethod === 'ingredients'">
          <label class="block mb-2 font-bold">
            {{ t("recipe.configuration.scale.scale") }}
            {{ ingredientScaleLabel }}
          </label>
          <URange v-model:modelValue="scale" :step="0.5" :min="0.5" :max="10" />
        </div>
        <div v-else>
          <label class="block mb-2 font-bold">
            {{ t("recipe.configuration.servings.new") }}
          </label>
          <UInput v-model.number="desiredServings" type="number" min="1" />
          <!-- Display the original serving size as a subtitle -->
          <div class="text-sm text-gray-500 mt-1">
            {{ servingsScaleLabel }}
          </div>
        </div>
      </div>
    </div>
  </USlideover>
</template>

<style module scoped>
/* Tailwind CSS handles all styling */
</style>

<i18n lang="json">
{
  "en": {
    "recipe": {
      "edit": {
        "successTitle": "Updated",
        "successDescription": "Recipe details updated successfully.",
        "nutritionSuccessDescription": "Nutritional information updated successfully.",
        "ingredientsSuccessDescription": "Ingredients updated successfully.",
        "stepsSuccessDescription": "Steps updated successfully.",
        "errorTitle": "Update Error",
        "errorDescription": "Failed to update recipe details.",
        "nutritionErrorDescription": "Failed to update nutritional information.",
        "ingredientsErrorDescription": "Failed to update ingredients.",
        "stepsErrorDescription": "Failed to update steps.",
        "editDetails": "Edit Details",
        "editingDetails": "Editing Details",
        "save": "Save",
        "cancel": "Cancel",
        "minutes": "Minutes",
        "hours": "Hours",
        "addIngredient": "Add Ingredient",
        "addStep": "Add Step"
      },
      "nutritionalInformation": {
        "per_serving": "Per Serving",
        "title": "Nutritional Information",
        "calories": "Calories",
        "protein": "Protein",
        "fat": "Fat",
        "carbs": "Carbohydrates"
      },
      "share": {
        "defaultText": "Check out this recipe!",
        "successTitle": "Shared",
        "successDescription": "Recipe shared successfully.",
        "errorTitle": "Share Error",
        "errorDescription": "Unable to share the recipe.",
        "copiedTitle": "Copied",
        "copiedDescription": "Recipe URL copied to clipboard.",
        "clipboardErrorTitle": "Clipboard Error",
        "clipboardErrorDescription": "Failed to copy the URL."
      },
      "configuration": {
        "title": "Configure Recipe",
        "divider": {
          "scaling": "Scaling"
        },
        "scale": {
          "scale": "Scale:",
          "half": "Half Recipe",
          "full": "Full Recipe",
          "double": "Double Recipe",
          "custom": "{value}× Recipe"
        },
        "servings": {
          "new": "New Servings:",
          "original": "Original serving size: { original }"
        },
        "method": {
          "label": "Scaling Method:",
          "ingredients": "By Ingredients",
          "servings": "By Servings"
        }
      },
      "error": {
        "title": "Error",
        "description": "There was a problem getting the recipe.",
        "action": "Try Again",
        "failedTitle": "Error!",
        "failedDescription": "There was an error processing your recipe. Please go back and try again.",
        "failedAction": "Go Back"
      },
      "details": {
        "title": "Recipe Details",
        "prepTime": "Prep time:",
        "cookTime": "Cook time:",
        "servings": "Servings:"
      },
      "sections": {
        "ingredients": "Ingredients",
        "steps": "Steps"
      },
      "buttons": {
        "originalRecipe": "Go to original recipe"
      },
      "bookmark": {
        "errorTitle": "Bookmark Error",
        "errorNotLoggedIn": "You must be logged in to bookmark recipes.",
        "addedTitle": "Recipe Bookmarked",
        "addedDescription": "Recipe has been added to your bookmarks.",
        "removedTitle": "Bookmark Removed",
        "removedDescription": "Recipe has been removed from your bookmarks."
      }
    }
  },
  "fr": {
    "recipe": {
      "edit": {
        "successTitle": "Mis à jour",
        "successDescription": "Détails de la recette mis à jour avec succès.",
        "nutritionSuccessDescription": "Informations nutritionnelles mises à jour avec succès.",
        "ingredientsSuccessDescription": "Ingrédients mis à jour avec succès.",
        "stepsSuccessDescription": "Étapes mises à jour avec succès.",
        "errorTitle": "Erreur de mise à jour",
        "errorDescription": "Échec de la mise à jour des détails de la recette.",
        "nutritionErrorDescription": "Échec de la mise à jour des informations nutritionnelles.",
        "ingredientsErrorDescription": "Échec de la mise à jour des ingrédients.",
        "stepsErrorDescription": "Échec de la mise à jour des étapes.",
        "editDetails": "Modifier les détails",
        "editingDetails": "Modification des détails",
        "save": "Sauvegarder",
        "cancel": "Annuler",
        "minutes": "Minutes",
        "hours": "Heures",
        "addIngredient": "Ajouter un ingrédient",
        "addStep": "Ajouter une étape"
      },
      "nutritionalInformation": {
        "per_serving": "Par portion",
        "title": "Informations nutritionnelles",
        "calories": "Calories",
        "protein": "Protéines",
        "fat": "Lipides",
        "carbs": "Glucides"
      },
      "share": {
        "defaultText": "Découvrez cette recette !",
        "successTitle": "Partagé",
        "successDescription": "Recette partagée avec succès.",
        "errorTitle": "Erreur de partage",
        "errorDescription": "Impossible de partager la recette.",
        "copiedTitle": "Copié",
        "copiedDescription": "URL de la recette copiée dans le presse-papiers.",
        "clipboardErrorTitle": "Erreur du Presse-papiers",
        "clipboardErrorDescription": "Échec de la copie de l'URL."
      },
      "configuration": {
        "title": "Configurer la recette",
        "divider": {
          "scaling": "Mise à l'échelle"
        },
        "scale": {
          "scale": "Échelle :",
          "half": "Demi-recette",
          "full": "Recette complète",
          "double": "Double recette",
          "custom": "Recette {value}×"
        },
        "servings": {
          "new": "Nouvelles portions :",
          "original": "Portion originale : { original }"
        },
        "method": {
          "label": "Méthode de mise à l'échelle :",
          "ingredients": "Par ingrédients",
          "servings": "Par portions"
        }
      },
      "error": {
        "title": "Erreur",
        "description": "Un problème est survenu lors de la récupération de la recette.",
        "action": "Réessayer",
        "failedTitle": "Erreur !",
        "failedDescription": "Une erreur est survenue lors du traitement de votre recette. Veuillez revenir en arrière et réessayer.",
        "failedAction": "Retour"
      },
      "details": {
        "title": "Détails de la recette",
        "prepTime": "Préparation :",
        "cookTime": "Cuisson :",
        "servings": "Portions :"
      },
      "sections": {
        "ingredients": "Ingrédients",
        "steps": "Étapes"
      },
      "buttons": {
        "originalRecipe": "Voir la recette originale"
      },
      "bookmark": {
        "errorTitle": "Erreur de signet",
        "errorNotLoggedIn": "Vous devez être connecté pour ajouter des recettes aux signets.",
        "addedTitle": "Recette ajoutée aux signets",
        "addedDescription": "La recette a été ajoutée à vos signets.",
        "removedTitle": "Signet supprimé",
        "removedDescription": "La recette a été retirée de vos signets."
      }
    }
  },
  "es": {
    "recipe": {
      "edit": {
        "successTitle": "Actualizado",
        "successDescription": "Detalles de la receta actualizados con éxito.",
        "nutritionSuccessDescription": "Información nutricional actualizada con éxito.",
        "ingredientsSuccessDescription": "Ingredientes actualizados con éxito.",
        "stepsSuccessDescription": "Pasos actualizados con éxito.",
        "errorTitle": "Error de actualización",
        "errorDescription": "Error al actualizar los detalles de la receta.",
        "nutritionErrorDescription": "Error al actualizar la información nutricional.",
        "ingredientsErrorDescription": "Error al actualizar los ingredientes.",
        "stepsErrorDescription": "Error al actualizar los pasos.",
        "editDetails": "Editar detalles",
        "editingDetails": "Editando detalles",
        "save": "Guardar",
        "cancel": "Cancelar",
        "minutes": "Minutos",
        "hours": "Horas",
        "addIngredient": "Añadir ingrediente",
        "addStep": "Añadir paso"
      },
      "nutritionalInformation": {
        "per_serving": "Por ración",
        "title": "Información nutricional",
        "calories": "Calorías",
        "protein": "Proteínas",
        "fat": "Grasas",
        "carbs": "Carbohidratos"
      },
      "share": {
        "defaultText": "¡Mira esta receta!",
        "successTitle": "Compartido",
        "successDescription": "Receta compartida exitosamente.",
        "errorTitle": "Error al compartir",
        "errorDescription": "No se pudo compartir la receta.",
        "copiedTitle": "Copiado",
        "copiedDescription": "URL de la receta copiada al portapapeles.",
        "clipboardErrorTitle": "Error del portapapeles",
        "clipboardErrorDescription": "No se pudo copiar la URL."
      },
      "configuration": {
        "title": "Configurar Receta",
        "divider": {
          "scaling": "Escalado"
        },
        "scale": {
          "scale": "Escala:",
          "half": "Media receta",
          "full": "Receta completa",
          "double": "Doble receta",
          "custom": "Receta {value}×"
        },
        "servings": {
          "new": "Nuevas porciones:",
          "original": "Tamaño original: { original }"
        },
        "method": {
          "label": "Método de escalado:",
          "ingredients": "Por ingredientes",
          "servings": "Por porciones"
        }
      },
      "error": {
        "title": "Error",
        "description": "Hubo un problema al obtener la receta.",
        "action": "Intentar de nuevo",
        "failedTitle": "¡Error!",
        "failedDescription": "Ocurrió un error al procesar tu receta. Por favor, regresa e inténtalo de nuevo.",
        "failedAction": "Regresar"
      },
      "details": {
        "title": "Detalles de la Receta",
        "prepTime": "Tiempo de preparación:",
        "cookTime": "Tiempo de cocción:",
        "servings": "Porciones:"
      },
      "sections": {
        "ingredients": "Ingredientes",
        "steps": "Pasos"
      },
      "buttons": {
        "originalRecipe": "Ir a la receta original"
      },
      "bookmark": {
        "errorTitle": "Error de marcador",
        "errorNotLoggedIn": "Debes iniciar sesión para marcar recetas.",
        "addedTitle": "Receta marcada",
        "addedDescription": "La receta ha sido agregada a tus marcadores.",
        "removedTitle": "Marcador eliminado",
        "removedDescription": "La receta ha sido removida de tus marcadores."
      }
    }
  }
}
</i18n>
