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
    recipe.tags.forEach((tag) => tags.add(tag.name));
  });
  return Array.from(tags).sort();
});

// Compute filtered recipes based on title match and selected tags.
const filteredRecipes = computed(() => {
  let recipes = savedRecipesState.value;
  if (filter.value) {
    recipes = recipes.filter((recipe) =>
      recipe.recipe.title.toLowerCase().includes(filter.value.toLowerCase()),
    );
  }

  if (selectedTags.value.length) {
    recipes = recipes.filter((recipe) =>
      selectedTags.value.some((tag) =>
        recipe.tags.some((recipeTag) => recipeTag.name === tag),
      ),
    );
  }
  return recipes;
});

const openTagsModal = () => {
  modal.open(AddTagsModal, {
    savedRecipeIds: selectedSavedRecipeIds.value,
  });
};

onMounted(async () => {
  loading.value = true;
  await getSavedRecipes();
  loading.value = false;
});

definePageMeta({
  middleware: "auth",
  layout: "dashboard",
});
</script>

<template>
  <UDashboardPage>
    <UDashboardPanel grow>
      <UDashboardNavbar title="Bookmarked Recipes">
        <template #right>
          <UInput
            icon="heroicons-solid:filter"
            v-model="filter"
            type="text"
            :placeholder="t('bookmarkedRecipes.filterPlaceholder')"
          />
        </template>
      </UDashboardNavbar>
      <UDashboardToolbar>
        <template #left>
          <UButton
            icon="material-symbols:new-label"
            :disabled="selectedSavedRecipeIds.length === 0"
            @click="openTagsModal"
          >
            {{ t("bookmarkedRecipes.addTags") }}
          </UButton>
          <USelectMenu v-model="selectedTags" :options="uniqueTags" multiple>
            <template #label>
              <span v-if="selectedTags.length" class="truncate">{{
                selectedTags.join(", ")
              }}</span>
              <span v-else>{{ t("bookmarkedRecipes.selectTags") }}</span>
            </template>
          </USelectMenu>
        </template>
      </UDashboardToolbar>

      <UDashboardPanelContent>
        <template v-if="loading">
          <div class="grid lg:grid-cols-2 gap-4 mt-4 w-full">
            <USkeleton class="h-20 w-full" />
            <USkeleton class="h-20 w-full" />
            <USkeleton class="h-20 w-full" />
            <USkeleton class="h-20 w-full" />
            <USkeleton class="h-20 w-full" />
            <USkeleton class="h-20 w-full" />
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
          <!-- Filter applied but no results -->
          <div
            class="w-full flex justify-center"
            v-else-if="filter && filteredRecipes.length === 0"
          >
            <UAlert
              class="w-full md:w-1/2"
              icon="material-symbols:info"
              color="yellow"
              variant="solid"
              :title="t('bookmarkedRecipes.filterNoResultsTitle')"
              :description="t('bookmarkedRecipes.filterNoResultsDescription')"
            />
          </div>
          <!-- Show bookmarked recipes with selection -->
          <UPageGrid v-else>
            <div
              v-for="bookmarkedRecipe in filteredRecipes"
              :key="bookmarkedRecipe.id"
              class="relative cursor-pointer"
            >
              <BookmarkedRecipeCard
                :bookmarked-recipe="bookmarkedRecipe"
                @select="selectedSavedRecipeIds.push(bookmarkedRecipe.id)"
                @deselect="
                  selectedSavedRecipeIds.splice(
                    selectedSavedRecipeIds.indexOf(bookmarkedRecipe.id),
                    1,
                  )
                "
              />
            </div>
          </UPageGrid>
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
      "selectTags": "Select tags"
    }
  },
  "fr": {
    "bookmarkedRecipes": {
      "noRecipesTitle": "Aucune recette en favori",
      "noRecipesDescription": "Vous n'avez pas encore marqué de recettes en favori. Retournez à l'accueil pour en générer une.",
      "goHome": "Accueil",
      "view": "Voir",
      "filterPlaceholder": "Filtrer par titre...",
      "filterNoResultsTitle": "Aucune recette ne correspond à votre filtre",
      "filterNoResultsDescription": "Essayez de modifier votre filtre pour trouver une recette en favori."
    }
  },
  "es": {
    "bookmarkedRecipes": {
      "noRecipesTitle": "No hay recetas marcadas",
      "noRecipesDescription": "Aún no has marcado ninguna receta. Vuelve a la página principal para generar una.",
      "goHome": "Inicio",
      "view": "Ver",
      "filterPlaceholder": "Filtrar por título...",
      "filterNoResultsTitle": "No hay recetas que coincidan con tu filtro",
      "filterNoResultsDescription": "Intenta ajustar tu filtro para encontrar una receta marcada."
    }
  }
}
</i18n>
