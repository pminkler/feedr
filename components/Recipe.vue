<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { useRecipe } from "~/composables/useRecipe";
import RecipeCardSkeleton from "~/components/RecipeCardSkeleton.vue";

const props = defineProps({
  url: {
    type: String,
    required: true,
  },
});

const recipe = ref(null);
const loading = ref(true);

const fetchRecipe = async () => {
  loading.value = true;
  const recipeApi = useRecipe();
  const response = await recipeApi.getRecipeFromUrl({ url: props.url });

  if (response) {
    const parsedResponse = JSON.parse(response);
    recipe.value = parsedResponse.body;
  }

  loading.value = false;
};

onMounted(fetchRecipe);
watch(() => props.url, fetchRecipe);
</script>

<template>
  <UContainer class="w-full md:w-3/4 lg:w-1/2 space-y-4">
    <template v-if="loading">
      <RecipeCardSkeleton />
      <RecipeCardSkeleton :line-count="6" />
      <RecipeCardSkeleton :line-count="4" use-paragraphs />
    </template>
    <template v-else>
      <UDashboardCard :title="recipe.title">
        <ul class="list-disc list-inside space-y-2">
          <li>Prep time: {{ recipe.prep_time }}</li>
          <li>Cook time: {{ recipe.cook_time }}</li>
          <li>Servings: {{ recipe.servings }}</li>
        </ul>
      </UDashboardCard>
      <UDashboardCard title="Ingredients">
        <ul class="list-disc list-inside space-y-2">
          <li v-for="ingredient in recipe.ingredients" :key="ingredient.name">
            {{ ingredient.quantity }} {{ ingredient.unit }}
            {{ ingredient.name }}
          </li>
        </ul>
      </UDashboardCard>
      <UDashboardCard title="Steps">
        <ol class="list-decimal list-inside space-y-4">
          <li v-for="instruction in recipe.instructions" :key="instruction">
            {{ instruction }}
          </li>
        </ol>
      </UDashboardCard>
    </template>
  </UContainer>
</template>

<style module scoped></style>
