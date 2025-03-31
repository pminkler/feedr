<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRecipe } from '~/composables/useRecipe';
import { useI18n } from 'vue-i18n';
import { useAuth } from '~/composables/useAuth';
import EditTagsModal from '~/components/EditTagsModal.vue';
import AddRecipeModal from '~/components/AddRecipeModal.vue';

// Define type for my recipes
import type { Recipe } from '~/types/models';

const localePath = useLocalePath();
const { t } = useI18n({ useScope: 'local' });
const { getMyRecipes, myRecipesState, isMyRecipesSynced } = useRecipe();
const { currentUser, isLoggedIn } = useAuth();
const overlay = useOverlay();
const filter = ref('');
const selectedTags = ref<string[]>([]);

// Extract unique tags from my recipes.
const uniqueTags = computed(() => {
  const tags = new Set<string>();
  myRecipesState.value.forEach((recipe) => {
    recipe.tags?.forEach((tag) => tags.add(tag.name));
  });
  return Array.from(tags).sort();
});

// Compute filtered recipes based on title match and selected tags.
const filteredRecipes = computed(() => {
  let recipes = myRecipesState.value;
  if (filter.value) {
    recipes = recipes.filter((recipe) => {
      const title = recipe.title;
      return title && title.toLowerCase().includes(filter.value.toLowerCase());
    });
  }

  if (selectedTags.value.length) {
    recipes = recipes.filter((recipe) =>
      selectedTags.value.some((tag) => recipe.tags?.some((recipeTag) => recipeTag.name === tag))
    );
  }
  return recipes;
});
type MyRecipe = Recipe;

// Function to format date
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString();
};

// Clear all filters function
const clearFilters = () => {
  filter.value = '';
  selectedTags.value = [];
};

// Add tag to filter (without replacing existing tags)
const addTagToFilter = (tagName: string) => {
  if (!selectedTags.value.includes(tagName)) {
    selectedTags.value = [...selectedTags.value, tagName];
  }
};

// Open edit tags modal for a specific recipe
const openEditTagsModal = async (recipeId: string) => {
  const modal = overlay.create(EditTagsModal, {
    props: {
      recipeId: recipeId,
    },
    events: {
      success: () => {
        // Refresh recipes after tags are edited to ensure UI is up-to-date
        getMyRecipes();
      },
    },
  });

  await modal.open();
};

// Open add recipe modal
const openAddRecipeModal = async () => {
  const modal = overlay.create(AddRecipeModal);
  await modal.open();
};

onMounted(async () => {
  try {
    await getMyRecipes();
  } catch (error) {
    console.error('Error loading my recipes:', error);
  }
});

// Default layout is used

// SEO optimization for My Recipes page
useSeoMeta({
  title: 'My Recipes | Feedr',
  ogTitle: 'My Recipe Collection | Feedr',
  description:
    'View and manage your saved recipes collection. Filter by tags, search by title, and organize your favorite recipes.',
  ogDescription:
    'Access your personal recipe collection - filter, search, and manage your favorite recipes all in one place.',
  robots: 'noindex, follow', // Don't index user-specific pages
});
</script>

