<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import type { PropType } from 'vue';

const { t } = useI18n({ useScope: 'local' });

interface Recipe {
  title: string;
  instructions: string[];
  ingredients: Ingredient[];
}

interface Ingredient {
  name?: string;
  quantity?: string | number;
  unit?: string | { label?: string; value?: string };
  stepMapping?: number[]; // steps where this ingredient is relevant
}

// For programmatic usage with useOverlay
const props = defineProps({
  recipe: {
    type: Object as PropType<Recipe>,
    required: true,
  },
  scaledIngredients: {
    type: Array as PropType<Ingredient[]>,
    required: true,
  },
});

// Emit close event for programmatic usage
const emit = defineEmits(['close']);

const currentStep = ref(0);
const touchStartX = ref(0);
const touchEndX = ref(0);
const MIN_SWIPE_DISTANCE = 50;

const nextStep = () => {
  if (currentStep.value < props.recipe.instructions.length - 1) {
    currentStep.value++;
  }
};

const prevStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--;
  }
};

const getUnitDisplay = (
  unit: string | { label?: string; value?: string } | null | undefined,
): string => {
  if (!unit) return '';
  if (typeof unit === 'object') return unit.value || '';
  return unit;
};

const getRelevantIngredients = () => {
  const currentStepIndex = currentStep.value + 1; // 1-based indexing for matching
  return props.scaledIngredients.filter((ingredient) => {
    return ingredient.stepMapping && ingredient.stepMapping.includes(currentStepIndex);
  });
};

const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'ArrowRight') {
    event.preventDefault();
    event.stopPropagation();
    nextStep();
  }
  else if (event.key === 'ArrowLeft') {
    event.preventDefault();
    event.stopPropagation();
    prevStep();
  }
  else if (event.key === 'Escape') {
    event.preventDefault();
    event.stopPropagation();
    emit('close', true);
  }
};

const handleTouchStart = (event: TouchEvent) => {
  if (event.touches?.length > 0) {
    touchStartX.value = event.touches[0]?.clientX || 0;
  }
};

const handleTouchEnd = (event: TouchEvent) => {
  if (event.changedTouches?.length > 0) {
    touchEndX.value = event.changedTouches[0]?.clientX || 0;
    handleSwipe();
  }
};

const handleSwipe = () => {
  const swipeDistance = touchEndX.value - touchStartX.value;

  if (Math.abs(swipeDistance) < MIN_SWIPE_DISTANCE) return;

  if (swipeDistance > 0) {
    // Swipe right -> previous step
    prevStep();
  }
  else {
    // Swipe left -> next step
    nextStep();
  }
};

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
  // Reset current step when modal is opened
  currentStep.value = 0;
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyDown);
});
</script>

<template>
  <UModal fullscreen @keydown="handleKeyDown">
    <template #body>
      <UContainer class="w-full md:w-3/4">
        <UPageHeader
          :headline="t('cookingMode.headline')"
          :title="recipe.title"
          :links="[
            {
              icon: 'heroicons:chevron-left',
              onClick: prevStep,
              disabled: currentStep === 0,
              variant: 'ghost',
            },
            {
              icon: 'heroicons:chevron-right',
              onClick: nextStep,
              disabled: currentStep === recipe.instructions.length - 1,
              variant: 'ghost',
            },
            {
              label: t('cookingMode.close'),
              onClick: () => emit('close', true),
              variant: 'ghost',
            },
          ]"
        />

        <div
          class="flex flex-col h-full lg:flex-row relative"
          @touchstart="handleTouchStart"
          @touchend="handleTouchEnd"
        >
          <!-- Swipe Indicators positioned at the edges with click/tap functionality -->
          <UIcon
            v-if="currentStep > 0"
            name="heroicons:chevron-left"
            class="swipe-hint swipe-hint-left cursor-pointer"
            @click="prevStep"
          />
          <UIcon
            v-if="currentStep < recipe.instructions.length - 1"
            name="heroicons:chevron-right"
            class="swipe-hint swipe-hint-right cursor-pointer"
            @click="nextStep"
          />
          <div class="lg:w-3/4 p-8 overflow-y-auto">
            <p class="text-lg font-medium mb-2">
              {{
                t('cookingMode.stepCounter', {
                  current: currentStep + 1,
                  total: recipe.instructions.length,
                })
              }}
            </p>
            <p class="text-xl">
              {{ recipe.instructions[currentStep] }}
            </p>
          </div>

          <div v-if="getRelevantIngredients().length" class="lg:w-1/4 p-8 overflow-y-auto">
            <h3 class="text-xl font-bold mb-4">
              {{ t('cookingMode.relevantIngredients') }}
            </h3>
            <ul class="list-disc pl-5 space-y-2">
              <li v-for="ingredient in getRelevantIngredients()" :key="ingredient.name">
                <template
                  v-if="
                    ingredient.quantity
                      && String(ingredient.quantity) !== '0'
                      && !isNaN(Number(ingredient.quantity))
                  "
                >
                  {{ ingredient.quantity }}
                  {{ getUnitDisplay(ingredient.unit) }}
                </template>
                {{ ingredient.name }}
              </li>
            </ul>
          </div>
        </div>
      </UContainer>
    </template>
  </UModal>
</template>

<style scoped>
.swipe-hint {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  opacity: 0.6;
  font-size: 2rem;
  transition: all 0.2s ease;
  z-index: 10;
  cursor: pointer;
}

.swipe-hint:hover, .swipe-hint:active {
  opacity: 0.9;
}

.swipe-hint:active {
  transform: translateY(-50%) scale(0.95);
}

.swipe-hint-left {
  left: -10px;
  padding-right: 20px; /* Increase tap target area */
}

.swipe-hint-right {
  right: -10px;
  padding-left: 20px; /* Increase tap target area */
}

@media (min-width: 768px) {
  .swipe-hint {
    display: none;
  }
}
</style>

<i18n lang="json">
{
  "en": {
    "cookingMode": {
      "headline": "Cooking Mode",
      "close": "Close",
      "stepCounter": "Step {current} of {total}",
      "relevantIngredients": "Ingredients for this step",
      "swipeHint": "Swipe left or right to navigate steps"
    }
  },
  "fr": {
    "cookingMode": {
      "headline": "Mode Cuisine",
      "close": "Fermer",
      "stepCounter": "Étape {current} sur {total}",
      "relevantIngredients": "Ingrédients pour cette étape",
      "swipeHint": "Glissez à gauche ou à droite pour naviguer"
    }
  },
  "es": {
    "cookingMode": {
      "headline": "Modo Cocina",
      "close": "Cerrar",
      "stepCounter": "Paso {current} de {total}",
      "relevantIngredients": "Ingredientes para este paso",
      "swipeHint": "Deslice a la izquierda o derecha para navegar"
    }
  }
}
</i18n>
