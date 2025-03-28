<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRecipe } from "~/composables/useRecipe";
import { useI18n } from "vue-i18n";
import { useAuth } from "~/composables/useAuth";
import AddTagsModal from "~/components/AddTagsModal.vue";

const localePath = useLocalePath();
const { t } = useI18n({ useScope: "local" });
const { getMyRecipes, myRecipesState } = useRecipe();
const { currentUser, isLoggedIn } = useAuth();
const overlay = useOverlay();

const loading = ref(true);
const filter = ref("");
const selectedTags = ref<string[]>([]);

// Store for row selection state - in TanStack Table v8 this is an object of row ids
const selectedRecipeMap = ref<Record<string, boolean>>({});

// Computed property to get the actual recipe IDs from selection state
const selectedRecipeIds = computed(() => {
  // Filter to only include keys where the value is true
  return Object.entries(selectedRecipeMap.value)
    .filter(([_, isSelected]) => isSelected === true)
    .map(([id, _]) => id);
});

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
      selectedTags.value.some((tag) =>
        recipe.tags?.some((recipeTag) => recipeTag.name === tag),
      ),
    );
  }
  return recipes;
});

// Define type for my recipes
import type { Recipe } from "~/types/models";
type MyRecipe = Recipe;

// Computed property to check if all recipes are selected
const areAllSelected = computed(() => {
  if (filteredRecipes.value.length === 0) return false;
  return filteredRecipes.value.every(
    (recipe) => !!selectedRecipeMap.value[recipe.id],
  );
});

// Toggle all recipes selection
const toggleSelectAll = () => {
  const shouldSelect = !areAllSelected.value;

  // Loop through all filtered recipes and explicitly set their selection state
  filteredRecipes.value.forEach((recipe) => {
    // Using Vue.set pattern to ensure reactivity when setting to false
    if (shouldSelect) {
      selectedRecipeMap.value[recipe.id] = true;
    } else {
      // When deselecting, we need to delete the key or set to explicitly false
      // to ensure our computed property recognizes the change
      selectedRecipeMap.value[recipe.id] = false;
    }
  });
};

const openTagsModal = async () => {
  const modal = overlay.create(AddTagsModal, {
    props: {
      recipeIds: selectedRecipeIds.value,
    },
  });

  await modal.open();
};

// Function to format date
const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString();
};

// Clear all filters function
const clearFilters = () => {
  filter.value = "";
  selectedTags.value = [];
};

// Add tag to filter (without replacing existing tags)
const addTagToFilter = (tagName: string) => {
  if (!selectedTags.value.includes(tagName)) {
    selectedTags.value = [...selectedTags.value, tagName];
  }
};

// Helper function for high contrast text based on YIQ algorithm
function getContrastYIQ(colorHex: string | undefined): string {
  if (!colorHex) return "#ffffff";

  // Convert hex to RGB
  const r = parseInt(colorHex.substring(0, 2), 16);
  const g = parseInt(colorHex.substring(2, 4), 16);
  const b = parseInt(colorHex.substring(4, 6), 16);

  // Calculate YIQ contrast value to determine if color is light or dark
  // Using YIQ gives better perceptual results for text contrast
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;

  // Return black or white based on YIQ value
  return yiq >= 128 ? "#000000" : "#ffffff";
}

onMounted(async () => {
  loading.value = true;
  try {
    await getMyRecipes();
  } catch (error) {
    console.error("Error loading my recipes:", error);
  } finally {
    loading.value = false;
  }
});

// Default layout is used