<template>
  <UDashboardPanel id="my-recipes">
    <template #header>
      <UDashboardNavbar title="My Recipes" icon="i-heroicons-document-text">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar
        :ui="{
          base: 'p-4',
          content: 'flex md:flex-row flex-col gap-4 w-full py-4 md:py-0',
        }"
      >
        <!-- Main flex column container -->
        <div class="w-full flex flex-col gap-4 py-2">
          <!-- Filters row -->
          <div class="w-full flex flex-wrap md:flex-nowrap items-center gap-2">
            <!-- Title filter input -->
            <div class="w-full md:flex-1">
              <UInput
                v-model="filter"
                :placeholder="t('myRecipes.filterPlaceholder')"
                icon="i-heroicons-magnifying-glass"
                class="w-full"
              />
            </div>

            <!-- Tags filter -->
            <div class="w-full md:w-auto">
              <USelectMenu
                v-model="selectedTags"
                :items="uniqueTags"
                :placeholder="t('myRecipes.selectTags')"
                multiple
                :icon="selectedTags.length ? 'i-heroicons-tag-solid' : 'i-heroicons-tag'"
                class="w-full md:w-auto min-w-[180px]"
              />
            </div>

            <!-- Clear filters button -->
            <div v-if="filter || selectedTags.length" class="shrink-0">
              <UTooltip :text="t('myRecipes.clearFilters')">
                <UButton
                  color="neutral"
                  variant="ghost"
                  icon="i-heroicons-x-circle"
                  size="sm"
                  :ui="{ rounded: 'rounded-full' }"
                  @click="clearFilters"
                />
              </UTooltip>
            </div>
          </div>
        </div>
      </UDashboardToolbar>
    </template>

    <template #body>
      <template v-if="!isMyRecipesSynced">
        <div class="mt-4 w-full">
          <UPageColumns
            :ui="{
              grid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-fr',
            }"
          >
            <!-- Generate 10 recipe card skeletons -->
            <UPageCard v-for="i in 10" :key="i" variant="subtle" class="h-full flex flex-col">
              <!-- Title skeleton -->
              <div class="flex items-center mb-1">
                <USkeleton class="h-5 w-3/4" />
              </div>

              <!-- Footer skeleton at the bottom -->
              <div class="mt-auto pt-1 space-y-1">
                <!-- Metadata skeleton -->
                <div class="flex items-center">
                  <div class="flex space-x-2">
                    <USkeleton class="h-3 w-10" />
                    <USkeleton class="h-3 w-12" />
                    <USkeleton class="h-3 w-10" />
                  </div>
                </div>

                <!-- Tags skeleton -->
                <div class="flex flex-wrap gap-1">
                  <USkeleton v-for="j in 3" :key="j" class="h-3 w-10 rounded-full" />
                </div>
              </div>
            </UPageCard>
          </UPageColumns>
        </div>
      </template>
      <!-- Loaded state -->
      <template v-else>
        <!-- No recipes at all -->
        <div v-if="myRecipesState.length === 0" class="w-full flex justify-center">
          <UAlert
            class="w-full md:w-1/2"
            icon="material-symbols:info"
            color="warning"
            variant="solid"
            :title="t('myRecipes.noRecipesTitle')"
            :description="t('myRecipes.noRecipesDescription')"
            :actions="[
              {
                label: t('myRecipes.addRecipe'),
                color: 'neutral',
                variant: 'solid',
                onClick: () => openAddRecipeModal(),
              },
            ]"
          />
        </div>
        <!-- No filtered recipes but have saved recipes -->
        <div v-else-if="filteredRecipes.length === 0" class="w-full flex justify-center">
          <UAlert
            class="w-full md:w-1/2"
            icon="material-symbols:search-off"
            color="info"
            variant="soft"
            :title="t('myRecipes.filterNoResultsTitle')"
            :description="t('myRecipes.filterNoResultsDescription')"
          />
        </div>
        <!-- Show bookmarked recipes in responsive cards layout -->
        <div v-else>
          <UPageColumns
            :ui="{
              grid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-fr',
            }"
          >
            <div v-for="recipe in filteredRecipes" :key="recipe.id" class="relative">
              <NuxtLink :to="localePath(`/recipes/${recipe.id}`)" class="absolute inset-0 z-5" />
              <UPageCard
                :title="recipe.title || t('myRecipes.untitledRecipe')"
                variant="subtle"
                class="h-full"
              >
                <template #title>
                  <div class="relative z-10 pointer-events-none">
                    <div class="font-semibold text-base line-clamp-1">
                      {{ recipe.title || t('myRecipes.untitledRecipe') }}
                    </div>

                    <!-- Recipe metadata -->
                    <div class="flex flex-wrap gap-2 text-xs text-gray-600 dark:text-gray-400 mt-1">
                      <div class="flex items-center">
                        <UIcon name="i-heroicons-calendar" class="mr-1 size-3" />
                        {{ formatDate(recipe.createdAt) }}
                      </div>

                      <div v-if="recipe.prep_time" class="flex items-center">
                        <UIcon name="i-heroicons-clock" class="mr-1 size-3" />
                        {{ recipe.prep_time }}
                      </div>

                      <div v-if="recipe.cook_time" class="flex items-center">
                        <UIcon name="i-heroicons-fire" class="mr-1 size-3" />
                        {{ recipe.cook_time }}
                      </div>
                    </div>
                  </div>
                </template>

                <template #description>
                  <!-- Tags section -->
                  <div class="flex flex-wrap gap-1.5 mt-2">
                    <UBadge
                      v-for="tag in recipe.tags"
                      :key="tag.name"
                      color="primary"
                      variant="outline"
                      class="pointer-events-auto relative z-20"
                      :label="tag.name"
                      @click.prevent.stop="addTagToFilter(tag.name)"
                    />
                  </div>
                </template>

                <template #footer>
                  <div class="flex justify-end mt-auto pt-1 relative">
                    <UButton
                      color="neutral"
                      variant="subtle"
                      class="pointer-events-auto relative z-20"
                      @click.prevent.stop="openEditTagsModal(recipe.id)"
                    >
                      {{ t('myRecipes.editTags') }}
                    </UButton>
                  </div>
                </template>
              </UPageCard>
            </div>
          </UPageColumns>
        </div>
      </template>
    </template>
  </UDashboardPanel>
