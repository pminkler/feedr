<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import type { PropType } from 'vue';
import { useTemplateRef } from '#imports';

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

interface StepSlide {
  instruction: string;
  index: number;
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
const carousel = useTemplateRef<{
  emblaApi?: {
    scrollTo: (index: number, animate: boolean) => void;
    slidesInView: () => number[];
    selectedScrollSnap: () => number;
    scrollNext: () => void;
    scrollPrev: () => void;
    canScrollNext: () => boolean;
    canScrollPrev: () => boolean;
  };
}>('carousel');

// Generate slides for the carousel
const slides = computed<StepSlide[]>(() => {
  return props.recipe.instructions.map((instruction, index) => ({
    instruction,
    index,
  }));
});

// Compute states for navigation buttons - keeping for future use
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const isFirstSlide = computed(() => {
  if (carousel.value?.emblaApi) {
    return !carousel.value.emblaApi.canScrollPrev();
  }
  return currentStep.value === 0;
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const isLastSlide = computed(() => {
  if (carousel.value?.emblaApi) {
    return !carousel.value.emblaApi.canScrollNext();
  }
  return currentStep.value === slides.value.length - 1;
});

// Handle step changes from the carousel
const onSlideChange = (index: number) => {
  console.log('Slide changed to:', index);

  // Ensure we're using the carousel's actual current slide for the indicator
  if (carousel.value?.emblaApi) {
    // Get the actual current slide from the carousel API
    const actualIndex = carousel.value.emblaApi.selectedScrollSnap();
    console.log('API selected index:', actualIndex);

    // Use the carousel's index for our step counter
    currentStep.value = actualIndex;

    // Debug carousel state
    console.log('Can scroll next:', carousel.value.emblaApi.canScrollNext());
    console.log('Can scroll prev:', carousel.value.emblaApi.canScrollPrev());
    console.log('Slides in view:', carousel.value.emblaApi.slidesInView());
  }
  else {
    // Fallback if carousel API not available
    currentStep.value = index;
  }
};

// Add direct monitoring to update dots during and after dragging
const forceUpdateDots = () => {
  // Immediately check the carousel position and update dots
  if (carousel.value?.emblaApi) {
    const currentIndex = carousel.value.emblaApi.selectedScrollSnap();
    console.log('Updating dots:', currentIndex);
    currentStep.value = currentIndex;
  }
};

// Navigation methods that always check current carousel position first
const prevStep = () => {
  console.log('prevStep called');

  if (carousel.value?.emblaApi) {
    // Get the ACTUAL current slide from the carousel API
    const currentIndex = carousel.value.emblaApi.selectedScrollSnap();
    console.log('Current carousel position:', currentIndex);

    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      console.log('Moving to previous slide:', prevIndex);

      // Update both our ref and the carousel
      currentStep.value = prevIndex;
      carousel.value.emblaApi.scrollTo(prevIndex, true);
    }
  }
};

const nextStep = () => {
  console.log('nextStep called');

  if (carousel.value?.emblaApi) {
    // Get the ACTUAL current slide from the carousel API
    const currentIndex = carousel.value.emblaApi.selectedScrollSnap();
    console.log('Current carousel position:', currentIndex);

    if (currentIndex < slides.value.length - 1) {
      const nextIndex = currentIndex + 1;
      console.log('Moving to next slide:', nextIndex);

      // Update both our ref and the carousel
      currentStep.value = nextIndex;
      carousel.value.emblaApi.scrollTo(nextIndex, true);
    }
  }
};

// Function to go to a specific slide (for dot navigation)
const goToSlide = (index: number) => {
  currentStep.value = index;
  if (carousel.value && carousel.value.emblaApi) {
    carousel.value.emblaApi.scrollTo(index, true);
  }
};

const getUnitDisplay = (
  unit: string | { label?: string; value?: string } | null | undefined,
): string => {
  if (!unit) return '';
  if (typeof unit === 'object') return unit.value || '';
  return unit;
};

const getRelevantIngredients = (stepIndex: number) => {
  const stepNumber = stepIndex + 1; // 1-based indexing for matching
  return props.scaledIngredients.filter((ingredient) => {
    return (
      ingredient.stepMapping && ingredient.stepMapping.includes(stepNumber)
    );
  });
};

// Prevent rapid key presses
let isHandlingKeyNav = false;

const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    event.preventDefault();
    event.stopPropagation();
    emit('close', true);
    return;
  }