// SEO optimization for My Recipes page
useSeoMeta({
  title: "My Recipes | Feedr",
  ogTitle: "My Recipe Collection | Feedr",
  description:
    "View and manage your saved recipes collection. Filter by tags, search by title, and organize your favorite recipes.",
  ogDescription:
    "Access your personal recipe collection - filter, search, and manage your favorite recipes all in one place.",
  robots: "noindex, follow", // Don't index user-specific pages
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
          <!-- First row: filters and select/deselect all -->
          <div class="w-full flex flex-wrap md:flex-nowrap items-center gap-2">
            <!-- Title filter input -->
            <div class="w-full md:flex-1">
              <UInput
                v-model="filter"
                :placeholder="t('myRecipes.filterPlaceholder')"
                icon="i-heroicons-magnifying-glass"
                size="sm"
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
                size="sm"
                :icon="
                  selectedTags.length
                    ? 'i-heroicons-tag-solid'
                    : 'i-heroicons-tag'
                "
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
                  @click="clearFilters"
                  :ui="{ rounded: 'rounded-full' }"
                />
              </UTooltip>
            </div>

            <!-- Select All button -->
            <div v-if="filteredRecipes.length > 0" class="shrink-0 ml-auto">
              <UButton
                color="neutral"
                variant="ghost"
                icon="i-heroicons-check-circle"
                size="sm"
                @click="toggleSelectAll"
                class="whitespace-nowrap"
              >
                {{
                  areAllSelected
                    ? t("myRecipes.deselectAll")
                    : t("myRecipes.selectAll")
                }}
              </UButton>
            </div>
          </div>

          <!-- Second row: action buttons for selected recipes -->
          <div
            v-if="selectedRecipeIds.length > 0"
            class="w-full flex flex-wrap gap-2"
          >
            <UButton
              color="primary"
              icon="i-heroicons-tag"
              size="sm"
              @click="openTagsModal"
              class="whitespace-nowrap"
            >
              {{ t("myRecipes.addTags") }}
              <span class="ml-1 text-xs font-normal">
                ({{ selectedRecipeIds.length }}
                {{
                  selectedRecipeIds.length === 1
                    ? t("myRecipes.recipeSelected")
                    : t("myRecipes.recipesSelected")
                }})
              </span>
            </UButton>

            <!-- Space for additional action buttons in the future -->
          </div>
        </div>
      </UDashboardToolbar>
    </template>

    <template #body>
      <template v-if="loading">
        <div class="mt-4 w-full">
          <UPageColumns
            :ui="{
              grid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-fr',
            }"
          >
            <!-- Generate 10 recipe card skeletons -->
            <UPageCard
              v-for="i in 10"
              :key="i"
              variant="subtle"
              class="h-full flex flex-col"
            >
              <!-- Title skeleton -->
              <div class="flex items-center justify-between mb-1">
                <USkeleton class="h-5 w-3/4" />
                <!-- Checkbox placeholder -->
                <div class="h-4 w-4 opacity-20 rounded-sm"></div>
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
                  <USkeleton
                    v-for="j in 3"
                    :key="j"
                    class="h-3 w-10 rounded-full"
                  />
                </div>
              </div>
            </UPageCard>
          </UPageColumns>
        </div>
      </template>
      <!-- Loaded state -->
      <template v-else>
        <!-- No recipes at all -->
        <div
          class="w-full flex justify-center"
          v-if="myRecipesState.length === 0"
        >
          <UAlert
            class="w-full md:w-1/2"
            icon="material-symbols:info"
            color="warning"
            variant="solid"
            :title="t('myRecipes.noRecipesTitle')"
            :description="t('myRecipes.noRecipesDescription')"
            :actions="[
              {
                label: t('myRecipes.goHome'),
                to: localePath('/'),
                color: 'neutral',
                variant: 'solid',
              },
            ]"
          />
        </div>
        <!-- No filtered recipes but have saved recipes -->
        <div
          class="w-full flex justify-center"
          v-else-if="filteredRecipes.length === 0"
        >
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
              grid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-fr'
            }">
            <UPageCard
              v-for="recipe in filteredRecipes"
              :key="recipe.id"
              :title="recipe.title || t('myRecipes.untitledRecipe')"
              variant="subtle"
              :to="localePath(`/recipes/${recipe.id}`)"
              spotlight
              spotlight-color="primary"
              :highlight="!!selectedRecipeMap[recipe.id]"
              highlight-color="primary"
              class="group transition duration-200 flex flex-col overflow-hidden relative h-full cursor-pointer"
              :ui="{
                base: 'relative h-full',
                container: 'h-full',
                body: { base: 'relative h-full flex flex-col z-10' }
              }"
            >
              <template #default>
                <!-- Selection checkbox -->
                <div class="absolute top-2 right-2 z-50">
                  <div @click.prevent.stop class="cursor-pointer">
                    <UCheckbox
                      :model-value="!!selectedRecipeMap[recipe.id]"
                      @update:model-value="
                        (value) => {
                          if (value) {
                            selectedRecipeMap[recipe.id] = true;
                          } else {
                            selectedRecipeMap[recipe.id] = false;
                          }
                        }
                      "
                      :aria-label="t('myRecipes.selectRecipe')"
                      :ui="{
                        wrapper: 'relative inline-flex items-center space-x-2',
                        container: 'h-5 w-5 shrink-0',
                        base: 'h-5 w-5 rounded-sm backdrop-blur-sm border border-primary-600 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50',
                        checked: {
                          background: 'bg-primary-600',
                          border: 'border-primary-600',
                        },
                        unchecked: {
                          background: 'bg-transparent',
                          border: 'border-primary-400 dark:border-primary-500',
                        },
                      }"
                    />
                  </div>
                </div>
              </template>

              <template #title>
                <div class="font-semibold text-base relative z-10 line-clamp-1 pointer-events-none">
                  {{ recipe.title || t("myRecipes.untitledRecipe") }}
                </div>
              </template>

              <template #footer>
                <div class="flex flex-col gap-1 mt-auto pt-1 relative z-10 pointer-events-none">
                  <!-- Recipe metadata -->
                  <div
                    class="flex flex-wrap gap-2 text-xs text-gray-600 dark:text-gray-400 pointer-events-none"
                  >
                    <div class="flex items-center pointer-events-none">
                      <UIcon name="i-heroicons-calendar" class="mr-1 size-3" />
                      {{ formatDate(recipe.createdAt) }}
                    </div>

                    <div v-if="recipe.prep_time" class="flex items-center pointer-events-none">
                      <UIcon name="i-heroicons-clock" class="mr-1 size-3" />
                      {{ recipe.prep_time }}
                    </div>

                    <div v-if="recipe.cook_time" class="flex items-center pointer-events-none">
                      <UIcon name="i-heroicons-fire" class="mr-1 size-3" />
                      {{ recipe.cook_time }}
                    </div>
                  </div>

                  <!-- Tags section -->
                  <div
                    v-if="recipe.tags && recipe.tags.length"
                    class="flex flex-wrap gap-1 pointer-events-none"
                  >
                    <UBadge
                      v-for="tag in recipe.tags"
                      :key="tag.name"
                      color="primary"
                      variant="solid"
                      size="xs"
                      class="cursor-pointer text-2xs font-medium shadow-sm py-0.5 px-1.5 pointer-events-auto"
                      :style="{
                        backgroundColor: `#${tag.color || '666666'}`,
                        color: getContrastYIQ(tag.color),
                      }"
                      @click.prevent.stop="addTagToFilter(tag.name)"
                    >
                      {{ tag.name }}
                    </UBadge>
                  </div>
                </div>
              </template>
            </UPageCard>
          </UPageColumns>
        </div>
      </template>
    </template>
  </UDashboardPanel>
</template>

<style scoped>
/* Make cards fully clickable by adding a pseudo-element on top */
.group::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 5;
}
</style>

<i18n lang="json">
{
  "en": {
    "myRecipes": {
      "addTags": "Add Tags",
      "savedOn": "Saved on",
      "noRecipesTitle": "No Recipes Found",
      "noRecipesDescription": "You don't have any recipes yet. Go back home and generate one.",
      "goHome": "Go Home",
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
      "cookTime": "Cook"
    }
  },
  "fr": {
    "myRecipes": {
      "addTags": "Ajouter des étiquettes",
      "savedOn": "Enregistré le",
      "noRecipesTitle": "Aucune recette trouvée",
      "noRecipesDescription": "Vous n'avez pas encore de recettes. Retournez à l'accueil pour en générer une.",
      "goHome": "Accueil",
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
      "cookTime": "Cuisson"
    }
  },
  "es": {
    "myRecipes": {
      "addTags": "Añadir etiquetas",
      "savedOn": "Guardado el",
      "noRecipesTitle": "No se encontraron recetas",
      "noRecipesDescription": "Aún no tienes recetas. Vuelve a la página principal para generar una.",
      "goHome": "Inicio",
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
      "cookTime": "Cocción"
    }
  }
}
</i18n>
