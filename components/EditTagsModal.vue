<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from "vue";
import { object, array, string } from "yup";
import { defineEmits } from "vue";
import { useI18n } from "vue-i18n";
import { useToast } from "#ui/composables/useToast";
import type { RecipeTag, Recipe } from "~/types/models";

const { t } = useI18n({ useScope: "local" });
const toast = useToast();
const isOpen = ref(true);

// Define props: recipeId is the single recipe ID to edit
const props = defineProps<{
  recipeId: string; // ID of the recipe to edit
}>();

// Get the recipe store
const recipeStore = useRecipe();
const { recipeTags, myRecipesState, getRecipeById } = recipeStore;

const saving = ref(false);
const loading = ref(true);
const currentRecipe = ref<Recipe | null>(null);

// Define emits: success event and close
const emit = defineEmits(["success", "close"]);

// Yup schema for the form
const schema = object({
  tags: array().of(
    object({
      id: string().nullable(),
      name: string().required("Tag name is required"),
    }),
  ),
});

// Reactive state for the form
const state = reactive({
  tags: [] as any[],
});

// Get all existing tags from all recipes for the dropdown options
const options = ref<RecipeTag[]>([...recipeTags.value]);

// Computed property that gets/sets the form state for tags
const labels = computed({
  get: () => state.tags,
  set: (newLabels) => {
    state.tags = newLabels;
  },
});

// Load the initial tags for the selected recipe and refresh all available tags
onMounted(async () => {
  try {
    loading.value = true;

    // Load in parallel instead of sequentially to improve performance
    const recipesPromises = [];

    // Only fetch recipes if the myRecipesState or savedRecipesState are empty
    if (myRecipesState.value.length === 0) {
      recipesPromises.push(recipeStore.getMyRecipes());
    }

    if (recipeTags.value.length === 0) {
      recipesPromises.push(recipeStore.getSavedRecipes());
    }

    // If we need to make any requests, wait for them in parallel
    if (recipesPromises.length > 0) {
      await Promise.all(recipesPromises);
    }

    // Update options with the latest data from the store
    options.value = [...recipeTags.value];

    // Try to find the current recipe from state first
    const recipe = myRecipesState.value.find((r) => r.id === props.recipeId);

    if (recipe) {
      currentRecipe.value = recipe;

      // Initialize with the recipe's existing tags
      if (recipe.tags && recipe.tags.length > 0) {
        state.tags = recipe.tags.map((tag) => ({
          id: `existing-${tag.name}`,
          name: tag.name,
        }));
      }
    } else {
      // If not found in state, fetch it directly
      const fetchedRecipe = await getRecipeById(props.recipeId);
      if (fetchedRecipe) {
        currentRecipe.value = fetchedRecipe;

        if (fetchedRecipe.tags && fetchedRecipe.tags.length > 0) {
          state.tags = fetchedRecipe.tags.map((tag) => ({
            id: `existing-${tag.name}`,
            name: tag.name,
          }));
        }
      }
    }
  } catch (error) {
    console.error("Error loading recipe tags:", error);
  } finally {
    loading.value = false;
  }
});

// Handler for tag creation
function onCreateTag(tagName: string) {
  // Check if the tag name is valid
  if (!tagName || !tagName.trim()) {
    return;
  }

  // Normalize the tag name for comparison
  const normalizedTagName = tagName.trim().toLowerCase();

  // Check if the tag already exists in options
  const existingOptionIndex = options.value.findIndex(
    (tag) => tag.name.toLowerCase() === normalizedTagName,
  );

  // If tag exists, the component will automatically select it
  if (existingOptionIndex >= 0) {
    return;
  }

  // Create new tag
  const newLabel = {
    id: `new-${Date.now()}`, // Use timestamp for more unique IDs
    name: tagName.trim(),
  };

  // Add to the beginning of the options list so it appears first
  console.log("pushing", newLabel, "to options", options.value);
  options.value.push(newLabel);
  labels.value.push(newLabel);
}

// Helper to sanitize a tag: keep only name
function sanitizeTag(tag: any) {
  return { name: tag.name };
}

