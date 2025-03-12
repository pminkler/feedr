<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRecipe } from "~/composables/useRecipe";
import { useLocalePath } from "#imports";
import { useI18n } from "vue-i18n";
import AddTagsModal from "~/components/AddTagsModal.vue";

const localePath = useLocalePath();
const { t } = useI18n({ useScope: "local" });
const { getSavedRecipes, savedRecipesState } = useRecipe();
const overlay = useOverlay();

const loading = ref(true);
const filter = ref("");
const selectedTags = ref<string[]>([]);

// Store for row selection state - in TanStack Table v8 this is an object of row ids
const selectedSavedRecipeIds = ref<Record<string, boolean>>({});

// Computed property to get the actual recipe IDs from selection state
const selectedRecipeIds = computed(() => {
  // Filter to only include keys where the value is true
  return Object.entries(selectedSavedRecipeIds.value)
    .filter(([_, isSelected]) => isSelected === true)
    .map(([id, _]) => id);
});

// Extract unique tags from saved recipes.
const uniqueTags = computed(() => {
  const tags = new Set<string>();
  savedRecipesState.value.forEach((recipe) => {
    recipe.tags?.forEach((tag) => tags.add(tag.name));
  });
  return Array.from(tags).sort();
});

// Compute filtered recipes based on title match and selected tags.
const filteredRecipes = computed(() => {
  let recipes = savedRecipesState.value;
  if (filter.value) {
    recipes = recipes.filter((recipe) => {
      const title = recipe.recipe?.title;
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

// Define type for bookmarked recipes
type BookmarkedRecipe = {
  id: string;
  recipeId: string;
  createdAt: string;
  recipe?: {
    title?: string;
    [key: string]: any;
  };
  tags?: Array<{
    name: string;
    [key: string]: any;
  }>;
  [key: string]: any;
};

// Computed property to check if all recipes are selected
const areAllSelected = computed(() => {
  if (filteredRecipes.value.length === 0) return false;
  return filteredRecipes.value.every(
    (recipe) => !!selectedSavedRecipeIds.value[recipe.id],
  );
});

// Toggle all recipes selection
const toggleSelectAll = () => {
  const shouldSelect = !areAllSelected.value;

  // Loop through all filtered recipes and explicitly set their selection state
  filteredRecipes.value.forEach((recipe) => {
    // Using Vue.set pattern to ensure reactivity when setting to false
    if (shouldSelect) {
      selectedSavedRecipeIds.value[recipe.id] = true;
    } else {
      // When deselecting, we need to delete the key or set to explicitly false
      // to ensure our computed property recognizes the change
      selectedSavedRecipeIds.value[recipe.id] = false;
    }
  });
};

const openTagsModal = async () => {
  const modal = overlay.create(AddTagsModal, {
    props: {
      savedRecipeIds: selectedRecipeIds.value,
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

// Function to get a food-related heroicon based on recipe content
const getRecipeIcon = (recipe: BookmarkedRecipe) => {
  // List of food-related heroicons
  const foodIcons = [
    "i-heroicons-cake",
    "i-heroicons-fire",
    "i-heroicons-beaker",
    "i-heroicons-heart",
    "i-heroicons-sun",
    "i-heroicons-shopping-cart",
    "i-heroicons-gift",
    "i-heroicons-light-bulb",
    "i-heroicons-sparkles",
  ];

  // Try to determine an appropriate icon based on recipe title or content
  const title = recipe.recipe?.title?.toLowerCase() || "";
  const description = recipe.recipe?.description?.toLowerCase() || "";

  if (
    title.includes("cake") ||
    title.includes("dessert") ||
    title.includes("cookie") ||
    title.includes("pie") ||
    title.includes("sweet") ||
    description.includes("dessert")
  ) {
    return "i-heroicons-cake";
  } else if (
    title.includes("grill") ||
    title.includes("bbq") ||
    title.includes("roast") ||
    description.includes("grill") ||
    description.includes("roast")
  ) {
    return "i-heroicons-fire";
  } else if (
    title.includes("soup") ||
    title.includes("stew") ||
    title.includes("mix") ||
    description.includes("soup") ||
    description.includes("mix")
  ) {
    return "i-heroicons-beaker";
  } else if (
    title.includes("healthy") ||
    title.includes("vegan") ||
    title.includes("salad") ||
    description.includes("healthy") ||
    description.includes("vegan")
  ) {
    return "i-heroicons-heart";
  } else if (
    title.includes("breakfast") ||
    title.includes("morning") ||
    title.includes("brunch") ||
    description.includes("breakfast") ||
    description.includes("morning")
  ) {
    return "i-heroicons-sun";
  } else if (
    title.includes("bread") ||
    title.includes("sandwich") ||
    title.includes("wrap") ||
    description.includes("bread") ||
    description.includes("sandwich")
  ) {
    return "i-heroicons-scissors";
  } else if (
    title.includes("special") ||
    title.includes("holiday") ||
    title.includes("celebration") ||
    description.includes("special") ||
    description.includes("holiday")
  ) {
    return "i-heroicons-gift";
  } else if (
    title.includes("quick") ||
    title.includes("easy") ||
    title.includes("simple") ||
    description.includes("quick") ||
    description.includes("easy")
  ) {
    return "i-heroicons-light-bulb";
  } else if (
    title.includes("fancy") ||
    title.includes("gourmet") ||
    title.includes("premium") ||
    description.includes("fancy") ||
    description.includes("gourmet")
  ) {
    return "i-heroicons-sparkles";
  }

  // If no specific match, use a consistent fallback based on recipe ID
  // This ensures the same recipe always shows the same icon
  const recipeIdSum = recipe.id
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return foodIcons[recipeIdSum % foodIcons.length];
};

onMounted(async () => {
  loading.value = true;
  try {
    await getSavedRecipes();
    console.log("Saved Recipes:", savedRecipesState.value);
    if (savedRecipesState.value.length > 0) {
      console.log("First Recipe:", savedRecipesState.value[0]);
    }
  } catch (error) {
    console.error("Error loading saved recipes:", error);
  } finally {
    loading.value = false;
  }
});

definePageMeta({
  middleware: "auth",
  layout: "dashboard",
});
</script>

<template>
  <UDashboardPanel id="bookmarks">
    <template #header>
      <UDashboardNavbar title="Bookmarked Recipes" icon="i-heroicons-bookmark">
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
        <!-- Responsive layout: column on mobile, row on desktop -->
        <div
          class="w-full flex md:flex-row flex-col gap-4 items-center py-2 md:py-0"
        >
          <!-- Filter input (adjusts to fit on desktop) -->
          <UInput
            v-model="filter"
            :placeholder="t('bookmarkedRecipes.filterPlaceholder')"
            icon="i-heroicons-magnifying-glass"
            trailing
            size="sm"
            class="w-full md:w-auto md:min-w-[240px]"
          />

          <!-- Tag selector and action buttons in a row on desktop -->
          <div
            class="w-full md:w-auto flex flex-wrap gap-2 items-center md:ml-auto"
          >
            <!-- Tags selector -->
            <USelectMenu
              v-if="uniqueTags.length > 0"
              v-model="selectedTags"
              :placeholder="t('bookmarkedRecipes.selectTags')"
              :options="uniqueTags"
              multiple
              size="sm"
              class="flex-grow min-w-[200px] md:min-w-[180px]"
            />

            <!-- Button group -->
            <div
              v-if="filteredRecipes.length > 0"
              class="flex flex-grow md:flex-grow-0 ml-auto"
            >
              <UButtonGroup size="sm" class="flex w-full">
                <UButton
                  color="neutral"
                  variant="ghost"
                  icon="i-heroicons-check-circle"
                  @click="toggleSelectAll"
                  class="flex-1 whitespace-nowrap"
                >
                  {{
                    areAllSelected
                      ? t("bookmarkedRecipes.deselectAll")
                      : t("bookmarkedRecipes.selectAll")
                  }}
                </UButton>

                <UButton
                  v-if="selectedRecipeIds.length > 0"
                  color="primary"
                  icon="i-heroicons-tag"
                  @click="openTagsModal"
                  class="flex-1 whitespace-nowrap"
                >
                  {{ t("bookmarkedRecipes.addTags") }}
                </UButton>
              </UButtonGroup>
            </div>
          </div>
        </div>
      </UDashboardToolbar>
    </template>

    <template #body>
      <template v-if="loading">
        <div class="mt-4 w-full">
          <USkeleton class="h-80 w-full" />
        </div>
      </template>
      <!-- Loaded state -->
      <template v-else>
        <!-- No bookmarked recipes at all -->
        <div
          class="w-full flex justify-center"
          v-if="savedRecipesState.length === 0"
        >
          <UAlert
            class="w-full md:w-1/2"
            icon="material-symbols:info"
            color="warning"
            variant="solid"
            :title="t('bookmarkedRecipes.noRecipesTitle')"
            :description="t('bookmarkedRecipes.noRecipesDescription')"
            :actions="[
              {
                label: t('bookmarkedRecipes.goHome'),
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
            :title="t('bookmarkedRecipes.filterNoResultsTitle')"
            :description="t('bookmarkedRecipes.filterNoResultsDescription')"
          />
        </div>
        <!-- Show bookmarked recipes in responsive cards layout -->
        <div v-else>
          <UPageColumns>
            <UPageCard
              v-for="recipe in filteredRecipes"
              :key="recipe.id"
              :title="
                recipe.recipe?.title || t('bookmarkedRecipes.untitledRecipe')
              "
              :description="recipe.recipe?.description || ''"
              variant="subtle"
              :to="localePath(`/recipes/${recipe.recipeId}`)"
              spotlight
              spotlight-color="primary"
              :highlight="!!selectedSavedRecipeIds[recipe.id]"
              highlight-color="primary"
              class="group transition duration-200 h-full overflow-hidden relative"
              :style="
                recipe.recipe?.imageUrl
                  ? {
                      backgroundImage: `linear-gradient(to bottom, var(--card-bg-from, rgba(255,255,255,0.95)) 0%, var(--card-bg-to, rgba(255,255,255,0.98)) 100%), url(${recipe.recipe.imageUrl})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }
                  : {}
              "
              :class="{
                'dark:[--card-bg-from:rgba(30,30,30,0.95)] dark:[--card-bg-to:rgba(30,30,30,0.98)]':
                  !!recipe.recipe?.imageUrl,
              }"
            >
              <template #default>
                <!-- Background icon if no image -->
                <div
                  v-if="!recipe.recipe?.imageUrl"
                  class="absolute inset-0 z-0 opacity-10 pointer-events-none flex items-center justify-center"
                >
                  <UIcon
                    :name="getRecipeIcon(recipe)"
                    class="text-primary-400 dark:text-primary-300 size-40 transform -rotate-12"
                  />
                </div>

                <!-- Selection checkbox -->
                <div class="absolute top-2 right-2 z-30">
                  <div
                    class="bg-white/90 dark:bg-gray-800/90 shadow-md rounded-full p-0.5"
                    @click.prevent.stop
                  >
                    <UCheckbox
                      :model-value="!!selectedSavedRecipeIds[recipe.id]"
                      @update:model-value="
                        (value) => {
                          if (value) {
                            selectedSavedRecipeIds[recipe.id] = true;
                          } else {
                            selectedSavedRecipeIds[recipe.id] = false;
                          }
                        }
                      "
                      :aria-label="t('bookmarkedRecipes.selectRecipe')"
                    />
                  </div>
                </div>
              </template>

              <template #header>
                <div class="flex flex-wrap gap-1 mb-2 relative z-20">
                  <UBadge
                    v-for="tag in recipe.tags"
                    :key="tag.name"
                    color="primary"
                    variant="subtle"
                    size="xs"
                    class="cursor-pointer"
                    @click.prevent.stop="selectedTags = [tag.name]"
                  >
                    {{ tag.name }}
                  </UBadge>
                </div>
              </template>

              <template #title>
                <div class="font-semibold text-base relative z-20">
                  {{
                    recipe.recipe?.title ||
                    t("bookmarkedRecipes.untitledRecipe")
                  }}
                </div>
              </template>

              <template #description>
                <div class="relative z-20">
                  <p
                    class="text-sm text-gray-700 dark:text-gray-300 line-clamp-2"
                  >
                    {{ recipe.recipe?.description || "" }}
                  </p>
                </div>
              </template>

              <template #footer>
                <div
                  class="flex flex-wrap justify-between items-center gap-2 mt-2 pt-2 border-t border-gray-200/50 dark:border-gray-700/50 relative z-20"
                >
                  <!-- Recipe metadata -->
                  <div
                    class="flex flex-wrap gap-3 text-xs text-gray-600 dark:text-gray-400"
                  >
                    <div class="flex items-center">
                      <UIcon
                        name="i-heroicons-calendar"
                        class="mr-1 size-3.5"
                      />
                      {{ formatDate(recipe.createdAt) }}
                    </div>

                    <div
                      v-if="recipe.recipe?.prep_time"
                      class="flex items-center"
                    >
                      <UIcon name="i-heroicons-clock" class="mr-1 size-3.5" />
                      {{ t("bookmarkedRecipes.prepTime") }}:
                      {{ recipe.recipe.prep_time }}
                    </div>

                    <div
                      v-if="recipe.recipe?.cook_time"
                      class="flex items-center"
                    >
                      <UIcon name="i-heroicons-fire" class="mr-1 size-3.5" />
                      {{ t("bookmarkedRecipes.cookTime") }}:
                      {{ recipe.recipe.cook_time }}
                    </div>
                  </div>

                  <!-- Action button -->
                  <UButton
                    color="primary"
                    variant="solid"
                    icon="i-heroicons-arrow-right"
                    size="xs"
                    :to="localePath(`/recipes/${recipe.recipeId}`)"
                    @click.stop
                    class="shrink-0"
                  />
                </div>
              </template>
            </UPageCard>
          </UPageColumns>
        </div>
      </template>
    </template>
  </UDashboardPanel>
</template>

<style module scoped>
/* Additional styling can be added here if needed */
</style>

<i18n lang="json">
{
  "en": {
    "bookmarkedRecipes": {
      "addTags": "Add Tags",
      "bookmarkedOn": "Bookmarked on",
      "noRecipesTitle": "No Bookmarked Recipes",
      "noRecipesDescription": "You haven't bookmarked any recipes yet. Go back home and generate one.",
      "goHome": "Go Home",
      "view": "View",
      "filterPlaceholder": "Filter by title...",
      "filterNoResultsTitle": "No recipes match your filter",
      "filterNoResultsDescription": "Try adjusting your filter to find a bookmarked recipe.",
      "selectTags": "Select tags",
      "selectRecipe": "Select recipe",
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
    "bookmarkedRecipes": {
      "addTags": "Ajouter des étiquettes",
      "bookmarkedOn": "Enregistré le",
      "noRecipesTitle": "Aucune recette en favori",
      "noRecipesDescription": "Vous n'avez pas encore marqué de recettes en favori. Retournez à l'accueil pour en générer une.",
      "goHome": "Accueil",
      "view": "Voir",
      "filterPlaceholder": "Filtrer par titre...",
      "filterNoResultsTitle": "Aucune recette ne correspond à votre filtre",
      "filterNoResultsDescription": "Essayez de modifier votre filtre pour trouver une recette en favori.",
      "selectTags": "Sélectionner des étiquettes",
      "selectRecipe": "Sélectionner la recette",
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
    "bookmarkedRecipes": {
      "addTags": "Añadir etiquetas",
      "bookmarkedOn": "Guardado el",
      "noRecipesTitle": "No hay recetas marcadas",
      "noRecipesDescription": "Aún no has marcado ninguna receta. Vuelve a la página principal para generar una.",
      "goHome": "Inicio",
      "view": "Ver",
      "filterPlaceholder": "Filtrar por título...",
      "filterNoResultsTitle": "No hay recetas que coincidan con tu filtro",
      "filterNoResultsDescription": "Intenta ajustar tu filtro para encontrar una receta marcada.",
      "selectTags": "Seleccionar etiquetas",
      "selectRecipe": "Seleccionar receta",
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
