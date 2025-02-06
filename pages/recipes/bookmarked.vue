<script setup lang="ts">
const { getSavedRecipes, savedRecipesState } = useRecipe();

getSavedRecipes();

definePageMeta({
  middleware: "auth",
});
</script>

<template>
  <UDashboardPage>
    <div class="grid lg:grid-cols-2 gap-4 mt-4 w-full">
      <UDashboardCard
        v-for="recipe in savedRecipesState"
        :title="recipe.recipe.title"
        :links="[{ label: 'View', to: `/recipes/${recipe.recipeId}` }]"
      />
    </div>
  </UDashboardPage>
</template>

<style module scoped></style>
