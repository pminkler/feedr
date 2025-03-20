<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { ref, computed, onMounted } from "vue";
import { useRecipe } from "~/composables/useRecipe";
import Logo from "../components/Logo.vue";

const localePath = useLocalePath();
const { t } = useI18n();
const searchTerm = ref("");
const open = ref(false);
const { myRecipesState, getMyRecipes } = useRecipe();

// Load recipes when component is mounted
onMounted(async () => {
  await getMyRecipes();
});

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

// Compute recipe search items
const recipeSearchItems = computed(() => {
  return myRecipesState.value.map((recipe) => ({
    id: `recipe-${recipe.id}`,
    label: recipe.title,
    icon: "i-heroicons-document-text",
    to: localePath(`/recipes/${recipe.id}`),
    description: recipe.description,
    onSelect: () => {
      open.value = false;
    },
  }));
});

// Automatically create search groups from navigation links and recipes
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
  {
    label: t("search.recipes"),
    id: "recipes",
    items: recipeSearchItems.value,
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
        <NuxtLink :to="localePath('index')" class="h-8 flex items-center">
          <Logo class="h-4" v-if="!collapsed" />
          <img src="/favicon.svg" v-else />
        </NuxtLink>
      </template>

      <template #default="{ collapsed }">
        <UDashboardSearchButton
          :collapsed="collapsed"
          :kbds="['ctrl', 'k']"
          class="bg-transparent ring-(--ui-border) w-full"
        />

        <UNavigationMenu :items="links" orientation="vertical" />
      </template>

      <template #footer="{ collapsed }">
        <UserMenu :collapsed="collapsed" />
      </template>
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
      "recipes": "Recipes",
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
      "recipes": "Recettes",
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
      "recipes": "Recetas",
      "placeholder": "Buscar o escribir un comando..."
    },
    "actions": {
      "newRecipe": "Nueva Receta"
    }
  }
}
</i18n>