  // Skip if we're already handling a key navigation
  if (isHandlingKeyNav) {
    event.preventDefault();
    return;
  }

  if (event.key === 'ArrowLeft') {
    event.preventDefault();
    isHandlingKeyNav = true;
    prevStep();
    // Reset after a short delay
    setTimeout(() => {
      isHandlingKeyNav = false;
    }, 300);
  }
  else if (event.key === 'ArrowRight') {
    event.preventDefault();
    isHandlingKeyNav = true;
    nextStep();
    // Reset after a short delay
    setTimeout(() => {
      isHandlingKeyNav = false;
    }, 300);
  }
};

// Set up continual position monitoring for the carousel
let positionMonitorInterval: number | null = null;

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
  // Reset current step when modal is opened
  currentStep.value = 0;

  // Debug carousel after it's mounted and set up monitoring
  setTimeout(() => {
    if (carousel.value?.emblaApi) {
      console.log('Carousel mounted. Total slides:', slides.value.length);
      console.log(
        'Current slide:',
        carousel.value.emblaApi.selectedScrollSnap(),
      );

      // Set up a position monitor that continuously checks the carousel position
      // This ensures the dots stay in sync with the carousel regardless of how it's moved
      positionMonitorInterval = window.setInterval(() => {
        if (carousel.value?.emblaApi) {
          const currentPosition = carousel.value.emblaApi.selectedScrollSnap();
          if (currentStep.value !== currentPosition) {
            console.log('Syncing dots to position:', currentPosition);
            currentStep.value = currentPosition;
          }
        }
      }, 100);

      // Add direct event listeners for touch interactions
      const carouselElement = document.querySelector('.embla__viewport');
      if (carouselElement) {
        // Add multiple event listeners to catch all types of interaction
        carouselElement.addEventListener('touchstart', forceUpdateDots);
        carouselElement.addEventListener('touchmove', forceUpdateDots);
        carouselElement.addEventListener('touchend', forceUpdateDots);

        // Also add listeners for mouse/pointer events
        carouselElement.addEventListener('pointerdown', forceUpdateDots);
        carouselElement.addEventListener('pointermove', forceUpdateDots);
        carouselElement.addEventListener('pointerup', forceUpdateDots);

        // Handle scroll events
        carouselElement.addEventListener('scroll', forceUpdateDots);
      }
    }
  }, 500);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyDown);

  // Clean up position monitoring interval
  if (positionMonitorInterval !== null) {
    window.clearInterval(positionMonitorInterval);
  }

  // Clean up all event listeners
  const carouselElement = document.querySelector('.embla__viewport');
  if (carouselElement) {
    // Remove touch listeners
    carouselElement.removeEventListener('touchstart', forceUpdateDots);
    carouselElement.removeEventListener('touchmove', forceUpdateDots);
    carouselElement.removeEventListener('touchend', forceUpdateDots);

    // Remove pointer listeners
    carouselElement.removeEventListener('pointerdown', forceUpdateDots);
    carouselElement.removeEventListener('pointermove', forceUpdateDots);
    carouselElement.removeEventListener('pointerup', forceUpdateDots);

    // Remove scroll listener
    carouselElement.removeEventListener('scroll', forceUpdateDots);
  }
});

// Watch for carousel changes to keep dots in sync
watch(() => carousel.value?.emblaApi?.selectedScrollSnap(), (newValue) => {
  if (newValue !== undefined) {
    currentStep.value = newValue;
  }
});
</script>

