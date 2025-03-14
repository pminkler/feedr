<script setup lang="ts">
import { useRoute } from "vue-router";
import { onBeforeMount } from "vue";
import { useI18n } from "vue-i18n";
import Recipe from "../../components/Recipe.vue";

const route = useRoute();
const { isLoggedIn } = useAuth();
const { t } = useI18n({ useScope: "local" });

// Default layout is used, no need for explicit setting
</script>

<template>
  <UDashboardPanel id="recipeDetails">
    <template #header>
      <UDashboardNavbar
        :title="t('recipeDetails.title')"
      />
    </template>

    <template #body>
      <Recipe
        :id="
          Array.isArray(route.params.id) ? route.params.id[0] : route.params.id
        "
      />
    </template>
  </UDashboardPanel>
</template>

<style module scoped>
/* Add your styles here */
</style>

<i18n lang="json">
{
  "en": {
    "recipeDetails": {
      "title": "Recipe Details"
    }
  },
  "fr": {
    "recipeDetails": {
      "title": "Détails de la Recette"
    }
  },
  "es": {
    "recipeDetails": {
      "title": "Detalles de la Receta"
    }
  }
}
</i18n>
