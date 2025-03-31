<script setup lang="ts">
import { useRoute } from 'vue-router';
import { ref, computed, onMounted, watch, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import type { Recipe } from '../../types/models';

// Components
import LoadingMessages from '../../components/LoadingMessages.vue';
import RecipeCookingMode from '../../components/RecipeCookingMode.vue';
import InstacartButton from '../../components/InstacartButton.vue';
import EditRecipeSlideover from '../../components/EditRecipeSlideover.vue';

// Composables
import { useRecipe } from '../../composables/useRecipe';
import { useAuth } from '../../composables/useAuth';
import { useIdentity } from '../../composables/useIdentity';

// ==============================================
// 1. Core State and Services Setup
// ==============================================

const toast = useToast();
const client = generateClient<Schema>();
const route = useRoute();
const { t } = useI18n({ useScope: 'local' });
const { currentUser } = useAuth();
const recipeStore = useRecipe();
const { isResourceOwner, getIdentityId, getAuthOptions } = useIdentity();

// ==============================================
// 2. Recipe and Recipe-related State
// ==============================================

// Recipe core data
const recipeId = computed(() =>
  Array.isArray(route.params.id) ? route.params.id[0] : route.params.id
);
// Define a flexible recipe type with optional properties
type FlexibleRecipe = {
  id?: string;
  title?: string;
  description?: string;
  ingredients?: Array<{
    name?: string;
    quantity?: string;
    unit?: string;
    stepMapping?: number[];
  }>;
  instructions?: string[];
  prep_time?: string;
  cook_time?: string;
  servings?: string;
  status?: string;
  url?: string;
  imageUrl?: string;
  tags?: Array<{ name?: string }>;
  nutritionalInformation?: {
    status?: string;
    calories?: string;
    protein?: string;
    fat?: string;
    carbs?: string;
  };
  createdAt?: string;
  [key: string]: unknown; // Allow for additional properties
};

const recipe = ref<FlexibleRecipe | null>(null);
const loading = ref(true);
const error = ref<Error | unknown>(null);
const waitingForProcessing = ref(false);
const isOwner = ref(false);

// UI state
const cookingMode = ref(false);
const isSlideoverOpen = ref(false);
const isEditSlideoverOpen = ref(false);

// Scaling state
const scale = ref(1);
const desiredServings = ref<number>(1);
const scalingMethod = ref<'ingredients' | 'servings'>('ingredients');

// Subscription management
let subscription: { unsubscribe: () => void } | null = null;

// ==============================================
// 3. Computed Properties
// ==============================================

// Recipe scaling properties
const originalServingsNumber = computed(() => {
  if (!recipe.value || !recipe.value.servings) return NaN;
  // Type assertion for servings to ensure it's treated as string
  const servingsText = recipe.value.servings as string;
  // If the servings string contains a range, ignore it for scaling-by-servings purposes
  if (/[–\-—]/.test(servingsText)) return NaN;
  const match = servingsText.match(/(\d+(\.\d+)?)/);
  if (match) {
    return parseFloat(match[0]);
  }
  return NaN;
});

const canScaleByServings = computed(() => !isNaN(originalServingsNumber.value));

const scalingFactor = computed(() => {
  if (scalingMethod.value === 'ingredients') {
    return scale.value;
  } else {
    const orig = originalServingsNumber.value;
    if (!isNaN(orig) && orig > 0) {
      return desiredServings.value / orig;
    }
    return 1;
  }
});

// Define a FlexibleIngredient type for better compatibility
interface FlexibleIngredient {
  name?: string;
  quantity?: string | number;
  unit?: string | { label?: string; value?: string };
  stepMapping?: number[];
}

// Scaled values
const scaledIngredients = computed(() => {
  if (!recipe.value || !recipe.value.ingredients || !Array.isArray(recipe.value.ingredients))
    return [];

  // Cast ingredients to FlexibleIngredient type for mapping
  return (recipe.value.ingredients as FlexibleIngredient[]).map((ingredient) => {
    // Handle quantity scaling only if it's a valid number
    let scaledQuantity: string | number = ingredient.quantity || '';

    // Only try to scale if we have a valid number
    if (ingredient.quantity && !isNaN(Number(ingredient.quantity))) {
      const numericQuantity = Number(ingredient.quantity) * scalingFactor.value;

      // Format to at most 2 decimal places for display
      if (Number.isInteger(numericQuantity)) {
        // Keep integers as is
        scaledQuantity = numericQuantity.toString();
      } else {
        // Round decimal values to 2 places
        scaledQuantity = numericQuantity.toFixed(2).replace(/\.00$/, '').replace(/\.0$/, '');
      }
    }

    return {
      ...ingredient,
      quantity: scaledQuantity,
    };
  });
});

// Scaling labels
const scaledServingsText = computed(() => {
  if (!recipe.value || !recipe.value.servings) return '';
  if (scalingMethod.value === 'servings') {
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
  if (val === 0.5) return t('recipe.configuration.scale.half');
  if (val === 1) return t('recipe.configuration.scale.full');
  if (val === 2) return t('recipe.configuration.scale.double');
  return t('recipe.configuration.scale.custom', { value: val });
});

const servingsScaleLabel = computed(() => {
  const orig = originalServingsNumber.value;
  if (!isNaN(orig)) {
    return t('recipe.configuration.servings.original', { original: orig });
  }
  return '';
});

// SEO properties
const seoTitle = computed(() =>
  recipe.value?.title ? `${recipe.value.title} | Feedr Recipe` : 'Recipe | Feedr'
);

const seoDescription = computed(() => {
  if (!recipe.value) return 'Loading recipe...';

  let description =
    recipe.value.description || 'View this recipe with ingredients and instructions';

  // Add some nutritional info if available
  if (recipe.value.nutritionalInformation?.status === 'SUCCESS') {
    const nutrition = recipe.value.nutritionalInformation;
    description += ` | ${nutrition.calories || ''} calories`;
    if (nutrition.protein) description += `, ${nutrition.protein} protein`;
  }

  return description;
});

const seoImage = computed(
  () => recipe.value?.imageUrl || 'https://feedr.app/web-app-manifest-512x512.png'
);

interface RecipeSchema {
  '@context': string;
  '@type': string;
  name: string;
  url: string;
  datePublished?: string;
  description?: string;
  image?: string;
  prepTime?: string;
  cookTime?: string;
  recipeYield?: string;
  recipeIngredient?: string[];
  recipeInstructions?: Array<{ '@type': string; text: string }>;
  nutrition?: {
    '@type': string;
    calories?: string;
    proteinContent?: string;
    fatContent?: string;
    carbohydrateContent?: string;
  };
}

const recipeSchema = computed<RecipeSchema | null>(() => {
  if (!recipe.value || recipe.value.status !== 'SUCCESS') return null;

  const recipeData: RecipeSchema = {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: recipe.value.title || 'Recipe',
    url: `https://feedr.app/recipes/${recipeId.value}`,
    datePublished: recipe.value.createdAt,
  };

  if (recipe.value.description) recipeData.description = recipe.value.description;
  if (recipe.value.imageUrl) recipeData.image = recipe.value.imageUrl;
  if (recipe.value.prep_time) recipeData.prepTime = recipe.value.prep_time;
  if (recipe.value.cook_time) recipeData.cookTime = recipe.value.cook_time;
  if (recipe.value.servings) recipeData.recipeYield = recipe.value.servings;

  // Add ingredients with proper check
  const ingredientsArray = recipe.value.ingredients;
  if (ingredientsArray && Array.isArray(ingredientsArray)) {
    // Use type assertion to get better typecheck support
    const typedIngredients = ingredientsArray as FlexibleIngredient[];
    if (typedIngredients.length > 0) {
      recipeData.recipeIngredient = typedIngredients.map((ingredient) =>
        `${ingredient.quantity || ''} ${ingredient.unit || ''} ${ingredient.name || ''}`.trim()
      );
    }
  }

  // Add instructions with proper check
  if (recipe.value.instructions && Array.isArray(recipe.value.instructions)) {
    const instructions = recipe.value.instructions as string[];
    if (instructions.length > 0) {
      recipeData.recipeInstructions = instructions.map((step) => ({
        '@type': 'HowToStep',
        text: step,
      }));
    }
  }

  // Add nutrition if available
  if (recipe.value.nutritionalInformation?.status === 'SUCCESS') {
    const nutrition = recipe.value.nutritionalInformation;
    recipeData.nutrition = {
      '@type': 'NutritionInformation',
    };

    if (nutrition.calories) recipeData.nutrition.calories = nutrition.calories;
    if (nutrition.protein) recipeData.nutrition.proteinContent = nutrition.protein;
    if (nutrition.fat) recipeData.nutrition.fatContent = nutrition.fat;
    if (nutrition.carbs) recipeData.nutrition.carbohydrateContent = nutrition.carbs;
  }

  return recipeData;
});

// ==============================================
// 4. Core Operations and API Calls
// ==============================================

// Fetch recipe data
const fetchRecipe = async () => {
  loading.value = true;
  error.value = null;

  try {
    // For reads, use the appropriate auth mode based on user state
    const id = recipeId.value;

    if (!id) {
      throw new Error('Recipe ID is not defined');
    }

    const response = await recipeStore.getRecipeById(id as string);
    if (response && response.status === 'SUCCESS') {
      recipe.value = response as FlexibleRecipe;
      loading.value = false;
    } else if (response && response.status === 'FAILED') {
      recipe.value = response as FlexibleRecipe;
      loading.value = false;
    } else {
      waitingForProcessing.value = true;
    }

    // After fetching the recipe, check if the current user is an owner
    if (recipe.value) {
      await checkOwnership();
    }

    console.log('Recipe ownership status:', isOwner.value);
    console.log('Recipe data:', recipe.value);
  } catch (err: unknown) {
    console.error('Error fetching recipe:', err);
    loading.value = false;
    error.value = err;
  }
};

// Check if current user owns the recipe
const checkOwnership = async () => {
  // Default to not an owner
  isOwner.value = false;

  if (!recipe.value) return;

  // Get the current user's identity ID
  const currentIdentityId = await getIdentityId();
  const currentUserId = currentUser.value?.username;

  console.log('Current user identity:', { currentIdentityId, currentUserId });
  console.log('Recipe ownership info:', {
    owners: recipe.value.owners,
    createdBy: recipe.value.createdBy,
  });

  // Check ownership in three ways:
  // 1. Check if the current user is in the owners array
  if (recipe.value.owners && Array.isArray(recipe.value.owners) && recipe.value.owners.length > 0) {
    // Uses the identity system to check ownership
    isOwner.value = await isResourceOwner(recipe.value.owners as string[]);
    if (isOwner.value) return; // Already determined ownership
  }

  // 2. Check if the current user created this recipe (by comparing identity IDs)
  if (recipe.value.createdBy && currentIdentityId) {
    if (recipe.value.createdBy === currentIdentityId) {
      console.log('User is the creator by identity ID');
      isOwner.value = true;
      return;
    }
  }

  // 3. For authenticated users, check if their username matches createdBy
  // (this is a backup in case the ID format is different)
  if (recipe.value.createdBy && currentUserId) {
    if (recipe.value.createdBy === currentUserId) {
      console.log('User is the creator by username');
      isOwner.value = true;
      return;
    }
  }

  console.log('Ownership determination result:', isOwner.value);
};

// Subscribe to realtime updates
const subscribeToChanges = async () => {
  try {
    if (subscription) {
      subscription.unsubscribe();
      subscription = null;
    }

    // For data subscriptions, we want to use userPool for authenticated users
    // and identityPool for guests, not the lambda auth
    const options = await getAuthOptions();

    subscription = client.models.Recipe.onUpdate({
      filter: { id: { eq: recipeId.value } },
      ...options,
    }).subscribe({
      next: (updatedRecipe) => {
        if (updatedRecipe.id === recipeId.value) {
          recipe.value = updatedRecipe as FlexibleRecipe;
          loading.value = false;
          waitingForProcessing.value = false;
        }
      },
      error: (err) => console.error('Error subscribing to recipe updates:', err),
    });
  } catch (error) {
    console.error('Error setting up subscription:', error);
  }
};

// Function to copy a recipe for the current user
async function copyRecipe() {
  try {
    // Copy the recipe - works for both guests and authenticated users
    // Only run if recipeId.value is defined
    if (!recipeId.value) {
      throw new Error('Recipe ID is not defined');
    }

    const newRecipe = await recipeStore.copyRecipe(recipeId.value as string);
    if (newRecipe && newRecipe.id) {
      // Show success toast
      toast.add({
        id: 'copy-success',
        title: t('recipe.copy.successTitle'),
        description: t('recipe.copy.successDescription'),
        icon: 'i-heroicons-document-duplicate',
        duration: 3000,
      });

      // Redirect to the new recipe
      navigateTo(`/recipes/${newRecipe.id}`);
    }
  } catch (error) {
    console.error('Error copying recipe:', error);
    toast.add({
      id: 'copy-error',
      title: t('recipe.copy.errorTitle'),
      description: t('recipe.copy.errorDescription'),
      icon: 'i-heroicons-exclamation-circle',
      color: 'error',
      duration: 3000,
    });
  }
}

// Function to share recipe
function shareRecipe() {
  if (!recipe.value) return;
  const shareData: { title: string; text: string; url?: string } = {
    title: recipe.value.title || t('recipe.share.defaultTitle'),
    text: recipe.value.description || t('recipe.share.defaultText'),
    url: recipe.value.url,
  };

  if (navigator.share) {
    navigator
      .share(shareData)
      .then(() => {
        toast.add({
          id: 'share-success',
          title: t('recipe.share.successTitle'),
          description: t('recipe.share.successDescription'),
          icon: 'material-symbols:share',
          duration: 3000,
        });
      })
      .catch((err) => {
        toast.add({
          id: 'share-error',
          color: 'error',
          title: t('recipe.share.errorTitle'),
          description: t('recipe.share.errorDescription'),
          icon: 'material-symbols:error',
          duration: 3000,
        });
        console.error('Share failed:', err);
      });
  } else if (recipe.value.url) {
    navigator.clipboard
      .writeText(recipe.value.url || '')
      .then(() => {
        toast.add({
          id: 'share-copied',
          title: t('recipe.share.copiedTitle'),
          description: t('recipe.share.copiedDescription'),
          icon: 'material-symbols:share',
          duration: 3000,
        });
      })
      .catch(() => {
        toast.add({
          id: 'share-clipboard-error',
          title: t('recipe.share.clipboardErrorTitle'),
          description: t('recipe.share.clipboardErrorDescription'),
          icon: 'material-symbols:error',
          duration: 3000,
          color: 'error',
        });
      });
  }
}

// ==============================================
// 5. UI Event Handlers
// ==============================================

// Toggle the configuration slideover
const toggleSlideover = () => {
  isSlideoverOpen.value = !isSlideoverOpen.value;
  console.log('Toggled config slideover, now:', isSlideoverOpen.value);
};

// Toggle the edit slideover
const toggleEditSlideover = () => {
  if (!isOwner.value) return;
  isEditSlideoverOpen.value = !isEditSlideoverOpen.value;
};

// Handle updated recipe from the edit slideover
function handleRecipeUpdated(updatedRecipe: Recipe | null) {
  recipe.value = updatedRecipe;
}

// ==============================================
// 6. Lifecycle Hooks
// ==============================================

// Visibility change handler
const handleVisibilityChange = async () => {
  if (document.visibilityState === 'visible') {
    await fetchRecipe();
    await subscribeToChanges();
  }
};

onMounted(async () => {
  try {
    await fetchRecipe();
    await subscribeToChanges();
  } catch (error) {
    console.error('Error during component mount:', error);
    loading.value = false;
  }

  document.addEventListener('visibilitychange', handleVisibilityChange);
});

onBeforeUnmount(() => {
  document.removeEventListener('visibilitychange', handleVisibilityChange);
  if (subscription) {
    subscription.unsubscribe();
  }
});

// ==============================================
// 7. Watchers
// ==============================================

// Watch for changes to recipeId and refetch when it changes
watch(() => recipeId.value, fetchRecipe);

// Set desiredServings based on original servings
watch(
  originalServingsNumber,
  (val) => {
    if (!isNaN(val)) {
      desiredServings.value = val;
    } else {
      scalingMethod.value = 'ingredients';
    }
  },
  { immediate: true }
);

// Apply SEO metadata when recipe changes
watch(
  [seoTitle, seoDescription, seoImage, recipeSchema],
  ([title, description, image, schema]) => {
    useSeoMeta({
      title: title,
      ogTitle: title,
      description: description,
      ogDescription: description,
      ogImage: image,
      twitterCard: 'summary_large_image',
      keywords: recipe.value?.title
        ? `${recipe.value.title}, recipe, cooking, ingredients, instructions, nutrition`
        : 'recipe, cooking, food',
    });

    // Add JSON-LD structured data for recipe
    if (schema) {
      useHead({
        script: [
          {
            id: 'recipe-schema',
            type: 'application/ld+json',
            innerHTML: JSON.stringify(schema),
          },
        ],
      });
    }
  },
  { immediate: true }
);
</script>

<template>
  <UDashboardPanel id="recipeDetails">
    <template #header>
      <UDashboardNavbar v-if="recipe && recipe.status !== 'FAILED'" :title="recipe?.title || ''">
        <template #left>
          <UDashboardSidebarCollapse />

          <div class="flex items-center">
            <span>{{ recipe?.title || '' }}</span>
          </div>
        </template>
        <template #right>
          <UButtonGroup>
            <UButton
              v-if="isOwner"
              icon="i-heroicons-pencil"
              variant="ghost"
              color="primary"
              :title="t('recipe.edit.editRecipe')"
              @click="toggleEditSlideover"
            />
            <UButton
              icon="i-heroicons-document-duplicate"
              variant="ghost"
              color="primary"
              :title="t('recipe.copy.buttonTitle')"
              @click="copyRecipe"
            />
            <UButton
              icon="material-symbols:share"
              variant="ghost"
              color="primary"
              @click="shareRecipe"
            />
            <UButton
              icon="heroicons-solid:arrows-pointing-out"
              variant="ghost"
              color="primary"
              @click="cookingMode = true"
            />
            <UButton
              icon="heroicons-solid:adjustments-horizontal"
              variant="ghost"
              color="primary"
              @click="toggleSlideover"
            />
          </UButtonGroup>
        </template>
      </UDashboardNavbar>
      <UDashboardNavbar v-else :title="t('recipeDetails.title')" />
    </template>

    <template #body>
      <!-- Global Error Alert -->
      <UAlert
        v-if="error"
        icon="material-symbols:error"
        color="error"
        :actions="[
          {
            variant: 'solid',
            color: 'neutral',
            label: t('recipe.error.action'),
            onClick: fetchRecipe,
          },
        ]"
        :title="t('recipe.error.title')"
        :description="t('recipe.error.description')"
      />

      <!-- Alert when recipe.status is FAILED -->
      <template v-else-if="recipe && recipe.status === 'FAILED'">
        <UAlert
          icon="i-heroicons-command-line"
          color="error"
          variant="solid"
          :title="t('recipe.error.failedTitle')"
          :description="t('recipe.error.failedDescription')"
        />
      </template>

      <template v-if="waitingForProcessing">
        <LoadingMessages />
        <UProgress />
      </template>

      <!-- Grid Layout -->
      <div
        v-if="waitingForProcessing || recipe?.status === 'SUCCESS'"
        class="grid grid-cols-1 lg:grid-cols-2 gap-4"
      >
        <!-- Column 1: Details, Nutritional Information, Ingredients -->
        <div class="space-y-4">
          <!-- Recipe Details Card with Edit button in header -->
          <UPageCard
            :ui="{
              header: 'px-4 py-3 sm:px-6',
            }"
          >
            <template #header>
              <div class="flex justify-between items-center w-full">
                <h3 class="text-base font-semibold leading-6">
                  {{ t('recipe.details.title') }}
                </h3>
              </div>
            </template>

            <template v-if="recipe && recipe.status === 'SUCCESS'">
              <ul class="list-disc list-inside space-y-4">
                <!-- Prep Time -->
                <li>{{ t('recipe.details.prepTime') }} {{ recipe.prep_time }}</li>

                <!-- Cook Time -->
                <li>{{ t('recipe.details.cookTime') }} {{ recipe.cook_time }}</li>

                <!-- Servings -->
                <li>{{ t('recipe.details.servings') }} {{ scaledServingsText }}</li>
              </ul>
            </template>
            <template v-else>
              <!-- Skeleton: 3 full-length lines -->
              <div class="space-y-2">
                <USkeleton v-for="i in 3" :key="i" class="h-4 w-full" />
              </div>
            </template>
          </UPageCard>

          <!-- Nutritional Information Card with Edit button in header -->
          <UPageCard
            :ui="{
              header: 'px-4 py-3 sm:px-6',
            }"
          >
            <template #header>
              <div class="flex justify-between items-center w-full">
                <div>
                  <h3 class="text-base font-semibold leading-6">
                    {{ t('recipe.nutritionalInformation.title') }}
                  </h3>
                  <p class="text-sm text-(--ui-text-muted)">
                    {{ t('recipe.nutritionalInformation.per_serving') }}
                  </p>
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
                  {{ t('recipe.nutritionalInformation.calories') }}:
                  {{ recipe.nutritionalInformation.calories }}
                </li>

                <!-- Protein -->
                <li>
                  {{ t('recipe.nutritionalInformation.protein') }}:
                  {{ recipe.nutritionalInformation.protein }}
                </li>

                <!-- Fat -->
                <li>
                  {{ t('recipe.nutritionalInformation.fat') }}:
                  {{ recipe.nutritionalInformation.fat }}
                </li>

                <!-- Carbs -->
                <li>
                  {{ t('recipe.nutritionalInformation.carbs') }}:
                  {{ recipe.nutritionalInformation.carbs }}
                </li>
              </ul>
            </template>
            <template v-else>
              <!-- Skeleton: 4 full-length lines -->
              <div class="space-y-2">
                <USkeleton v-for="i in 4" :key="i" class="h-4 w-full" />
              </div>
            </template>
          </UPageCard>

          <!-- Ingredients Card with Edit button in header -->
          <UPageCard
            :ui="{
              header: 'px-4 py-3 sm:px-6',
            }"
          >
            <template #header>
              <div class="flex justify-between items-center w-full">
                <h3 class="text-base font-semibold leading-6">
                  {{ t('recipe.sections.ingredients') }}
                </h3>
              </div>
            </template>

            <template v-if="recipe && recipe.status === 'SUCCESS'">
              <!-- Display mode -->
              <ul class="list-disc list-inside space-y-4">
                <li v-for="ingredient in scaledIngredients" :key="ingredient.name">
                  <template
                    v-if="
                      ingredient.quantity &&
                      ingredient.quantity !== '0' &&
                      !isNaN(Number(ingredient.quantity))
                    "
                  >
                    {{ ingredient.quantity }}
                    {{
                      typeof ingredient.unit === 'object' && 'value' in ingredient.unit
                        ? ingredient.unit.value
                        : ingredient.unit
                    }}
                  </template>
                  {{ ingredient.name }}
                </li>
              </ul>
            </template>
            <template v-else>
              <!-- Skeleton: 10 full-length lines -->
              <div class="space-y-2">
                <USkeleton v-for="i in 10" :key="i" class="h-4 w-full" />
              </div>
            </template>

            <!-- Instacart Button after ingredients list -->
            <div
              v-if="recipe && recipe.ingredients && recipe.ingredients.length > 0"
              class="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700"
            >
              <InstacartButton
                :ingredients="
                  scaledIngredients.map((ing) => ({
                    name: ing.name || '',
                    quantity: ing.quantity || '',
                    unit:
                      typeof ing.unit === 'string'
                        ? { label: ing.unit, value: ing.unit }
                        : ing.unit || { label: '', value: '' },
                  }))
                "
                :recipe-title="recipe.title || ''"
                :recipe-instructions="recipe.instructions || []"
                :recipe-image-url="recipe.imageUrl || ''"
              />
            </div>
          </UPageCard>
        </div>

        <!-- Column 2: Steps -->
        <div>
          <UPageCard
            :ui="{
              header: 'px-4 py-3 sm:px-6',
            }"
          >
            <template #header>
              <div class="flex justify-between items-center w-full">
                <h3 class="text-base font-semibold leading-6">
                  {{ t('recipe.sections.steps') }}
                </h3>
              </div>
            </template>

            <template v-if="recipe && recipe.status === 'SUCCESS'">
              <!-- Display mode -->
              <ol class="list-decimal list-inside space-y-4">
                <li v-for="instruction in recipe.instructions" :key="instruction">
                  {{ instruction }}
                </li>
              </ol>
            </template>
            <template v-else>
              <!-- Skeleton: 5 paragraph-looking blocks -->
              <div class="space-y-4">
                <USkeleton v-for="i in 5" :key="i" class="h-20 w-full" />
              </div>
            </template>
          </UPageCard>
        </div>
      </div>

      <!-- Link to Original Recipe -->
      <div
        v-if="recipe && recipe.url && recipe.status !== 'FAILED'"
        class="flex w-full justify-center"
      >
        <ULink :to="recipe.url">
          <UButton variant="ghost" block>
            {{ t('recipe.buttons.originalRecipe') }}
          </UButton>
        </ULink>
      </div>
    </template>
  </UDashboardPanel>

  <!-- Cooking Mode -->
  <RecipeCookingMode
    v-if="
      cookingMode &&
      recipe &&
      recipe.title &&
      recipe.instructions &&
      Array.isArray(recipe.instructions)
    "
    v-model:is-open="cookingMode"
    :recipe="{
      // Force type to match RecipeCookingMode's expected props
      title: recipe.title || '',
      instructions: (recipe.instructions || []) as string[],
      ingredients: [], // RecipeCookingMode uses scaledIngredients instead
    }"
    :scaled-ingredients="scaledIngredients as any"
  />

  <!-- Configuration Slideover -->
  <USlideover
    v-model:open="isSlideoverOpen"
    :title="t('recipe.configuration.title')"
    :timeout="0"
    prevent-close
  >
    <!-- Hidden but programmatically accessible trigger -->
    <span class="hidden">{{ t('recipe.configuration.title') }}</span>

    <!-- Body content -->
    <template #body>
      <div class="space-y-4">
        <USeparator :label="t('recipe.configuration.divider.scaling')" />

        <div v-if="canScaleByServings">
          <label class="block mb-2 font-bold">
            {{ t('recipe.configuration.method.label') }}
          </label>
          <USelect
            v-model="scalingMethod"
            :items="[
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
            {{ t('recipe.configuration.scale.scale') }}
            {{ ingredientScaleLabel }}
          </label>
          <USlider v-model:model-value="scale" :step="0.5" :min="0.5" :max="10" />
        </div>
        <div v-else>
          <label class="block mb-2 font-bold">
            {{ t('recipe.configuration.servings.new') }}
          </label>
          <UInput v-model.number="desiredServings" type="number" min="1" />
          <!-- Display the original serving size as a subtitle -->
          <div class="text-sm text-(--ui-text-muted) mt-1">
            {{ servingsScaleLabel }}
          </div>
        </div>
      </div>
    </template>

    <!-- Footer with close button -->
    <template #footer>
      <div class="flex justify-end">
        <UButton color="neutral" variant="outline" @click="isSlideoverOpen = false">
          {{ t('recipe.configuration.close') }}
        </UButton>
      </div>
    </template>
  </USlideover>

  <!-- Recipe Edit Slideover -->
  <EditRecipeSlideover
    v-model="isEditSlideoverOpen"
    :recipe="recipe as any"
    :is-owner="isOwner"
    :client="client"
    :get-auth-options="getAuthOptions"
    @recipe-updated="handleRecipeUpdated"
  />
