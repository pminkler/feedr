<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { ref } from 'vue';
import { FormIngredient as Ingredient } from '~/types/models';

const props = defineProps({
  ingredients: {
    type: Array as () => Ingredient[],
    required: false,
    default: () => [],
  },
  compact: {
    type: Boolean,
    default: false,
  },
  recipeTitle: {
    type: String,
    default: '',
  },
  recipeInstructions: {
    type: Array as () => string[],
    default: () => [],
  },
  recipeImageUrl: {
    type: String,
    default: '',
  },
});

const { t } = useI18n();
const { generateInstacartUrl } = useRecipe();
const toast = useToast();

const isGenerating = ref(false);
const instacartUrl = ref('');
const expirationTime = ref<Date | null>(null);

async function openInstacartCart() {
  // Always regenerate URL when ingredients might have been modified
  try {
    isGenerating.value = true;

    // Call our function to generate the URL with recipe data
    // Make sure we're passing properly filtered ingredients
    const filteredIngredients = props.ingredients.map((ingredient: Ingredient) => ({
      name: ingredient.name.trim().toLowerCase(),
      quantity:
        typeof ingredient.quantity === 'number'
          ? ingredient.quantity.toString()
          : ingredient.quantity,
      unit: typeof ingredient.unit === 'object' ? ingredient.unit.value : ingredient.unit,
    }));

    const result = await generateInstacartUrl(filteredIngredients, {
      title: props.recipeTitle,
      instructions: props.recipeInstructions,
      imageUrl: props.recipeImageUrl,
    });

    if (result && result.url) {
      instacartUrl.value = result.url;

      // Store expiration time if provided
      if (result.expiresAt) {
        expirationTime.value = new Date(result.expiresAt);
      }

      // Open the URL in a new tab
      window.open(result.url, '_blank');

      toast.add({
        title: t('recipe.instacart.success.title'),
        description: t('recipe.instacart.success.description', { count: result.ingredients }),
        color: 'success',
      });
    } else {
      throw new Error('Failed to generate Instacart URL');
    }
  } catch (error) {
    console.error('Error generating Instacart URL:', error);
    toast.add({
      title: t('recipe.instacart.error.title'),
      description: t('recipe.instacart.error.description'),
      color: 'error',
    });
  } finally {
    isGenerating.value = false;
  }
}
</script>

<template>
  <div>
    <button
      :disabled="isGenerating || props.ingredients.length === 0"
      class="flex items-center h-[46px] px-[18px] py-[16px] rounded-full w-full justify-center"
      :class="{
        'dark:bg-[#003D29] dark:text-[#FAF1E5] bg-[#FAF1E5] text-[#003D29]': true,
        'cursor-not-allowed opacity-50': isGenerating || props.ingredients.length === 0,
        'dark:border-0 border border-[#EFE9E1]': true,
      }"
      @click="openInstacartCart"
    >
      <img v-if="!isGenerating" src="/Instacart_Carrot.svg" alt="Instacart" class="w-[22px] mr-2" />
      <span v-if="isGenerating" class="mr-2 animate-spin">
        <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          />
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </span>
      <span class="font-medium">
        {{ isGenerating ? t('recipe.instacart.loading') : t('recipe.instacart.button') }}
      </span>
    </button>
    <p v-if="!compact" class="text-xs text-gray-500 mt-1 text-center">
      {{ t('recipe.instacart.affiliate.disclosure') }}
    </p>
  </div>
</template>
