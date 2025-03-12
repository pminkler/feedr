<script setup lang="ts">
import { useRoute } from "vue-router";
import { onBeforeMount } from "vue";
import { useI18n } from "vue-i18n";
import Recipe from "../../components/Recipe.vue";

const route = useRoute();
const { isLoggedIn } = useAuth();
const { t } = useI18n({ useScope: "local" });

definePageMeta({
  layout: "default",
});

onBeforeMount(() => {
  if (isLoggedIn.value) {
    setPageLayout("dashboard");
  }
});
</script>

<template>
  <!--Logged Out-->
  <UContainer class="w-full md:w-3/4 lg:w-3/4" v-if="!isLoggedIn">
    <Recipe
      :id="
        Array.isArray(route.params.id) ? route.params.id[0] : route.params.id
      "
    />
  </UContainer>

  <!--Logged In-->
  <UDashboardPanel id="recipeDetails" v-else>
    <template #header>
      <UDashboardNavbar
        :title="t('recipeDetails.title')"
        :ui="{ right: 'gap-3' }"
      >
        <template #right>
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-heroicons-bookmark"
            to="/bookmarks"
          >
            {{ t("recipeDetails.backToBookmarks") }}
          </UButton>
        </template>
      </UDashboardNavbar>
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
      "title": "Recipe Details",
      "backToBookmarks": "Back to Bookmarks"
    }
  },
  "fr": {
    "recipeDetails": {
      "title": "Détails de la Recette",
      "backToBookmarks": "Retour aux Favoris"
    }
  },
  "es": {
    "recipeDetails": {
      "title": "Detalles de la Receta",
      "backToBookmarks": "Volver a Favoritos"
    }
  }
}
</i18n>
