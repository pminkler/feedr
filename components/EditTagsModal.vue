<script setup lang="ts">
import { ref, reactive, computed, onMounted, defineEmits } from 'vue';
import { object, array, string } from 'yup';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';
import type { RecipeTag } from '../types/models';
import { useRecipeStore } from '~/stores/recipes';

const { t } = useI18n({ useScope: 'local' });
const isOpen = ref(true);

// Define props: recipeId is the single recipe ID to edit
const props = defineProps<{
  recipeId: string; // ID of the recipe to edit
}>();

// Get the recipe store
const recipeStore = useRecipeStore();
const { recipeTags, userRecipes } = storeToRefs(recipeStore);
const { getRecipeById, updateRecipe } = recipeStore;

const saving = ref(false);
const loading = ref(true);
// Use Record<string, any> instead of Recipe since Recipe is not exported from models
const currentRecipe = ref<Record<string, unknown> | null>(null);

// Define emits: success event and close
const emit = defineEmits(['success', 'close']);

// Yup schema for the form - simplified for string array
const schema = object({
  tags: array().of(string().required('Tag name is required')),
});

// Reactive state for the form - store simple strings instead of objects
const state = reactive({
  tags: [] as string[],
});

// Transform tag objects to simple string array for options
const options = computed(() => {
  return recipeTags.value.map((tag: RecipeTag) => tag.name);
});

// Direct binding for the select menu
const selectedTags = computed({
  get: () => state.tags,
  set: (newTags) => {
    state.tags = newTags;
  },
});

// Load the initial tags for the selected recipe and refresh all available tags
onMounted(async () => {
  try {
    loading.value = true;

    // The subscription should keep userRecipes up to date, so we don't need to fetch them

    // Try to find the current recipe from state first
    const recipe = userRecipes.value.find(
      (r: Record<string, unknown>) => r.id === props.recipeId,
    );

    if (recipe) {
      currentRecipe.value = recipe;

      // Initialize with the recipe's existing tags - just use the tag names
      if (recipe && recipe.tags) {
        const tags = Array.isArray(recipe.tags) ? recipe.tags : [];
        if (tags.length > 0) {
          state.tags = tags.map((tag: { name: string }) => tag.name);
        }
      }
    }
    else {
      // If not found in state, fetch it directly
      const fetchedRecipe = await getRecipeById(props.recipeId);
      if (fetchedRecipe) {
        currentRecipe.value = fetchedRecipe;

        // Handle recipe tags with type safety
        const tags = fetchedRecipe.tags as Array<{ name: string }> | undefined;
        if (tags && Array.isArray(tags) && tags.length > 0) {
          state.tags = tags
            .filter((tag) => tag && typeof tag === 'object')
            .map((tag) => {
              return tag.name;
            })
            .filter((name) => name !== '');
        }
      }
    }
  }
  catch (error) {
    console.error('Error loading recipe tags:', error);
  }
  finally {
    loading.value = false;
  }
});

// Handler for tag creation
function onCreateTag(tagName: string) {
  // Check if the tag name is valid
  if (!tagName || !tagName.trim()) {
    return;
  }

  const trimmedTagName = tagName.trim();

  // No need to check for existence since the component will handle it for simple strings
  // Add directly to the selected tags
  if (!state.tags.includes(trimmedTagName)) {
    state.tags.push(trimmedTagName);
  }
}

// Submission handler for the form
async function onSubmit() {
  saving.value = true;

  try {
    // Convert string tags to the required tag objects format
    const newTags = state.tags.map((name) => ({ name }));

    // Replace tags with the edited set
    await updateRecipe(props.recipeId, { tags: newTags });

    // No need to refresh recipes, the subscription will automatically update the UI
  }
  catch (e) {
    console.error('Error updating tags:', e);
  }
  finally {
    saving.value = false;
    isOpen.value = false;
    emit('close');
    emit('success'); // Let parent component know tags were successfully updated
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
        class="space-y-4"
        @submit="onSubmit"
      >
        <div v-if="loading">
          <USkeleton class="h-10 w-full rounded" />
          <div class="mt-2 flex flex-wrap gap-1">
            <USkeleton v-for="i in 3" :key="i" class="h-6 w-16 rounded" />
          </div>
        </div>
        <USelectMenu
          v-else
          v-model="selectedTags"
          name="tags"
          :items="options"
          :placeholder="t('editTags.selectPlaceholder')"
          multiple
          create-item
          class="w-full"
          icon="i-heroicons-tag"
          trailing-icon="i-heroicons-chevron-down"
          @create="onCreateTag"
        >
          <template #default="{ modelValue }">
            <template v-if="modelValue && modelValue.length">
              <div class="flex flex-wrap gap-1 items-center">
                <UBadge
                  v-for="tag in modelValue"
                  :key="tag"
                  color="primary"
                  variant="subtle"
                >
                  {{ tag }}
                </UBadge>
              </div>
            </template>
            <template v-else>
              <span class="text-gray-500 truncate">
                {{ t('editTags.selectPlaceholder') }}
              </span>
            </template>
          </template>

          <template #create-item-label="{ item }">
            <span class="shrink-0">{{ t('editTags.newTag') }}: </span>
            <span class="truncate">{{ item }}</span>
          </template>
        </USelectMenu>
      </UForm>
    </template>

    <template #footer>
      <div class="flex justify-between w-full">
        <UButton
          variant="ghost"
          color="error"
          icon="i-heroicons-trash"
          :disabled="saving || loading || state.tags.length === 0"
          @click="state.tags = []"
        >
          {{ t('editTags.clearAll') }}
        </UButton>

        <div class="flex space-x-2">
          <UButton
            variant="ghost"
            :disabled="saving || loading"
            @click="
              isOpen = false;
              emit('close');
            "
          >
            {{ t('editTags.cancel') }}
          </UButton>
          <UButton :loading="saving" :disabled="loading" @click="onSubmit">
            {{ loading ? t('editTags.loading') : t('editTags.submit') }}
          </UButton>
        </div>
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
      "clearAll": "Clear All",
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
      "clearAll": "Tout effacer",
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
      "clearAll": "Borrar todo",
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
