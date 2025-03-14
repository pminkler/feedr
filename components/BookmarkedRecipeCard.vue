<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { useRecipe } from "~/composables/useRecipe";

const selected = ref(false);

const emit = defineEmits(["select", "unselect"]);

// Helper function for high contrast text based on YIQ algorithm
function getContrastYIQ(colorHex: string | undefined): string {
  if (!colorHex) return '#ffffff';
  
  // Convert hex to RGB
  const r = parseInt(colorHex.substring(0, 2), 16);
  const g = parseInt(colorHex.substring(2, 4), 16);
  const b = parseInt(colorHex.substring(4, 6), 16);
  
  // Calculate YIQ contrast value to determine if color is light or dark
  // Using YIQ gives better perceptual results for text contrast
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  
  // Return black or white based on YIQ value
  return (yiq >= 128) ? '#000000' : '#ffffff';
}
const { t } = useI18n({ useScope: "local" });
const localePath = useLocalePath();
const removingTags = ref<string[]>([]);

const { updateRecipe } = useRecipe();

const removeTag = async ({
  bookmarkedRecipeId = "",
  tagName = "",
}: {
  bookmarkedRecipeId: string;
  tagName: string;
}): Promise<void> => {
  try {
    removingTags.value.push(tagName);
    await updateRecipe(bookmarkedRecipeId, {
      tags: props.bookmarkedRecipe.tags.filter(
        (tag: { name: string }) => tag.name !== tagName,
      ),
    });
  } catch (error) {
    console.error("Error removing tag:", error);
  } finally {
    removingTags.value = removingTags.value.filter((tag) => tag !== tagName);
  }
};

const props = defineProps({
  bookmarkedRecipe: {
    type: Object,
    required: true,
  },
});

function getLocalizedDate(dateString: string) {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  return date.toLocaleDateString(undefined, options);
}

const select = () => {
  selected.value = !selected.value;
  if (selected.value) {
    emit("select", props.bookmarkedRecipe.id);
  } else {
    emit("unselect", props.bookmarkedRecipe.id);
  }
};
</script>

<template>
  <UPageCard
    @click="select"
    :title="bookmarkedRecipe.recipe.title"
    :description="`${t('bookmarkedRecipes.bookmarkedOn')} ${getLocalizedDate(bookmarkedRecipe.createdAt)}`"
    :class="selected ? 'border-2 border-primary-500 rounded-sm' : ''"
    :links="[
      {
        label: t('bookmarkedRecipes.view'),
        to: localePath(`/recipes/${bookmarkedRecipe.recipeId}`),
        click: (e) => e.stopPropagation(),
      },
    ]"
  >
    <div class="flex flex-wrap gap-1.5 mt-2">
      <UBadge
        v-for="tag in bookmarkedRecipe.tags"
        :key="tag.name"
        :label="tag.name"
        color="neutral"
        size="xs"
        variant="solid"
        class="text-xs font-medium shadow-sm"
        :style="{
          backgroundColor: `#${tag.color || '666666'}`,
          color: getContrastYIQ(tag.color)
        }"
      >
        <template #trailing>
          <UIcon
            @click.stop="
              removeTag({
                bookmarkedRecipeId: bookmarkedRecipe.id,
                tagName: tag.name,
              })
            "
            :name="
              removingTags.includes(tag.name)
                ? 'svg-spinners:180-ring'
                : 'i-heroicons-x-mark'
            "
            class="w-3 h-3 ml-0.5"
          />
        </template>
      </UBadge>
    </div>
  </UPageCard>
</template>

<style module scoped></style>

<i18n lang="json">
{
  "en": {
    "bookmarkedRecipes": {
      "bookmarkedOn": "Bookmarked on",
      "view": "View",
      "filterPlaceholder": "Filter by title...",
      "filterNoResultsTitle": "No recipes match your filter",
      "filterNoResultsDescription": "Try adjusting your filter to find a bookmarked recipe."
    }
  },
  "fr": {
    "bookmarkedRecipes": {
      "view": "Voir"
    }
  },
  "es": {
    "bookmarkedRecipes": {
      "view": "Ver"
    }
  }
}
</i18n>
