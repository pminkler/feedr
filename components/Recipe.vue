<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { useRecipe } from "~/composables/useRecipe";
import RecipeCardSkeleton from "~/components/RecipeCardSkeleton.vue";
import { generateClient } from "aws-amplify/data";

const client = generateClient<Schema>();

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
});

const recipe = ref(null);
const loading = ref(true);
const error = ref(null);

const fetchRecipe = async () => {
  loading.value = true;
  error.value = null;
  const recipeStore = useRecipe();
  const response = await recipeStore.getRecipeById(props.id);

  if (response && response.status === "SUCCESS") {
    recipe.value = response;
    loading.value = false;
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
watch(() => props.url, fetchRecipe);
</script>

<template>
  <div class="space-y-4">
    <template v-if="loading">
      <RecipeCardSkeleton />
      <RecipeCardSkeleton :line-count="6" />
      <RecipeCardSkeleton :line-count="4" use-paragraphs />
    </template>
    <template v-else-if="error">
      <UAlert
        icon="material-symbols:error"
        color="red"
        :actions="[
          {
            variant: 'solid',
            color: 'gray',
            label: 'Try Again',
            click: fetchRecipe,
          },
        ]"
        title="Error"
        description="There was a problem getting the recipe."
      />
    </template>
    <template v-else>
      <UDashboardCard v-if="recipe" :title="recipe.title">
        <ul class="list-disc list-inside space-y-2">
          <li>Prep time: {{ recipe.prep_time }}</li>
          <li>Cook time: {{ recipe.cook_time }}</li>
          <li>Servings: {{ recipe.servings }}</li>
        </ul>
      </UDashboardCard>
      <UDashboardCard v-if="recipe" title="Ingredients">
        <ul class="list-disc list-inside space-y-2">
          <li v-for="ingredient in recipe.ingredients" :key="ingredient.name">
            {{ ingredient.quantity }} {{ ingredient.unit }}
            {{ ingredient.name }}
          </li>
        </ul>
      </UDashboardCard>
      <UDashboardCard v-if="recipe" title="Steps">
        <ol class="list-decimal list-inside space-y-4">
          <li v-for="instruction in recipe.instructions" :key="instruction">
            {{ instruction }}
          </li>
        </ol>
      </UDashboardCard>
    </template>
  </div>
</template>

<style module scoped></style>