<template>
  <UModal fullscreen @keydown="handleKeyDown">
    <template #header>
      <div class="flex justify-between items-center w-full">
        <div>
          <h3
            class="text-base font-medium text-primary-500 dark:text-primary-400"
          >
            {{ t("cookingMode.headline") }}
          </h3>
          <p class="text-xl font-semibold mt-1">
            {{ recipe.title }}
          </p>
        </div>
        <UButton
          icon="heroicons:x-mark"
          color="neutral"
          variant="ghost"
          aria-label="Close"
          class="absolute right-4 top-4"
          @click="emit('close', true)"
        />
      </div>
    </template>
    <template #body>
      <div class="flex flex-col h-full">
        <UContainer class="w-full md:w-3/4 flex-grow flex flex-col">
          <div class="relative w-full flex-grow flex flex-col">
            <!-- Custom previous button -->
            <UButton
              icon="heroicons:chevron-left"
              color="neutral"
              variant="link"
              class="absolute -left-7 top-1/2 -translate-y-1/2 z-10 nav-button"
              aria-label="Previous step"
              @click="prevStep"
            />

            <!-- Custom next button -->
            <UButton
              icon="heroicons:chevron-right"
              color="neutral"
              variant="link"
              class="absolute -right-7 top-1/2 -translate-y-1/2 z-10 nav-button"
              aria-label="Next step"
              @click="nextStep"
            />

            <UCarousel
              v-slot="{ item }"
              ref="carousel"
              :items="slides"
              class="w-full flex-grow flex flex-col"
              :dots="false"
              :auto-height="false"
              :skip-snaps="false"
              :drag-free="false"
              :drag-threshold="20"
              :duration="20"
              :loop="false"
              :slides-to-scroll="1"
              :align="'center'"
              :contain-scroll="'trimSnaps'"
              :ui="{
                item: 'w-full h-full',
                container: 'h-full',
                viewport: 'h-full flex flex-col',
              }"
              @change="onSlideChange"
            >
              <div class="w-full flex flex-col h-full px-2 py-4">
                <!-- Step counter -->
                <p class="text-lg font-medium mb-6 px-2">
                  {{
                    t("cookingMode.stepCounter", {
                      current: item.index + 1,
                      total: recipe.instructions.length,
                    })
                  }}
                </p>

                <div class="w-full lg:flex lg:flex-row gap-6 flex-grow">
                  <!-- Instruction -->
                  <div
                    class="lg:w-3/4 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg shadow-sm mb-6 lg:mb-0 flex-grow flex flex-col overflow-auto"
                  >
                    <p class="text-xl flex-grow">
                      {{ item.instruction }}
                    </p>
                  </div>

                  <!-- Ingredients for this step -->
                  <div
                    v-if="getRelevantIngredients(item.index).length"
                    class="lg:w-1/4 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg shadow-sm overflow-auto"
                  >
                    <h3 class="text-xl font-bold mb-4">
                      {{ t("cookingMode.relevantIngredients") }}
                    </h3>
                    <ul class="list-disc pl-5 space-y-2">
                      <li
                        v-for="ingredient in getRelevantIngredients(item.index)"
                        :key="ingredient.name"
                      >
                        <template
                          v-if="
                            ingredient.quantity
                              && String(ingredient.quantity) !== '0'
                              && !isNaN(Number(ingredient.quantity))
                          "
                        >
                          <span class="font-medium">{{
                            ingredient.quantity
                          }}</span>
                          {{ getUnitDisplay(ingredient.unit) }}
                        </template>
                        {{ ingredient.name }}
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </UCarousel>
          </div>
        </UContainer>
      </div>
    </template>
    <template #footer>
      <div class="flex justify-center w-full py-4 sticky bottom-0">
        <!-- Custom dot navigation -->
        <div class="flex gap-2">
          <button
            v-for="(_, i) in slides"
            :key="i"
            class="w-3 h-3 rounded-full transition-colors duration-200 focus:outline-none"
            :class="currentStep === i ? 'bg-orange-500' : 'bg-gray-300 dark:bg-gray-600'"
            :aria-label="`Go to step ${i + 1}`"
            @click="goToSlide(i)"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>

<style scoped>
/* Custom styling for the carousel */
:deep(.embla__slide) {
  flex: 0 0 100%;
  min-width: 0;
  height: 100%;
}

:deep(.embla) {
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-direction: column;
}

:deep(.embla__viewport) {
  overflow: hidden;
  width: 100%;
  height: 100%;
  flex-grow: 1;
}

:deep(.embla__container) {
  display: flex;
  user-select: none;
  -webkit-touch-callout: none;
  -webkit-tap-highlight-color: transparent;
  height: 100%;
}

/* Style for custom navigation buttons */
.nav-button {
  background-color: transparent !important;
  border: none !important;
  box-shadow: none !important;
  padding: 0.5rem !important;
  transition: transform 0.2s ease-in-out;
}

.nav-button svg {
  width: 28px;
  height: 28px;
  color: var(--color-neutral-500);
}

.nav-button:hover svg {
  color: var(--color-primary-500);
}

.nav-button:focus {
  outline: none !important;
  box-shadow: none !important;
}

.nav-button:active {
  transform: scale(0.95) translateY(-50%);
}

@media (max-width: 768px) {
  .nav-button svg {
    width: 24px;
    height: 24px;
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