</template>

<style scoped>
/* Ensure the tag badges can be clicked */
:deep(.UBadge),
:deep(.UButton) {
  position: relative;
  z-index: 20;
}

/* Fix z-index for interactive elements */
.pointer-events-auto {
  position: relative;
  z-index: 20;
}
</style>

<i18n lang="json">
{
  "en": {
    "myRecipes": {
      "addTags": "Add Tags",
      "savedOn": "Saved on",
      "noRecipesTitle": "No Recipes Found",
      "noRecipesDescription": "You don't have any recipes yet. Add one now!",
      "addRecipe": "Add Recipe",
      "view": "View",
      "filterPlaceholder": "Filter by title...",
      "filterNoResultsTitle": "No recipes match your filter",
      "filterNoResultsDescription": "Try adjusting your filter to find a recipe.",
      "selectTags": "Filter by tags",
      "tagSelected": "tag selected",
      "tagsSelected": "tags selected",
      "filterByTags": "Filter recipes by tags",
      "clearFilters": "Clear all filters",
      "selectRecipe": "Select recipe",
      "recipeSelected": "recipe selected",
      "recipesSelected": "recipes selected",
      "selectAll": "Select all",
      "deselectAll": "Deselect all",
      "title": "Title",
      "tags": "Tags",
      "actions": "Actions",
      "untitledRecipe": "Untitled Recipe",
      "prepTime": "Prep",
      "cookTime": "Cook",
      "editTags": "Edit Tags"
    }
  },
  "fr": {
    "myRecipes": {
      "addTags": "Ajouter des étiquettes",
      "savedOn": "Enregistré le",
      "noRecipesTitle": "Aucune recette trouvée",
      "noRecipesDescription": "Vous n'avez pas encore de recettes. Ajoutez-en une maintenant !",
      "addRecipe": "Ajouter une recette",
      "view": "Voir",
      "filterPlaceholder": "Filtrer par titre...",
      "filterNoResultsTitle": "Aucune recette ne correspond à votre filtre",
      "filterNoResultsDescription": "Essayez de modifier votre filtre pour trouver une recette.",
      "selectTags": "Filtrer par étiquettes",
      "tagSelected": "étiquette sélectionnée",
      "tagsSelected": "étiquettes sélectionnées",
      "filterByTags": "Filtrer les recettes par étiquettes",
      "clearFilters": "Effacer tous les filtres",
      "selectRecipe": "Sélectionner la recette",
      "recipeSelected": "recette sélectionnée",
      "recipesSelected": "recettes sélectionnées",
      "selectAll": "Tout sélectionner",
      "deselectAll": "Tout désélectionner",
      "title": "Titre",
      "tags": "Étiquettes",
      "actions": "Actions",
      "untitledRecipe": "Recette sans titre",
      "prepTime": "Préparation",
      "cookTime": "Cuisson",
      "editTags": "Modifier les étiquettes"
    }
  },
  "es": {
    "myRecipes": {
      "addTags": "Añadir etiquetas",
      "savedOn": "Guardado el",
      "noRecipesTitle": "No se encontraron recetas",
      "noRecipesDescription": "Aún no tienes recetas. ¡Añade una ahora!",
      "addRecipe": "Añadir receta",
      "view": "Ver",
      "filterPlaceholder": "Filtrar por título...",
      "filterNoResultsTitle": "No hay recetas que coincidan con tu filtro",
      "filterNoResultsDescription": "Intenta ajustar tu filtro para encontrar una receta.",
      "selectTags": "Filtrar por etiquetas",
      "tagSelected": "etiqueta seleccionada",
      "tagsSelected": "etiquetas seleccionadas",
      "filterByTags": "Filtrar recetas por etiquetas",
      "clearFilters": "Borrar todos los filtros",
      "selectRecipe": "Seleccionar receta",
      "recipeSelected": "receta seleccionada",
      "recipesSelected": "recetas seleccionadas",
      "selectAll": "Seleccionar todo",
      "deselectAll": "Deseleccionar todo",
      "title": "Título",
      "tags": "Etiquetas",
      "actions": "Acciones",
      "untitledRecipe": "Receta sin título",
      "prepTime": "Preparación",
      "cookTime": "Cocción",
      "editTags": "Editar etiquetas"
    }
  }
}
</i18n>