// Submission handler for the form
async function onSubmit() {
  saving.value = true;

  try {
    // Sanitize the new tags
    const newTags = state.tags.map(sanitizeTag);

    // Replace tags with the edited set
    await recipeStore.updateRecipe(props.recipeId, { tags: newTags });

    // Refresh the recipe list to update the UI
    await recipeStore.getMyRecipes();
  } catch (e) {
    console.error("Error updating tags:", e);
  } finally {
    saving.value = false;
    isOpen.value = false;
    emit("close");
    emit("success"); // Let parent component know tags were successfully updated
  }
}
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="t('editTags.title')"
    :description="
      currentRecipe
        ? t('editTags.singleDescription', {
            title: currentRecipe.title || t('editTags.untitledRecipe'),
          })
        : t('editTags.description')
    "
  >
    <template #default>
      <!-- Trigger button not needed when modal is controlled programmatically -->
    </template>

    <template #body>
      <UForm
        :schema="schema"
        :state="state"
        @submit="onSubmit"
        class="space-y-4"
      >
        <div v-if="loading">
          <USkeleton class="h-10 w-full rounded" />
          <div class="mt-2 flex flex-wrap gap-1">
            <USkeleton v-for="i in 3" :key="i" class="h-6 w-16 rounded" />
          </div>
        </div>
        <USelectMenu
          v-else
          v-model="labels"
          name="tags"
          label-key="name"
          :items="options"
          :placeholder="t('editTags.selectPlaceholder')"
          multiple
          create-item
          @create="onCreateTag"
          class="w-full"
          icon="i-heroicons-tag"
          trailing-icon="i-heroicons-chevron-down"
        />
      </UForm>
    </template>

    <template #footer>
      <div class="flex justify-end space-x-2 w-full">
        <UButton
          variant="ghost"
          @click="
            isOpen = false;
            emit('close');
          "
          :disabled="saving || loading"
        >
          {{ t("editTags.cancel") }}
        </UButton>
        <UButton :loading="saving" @click="onSubmit" :disabled="loading">
          {{ loading ? t("editTags.loading") : t("editTags.submit") }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<style scoped>
/* Add any custom styles if needed */
</style>

<i18n lang="json">
{
  "en": {
    "editTags": {
      "title": "Edit Tags",
      "description": "Select, create, or remove tags for this recipe.",
      "singleDescription": "Edit tags for \"{title}\"",
      "selectPlaceholder": "Select tags",
      "tagsLabel": "Tags",
      "tagsHelp": "Select from existing tags across all your recipes or create new ones",
      "newTag": "New tag",
      "removeTag": "Remove tag {tag}",
      "cancel": "Cancel",
      "submit": "Save Changes",
      "loading": "Loading...",
      "untitledRecipe": "Untitled Recipe",
      "duplicateTag": "Duplicate Tag",
      "tagAlreadyExists": "Tag \"{tag}\" is already selected"
    }
  },
  "fr": {
    "editTags": {
      "title": "Modifier les étiquettes",
      "description": "Sélectionnez, créez ou supprimez des étiquettes pour cette recette.",
      "singleDescription": "Modifier les étiquettes pour \"{title}\"",
      "selectPlaceholder": "Sélectionnez des étiquettes",
      "tagsLabel": "Étiquettes",
      "tagsHelp": "Sélectionnez parmi les étiquettes existantes de toutes vos recettes ou créez-en de nouvelles",
      "newTag": "Nouvelle étiquette",
      "removeTag": "Supprimer l'étiquette {tag}",
      "cancel": "Annuler",
      "submit": "Enregistrer les modifications",
      "loading": "Chargement...",
      "untitledRecipe": "Recette sans titre",
      "duplicateTag": "Étiquette dupliquée",
      "tagAlreadyExists": "L'étiquette \"{tag}\" est déjà sélectionnée"
    }
  },
  "es": {
    "editTags": {
      "title": "Editar etiquetas",
      "description": "Seleccione, cree o elimine etiquetas para esta receta.",
      "singleDescription": "Editar etiquetas para \"{title}\"",
      "selectPlaceholder": "Seleccione etiquetas",
      "tagsLabel": "Etiquetas",
      "tagsHelp": "Seleccione entre las etiquetas existentes de todas sus recetas o cree nuevas",
      "newTag": "Nueva etiqueta",
      "removeTag": "Eliminar etiqueta {tag}",
      "cancel": "Cancelar",
      "submit": "Guardar cambios",
      "loading": "Cargando...",
      "untitledRecipe": "Receta sin título",
      "duplicateTag": "Etiqueta duplicada",
      "tagAlreadyExists": "La etiqueta \"{tag}\" ya está seleccionada"
    }
  }
}
</i18n>
