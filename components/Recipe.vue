<script setup lang="ts">
import { ref, onMounted, watch, computed } from "vue";
import { useRecipe } from "~/composables/useRecipe";
import RecipeCardSkeleton from "~/components/RecipeCardSkeleton.vue";
import { generateClient } from "aws-amplify/data";
import { useI18n } from "vue-i18n";
import LoadingMessages from "~/components/LoadingMessages.vue";
import { onBeforeUnmount } from "vue";

// Create your AWS Amplify client (adjust Schema type as needed)
import type { Schema } from "~/amplify/data/resource";
const client = generateClient<Schema>();

// Get the translation function
const { t } = useI18n();
const toast = useToast();

// Optional: loading messages (if needed)
const loadingMessages = useLoadingMessages();

// Define the props for the component
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

// Get our composable so we can access getRecipeById and scaleIngredients
const recipeStore = useRecipe();

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
  const updateRecipe = client.models.Recipe.onUpdate({
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

// Function to handle when page becomes visible
const handleVisibilityChange = () => {
  if (document.visibilityState === "visible") {
    // Fetch the latest recipe data when the user returns to the page
    fetchRecipe();
  }
};

// Add the event listener when the component mounts
document.addEventListener("visibilitychange", handleVisibilityChange);

// Cleanup the listener when the component is unmounted
onBeforeUnmount(() => {
  document.removeEventListener("visibilitychange", handleVisibilityChange);
});

// If the URL prop changes, refetch the recipe
watch(() => props.url, fetchRecipe);

// Attempt to extract a single number from the recipe.servings string.
const originalServingsNumber = computed(() => {
  if (!recipe.value || !recipe.value.servings) return NaN;
  if (/[–\-—]/.test(recipe.value.servings)) return NaN;
  const match = recipe.value.servings.match(/(\d+(\.\d+)?)/);
  if (match) {
    return parseFloat(match[0]);
  }
  return NaN;
});

// Determine whether we can use servings scaling
const canScaleByServings = computed(() => !isNaN(originalServingsNumber.value));

// When the recipe is loaded and can scale by servings, initialize desiredServings.
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

// Compute a scaling factor based on the chosen method.
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

// Compute the scaled ingredients using the scaling factor.
const scaledIngredients = computed(() => {
  if (!recipe.value || !recipe.value.ingredients) return [];
  return recipeStore.scaleIngredients(
    recipe.value.ingredients,
    scalingFactor.value,
  );
});

// A computed label for the scale value in "ingredients" mode using i18n.
const ingredientScaleLabel = computed(() => {
  const val = scale.value;
  if (val === 0.5) return t("recipe.configuration.scale.half");
  if (val === 1) return t("recipe.configuration.scale.full");
  if (val === 2) return t("recipe.configuration.scale.double");
  return t("recipe.configuration.scale.custom", { value: val });
});

// A computed label for the servings scaling mode.
const servingsScaleLabel = computed(() => {
  const orig = originalServingsNumber.value;
  return !isNaN(orig)
    ? `${desiredServings.value} / ${orig}`
    : desiredServings.value.toString();
});

// Share functionality using the Web Share API or clipboard fallback.
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
</script>

<template>
  <div class="space-y-4">
    <!-- Loading State -->
    <template v-if="loading">
      <template v-if="waitingForProcessing">
        <div class="flex flex-col space-y-2 pb-6">
          <LoadingMessages />
          <UProgress animation="carousel" />
        </div>
      </template>
      <RecipeCardSkeleton />
      <RecipeCardSkeleton :line-count="6" />
      <RecipeCardSkeleton :line-count="4" use-paragraphs />
    </template>

    <!-- Error State -->
    <template v-else-if="error">
      <UAlert
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
    </template>

    <!-- Loaded State -->
    <template v-else>
      <!-- If the recipe has failed, show a red alert with a link to go back -->
      <template v-if="recipe && recipe.status === 'FAILED'">
        <UAlert
          icon="material-symbols:error"
          color="red"
          :actions="[
            {
              variant: 'solid',
              color: 'gray',
              label: t('recipe.error.failedAction'),
              to: '/',
            },
          ]"
          :title="t('recipe.error.failedTitle')"
          :description="t('recipe.error.failedDescription')"
        />
      </template>
      <template v-else>
        <!-- Top card with recipe details and links for configuration and sharing -->
        <UDashboardCard
          v-if="recipe"
          :title="recipe.title"
          :links="[
            {
              icon: 'material-symbols:share',
              variant: 'ghost',
              click: shareRecipe,
            },
            {
              label: t('recipe.configuration.configure'),
              click: () => {
                isSlideoverOpen = true;
              },
            },
          ]"
        >
          <ul class="list-disc list-inside space-y-2">
            <li>{{ t("recipe.details.prepTime") }} {{ recipe.prep_time }}</li>
            <li>{{ t("recipe.details.cookTime") }} {{ recipe.cook_time }}</li>
            <li>{{ t("recipe.details.servings") }} {{ recipe.servings }}</li>
          </ul>
        </UDashboardCard>

        <!-- Ingredients card showing the scaled ingredients -->
        <UDashboardCard v-if="recipe" :title="t('recipe.sections.ingredients')">
          <ul class="list-disc list-inside space-y-2">
            <li v-for="ingredient in scaledIngredients" :key="ingredient.name">
              {{ ingredient.quantity }} {{ ingredient.unit }}
              {{ ingredient.name }}
            </li>
          </ul>
        </UDashboardCard>

        <!-- Steps card -->
        <UDashboardCard v-if="recipe" :title="t('recipe.sections.steps')">
          <ol class="list-decimal list-inside space-y-4">
            <li v-for="instruction in recipe.instructions" :key="instruction">
              {{ instruction }}
            </li>
          </ol>
        </UDashboardCard>

        <!-- Link to the original recipe -->
        <div class="flex w-full justify-center" v-if="recipe.url">
          <ULink :to="recipe.url">
            <UButton variant="ghost" block>
              {{ t("recipe.buttons.originalRecipe") }}
            </UButton>
          </ULink>
        </div>
      </template>
    </template>

    <!-- Slideover for configuration -->
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

          <!-- Divider with label "Scaling" -->
          <UDivider :label="t('recipe.configuration.divider.scaling')" />

          <!-- Only show the method select if we can scale by servings -->
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

          <!-- Show configuration controls based on the selected method -->
          <div v-if="scalingMethod === 'ingredients'">
            <label class="block mb-2 font-bold">
              {{ t("recipe.configuration.scale.scale") }}
              {{ ingredientScaleLabel }}
            </label>
            <URange
              v-model:modelValue="scale"
              :step="0.5"
              :min="0.5"
              :max="10"
            />
          </div>
          <div v-else>
            <label class="block mb-2 font-bold">
              {{ t("recipe.configuration.servings.new") }}
              {{ servingsScaleLabel }}
            </label>
            <UInput v-model.number="desiredServings" type="number" min="1" />
          </div>
        </div>
      </div>
    </USlideover>
  </div>
</template>

<style module scoped></style>
