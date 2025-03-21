<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import { object, array, string } from "yup";
import { defineEmits } from "vue";
import { useI18n } from "vue-i18n";
import type { RecipeTag } from "~/types/models";

const { t } = useI18n({ useScope: "local" });
const isOpen = ref(true);

// Define props: recipeIds is an array of recipe IDs.
const props = defineProps<{
  recipeIds: string[]; // or number[] depending on your ID type
}>();
// Get the recipe store; assume it provides recipeTags and updateRecipe.
const recipeStore = useRecipe();
const { recipeTags } = recipeStore;
const overlay = useOverlay();

const saving = ref(false);

// Define emits: success event and close.
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
const options = ref<RecipeTag[]>([...recipeTags.value]);

// Computed property that gets/sets the form state for tags.
const labels = computed({
  get: () => state.tags,
  set: (newLabels) => {
    state.tags = newLabels;
  },
});

// Handler for tag creation
function onCreateTag(tagName: string) {
  const newLabel = {
    id: `new-${options.value.length + 1}`,
    name: tagName,
    color: generateColorFromString(tagName),
  };
  options.value.push(newLabel);
  state.tags.push(newLabel);
}

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

// Helper to sanitize a tag: keep only name and color.
function sanitizeTag(tag: any) {
  return { name: tag.name, color: tag.color };
}

// Submission handler for the form.
// For each saved recipe, merge existing tags with the new ones (sanitized), then update.
async function onSubmit() {
  saving.value = true;

  // Loop over each recipe ID.
  try {
    for (const recipeId of props.recipeIds) {
      // Find the current recipe from the store's state.
      const recipe = recipeStore.savedRecipesState.value.find(
        (r: any) => r.id === recipeId,
      );
      // Get existing tags (sanitized), or default to an empty array.
      const oldTags = (recipe?.tags || []).map(sanitizeTag);
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
      // Call updateRecipe with the merged tags.
      await recipeStore.updateRecipe(recipeId, { tags: mergedTags });
    }
  } catch (e) {
    console.error("Error updating tags:", e);
  } finally {
    saving.value = false;
    isOpen.value = false;
    emit("close");
  }
}
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="t('addTags.title')"
    :description="t('addTags.description')"
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
        <UFormGroup label="Tags" name="tags">
          <USelectMenu
            v-model="labels"
            value-key="id"
            name="tags"
            :items="options"
            label-key="name"
            multiple
            create-item
            placeholder="Select tags"
            class="w-full"
            @create="onCreateTag"
          >
            <template #default="{ modelValue }">
              <template v-if="modelValue && modelValue.length">
                <div class="flex flex-wrap gap-1 items-center">
                  <div
                    v-for="label of modelValue"
                    :key="label.id"
                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium shadow-sm"
                    :style="{
                      backgroundColor: `#${label.color || '666666'}`,
                      color: getContrastYIQ(label.color),
                    }"
                  >
                    <span
                      class="shrink-0 w-2 h-2 rounded-full"
                      :style="{ background: '#' + label.color }"
                    />
                    <span>{{ label.name }}</span>
                  </div>
                </div>
              </template>
              <template v-else>
                <span class="text-gray-500 truncate">
                  {{ t("addTags.selectPlaceholder") }}
                </span>
              </template>
            </template>

            <template #item-leading="{ item }">
              <span
                class="shrink-0 w-2 h-2 mt-px rounded-full"
                :style="{ background: '#' + item.color }"
              />
            </template>

            <template #create-item-label="{ item }">
              <span class="shrink-0">New label:</span>
              <span
                class="shrink-0 w-2 h-2 mt-px rounded-full mx-1"
                :style="{
                  background: '#' + generateColorFromString(item),
                }"
              />
              <span class="truncate">{{ item }}</span>
            </template>
          </USelectMenu>
        </UFormGroup>
      </UForm>
    </template>

    <template #footer>
      <div class="flex justify-end space-x-2">
        <UButton
          variant="ghost"
          @click="
            isOpen = false;
            emit('close');
          "
          :disabled="saving"
        >
          {{ t("addTags.cancel") }}
        </UButton>
        <UButton :loading="saving" @click="onSubmit">
          {{ t("addTags.submit") }}
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
