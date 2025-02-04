<script setup lang="ts">
import { ref, onMounted, PropType } from "vue";

const isOpen = defineModel("isOpen");

const props = defineProps({
  recipe: {
    type: Object as PropType<Recipe>,
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
  return props.recipe.ingredients.filter((ingredient) => {
    return (
      ingredient.stepMapping &&
      ingredient.stepMapping.includes(currentStepIndex)
    );
  });
};

onMounted(() => {
  window.addEventListener("keydown", handleKeyDown);
});

const handleKeyDown = (event) => {
  if (isOpen.value) {
    if (event.key === "ArrowRight") {
      nextStep();
    } else if (event.key === "ArrowLeft") {
      prevStep();
    }
  }
};
</script>

Code snippet

<template>
  <UModal fullscreen v-if="isOpen" v-model="isOpen" @keydown="handleKeyDown">
    <UContainer class="w-full md:w-3/4">
      <UPageHeader
        headline="Cooking Mode"
        :title="recipe.title"
        :links="[
          {
            icon: 'heroicons:chevron-left',
            click: prevStep,
            disabled: currentStep === 0,
            variant: 'ghost',
          },
          {
            icon: 'heroicons:chevron-right',
            click: nextStep,
            disabled: currentStep === recipe.instructions.length - 1,
            variant: 'ghost',
          },
          {
            label: 'Close',
            click: () => (isOpen = false),
            variant: 'ghost',
          },
        ]"
      />

      <div class="flex flex-col h-full lg:flex-row">
        <div class="lg:w-3/4 p-8 overflow-y-auto">
          <p class="text-lg font-medium mb-2">
            Step {{ currentStep + 1 }} of {{ recipe.instructions.length }}
          </p>
          <p class="text-xl">{{ recipe.instructions[currentStep] }}</p>
        </div>

        <div
          class="lg:w-1/4 p-8 overflow-y-auto"
          v-if="getRelevantIngredients().length"
        >
          <h3 class="text-xl font-bold mb-4">Relevant Ingredients</h3>
          <ul class="list-disc pl-5 space-y-2">
            <li
              v-for="ingredient in getRelevantIngredients()"
              :key="ingredient.name"
            >
              {{ ingredient.quantity }} {{ ingredient.unit }}
              {{ ingredient.name }}
            </li>
          </ul>
        </div>
      </div>
    </UContainer>
  </UModal>
</template>

<style module scoped></style>

<style module scoped></style>
