<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n({ useScope: "local" });
const isOpen = defineModel("isOpen");

interface Recipe {
  title: string;
  instructions: string[];
  ingredients: Ingredient[];
}

interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
  stepMapping?: number[]; // steps where this ingredient is relevant
}

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

const currentStep = ref(0);

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

const getRelevantIngredients = () => {
  const currentStepIndex = currentStep.value + 1; // 1-based indexing for matching
  return props.scaledIngredients.filter((ingredient) => {
    return (
      ingredient.stepMapping &&
      ingredient.stepMapping.includes(currentStepIndex)
    );
  });
};

const handleKeyDown = (event: KeyboardEvent) => {
  if (isOpen.value) {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      event.stopPropagation();
      nextStep();
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      event.stopPropagation();
      prevStep();
    }
  }
};

onMounted(() => {
  window.addEventListener("keydown", handleKeyDown);
});
</script>

<template>
  <UModal
    fullscreen
    v-if="isOpen"
    v-model:open="isOpen"
    @keydown="handleKeyDown"
  >
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
              onClick: () => (isOpen = false),
              variant: 'ghost',
            },
          ]"
        />

        <div class="flex flex-col h-full lg:flex-row">
          <div class="lg:w-3/4 p-8 overflow-y-auto">
            <p class="text-lg font-medium mb-2">
              {{
                t("cookingMode.stepCounter", {
                  current: currentStep + 1,
                  total: recipe.instructions.length,
                })
              }}
            </p>
            <p class="text-xl">{{ recipe.instructions[currentStep] }}</p>
          </div>

          <div
            class="lg:w-1/4 p-8 overflow-y-auto"
            v-if="getRelevantIngredients().length"
          >
            <h3 class="text-xl font-bold mb-4">
              {{ t("cookingMode.relevantIngredients") }}
            </h3>
            <ul class="list-disc pl-5 space-y-2">
              <li
                v-for="ingredient in getRelevantIngredients()"
                :key="ingredient.name"
              >
                <template v-if="ingredient.quantity && ingredient.quantity !== '0' && !isNaN(Number(ingredient.quantity))">
                  {{ ingredient.quantity }} {{ typeof ingredient.unit === 'object' ? ingredient.unit.value : ingredient.unit }}
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

<style module scoped></style>

<i18n lang="json">
{
  "en": {
    "cookingMode": {
      "headline": "Cooking Mode",
      "close": "Close",
      "stepCounter": "Step {current} of {total}",
      "relevantIngredients": "Ingredients for this step"
    }
  },
  "fr": {
    "cookingMode": {
      "headline": "Mode Cuisine",
      "close": "Fermer",
      "stepCounter": "Étape {current} sur {total}",
      "relevantIngredients": "Ingrédients pour cette étape"
    }
  },
  "es": {
    "cookingMode": {
      "headline": "Modo Cocina",
      "close": "Cerrar",
      "stepCounter": "Paso {current} de {total}",
      "relevantIngredients": "Ingredientes para este paso"
    }
  }
}
</i18n>
