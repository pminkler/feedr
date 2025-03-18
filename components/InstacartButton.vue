<script setup lang="ts">
import { useRecipe } from '~/composables/useRecipe';
import { useI18n } from 'vue-i18n';

const props = defineProps({
  ingredients: {
    type: Array,
    required: true,
    default: () => []
  },
  compact: {
    type: Boolean,
    default: false
  },
  recipeTitle: {
    type: String,
    default: ""
  },
  recipeInstructions: {
    type: Array,
    default: () => []
  },
  recipeImageUrl: {
    type: String,
    default: ""
  }
});

const { t } = useI18n();
const { generateInstacartUrl } = useRecipe();
const toast = useToast();

const isGenerating = ref(false);
const instacartUrl = ref('');
const expirationTime = ref<Date | null>(null);

async function openInstacartCart() {
  // Check if we have a valid URL and it hasn't expired
  const now = new Date();
  
  if (instacartUrl.value && expirationTime.value && now < expirationTime.value) {
    // If we already have a valid URL, open it directly
    window.open(instacartUrl.value, '_blank');
    return;
  }

  try {
    isGenerating.value = true;
    
    // Call our function to generate the URL with recipe data
    const result = await generateInstacartUrl(props.ingredients, {
      title: props.recipeTitle,
      instructions: props.recipeInstructions,
      imageUrl: props.recipeImageUrl
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
        color: 'green'
      });
    } else {
      throw new Error('Failed to generate Instacart URL');
    }
  } catch (error) {
    console.error('Error generating Instacart URL:', error);
    toast.add({
      title: t('recipe.instacart.error.title'),
      description: t('recipe.instacart.error.description'),
      color: 'red'
    });
  } finally {
    isGenerating.value = false;
  }
}
</script>

<template>
  <div>
    <button
      @click="openInstacartCart"
      :disabled="isGenerating || props.ingredients.length === 0"
      class="flex items-center h-[46px] px-[18px] py-[16px] rounded-full w-full justify-center"
      :class="{ 
        'dark:bg-[#003D29] dark:text-[#FAF1E5] bg-[#FAF1E5] text-[#003D29]': true,
        'cursor-not-allowed opacity-50': isGenerating || props.ingredients.length === 0,
        'dark:border-0 border border-[#EFE9E1]': true
      }"
    >
      <img v-if="!isGenerating" src="/Instacart_Carrot.svg" alt="Instacart" class="w-[22px] mr-2" />
      <span v-if="isGenerating" class="mr-2 animate-spin">
        <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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