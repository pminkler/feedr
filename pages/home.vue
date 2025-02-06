<script setup lang="ts">
const { getSavedRecipes, savedRecipesState } = useRecipe();

getSavedRecipes();

definePageMeta({
  middleware: "auth",
});
</script>

<template>
  <UDashboardPage>
    <UDashboardPanel grow>
      <UDashboardNavbar title="Home" />

      <UDashboardPanelContent>
        <div class="grid lg:grid-cols-2 gap-4 mt-4">
          <UDashboardCard
            v-for="recipe in savedRecipesState"
            :title="recipe.recipe.title"
            :links="[{ label: 'View', to: `/recipes/${recipe.recipeId}` }]"
          />
        </div>
      </UDashboardPanelContent>
    </UDashboardPanel>
  </UDashboardPage>
</template>

<style module scoped></style>
