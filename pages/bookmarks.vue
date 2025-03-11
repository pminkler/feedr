<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRecipe } from "~/composables/useRecipe";
import { useLocalePath } from "#imports";
import { useI18n } from "vue-i18n";
import AddTagsModal from "~/components/AddTagsModal.vue";

const localePath = useLocalePath();
const { t } = useI18n({ useScope: "local" });
const { getSavedRecipes, savedRecipesState } = useRecipe();
const modal = useModal();

const loading = ref(true);
const filter = ref("");
const selectedTags = ref<string[]>([]);

// Reactive array to track selected recipe IDs.
const selectedSavedRecipeIds = ref<string[]>([]);

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

// Table columns configuration for the bookmarked recipes table
const columns = [
  {
    key: "select",
    label: "",
  },
  {
    key: "title",
    label: t("bookmarkedRecipes.title"),
  },
  {
    key: "createdAt",
    label: t("bookmarkedRecipes.bookmarkedOn"),
  },
  {
    key: "actions",
    label: t("bookmarkedRecipes.actions"),
  },
];

const openTagsModal = () => {
  modal.open(AddTagsModal, {
    savedRecipeIds: selectedSavedRecipeIds.value,
  });
};

// Function to format date
const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString();
};

// Handle table row selection
const onRowSelectionChange = (rows) => {
  selectedSavedRecipeIds.value = rows.map((row) => row.id);
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
  <UDashboardPage>
    <UDashboardPanel grow>
      <UDashboardNavbar title="Bookmarked Recipes"> </UDashboardNavbar>

      <UDashboardPanelContent>
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
          <!-- Show bookmarked recipes in table with selection -->
          <div v-else>
            <UTable
              :columns="columns"
              :rows="savedRecipesState"
              :ui="{
                tbody: {
                  tr: 'hover:bg-gray-50 dark:hover:bg-gray-800',
                },
              }"
              :selection="true"
              @update:selection="onRowSelectionChange"
            >
              <!-- Title column -->
              <template #title-data="{ row }">
                <div>
                  <ULink
                    :to="localePath(`/recipes/${row.recipeId}`)"
                    class="hover:text-primary-500 hover:underline"
                  >
                    <span v-if="row.recipe && row.recipe.title">{{
                      row.recipe.title
                    }}</span>
                    <span v-else>{{
                      t("bookmarkedRecipes.untitledRecipe")
                    }}</span>
                  </ULink>
                </div>
              </template>

              <!-- Created at column -->
              <template #createdAt-cell="{ row }">
                {{ formatDate(row.createdAt) }}
              </template>

              <!-- Actions column -->
              <template #actions-data="{ row }">
                <div class="flex gap-2">
                  <UButton
                    color="primary"
                    variant="ghost"
                    icon="i-heroicons-eye"
                    size="sm"
                    :to="localePath(`/recipes/${row.recipeId}`)"
                  >
                    {{ t("bookmarkedRecipes.view") }}
                  </UButton>
                </div>
              </template>
            </UTable>
          </div>
        </template>
      </UDashboardPanelContent>
    </UDashboardPanel>
  </UDashboardPage>
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
      "title": "Title",
      "tags": "Tags",
      "actions": "Actions",
      "untitledRecipe": "Untitled Recipe"
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
      "title": "Titre",
      "tags": "Étiquettes",
      "actions": "Actions",
      "untitledRecipe": "Recette sans titre"
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
      "title": "Título",
      "tags": "Etiquetas",
      "actions": "Acciones",
      "untitledRecipe": "Receta sin título"
    }
  }
}
</i18n>
