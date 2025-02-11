<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import { object, array, string } from "yup";
import { defineEmits } from "vue";
import { useRecipe } from "#imports";
import { useI18n } from "vue-i18n";
import { SavedRecipeTag } from "~/types/models";

const { t } = useI18n({ useScope: "local" });

// Define props: savedRecipeIds is an array of saved recipe IDs.
const props = defineProps<{
  savedRecipeIds: string[]; // or number[] depending on your ID type
}>();
// Get the recipe store; assume it provides savedRecipeTags and updateSavedRecipe.
const recipeStore = useRecipe();
const { savedRecipeTags } = recipeStore;
const modal = useModal();

const saving = ref(false);

// Define emits: success event (and optionally close).
const emit = defineEmits(["success", "close"]);

// Yup schema for the form – require at least one tag.
const schema = object({
  tags: array()
    .of(
      object({
        id: string().nullable(),
        name: string().required("Tag name is required"),
      }),
    )
    .min(1, "At least one tag is required"),
});

// Reactive state for the form.
const state = reactive({
  tags: [] as any[],
});

// Combine the existing saved recipe tags with our own options.
// (We assume savedRecipeTags is an array of objects with { id, name, color }.)
const options = ref<SavedRecipeTag>([...savedRecipeTags.value]);

// Computed property that gets/sets the form state for tags.
const labels = computed({
  get: () => state.tags,
  set: async (newLabels) => {
    const processed = await Promise.all(
      newLabels.map(async (label: any) => {
        if (label.id) return label;
        // Simulate API creation of a label by generating an id and a random color.
        const newLabel = {
          id: options.value.length + 1,
          name: label.name,
          color: generateColorFromString(label.name),
        };
        options.value.push(newLabel);
        return newLabel;
      }),
    );
    state.tags = processed;
  },
});

// Helper functions to generate a random-looking color from a string.
function hashCode(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return hash;
}

function intToRGB(i: number) {
  const c = (i & 0x00ffffff).toString(16).toUpperCase();
  return "00000".substring(0, 6 - c.length) + c;
}

function generateColorFromString(str: string) {
  return intToRGB(hashCode(str));
}

// Helper to sanitize a tag: keep only name and color.
function sanitizeTag(tag: any) {
  return { name: tag.name, color: tag.color };
}

// Submission handler for the form.
// For each saved recipe, merge existing tags with the new ones (sanitized), then update.
async function onSubmit() {
  saving.value = true;

  // Loop over each saved recipe ID.
  try {
    for (const savedRecipeId of props.savedRecipeIds) {
      // Find the current saved recipe from the store's state.
      const savedRecipe = recipeStore.savedRecipesState.value.find(
        (r: any) => r.id === savedRecipeId,
      );
      // Get existing tags (sanitized), or default to an empty array.
      const oldTags = (savedRecipe?.tags || []).map(sanitizeTag);
      // Sanitize the new tags.
      const newTags = state.tags.map(sanitizeTag);
      // Merge old and new tags using a Map keyed by lowercase tag name.
      const mergedMap = new Map<string, { name: string; color: string }>();
      for (const tag of oldTags) {
        mergedMap.set(tag.name?.toLowerCase(), tag);
      }
      for (const tag of newTags) {
        if (!mergedMap.has(tag.name?.toLowerCase())) {
          mergedMap.set(tag.name.toLowerCase(), tag);
        }
      }
      const mergedTags = Array.from(mergedMap.values());
      // Call updateSavedRecipe with the merged tags.
      await recipeStore.updateSavedRecipe(savedRecipeId, { tags: mergedTags });
    }
  } catch (e) {
  } finally {
    saving.value = false;
    modal.close();
  }
}
</script>

<template>
  <UModal>
    <UCard>
      <div class="space-y-4">
        <h2 class="text-xl font-bold">{{ t("addTags.title") }}</h2>
        <p class="text-sm text-gray-600">{{ t("addTags.description") }}</p>
        <UForm
          :schema="schema"
          :state="state"
          @submit="onSubmit"
          class="space-y-4"
        >
          <UFormGroup label="Tags" name="tags">
            <USelectMenu
              v-model="labels"
              by="id"
              name="tags"
              :options="options"
              option-attribute="name"
              multiple
              searchable
              creatable
            >
              <template #label>
                <template v-if="labels.length">
                  <span class="flex items-center -space-x-1">
                    <span
                      v-for="label of labels"
                      :key="label.id"
                      class="flex-shrink-0 w-2 h-2 mt-px rounded-full"
                      :style="{ background: '#' + label.color }"
                    />
                  </span>
                  <span>
                    {{ labels.length }}
                    {{
                      labels.length > 1
                        ? t("addTags.labelsPlural")
                        : t("addTags.labelsSingular")
                    }}
                  </span>
                </template>
                <template v-else>
                  <span class="text-gray-500 dark:text-gray-400 truncate">
                    {{ t("addTags.selectPlaceholder") }}
                  </span>
                </template>
              </template>

              <template #option="{ option }">
                <span
                  class="flex-shrink-0 w-2 h-2 mt-px rounded-full"
                  :style="{ background: '#' + option.color }"
                />
                <span class="truncate">{{ option.name }}</span>
              </template>

              <template #option-create="{ option }">
                <span class="flex-shrink-0">New label:</span>
                <span
                  class="flex-shrink-0 w-2 h-2 mt-px rounded-full -mx-1"
                  :style="{
                    background: '#' + generateColorFromString(option.name),
                  }"
                />
                <span class="block truncate">{{ option.name }}</span>
              </template>
            </USelectMenu>
          </UFormGroup>
          <div class="flex justify-end space-x-2">
            <UButton variant="ghost" @click="modal.close()" :disabled="saving">
              {{ t("addTags.cancel") }}
            </UButton>
            <UButton type="submit" :loading="saving">
              {{ t("addTags.submit") }}
            </UButton>
          </div>
        </UForm>
      </div>
    </UCard>
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
