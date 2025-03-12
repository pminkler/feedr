<script setup lang="ts">
import { onMounted, ref, computed, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import { useMealPlan } from "~/composables/useMealPlan";
import { useRecipe } from "~/composables/useRecipe";
import { SavedRecipeTag } from "~/types/models";

const { t } = useI18n({ useScope: "local" });
const route = useRoute();
const planId = ref(route.params.id as string);
const { mealPlansState, isLoading: mealPlanLoading, getMealPlanById, addRecipeToMealPlan } = useMealPlan();
const { savedRecipesState, getSavedRecipes } = useRecipe();

const isLoadingRecipes = ref(false);
const isProcessing = ref(false);
const selectedRecipes = ref<string[]>([]);
const searchQuery = ref("");
const hasChanges = ref(false);

// Computed property to get the current meal plan from the state
const currentPlan = computed(() => {
  const plan = mealPlansState.value.find(p => p.id === planId.value);
  if (plan) {
    return plan;
  }
  // Return a default plan if not found
  return {
    id: planId.value,
    recipes: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
});

// Load data on component mount
onMounted(async () => {
  try {
    // Fetch the meal plan from the backend
    await getMealPlanById(planId.value);
    
    // Start loading recipes in parallel
    isLoadingRecipes.value = true;
    await getSavedRecipes();
    
    // Pre-select any recipes that are already in the plan
    const plan = mealPlansState.value.find(p => p.id === planId.value);
    if (plan && plan.recipes.length > 0) {
      selectedRecipes.value = plan.recipes.map(recipe => recipe.id);
    }
  } catch (error) {
    console.error("Error loading data:", error);
  } finally {
    isLoadingRecipes.value = false;
  }
});

// Format recipe options for the select menu
const recipeOptions = computed(() => {
  return savedRecipesState.value.map(savedRecipe => {
    return {
      id: savedRecipe.recipeId,
      label: savedRecipe.recipe?.title || "Untitled Recipe",
      tags: savedRecipe.tags || [],
    };
  });
});

// Handle changes in selected recipes
const handleRecipesChanged = (newSelectedRecipes: string[]) => {
  hasChanges.value = true;
};

// Add selected recipes to the meal plan and persist to backend
const updateMealPlan = async () => {
  if (isProcessing.value || !hasChanges.value) return;
  
  try {
    isProcessing.value = true;
    
    // Get the current state of the meal plan
    const plan = mealPlansState.value.find(p => p.id === planId.value);
    
    // Get the previously selected recipes
    const previouslySelected = new Set(plan?.recipes.map(r => r.id) || []);
    
    // Find out which recipes were newly selected
    for (const recipeId of selectedRecipes.value) {
      if (!previouslySelected.has(recipeId)) {
        // This will persist to the backend via GraphQL
        await addRecipeToMealPlan(planId.value, recipeId);
      }
    }
    
    // Note: We don't handle removal here - that would be a separate feature
    
    hasChanges.value = false;
  } catch (error) {
    console.error("Error updating meal plan:", error);
  } finally {
    isProcessing.value = false;
  }
};

// Prepare all recipes for the accordion
const recipeAccordionItems = computed(() => {
  const recipeIds = new Set(selectedRecipes.value);
  
  return savedRecipesState.value
    .filter(savedRecipe => recipeIds.has(savedRecipe.recipeId))
    .map(savedRecipe => {
      const recipe = savedRecipe.recipe || {};
      const nutrition = recipe.nutritionalInformation || {};
      
      return {
        id: savedRecipe.recipeId,
        label: recipe.title || "Untitled Recipe",
        tags: savedRecipe.tags || [],
        defaultOpen: false,
        // Recipe details
        ingredients: recipe.ingredients || [],
        description: recipe.description || "",
        prep_time: recipe.prep_time || "",
        cook_time: recipe.cook_time || "",
        servings: recipe.servings || "",
        // Nutritional information
        nutritionalInformation: {
          calories: nutrition.calories || "",
          fat: nutrition.fat || "",
          carbs: nutrition.carbs || "",
          protein: nutrition.protein || "",
          status: nutrition.status || "PENDING"
        }
      };
    });
});

// Overall loading state
const isLoading = computed(() => {
  return mealPlanLoading.value || isLoadingRecipes.value;
});

definePageMeta({
  middleware: "auth",
  layout: "dashboard",
});
</script>

<template>
  <UDashboardPage>
    <UDashboardPanel grow>
      <UDashboardNavbar :title="t('mealPlan.title')"></UDashboardNavbar>
      
      <UDashboardPanelContent>
        <div class="w-full p-4">
          <UAlert
            class="mb-6"
            icon="material-symbols:info"
            color="blue"
            variant="soft"
            :title="t('mealPlan.newPlanCreated')"
          />
          
          <UCard class="mb-6">
            <template #header>
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-medium">{{ t('mealPlan.details') }}</h3>
              </div>
            </template>
            
            <div v-if="isLoading" class="py-8 flex justify-center items-center">
              <ULoadingIndicator size="lg" />
            </div>
            
            <div v-else class="space-y-4">
              <div>
                <UFormGroup :label="t('mealPlan.addRecipe')">
                  <USelectMenu
                    v-model="selectedRecipes"
                    v-model:query="searchQuery"
                    :options="recipeOptions"
                    placeholder="Search recipes..."
                    option-attribute="label"
                    value-attribute="id"
                    multiple
                    searchable
                    clear-search-on-close
                    :search-attributes="['label', 'tags.name']"
                    @update:model-value="handleRecipesChanged"
                  >
                    <template #option="{ option }">
                      <div class="flex items-center gap-2">
                        <span class="truncate">{{ option.label }}</span>
                        <!-- Show tags if available -->
                        <div class="flex ml-auto gap-1" v-if="option.tags && option.tags.length">
                          <span
                            v-for="tag in option.tags.slice(0, 3)"
                            :key="tag.id"
                            class="w-2 h-2 rounded-full"
                            :style="{ backgroundColor: '#' + tag.color }"
                          ></span>
                          <span v-if="option.tags.length > 3" class="text-xs text-gray-500">+{{ option.tags.length - 3 }}</span>
                        </div>
                      </div>
                    </template>
                  </USelectMenu>
                </UFormGroup>
              </div>
              
              <div v-if="selectedRecipes.length > 0">
                <h4 class="font-medium mb-2">{{ t('mealPlan.recipesInPlan') }}</h4>
                
                <!-- Recipe accordions - single level -->
                <UAccordion 
                  multiple
                  :items="recipeAccordionItems"
                >
                  <!-- Recipe header -->
                  <template #default="{ item, open }">
                    <div class="flex items-center justify-between w-full">
                      <div class="flex items-center gap-2">
                        <span class="font-medium">{{ item.label }}</span>
                        <!-- Show tags in the header -->
                        <div class="flex gap-1" v-if="item.tags && item.tags.length">
                          <span
                            v-for="tag in item.tags.slice(0, 3)"
                            :key="tag.id"
                            class="w-2 h-2 rounded-full"
                            :style="{ backgroundColor: '#' + tag.color }"
                          ></span>
                        </div>
                      </div>
                      <div class="flex items-center gap-2 text-xs text-gray-500">
                        <span v-if="item.prep_time" class="flex items-center gap-1">
                          <UIcon name="i-heroicons-clock" class="w-3 h-3" />
                          {{ t('mealPlan.prep') }}: {{ item.prep_time }}
                        </span>
                        <span v-if="item.cook_time" class="flex items-center gap-1">
                          <UIcon name="i-heroicons-fire" class="w-3 h-3" />
                          {{ t('mealPlan.cook') }}: {{ item.cook_time }}
                        </span>
                        <span v-if="item.servings" class="flex items-center gap-1">
                          <UIcon name="i-heroicons-user-group" class="w-3 h-3" />
                          {{ item.servings }}
                        </span>
                      </div>
                    </div>
                  </template>
                  
                  <!-- Recipe details -->
                  <template #item="{ item }">
                    <div class="space-y-4 text-sm">
                      <!-- Description -->
                      <p v-if="item.description" class="text-gray-700 dark:text-gray-300">
                        {{ item.description }}
                      </p>
                      
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <!-- Ingredients -->
                        <div v-if="item.ingredients && item.ingredients.length > 0">
                          <h5 class="font-medium text-gray-900 dark:text-gray-100 mb-2">
                            {{ t('mealPlan.ingredients') }}
                          </h5>
                          <ul class="list-disc list-inside text-gray-700 dark:text-gray-300">
                            <li v-for="ingredient in item.ingredients" :key="ingredient.name" class="ml-2">
                              {{ ingredient.quantity }} {{ ingredient.unit }} {{ ingredient.name }}
                            </li>
                          </ul>
                        </div>
                        
                        <!-- Nutritional information -->
                        <div v-if="item.nutritionalInformation">
                          <h5 class="font-medium text-gray-900 dark:text-gray-100 mb-2">
                            {{ t('mealPlan.nutritionalInfo') }}
                          </h5>
                          
                          <div v-if="item.nutritionalInformation.status === 'SUCCESS'" class="space-y-1">
                            <div class="flex items-center justify-between">
                              <span>{{ t('mealPlan.calories') }}:</span>
                              <span class="font-medium">{{ item.nutritionalInformation.calories }}</span>
                            </div>
                            <div class="flex items-center justify-between">
                              <span>{{ t('mealPlan.protein') }}:</span>
                              <span class="font-medium">{{ item.nutritionalInformation.protein }}</span>
                            </div>
                            <div class="flex items-center justify-between">
                              <span>{{ t('mealPlan.fat') }}:</span>
                              <span class="font-medium">{{ item.nutritionalInformation.fat }}</span>
                            </div>
                            <div class="flex items-center justify-between">
                              <span>{{ t('mealPlan.carbs') }}:</span>
                              <span class="font-medium">{{ item.nutritionalInformation.carbs }}</span>
                            </div>
                          </div>
                          
                          <p v-else class="text-gray-500 dark:text-gray-400 italic">
                            {{ t('mealPlan.nutritionalInfoPending') }}
                          </p>
                        </div>
                      </div>
                    </div>
                  </template>
                </UAccordion>
              </div>
              
              <p v-else>{{ t('mealPlan.emptyPlan') }}</p>
            </div>
            
            <template #footer>
              <div class="flex justify-between">
                <UButton
                  color="primary"
                  :loading="isProcessing"
                  :disabled="!hasChanges"
                  @click="updateMealPlan"
                >
                  {{ t('mealPlan.saveChanges') }}
                </UButton>
                
                <UButton
                  color="gray"
                  icon="i-heroicons-arrow-left"
                  variant="ghost"
                  to="/plans"
                >
                  {{ t('mealPlan.backToPlans') }}
                </UButton>
              </div>
            </template>
          </UCard>
        </div>
      </UDashboardPanelContent>
    </UDashboardPanel>
  </UDashboardPage>
</template>

<i18n lang="json">
{
  "en": {
    "mealPlan": {
      "title": "Meal Plan Details",
      "newPlanCreated": "New Meal Plan Created",
      "details": "Plan Details",
      "emptyPlan": "This meal plan is currently empty. Use the search above to add recipes.",
      "backToPlans": "Back to Plans",
      "addRecipe": "Add Recipes to Plan",
      "recipesInPlan": "Recipes in this plan",
      "saveChanges": "Save Changes",
      "ingredients": "Ingredients",
      "nutritionalInfo": "Nutritional Information",
      "nutritionalInfoPending": "Nutritional information is being processed",
      "calories": "Calories",
      "protein": "Protein",
      "fat": "Fat",
      "carbs": "Carbohydrates",
      "prep": "Prep",
      "cook": "Cook"
    }
  },
  "fr": {
    "mealPlan": {
      "title": "Détails du Plan de Repas",
      "newPlanCreated": "Nouveau Plan de Repas Créé",
      "details": "Détails du Plan",
      "emptyPlan": "Ce plan de repas est actuellement vide. Utilisez la recherche ci-dessus pour ajouter des recettes.",
      "backToPlans": "Retour aux Plans",
      "addRecipe": "Ajouter des Recettes au Plan",
      "recipesInPlan": "Recettes dans ce plan",
      "saveChanges": "Enregistrer les Modifications",
      "ingredients": "Ingrédients",
      "nutritionalInfo": "Informations Nutritionnelles",
      "nutritionalInfoPending": "Les informations nutritionnelles sont en cours de traitement",
      "calories": "Calories",
      "protein": "Protéines",
      "fat": "Matières grasses",
      "carbs": "Glucides",
      "prep": "Préparation",
      "cook": "Cuisson"
    }
  },
  "es": {
    "mealPlan": {
      "title": "Detalles del Plan de Comidas",
      "newPlanCreated": "Nuevo Plan de Comidas Creado",
      "details": "Detalles del Plan",
      "emptyPlan": "Este plan de comidas está actualmente vacío. Utiliza la búsqueda de arriba para añadir recetas.",
      "backToPlans": "Volver a los Planes",
      "addRecipe": "Añadir Recetas al Plan",
      "recipesInPlan": "Recetas en este plan",
      "saveChanges": "Guardar Cambios",
      "ingredients": "Ingredientes",
      "nutritionalInfo": "Información Nutricional",
      "nutritionalInfoPending": "La información nutricional está siendo procesada",
      "calories": "Calorías",
      "protein": "Proteínas",
      "fat": "Grasas",
      "carbs": "Carbohidratos",
      "prep": "Preparación",
      "cook": "Cocción"
    }
  }
}
</i18n>