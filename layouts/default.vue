<script setup lang="ts">
import { useI18n } from "vue-i18n";

const route = useRoute();
const appConfig = useAppConfig();
const localePath = useLocalePath();
const { t } = useI18n();

const links = [
  {
    id: "my-recipes",
    label: t("navigation.myRecipes"),
    icon: "i-heroicons-document-text",
    to: localePath("my-recipes"),
    tooltip: {
      text: t("navigation.myRecipes"),
      shortcuts: ["G", "R"],
    },
  },
  {
    id: "planning",
    label: t("navigation.mealPlanning"),
    icon: "i-heroicons-calendar",
    to: localePath("planning"),
    tooltip: {
      text: t("navigation.mealPlanning"),
      shortcuts: ["G", "P"],
    },
  },
];
</script>

<template>
  <UDashboardGroup>
    <UDashboardSidebar collapsible resizable :min-size="20">
      <template #header="{ collapsed }">
        <UDashboardSearchButton :collapsed="collapsed" />
      </template>

      <UNavigationMenu :items="links" orientation="vertical" />
    </UDashboardSidebar>
    <slot />
  </UDashboardGroup>
</template>

<i18n lang="json">
{
  "en": {
    "navigation": {
      "myRecipes": "My Recipes",
      "mealPlanning": "Meal Planning"
    }
  },
  "fr": {
    "navigation": {
      "myRecipes": "Mes Recettes",
      "mealPlanning": "Planification"
    }
  },
  "es": {
    "navigation": {
      "myRecipes": "Mis Recetas",
      "mealPlanning": "Planificación"
    }
  }
}
</i18n>
