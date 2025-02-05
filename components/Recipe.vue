<script setup lang="ts">
import { ref, onMounted, watch, computed, onBeforeUnmount } from "vue";
import { useRecipe } from "~/composables/useRecipe";
import { generateClient } from "aws-amplify/data";
import { useI18n } from "vue-i18n";
import LoadingMessages from "~/components/LoadingMessages.vue";

// Assume you have a toast composable available
const toast = useToast();

// Create your AWS Amplify client (adjust Schema type as needed)
import type { Schema } from "~/amplify/data/resource";
const client = generateClient<Schema>();

const { t } = useI18n();

const cookingMode = ref(false);
const loadingMessages = useLoadingMessages();

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

// Scaling state:
const scale = ref(1);
const desiredServings = ref<number>(1);

// Controls whether the configuration slideover is open
const isSlideoverOpen = ref(false);

// Which scaling method to use: "ingredients" or "servings"
const scalingMethod = ref<"ingredients" | "servings">("ingredients");

const recipeStore = useRecipe();

let subscription: { unsubscribe: () => void } | null = null;

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
};

const subscribeToChanges = async () => {
  if (subscription) {
    subscription.unsubscribe();
    subscription = null;
  }
  subscription = client.models.Recipe.onUpdate({
    filter: { id: { eq: props.id } },
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

const scaledIngredients = computed(() => {
  if (!recipe.value || !recipe.value.ingredients) return [];
  return recipeStore.scaleIngredients(
    recipe.value.ingredients,
    scalingFactor.value,
  );
});

// When scaling by ingredients, multiply each distinct number in the servings string by the scale factor.
// When scaling by servings, simply display the desired servings value.
const scaledServingsText = computed(() => {
  if (!recipe.value || !recipe.value.servings) return "";
  if (scalingMethod.value === "servings") {
    return desiredServings.value.toString();
  }
  const factor = scale.value;
  return recipe.value.servings.replace(/(\d+(\.\d+)?)/g, (match) => {
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

// Updated, concise label showing only the original serving size as a subtitle.
// Assumes an i18n key "recipe.configuration.servings.original" with a parameter "original".
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
        });
      });
  }
}

const handleVisibilityChange = async () => {
  if (document.visibilityState === "visible") {
    await fetchRecipe();
    await subscribeToChanges();
  }
};

document.addEventListener("visibilitychange", handleVisibilityChange);

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

    <template v-if="waitingForProcessing">
      <LoadingMessages />
      <UProgress />
    </template>

    <!-- Page Header (only rendered when recipe data exists) -->
    <UPageHeader
      v-if="recipe"
      :title="recipe.title"
      :links="[
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
      ]"
    />

    <!-- Grid Layout -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <!-- Column 1: Details, Nutritional Information, Ingredients -->
      <div class="space-y-4">
        <!-- Recipe Details Card -->
        <UDashboardCard :title="t('recipe.details.title')">
          <template v-if="recipe && recipe.status === 'SUCCESS'">
            <ul class="list-disc list-inside space-y-2">
              <li>{{ t("recipe.details.prepTime") }} {{ recipe.prep_time }}</li>
              <li>{{ t("recipe.details.cookTime") }} {{ recipe.cook_time }}</li>
              <!-- Updated servings line using the computed value -->
              <li>
                {{ t("recipe.details.servings") }}
                {{ scaledServingsText }}
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

        <!-- Nutritional Information Card -->
        <UDashboardCard
          :title="t('recipe.nutritionalInformation.title')"
          :description="t('recipe.nutritionalInformation.per_serving')"
        >
          <template
            v-if="
              recipe &&
              recipe.nutritionalInformation &&
              recipe.nutritionalInformation.status === 'SUCCESS'
            "
          >
            <ul class="list-disc list-inside space-y-2">
              <li>
                {{ t("recipe.nutritionalInformation.calories") }}:
                {{ recipe.nutritionalInformation.calories }}
              </li>
              <li>
                {{ t("recipe.nutritionalInformation.protein") }}:
                {{ recipe.nutritionalInformation.protein }}
              </li>
              <li>
                {{ t("recipe.nutritionalInformation.fat") }}:
                {{ recipe.nutritionalInformation.fat }}
              </li>
              <li>
                {{ t("recipe.nutritionalInformation.carbs") }}:
                {{ recipe.nutritionalInformation.carbs }}
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

        <!-- Ingredients Card -->
        <UDashboardCard :title="t('recipe.sections.ingredients')">
          <template v-if="recipe && recipe.status === 'SUCCESS'">
            <ul class="list-disc list-inside space-y-2">
              <li
                v-for="ingredient in scaledIngredients"
                :key="ingredient.name"
              >
                {{ ingredient.quantity }} {{ ingredient.unit }}
                {{ ingredient.name }}
              </li>
            </ul>
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
        <UDashboardCard :title="t('recipe.sections.steps')">
          <template v-if="recipe && recipe.status === 'SUCCESS'">
            <ol class="list-decimal list-inside space-y-4">
              <li v-for="instruction in recipe.instructions" :key="instruction">
                {{ instruction }}
              </li>
            </ol>
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
    <div class="flex w-full justify-center" v-if="recipe && recipe.url">
      <ULink :to="recipe.url">
        <UButton variant="ghost" block>
          {{ t("recipe.buttons.originalRecipe") }}
        </UButton>
      </ULink>
    </div>
  </div>

  <!-- Cooking Mode and Configuration Slideover -->
  <RecipeCookingMode v-model:is-open="cookingMode" :recipe="recipe" />

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
