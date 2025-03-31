<script setup lang="ts">
import { ref, computed, defineEmits, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRecipe } from '~/composables/useRecipe';
import { useMealPlan } from '~/composables/useMealPlan';
import type { Recipe, MealPlan, MealType } from '~/types/models';

const { t } = useI18n({ useScope: 'local' });
const isOpen = ref(true);
const selectedRecipes = ref<string[]>([]);
const servings = ref(2);
const addToAllDays = ref(false);
const selectedMealPlans = ref<string[]>([]);
const isLoading = ref(false);
const mealType = ref<MealType>('OTHER');

// Get recipes and meal plans
const { myRecipesState, getMyRecipes } = useRecipe();
const { mealPlansState, getMealPlans, addRecipeToMealPlan, getCurrentWeekDays } = useMealPlan();

// Define props: date is the selected date to add a meal to
const props = defineProps<{
  date: string;
}>();

// Define emits: close event
const emit = defineEmits(['close', 'mealAdded']);

// Load recipes and meal plans on component mount
onMounted(async () => {
  isLoading.value = true;
  // First get recipes once
  await Promise.all([getMyRecipes(), getMealPlans()]);

  // If there are active meal plans, select them by default
  const activePlans = mealPlansState.value.filter((plan) => plan.isActive).map((plan) => plan.id);

  if (activePlans.length > 0) {
    selectedMealPlans.value = activePlans;
  }

  // Debug output after loading
  console.log('Loaded meal plans:', mealPlansState.value);
  console.log('Loaded my recipes:', myRecipesState.value);

  isLoading.value = false;
});

const formattedDate = computed(() => {
  if (!props.date) return '';

  // Parse the ISO date string (YYYY-MM-DD) and create a Date object
  // Add a time component so it's interpreted in the user's timezone
  const localDate = new Date(`${props.date}T00:00:00`);

  // Format the date in the user's locale and timezone
  return localDate.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
});

// Close the modal
const closeModal = () => {
  isOpen.value = false;
  emit('close');
};

// Get user recipes for selection
const availableRecipes = computed(() => {
  // Create a map to prevent duplicates
  const recipeMap = new Map();

  console.log('My recipes:', myRecipesState.value.length);

  // Add my recipes
  myRecipesState.value.forEach((recipe) => {
    if (recipe && recipe.id) {
      recipeMap.set(recipe.id, recipe);
    }
  });

  // Convert map values to array
  const result = Array.from(recipeMap.values());
  console.log('Available recipes:', result.length);

  if (result.length > 0) {
    console.log('Sample recipe:', result[0]);
  }

  return result;
});

// Get all week days for "add to all days" feature
const weekDays = computed(() => {
  return getCurrentWeekDays().map((day) => day.date);
});

// Determine if form is valid for submission
const isValid = computed(() => {
  return (
    selectedRecipes.value.length > 0 && selectedMealPlans.value.length > 0 && servings.value > 0
  );
});

