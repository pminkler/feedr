<script setup lang="ts">
import { ref, reactive, computed, defineEmits } from 'vue';
import { object, array, string } from 'yup';
import { useI18n } from 'vue-i18n';

const { t } = useI18n({ useScope: 'local' });
const isOpen = ref(true);

// Define props: recipeIds is an array of recipe IDs.
const props = defineProps<{
  recipeIds: string[]; // or number[] depending on your ID type
}>();
// Get the recipe store; assume it provides recipeTags and updateRecipe.
const recipeStore = useRecipe();
const { recipeTags, getMyRecipes } = recipeStore;

const saving = ref(false);

// Define emits: success event and close.
const emit = defineEmits(['success', 'close']);

// Yup schema for the form – require at least one tag.
const schema = object({
  tags: array()
    .of(string().required('Tag name is required'))
    .min(1, 'At least one tag is required'),
});

// Reactive state for the form.
const state = reactive({
  tags: [] as string[],
});

// Combine the existing saved recipe tags with our own options.
// Convert tag objects to simple strings for options
const options = computed(() => {
  return recipeTags.value.map((tag: { name: string }) => tag.name);
});

// Computed property that gets/sets the form state for tags.
const labels = computed({
  get: () => state.tags,
  set: (newLabels: string[]) => {
    state.tags = newLabels;
  },
});

// Handler for tag creation
function onCreateTag(tagName: string) {
  // Check if the tag name is valid
  if (!tagName || !tagName.trim()) {
    return;
  }

  const trimmedTagName = tagName.trim();

  // Add directly to the selected tags if it doesn't exist
  if (!state.tags.includes(trimmedTagName)) {
    state.tags.push(trimmedTagName);
  }
}

// Submission handler for the form.
// For each saved recipe, merge existing tags with the new ones (sanitized), then update.
async function onSubmit() {
  saving.value = true;

  // Loop over each recipe ID.
  try {
    for (const recipeId of props.recipeIds) {
      // Find the current recipe from the store's state.
      const recipe = recipeStore.myRecipesState.value.find(
        (r: Record<string, unknown>) => r.id === recipeId,
      );
      // Get existing tags (sanitized), or default to an empty array.
      const tags = recipe?.tags || [];
      const oldTags = Array.isArray(tags)
        ? tags.map((tag: Record<string, unknown>) =>
            typeof tag === 'object' && tag !== null && typeof tag.name === 'string'
              ? tag.name.trim()
              : '',
          )
        : [];

      // Convert strings to tag objects done within mergedTags creation

      // Merge old and new tags using a Set to avoid duplicates
      const existingNames = new Set<string>();

      // Add existing tag names to the Set
      for (const name of oldTags) {
        if (name) existingNames.add(name.toLowerCase());
      }

      // Create the final merged tags list
      const mergedTags = [];

      // First add all existing tags
      if (Array.isArray(tags)) {
        for (const tag of tags) {
          if (typeof tag === 'object' && tag !== null && typeof tag.name === 'string') {
            mergedTags.push({ name: tag.name });
          }
        }
      }

      // Then add new tags that don't exist yet
      for (const tagName of state.tags) {
        if (!existingNames.has(tagName.toLowerCase())) {
          mergedTags.push({ name: tagName });
          existingNames.add(tagName.toLowerCase());
        }
      }

      // Call updateRecipe with the merged tags.
      await recipeStore.updateRecipe(recipeId, { tags: mergedTags });
    }

    // Refresh the recipe list to update the UI
    await getMyRecipes();
    // No need to call subscribeToMyRecipes here as the subscription will automatically update
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
  <UModal v-model:open="isOpen" :title="t('addTags.title')" :description="t('addTags.description')">
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
        <UFormGroup label="Tags" name="tags">
          <USelectMenu
            v-model="labels"
            name="tags"
            :items="options"
            multiple
            create-item
            placeholder="Select tags"
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
                  {{ t('addTags.selectPlaceholder') }}
                </span>
              </template>
            </template>

            <template #create-item-label="{ item }">
              <span class="shrink-0">New label: </span>
              <span class="truncate">{{ item }}</span>
            </template>
          </USelectMenu>
        </UFormGroup>
      </UForm>
    </template>

    <template #footer>
      <div class="flex justify-end space-x-2 w-full">
        <UButton
          variant="ghost"
          :disabled="saving"
          @click="
            isOpen = false;
            emit('close');
          "
        >
          {{ t('addTags.cancel') }}
        </UButton>
        <UButton :loading="saving" @click="onSubmit">
          {{ t('addTags.submit') }}
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
    "addTags": {
      "title": "Add Tags to Recipes",
      "description": "Select or create tags to add to the selected bookmarked recipes.",
      "selectPlaceholder": "Select tags",
      "labelsSingular": "label",
      "labelsPlural": "labels",
      "cancel": "Cancel",
      "submit": "Add Tags"
    }
  },
  "fr": {
    "addTags": {
      "title": "Ajouter des étiquettes aux recettes",
      "description": "Sélectionnez ou créez des étiquettes à ajouter aux recettes en favori sélectionnées.",
      "selectPlaceholder": "Sélectionnez des étiquettes",
      "labelsSingular": "étiquette",
      "labelsPlural": "étiquettes",
      "cancel": "Annuler",
      "submit": "Ajouter des étiquettes"
    }
  },
  "es": {
    "addTags": {
      "title": "Agregar etiquetas a las recetas",
      "description": "Seleccione o cree etiquetas para agregar a las recetas marcadas seleccionadas.",
      "selectPlaceholder": "Seleccione etiquetas",
      "labelsSingular": "etiqueta",
      "labelsPlural": "etiquetas",
      "cancel": "Cancelar",
      "submit": "Agregar etiquetas"
    }
  }
}
</i18n>
