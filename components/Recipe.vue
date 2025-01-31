<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { useRecipe } from "~/composables/useRecipe";
import RecipeCardSkeleton from "~/components/RecipeCardSkeleton.vue";
import { generateClient } from "aws-amplify/data";
import { useI18n } from "vue-i18n";
import LoadingMessages from "~/components/LoadingMessages.vue";

// Create your AWS Amplify client (adjust Schema type as needed)
const client = generateClient<Schema>();

// Get the translation function
const { t } = useI18n();

// Optional: loadingMessages is used in the waiting state
const loadingMessages = useLoadingMessages();

// Define the props for the component
const props = defineProps({
  id: {
    type: String,
    required: true,
  },
});

const recipe = ref(null);
const loading = ref(true);
const error = ref(null);
const waitingForProcessing = ref(false);

const fetchRecipe = async () => {
  loading.value = true;
  error.value = null;
  const recipeStore = useRecipe();
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
    error: (error) => {
      console.error("Error subscribing to recipe updates:", error);
    },
  });
};

onMounted(async () => {
  await fetchRecipe();
  await subscribeToChanges();
});

// Watch for prop changes (if any, e.g. a URL prop) and refetch as needed
watch(() => props.url, fetchRecipe);
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
      <UDashboardCard v-if="recipe" :title="recipe.title">
        <ul class="list-disc list-inside space-y-2">
          <li>{{ t("recipe.details.prepTime") }} {{ recipe.prep_time }}</li>
          <li>{{ t("recipe.details.cookTime") }} {{ recipe.cook_time }}</li>
          <li>{{ t("recipe.details.servings") }} {{ recipe.servings }}</li>
        </ul>
      </UDashboardCard>
      <UDashboardCard v-if="recipe" :title="t('recipe.sections.ingredients')">
        <ul class="list-disc list-inside space-y-2">
          <li v-for="ingredient in recipe.ingredients" :key="ingredient.name">
            {{ ingredient.quantity }} {{ ingredient.unit }}
            {{ ingredient.name }}
          </li>
        </ul>
      </UDashboardCard>
      <UDashboardCard v-if="recipe" :title="t('recipe.sections.steps')">
        <ol class="list-decimal list-inside space-y-4">
          <li v-for="instruction in recipe.instructions" :key="instruction">
            {{ instruction }}
          </li>
        </ol>
      </UDashboardCard>
      <div>
        <ULink :to="recipe.url">
          <UButton variant="ghost" block>{{
            t("recipe.buttons.originalRecipe")
          }}</UButton>
        </ULink>
      </div>
    </template>
  </div>
</template>

<style module scoped></style>
