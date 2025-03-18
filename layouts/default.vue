<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { ref, computed } from "vue";

const localePath = useLocalePath();
const { t } = useI18n();
const searchTerm = ref("");
const open = ref(false);

// Define navigation links for sidebar
const links = [
  {
    id: "my-recipes",
    label: t("navigation.myRecipes"),
    icon: "i-heroicons-document-text",
    to: localePath("my-recipes"),
    onSelect: () => {
      open.value = false;
    },
  },
];

// Automatically create search groups from navigation links
const searchGroups = computed(() => [
  {
    label: t("search.navigation"),
    id: "links",
    items: links.map((link) => ({
      id: link.id,
      label: link.label,
      icon: link.icon,
      to: link.to,
      shortcut: link.shortcut,
      onSelect: link.onSelect,
    })),
  },
]);
</script>

<template>
  <UDashboardGroup>
    <UDashboardSearch
      shortcut="ctrl_k"
      v-model:search-term="searchTerm"
      v-model:open="open"
      :groups="searchGroups"
      :placeholder="t('search.placeholder')"
    />

    <UDashboardSidebar v-model:open="open" collapsible resizable :min-size="20">
      <template #header="{ collapsed }">
        <UDashboardSearchButton
          :collapsed="collapsed"
          :kbds="['ctrl', 'k']"
          class="bg-transparent ring-(--ui-border) w-full"
        />
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
      "mealPlanning": "Meal Planning",
      "bookmarks": "Bookmarks"
    },
    "search": {
      "navigation": "Navigation",
      "actions": "Actions",
      "placeholder": "Search or type a command..."
    },
    "actions": {
      "newRecipe": "New Recipe"
    }
  },
  "fr": {
    "navigation": {
      "myRecipes": "Mes Recettes",
      "mealPlanning": "Planification",
      "bookmarks": "Favoris"
    },
    "search": {
      "navigation": "Navigation",
      "actions": "Actions",
      "placeholder": "Rechercher ou saisir une commande..."
    },
    "actions": {
      "newRecipe": "Nouvelle Recette"
    }
  },
  "es": {
    "navigation": {
      "myRecipes": "Mis Recetas",
      "mealPlanning": "Planificación",
      "bookmarks": "Marcadores"
    },
    "search": {
      "navigation": "Navegación",
      "actions": "Acciones",
      "placeholder": "Buscar o escribir un comando..."
    },
    "actions": {
      "newRecipe": "Nueva Receta"
    }
  }
}
</i18n>
