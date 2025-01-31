<script setup lang="ts">
import { ref, onMounted, watch, computed } from "vue";
import { useRecipe } from "~/composables/useRecipe";
import RecipeCardSkeleton from "~/components/RecipeCardSkeleton.vue";
import { generateClient } from "aws-amplify/data";
import { useI18n } from "vue-i18n";
import LoadingMessages from "~/components/LoadingMessages.vue";

// Create your AWS Amplify client (adjust Schema type as needed)
import type { Schema } from "~/amplify/data/resource";
const client = generateClient<Schema>();

// Get the translation function
const { t } = useI18n();

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

// The scale factor for ingredients; default is 1 (full recipe)
const scale = ref(1);

// Controls whether the scaling configuration slideover is open
const isSlideoverOpen = ref(false);

// Get our composable so we can access getRecipeById and scaleIngredients
const recipeStore = useRecipe();

const fetchRecipe = async () => {
  loading.value = true;
  error.value = null;
  const response = await recipeStore.getRecipeById(props.id);
  if (response && response.status === "SUCCESS") {
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

// If the URL prop changes, refetch the recipe
watch(() => props.url, fetchRecipe);

// A computed property that applies the scaling to the recipe's ingredients.
const scaledIngredients = computed(() => {
  if (!recipe.value || !recipe.value.ingredients) return [];
  return recipeStore.scaleIngredients(recipe.value.ingredients, scale.value);
});

// A computed label for the scale value to make it user friendly using i18n.
const scaleLabel = computed(() => {
  const val = scale.value;
  if (val === 0.5) return t("recipe.configuration.scale.half");
  if (val === 1) return t("recipe.configuration.scale.full");
  if (val === 2) return t("recipe.configuration.scale.double");
  return t("recipe.configuration.scale.custom", { value: val });
});
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
      <!-- Top card with recipe details and a link to open the configuration slideover -->
      <UDashboardCard
        v-if="recipe"
        :title="recipe.title"
        :links="[
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
      <div>
        <ULink :to="recipe.url">
          <UButton variant="ghost" block>
            {{ t("recipe.buttons.originalRecipe") }}
          </UButton>
        </ULink>
      </div>
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
          <div>
            <label class="block mb-2 font-bold">
              {{ t("recipe.configuration.scale.scale") }} {{ scaleLabel }}
            </label>
            <!-- The slider only allows positive scaling (from 0.5 up) -->
            <URange
              v-model:modelValue="scale"
              :step="0.5"
              :min="0.5"
              :max="10"
            />
          </div>
        </div>
      </div>
    </USlideover>
  </div>
</template>

<style module scoped></style>