</template>

<style module scoped>
/* Tailwind CSS handles all styling */
</style>

<i18n lang="json">
{
  "en": {
    "recipeDetails": {
      "title": "Recipe"
    },
    "recipe": {
      "edit": {
        "successTitle": "Updated",
        "successDescription": "Recipe details updated successfully.",
        "titleSuccessDescription": "Recipe title updated successfully.",
        "nutritionSuccessDescription": "Nutritional information updated successfully.",
        "ingredientsSuccessDescription": "Ingredients updated successfully.",
        "stepsSuccessDescription": "Steps updated successfully.",
        "allChangesSuccessDescription": "Recipe updated successfully.",
        "errorTitle": "Update Error",
        "errorDescription": "Failed to update recipe details.",
        "titleErrorDescription": "Failed to update recipe title.",
        "nutritionErrorDescription": "Failed to update nutritional information.",
        "ingredientsErrorDescription": "Failed to update ingredients.",
        "stepsErrorDescription": "Failed to update steps.",
        "allChangesErrorDescription": "Failed to update recipe.",
        "editDetails": "Edit Details",
        "editingDetails": "Editing Details",
        "editRecipe": "Edit Recipe",
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
        },
        "close": "Close"
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
        "servings": "Servings:",
        "recipeTitle": "Recipe Title:"
      },
      "sections": {
        "ingredients": "Ingredients",
        "steps": "Steps"
      },
      "buttons": {
        "originalRecipe": "Go to original recipe"
      },
      "copy": {
        "buttonTitle": "Copy Recipe",
        "errorTitle": "Copy Error",
        "errorDescription": "Failed to copy the recipe.",
        "guestTitle": "Create an Account",
        "guestDescription": "Create an account to copy this recipe and save it to your collection.",
        "guestAction": "Sign Up",
        "successTitle": "Recipe Copied",
        "successDescription": "Recipe has been copied to your collection."
      }
    }
  },
  "fr": {
    "recipeDetails": {
      "title": "Recette"
    },
    "recipe": {
      "edit": {
        "successTitle": "Mis à jour",
        "successDescription": "Détails de la recette mis à jour avec succès.",
        "titleSuccessDescription": "Titre de la recette mis à jour avec succès.",
        "nutritionSuccessDescription": "Informations nutritionnelles mises à jour avec succès.",
        "ingredientsSuccessDescription": "Ingrédients mis à jour avec succès.",
        "stepsSuccessDescription": "Étapes mises à jour avec succès.",
        "allChangesSuccessDescription": "Recette mise à jour avec succès.",
        "errorTitle": "Erreur de mise à jour",
        "errorDescription": "Échec de la mise à jour des détails de la recette.",
        "titleErrorDescription": "Échec de la mise à jour du titre de la recette.",
        "nutritionErrorDescription": "Échec de la mise à jour des informations nutritionnelles.",
        "ingredientsErrorDescription": "Échec de la mise à jour des ingrédients.",
        "stepsErrorDescription": "Échec de la mise à jour des étapes.",
        "allChangesErrorDescription": "Échec de la mise à jour de la recette.",
        "editDetails": "Modifier les détails",
        "editingDetails": "Modification des détails",
        "editRecipe": "Modifier la recette",
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
        "close": "Fermer",
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
        "servings": "Portions :",
        "recipeTitle": "Titre de la recette :"
      },
      "sections": {
        "ingredients": "Ingrédients",
        "steps": "Étapes"
      },
      "buttons": {
        "originalRecipe": "Voir la recette originale"
      },
      "copy": {
        "buttonTitle": "Copier la recette",
        "errorTitle": "Erreur de copie",
        "errorDescription": "Échec de la copie de la recette.",
        "guestTitle": "Créer un compte",
        "guestDescription": "Créez un compte pour copier cette recette et la sauvegarder dans votre collection.",
        "guestAction": "S'inscrire",
        "successTitle": "Recette copiée",
        "successDescription": "La recette a été copiée dans votre collection."
      }
    }
  },
  "es": {
    "recipeDetails": {
      "title": "Receta"
    },
    "recipe": {
      "edit": {
        "successTitle": "Actualizado",
        "successDescription": "Detalles de la receta actualizados con éxito.",
        "titleSuccessDescription": "Título de la receta actualizado con éxito.",
        "nutritionSuccessDescription": "Información nutricional actualizada con éxito.",
        "ingredientsSuccessDescription": "Ingredientes actualizados con éxito.",
        "stepsSuccessDescription": "Pasos actualizados con éxito.",
        "allChangesSuccessDescription": "Receta actualizada con éxito.",
        "errorTitle": "Error de actualización",
        "errorDescription": "Error al actualizar los detalles de la receta.",
        "titleErrorDescription": "Error al actualizar el título de la receta.",
        "nutritionErrorDescription": "Error al actualizar la información nutricional.",
        "ingredientsErrorDescription": "Error al actualizar los ingredientes.",
        "stepsErrorDescription": "Error al actualizar los pasos.",
        "allChangesErrorDescription": "Error al actualizar la receta.",
        "editDetails": "Editar detalles",
        "editingDetails": "Editando detalles",
        "editRecipe": "Editar receta",
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
        },
        "close": "Cerrar"
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
        "servings": "Porciones:",
        "recipeTitle": "Título de la receta:"
      },
      "sections": {
        "ingredients": "Ingredientes",
        "steps": "Pasos"
      },
      "buttons": {
        "originalRecipe": "Ir a la receta original"
      },
      "copy": {
        "buttonTitle": "Copiar receta",
        "errorTitle": "Error de copia",
        "errorDescription": "No se pudo copiar la receta.",
        "guestTitle": "Crear una cuenta",
        "guestDescription": "Crea una cuenta para copiar esta receta y guardarla en tu colección.",
        "guestAction": "Registrarse",
        "successTitle": "Receta copiada",
        "successDescription": "La receta ha sido copiada a tu colección."
      }
    }
  }
}
</i18n>
