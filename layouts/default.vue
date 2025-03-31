<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { ref, computed, onMounted } from 'vue';
import { useRecipe } from '~/composables/useRecipe';
import AddRecipeModal from '~/components/AddRecipeModal.vue';

const localePath = useLocalePath();
const { t } = useI18n();
const searchTerm = ref('');
const open = ref(false);
const overlay = useOverlay();
const { myRecipesState, getMyRecipes } = useRecipe();

// Load recipes when component is mounted
onMounted(async () => {
  await getMyRecipes();
});

// Import AddRecipeModal component

// Define navigation links for sidebar
const links = [
  {
    id: 'add-recipe',
    label: t('navigation.addRecipe'),
    icon: 'i-heroicons-plus-circle',
    onSelect: async () => {
      const modal = overlay.create(AddRecipeModal);
      await modal.open();
    },
  },
  {
    id: 'my-recipes',
    label: t('navigation.myRecipes'),
    icon: 'i-heroicons-document-text',
    to: localePath('my-recipes'),
    onSelect: () => {
      open.value = false;
    },
  },
  {
    id: 'contact',
    label: t('navigation.contact'),
    icon: 'i-heroicons-envelope',
    to: localePath('contact'),
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
    icon: 'i-heroicons-document-text',
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
    label: t('search.navigation'),
    id: 'links',
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
    label: t('search.recipes'),
    id: 'recipes',
    items: recipeSearchItems.value,
  },
]);
</script>

<template>
  <UDashboardGroup>
    <UDashboardSearch
      v-model:search-term="searchTerm"
      v-model:open="open"
      shortcut="ctrl_k"
      :groups="searchGroups"
      :placeholder="t('search.placeholder')"
    />

    <UDashboardSidebar v-model:open="open" collapsible resizable :min-size="20">
      <template #header="{ collapsed }">
        <NuxtLink :to="localePath('index')" class="h-8 flex items-center gap-2">
          <template v-if="!collapsed">
            <img
              src="/assets/images/feedr_icon_cropped.png"
              style="height: 100%; object-fit: contain"
            />
            <span class="text-xl font-bold font-nunito text-primary-400 uppercase">Feedr</span>
          </template>
          <img
            v-else
            src="/assets/images/feedr_icon_cropped.png"
            style="height: 100%; object-fit: contain"
          />
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
      "addRecipe": "Add Recipe",
      "myRecipes": "My Recipes",
      "bookmarks": "Bookmarks",
      "contact": "Contact Us"
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
      "addRecipe": "Ajouter une recette",
      "myRecipes": "Mes Recettes",
      "bookmarks": "Favoris",
      "contact": "Contactez-nous"
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
      "addRecipe": "Añadir receta",
      "myRecipes": "Mis Recetas",
      "bookmarks": "Marcadores",
      "contact": "Contáctenos"
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
