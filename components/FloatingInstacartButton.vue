<script setup lang="ts">
import { useRecipe } from '~/composables/useRecipe';
import { useI18n } from 'vue-i18n';
import { ref, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  ingredients: {
    type: Array,
    required: false,
    default: () => [],
  },
  recipeTitle: {
    type: String,
    default: '',
  },
  recipeInstructions: {
    type: Array,
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
const showTooltip = ref(false);
const isVisible = ref(false);
const lastScrollPosition = ref(0);
const isGenerating = ref(false);

// Handle scroll visibility
function handleScroll() {
  const currentScrollPosition = window.scrollY;

  // Show button when scrolled below 200px
  isVisible.value = currentScrollPosition > 200;

  // Store last scroll position
  lastScrollPosition.value = currentScrollPosition;
}

function toggleTooltip() {
  showTooltip.value = !showTooltip.value;
}

const instacartUrl = ref('');
const expirationTime = ref<Date | null>(null);

async function openInstacartCart() {
  // Always regenerate URL when ingredients might have been modified
  try {
    isGenerating.value = true;

    // Call our function to generate the URL with recipe data
    // Make sure we're passing properly filtered ingredients
    const filteredIngredients = props.ingredients.map((ingredient) => ({
      name: ingredient.name.trim().toLowerCase(),
      quantity: ingredient.quantity,
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
        color: 'green',
      });
    } else {
      throw new Error('Failed to generate Instacart URL');
    }
  } catch (error) {
    console.error('Error generating Instacart URL:', error);
    toast.add({
      title: t('recipe.instacart.error.title'),
      description: t('recipe.instacart.error.description'),
      color: 'red',
    });
  } finally {
    isGenerating.value = false;
  }
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll);
  handleScroll(); // Initial check
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});
</script>

<template>
  <div
    v-if="isVisible && props.ingredients.length > 0"
    class="fixed bottom-5 right-5 z-50 flex flex-col items-end transition-all duration-300"
    :class="{
      'opacity-100': isVisible,
      'opacity-0': !isVisible,
      'translate-y-0': isVisible,
      'translate-y-10': !isVisible,
    }"
  >
    <!-- Tooltip with disclosure text -->
    <div
      v-if="showTooltip"
      class="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg mb-2 text-xs max-w-[250px] text-center animated fadeIn"
    >
      <p>{{ t('recipe.instacart.tooltip') }}</p>
      <p class="mt-1 text-gray-500 text-xs">{{ t('recipe.instacart.affiliate.disclosure') }}</p>
    </div>

    <!-- Button -->
    <button
      class="rounded-full h-12 w-12 flex items-center justify-center shadow-lg bg-[#FAF1E5] text-[#003D29] dark:bg-[#003D29] dark:text-[#FAF1E5] dark:border-0 border border-[#EFE9E1]"
      @mouseenter="toggleTooltip"
      @mouseleave="toggleTooltip"
      @click="openInstacartCart"
    >
      <img v-if="!isGenerating" src="/Instacart_Carrot.svg" alt="Instacart" class="w-[22px]" />
      <span v-else class="animate-spin">
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
    </button>
  </div>
</template>

<style scoped>
.animated {
  animation-duration: 0.3s;
  animation-fill-mode: both;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fadeIn {
  animation-name: fadeIn;
}
</style>
