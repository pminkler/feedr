<script setup lang="ts">
import { useRecipe } from "~/composables/useRecipe";
import { useLocalePath } from "#imports";
import { useI18n } from "vue-i18n";

const localePath = useLocalePath();
const { t } = useI18n({ useScope: "local" });

const { getSavedRecipes, savedRecipesState } = useRecipe();

const loading = ref(true);

// Fetch saved recipes on page load
onMounted(async () => {
  loading.value = true;
  await getSavedRecipes();
  loading.value = false;
});

definePageMeta({
  middleware: "auth",
});
</script>

<template>
  <UDashboardPage>
    <template v-if="loading">
      <div class="grid lg:grid-cols-2 gap-4 mt-4 w-full">
        <USkeleton class="h-20 w-full" />
        <USkeleton class="h-20 w-full" />
        <USkeleton class="h-20 w-full" />
        <USkeleton class="h-20 w-full" />
        <USkeleton class="h-20 w-full" />
        <USkeleton class="h-20 w-full" />
      </div>
    </template>
    <template v-else>
      <div
        class="w-full flex justify-center"
        v-if="savedRecipesState.length === 0"
      >
        <UAlert
          class="w-full md:w-1/2"
          icon="material-symbols:info"
          color="yellow"
          variant="solid"
          :title="t('bookmarkedRecipes.noRecipesTitle')"
          :description="t('bookmarkedRecipes.noRecipesDescription')"
          :actions="[
            {
              label: t('bookmarkedRecipes.goHome'),
              to: localePath('/'),
              color: 'gray',
              variant: 'solid',
            },
          ]"
        />
      </div>
      <div class="grid lg:grid-cols-2 gap-4 mt-4 w-full" v-else>
        <UDashboardCard
          v-for="recipe in savedRecipesState"
          :key="recipe.recipeId"
          :title="recipe.recipe.title"
          :links="[
            {
              label: t('bookmarkedRecipes.view'),
              to: localePath(`/recipes/${recipe.recipeId}`),
            },
          ]"
        />
      </div>
    </template>
  </UDashboardPage>
</template>

<style module scoped></style>

<i18n lang="json">
{
  "en": {
    "bookmarkedRecipes": {
      "noRecipesTitle": "No Bookmarked Recipes",
      "noRecipesDescription": "You haven't bookmarked any recipes yet. Go back home and generate one.",
      "goHome": "Go Home",
      "view": "View"
    }
  },
  "fr": {
    "bookmarkedRecipes": {
      "noRecipesTitle": "Aucune recette en favori",
      "noRecipesDescription": "Vous n'avez pas encore marqué de recettes en favori. Retournez à l'accueil pour en générer une.",
      "goHome": "Accueil",
      "view": "Voir"
    }
  },
  "es": {
    "bookmarkedRecipes": {
      "noRecipesTitle": "No hay recetas marcadas",
      "noRecipesDescription": "Aún no has marcado ninguna receta. Vuelve a la página principal para generar una.",
      "goHome": "Inicio",
      "view": "Ver"
    }
  }
}
</i18n>