// Add recipes to selected meal plans
const addMeal = async () => {
  if (!isValid.value) return;

  isLoading.value = true;
  try {
    const dates = addToAllDays.value ? weekDays.value : [props.date];

    console.log('Adding meals with:');
    console.log('- Selected meal plans:', selectedMealPlans.value);
    console.log('- Selected recipes:', selectedRecipes.value);
    console.log('- Dates:', dates);
    console.log('- Servings:', servings.value);

    // Create a promise for each meal plan and recipe combination
    const promises = [];

    // First check that the plans exist
    for (const mealPlanId of selectedMealPlans.value) {
      const plan = mealPlansState.value.find((p) => p.id === mealPlanId);
      if (!plan) {
        console.error(`Selected meal plan ${mealPlanId} not found in state!`);
      } else {
        console.log(`Found meal plan: ${plan.name} (${plan.id})`);
      }

      for (const recipeId of selectedRecipes.value) {
        // Find recipe to verify it exists
        const recipe = myRecipesState.value.find((r) => r.id === recipeId);

        if (!recipe) {
          console.error(`Selected recipe ${recipeId} not found!`);
        } else {
          console.log(`Found recipe: ${recipe.title} (${recipe.id})`);
        }

        for (const date of dates) {
          console.log(`Adding recipe ${recipeId} to meal plan ${mealPlanId} on ${date}`);
          promises.push(
            addRecipeToMealPlan(mealPlanId, recipeId, {
              date,
              servingSize: servings.value,
              mealType: 'OTHER', // Default to OTHER since we removed meal type selection
            }).catch((err) => {
              console.error(`Error adding recipe ${recipeId} to plan ${mealPlanId}:`, err);
              throw err;
            })
          );
        }
      }
    }

    // Wait for all assignments to be created
    await Promise.all(promises);
    console.log('All meal assignments created successfully');

    // Emit success event
    emit('mealAdded');

    // Close the modal
    closeModal();
  } catch (error) {
    console.error('Error adding meals:', error);
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="t('addMeal.title')"
    :description="t('addMeal.description')"
    size="xl"
  >
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-base font-semibold leading-6">
          {{ t('addMeal.title') }}: {{ formattedDate }}
        </h3>
        <UButton
          color="gray"
          variant="ghost"
          icon="i-heroicons-x-mark"
          class="-my-1"
          @click="closeModal"
        />
      </div>
    </template>

    <template #body>
      <div class="p-4">
        <UForm
          :state="{
            selectedRecipes,
            selectedMealPlans,
            servings,
            addToAllDays,
          }"
        >
          <USkeleton v-if="isLoading" class="h-64" />
          <div v-else class="space-y-8">
            <!-- Recipe Selection -->
            <UFormField name="selectedRecipes" :label="t('addMeal.recipes')" required>
              <USelectMenu
                v-model="selectedRecipes"
                :items="availableRecipes"
                multiple
                valueKey="id"
                labelKey="title"
                placeholder="Select recipes"
                :searchInput="{ placeholder: 'Search recipes...' }"
                :filterFields="['title']"
                class="min-w-full min-h-[40px]"
                :ui="{ base: 'min-h-[40px] block w-full' }"
              >
                <template #item="{ item: recipe }">
                  <div class="flex items-center gap-2">
                    <img
                      v-if="recipe.imageUrl"
                      :src="recipe.imageUrl"
                      class="h-8 w-8 object-cover rounded"
                      :alt="recipe.title"
                    />
                    <UIcon v-else name="i-heroicons-document-text" class="h-5 w-5 text-gray-400" />
                    <div>
                      <div class="font-medium">{{ recipe.title }}</div>
                      <div class="text-xs text-gray-500">
                        {{ recipe.prep_time }} prep · {{ recipe.cook_time }} cook ·
                        {{ recipe.servings }} servings
                      </div>
                    </div>
                  </div>
                </template>

                <template #default="{ modelValue }">
                  <div class="flex flex-wrap gap-1">
                    <div
                      v-for="recipeId in modelValue"
                      :key="recipeId"
                      class="inline-flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded px-2 py-1"
                    >
                      <span class="text-xs">
                        {{ availableRecipes.find((r) => r.id === recipeId)?.title }}
                      </span>
                    </div>
                  </div>
                </template>
              </USelectMenu>
            </UFormField>

            <!-- Meal Plan Selection -->
            <UFormField name="selectedMealPlans" :label="t('addMeal.mealPlans')" required>
              <USelectMenu
                v-model="selectedMealPlans"
                :items="mealPlansState"
                multiple
                valueKey="id"
                labelKey="name"
                placeholder="Select meal plans"
                :searchInput="{ placeholder: 'Search meal plans...' }"
                :filterFields="['name']"
                class="min-w-full min-h-[40px]"
                :ui="{ base: 'min-h-[40px] block w-full' }"
              >
                <template #item="{ item: plan }">
                  <div class="flex items-center gap-2">
                    <div
                      class="h-4 w-4 rounded-full"
                      :style="{ backgroundColor: plan.color }"
                    ></div>
                    <span>{{ plan.name }}</span>
                  </div>
                </template>

                <template #default="{ modelValue }">
                  <div class="flex flex-wrap gap-1">
                    <div
                      v-for="planId in modelValue"
                      :key="planId"
                      class="inline-flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-full px-2 py-1"
                    >
                      <div
                        class="h-3 w-3 rounded-full"
                        :style="{
                          backgroundColor:
                            mealPlansState.find((p) => p.id === planId)?.color || '#3B82F6',
                        }"
                      ></div>
                      <span class="text-xs">{{
                        mealPlansState.find((p) => p.id === planId)?.name
                      }}</span>
                    </div>
                  </div>
                </template>
              </USelectMenu>
            </UFormField>

            <!-- Number of Servings -->
            <UFormField
              name="servings"
              :label="t('addMeal.servings')"
              :help="t('addMeal.servingsHelp')"
              required
            >
              <UInput id="servings" v-model="servings" type="number" min="1" max="20" />
            </UFormField>

            <!-- Add to All Days Toggle -->
            <UFormField name="addToAllDays" :help="t('addMeal.addToAllDaysHelp')">
              <UCheckbox v-model="addToAllDays" :label="t('addMeal.addToAllDays')" />
            </UFormField>
          </div>
        </UForm>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-3">
        <UButton color="gray" variant="soft" @click="closeModal" :disabled="isLoading">
          {{ t('addMeal.cancel') }}
        </UButton>
        <UButton
          color="primary"
          variant="solid"
          :disabled="!isValid || isLoading"
          :loading="isLoading"
          @click="addMeal"
        >
          {{ t('addMeal.add') }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<i18n lang="json">
{
  "en": {
    "addMeal": {
      "title": "Add Meal",
      "description": "Select recipes to add to your meal plans",
      "recipes": "Recipes",
      "mealPlans": "Meal Plans",
      "servings": "Number of Servings",
      "mealType": "Meal Type",
      "addToAllDays": "Add to all days of the active week",
      "addToAllDaysHelp": "This will add the selected recipes to every day in the current week view",
      "servingsHelp": "Number of people this meal will serve",
      "breakfast": "Breakfast",
      "lunch": "Lunch",
      "dinner": "Dinner",
      "snack": "Snack",
      "other": "Other",
      "selectRecipe": "Select recipes to add to your meal plan for this day.",
      "recipeSelection": "Recipe selection",
      "cancel": "Cancel",
      "add": "Add to plan"
    }
  },
  "fr": {
    "addMeal": {
      "title": "Ajouter un repas",
      "description": "Sélectionnez des recettes à ajouter à vos plans de repas",
      "recipes": "Recettes",
      "mealPlans": "Plans de repas",
      "servings": "Nombre de portions",
      "mealType": "Type de repas",
      "addToAllDays": "Ajouter à tous les jours de la semaine active",
      "addToAllDaysHelp": "Cela ajoutera les recettes sélectionnées à chaque jour de la vue de la semaine en cours",
      "servingsHelp": "Nombre de personnes que ce repas servira",
      "breakfast": "Petit-déjeuner",
      "lunch": "Déjeuner",
      "dinner": "Dîner",
      "snack": "Collation",
      "other": "Autre",
      "selectRecipe": "Sélectionnez des recettes à ajouter à votre plan pour ce jour.",
      "recipeSelection": "Sélection de recette",
      "cancel": "Annuler",
      "add": "Ajouter au plan"
    }
  },
  "es": {
    "addMeal": {
      "title": "Añadir comida",
      "description": "Seleccione recetas para añadir a sus planes de comidas",
      "recipes": "Recetas",
      "mealPlans": "Planes de comidas",
      "servings": "Número de porciones",
      "mealType": "Tipo de comida",
      "addToAllDays": "Añadir a todos los días de la semana activa",
      "addToAllDaysHelp": "Esto añadirá las recetas seleccionadas a cada día en la vista de la semana actual",
      "servingsHelp": "Número de personas que servirá esta comida",
      "breakfast": "Desayuno",
      "lunch": "Almuerzo",
      "dinner": "Cena",
      "snack": "Merienda",
      "other": "Otro",
      "selectRecipe": "Seleccione recetas para añadir a su plan para este día.",
      "recipeSelection": "Selección de receta",
      "cancel": "Cancelar",
      "add": "Añadir al plan"
    }
  }
}
</i18n>
