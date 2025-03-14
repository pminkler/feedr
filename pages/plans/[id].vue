<script setup lang="ts">
import { onMounted, ref, computed, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import { useMealPlan } from "~/composables/useMealPlan";
import { useRecipe } from "~/composables/useRecipe";
import {
  CalendarDate,
  DateFormatter,
  getLocalTimeZone,
} from "@internationalized/date";
import type { RecipeTag } from "~/types/models";

const { t } = useI18n({ useScope: "local" });
const route = useRoute();
const planId = ref(route.params.id as string);
const {
  mealPlansState,
  isLoading: mealPlanLoading,
  getMealPlanById,
  addRecipeToMealPlan,
} = useMealPlan();
const { savedRecipesState, getSavedRecipes } = useRecipe();

const isLoadingRecipes = ref(false);
const isProcessing = ref(false);
const selectedRecipes = ref<string[]>([]);
const searchQuery = ref("");
const hasChanges = ref(false);

// Date range picker setup
const df = new DateFormatter("en-US", { dateStyle: "medium" });
const today = new Date();
const dateRange = ref({
  start: new CalendarDate(
    today.getFullYear(),
    today.getMonth() + 1,
    today.getDate(),
  ),
  end: new CalendarDate(
    today.getFullYear(),
    today.getMonth() + 1,
    today.getDate() + 6,
  ), // Default to a week
});

// Computed property to get the current meal plan from the state
const currentPlan = computed(() => {
  const plan = mealPlansState.value.find((p) => p.id === planId.value);
  if (plan) {
    // Ensure mealPlanRecipes is always an array
    return {
      ...plan,
      mealPlanRecipes: Array.isArray(plan.mealPlanRecipes)
        ? plan.mealPlanRecipes
        : [],
    };
  }
  // Return a default plan if not found
  return {
    id: planId.value,
    name: `Meal Plan`,
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    mealPlanRecipes: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
});

// Load data on component mount
onMounted(async () => {
  try {
    console.log("Mounting meal plan component for ID:", planId.value);

    // Ensure dailyRecipes is initialized
    if (!dailyRecipes.value) {
      dailyRecipes.value = new Map<string, string[]>();
    }

    // Fetch the meal plan from the backend
    console.log("Fetching meal plan data...");
    await getMealPlanById(planId.value);

    // Start loading recipes in parallel
    isLoadingRecipes.value = true;
    console.log("Fetching saved recipes...");
    await getSavedRecipes();

    // Pre-select any recipes that are already in the plan
    const plan = mealPlansState.value.find((p) => p.id === planId.value);
    console.log("Found meal plan:", plan);

    // Ensure mealPlanRecipes is an array before proceeding
    const mealPlanRecipes = Array.isArray(plan?.mealPlanRecipes)
      ? plan.mealPlanRecipes
      : [];

    console.log("Meal plan recipes:", mealPlanRecipes);

    if (mealPlanRecipes.length > 0) {
      // Extract unique recipe IDs from mealPlanRecipes
      selectedRecipes.value = [
        ...new Set(mealPlanRecipes.map((mpr) => mpr.recipeId)),
      ];

      // Organize recipes by day based on dayAssignment in config
      console.log("Organizing recipes by day...");

      // Create a map to group recipes by day
      const recipesByDay = new Map<string, string[]>();

      mealPlanRecipes.forEach((mpr) => {
        if (mpr.config?.dayAssignment) {
          const dayKey = mpr.config.dayAssignment;
          console.log(`Found recipe for day ${dayKey}:`, mpr.recipeId);

          // Get existing recipes for this day or initialize empty array
          const dayRecipes = recipesByDay.get(dayKey) || [];

          // Always add the recipe to allow duplicates
          recipesByDay.set(dayKey, [...dayRecipes, mpr.recipeId]);
        }
      });

      // Set the dailyRecipes map to our new map
      dailyRecipes.value = recipesByDay;
      console.log("Daily recipes map:", Object.fromEntries(dailyRecipes.value));

      // If no days are assigned but we have recipes, assign them to the first day
      if (
        dailyRecipes.value.size === 0 &&
        selectedRecipes.value.length > 0 &&
        dateRange.value.start
      ) {
        const firstDayKey = getDateKey(dateRange.value.start);
        dailyRecipes.value.set(firstDayKey, [...selectedRecipes.value]);
      }
    }
  } catch (error) {
    console.error("Error loading data:", error);
  } finally {
    isLoadingRecipes.value = false;
  }
});

// Format recipe options for the select menu
const recipeOptions = computed(() => {
  return savedRecipesState.value.map((recipe) => {
    return {
      id: recipe.id,
      label: recipe.title || "Untitled Recipe",
      tags: recipe.tags || [],
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
    const plan = mealPlansState.value.find((p) => p.id === planId.value);

    // Ensure mealPlanRecipes is an array before proceeding
    const mealPlanRecipes = Array.isArray(plan?.mealPlanRecipes)
      ? plan.mealPlanRecipes
      : [];

    // Get the previously selected recipes
    const previouslySelected = new Set(
      mealPlanRecipes.map((r) => r.recipeId) || [],
    );

    // Find out which recipes were newly selected
    for (const item of selectedRecipes.value) {
      // Extract the ID, handling both string IDs and object selections
      const recipeId =
        typeof item === "object" && item !== null && "id" in item
          ? item.id
          : item;

      if (!previouslySelected.has(recipeId)) {
        // Default to first day if date range is available
        const defaultDay = dateRange.value.start
          ? getDateKey(dateRange.value.start)
          : new Date().toISOString().split("T")[0];

        console.log("Adding recipe to meal plan:", recipeId);

        // This will persist to the backend via GraphQL with the new config structure
        await addRecipeToMealPlan(planId.value, recipeId, {
          dayAssignment: defaultDay,
          servingSize: 1,
          mealType: "OTHER",
        });
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
  // Extract IDs from selected recipes, handling both string IDs and object selections
  const recipeIds = new Set(
    selectedRecipes.value.map((item) =>
      typeof item === "object" && item !== null && "id" in item
        ? item.id
        : item,
    ),
  );

  return savedRecipesState.value
    .filter((recipe) => recipeIds.has(recipe.id))
    .map((recipe) => {
      const nutrition = recipe.nutritionalInformation || {};

      return {
        id: recipe.id,
        label: recipe.title || "Untitled Recipe",
        tags: recipe.tags || [],
        defaultOpen: false,
        // Recipe details directly from Recipe
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
          status: nutrition.status || "PENDING",
        },
      };
    });
});

// Map to track recipes assigned to each day
// Key is date in ISO format (YYYY-MM-DD), value is array of recipe IDs
const dailyRecipes = ref<Map<string, string[]>>(new Map());

// State for the recipe selection modal
const isModalOpen = ref(false);
const selectedDayDate = ref<CalendarDate | null>(null);
const tempSelectedRecipes = ref<string[]>([]);
const modalSearchQuery = ref("");

// Handle date range changes
const handleDateRangeChanged = () => {
  // You would typically update the meal plan with the new date range here
  console.log("Date range changed:", dateRange.value);
};

// Generate an array of dates between start and end dates
const daysInRange = computed(() => {
  if (!dateRange.value.start || !dateRange.value.end) return [];

  const days = [];
  let currentDate = dateRange.value.start;

  // Add each day in the range to the array
  while (currentDate.compare(dateRange.value.end) <= 0) {
    days.push(currentDate);
    currentDate = currentDate.add({ days: 1 });
  }

  return days;
});

// Format the day header with weekday and date
const formatDayHeader = (date: CalendarDate) => {
  const dateObj = date.toDate(getLocalTimeZone());
  const weekday = new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(
    dateObj,
  );
  const month = new Intl.DateTimeFormat("en-US", { month: "short" }).format(
    dateObj,
  );
  const day = dateObj.getDate();

  return `${weekday}, ${month} ${day}`;
};

// Open the modal to add recipes to a specific day
const openAddRecipesModal = (date: CalendarDate) => {
  selectedDayDate.value = date;
  tempSelectedRecipes.value = [];
  isModalOpen.value = true;
};

// Helper function to get date string key (YYYY-MM-DD)
const getDateKey = (date: CalendarDate): string => {
  return date.toString();
};

// Get recipes for a specific day
const getRecipesForDay = (date: CalendarDate): string[] => {
  if (!dailyRecipes.value) return [];
  const dateKey = getDateKey(date);

  // Get the recipes and ensure they're all string IDs
  const recipes = dailyRecipes.value.get(dateKey) || [];
  return recipes.map((item) =>
    typeof item === "object" && item !== null && "id" in item ? item.id : item,
  );
};

// Calculate daily nutritional totals for a specific day
const getDailyNutritionTotals = (date: CalendarDate) => {
  const recipeIds = getRecipesForDay(date);
  
  // Initialize totals
  const totals = {
    calories: 0,
    fat: 0,
    carbs: 0,
    protein: 0,
    complete: false, // Track if all nutritional info is available
    anyComplete: false // Track if any nutritional info is available
  };
  
  if (recipeIds.length === 0) return totals;
  
  let completeCount = 0;
  
  // Sum up nutritional values for all recipes in the day
  recipeIds.forEach(recipeId => {
    const recipe = savedRecipesState.value.find(r => r.id === recipeId);
    if (recipe && recipe.nutritionalInformation) {
      const nutrition = recipe.nutritionalInformation;
      
      // Check if this recipe has complete nutritional information
      if (nutrition.status === "SUCCESS") {
        totals.anyComplete = true;
        completeCount++;
        
        // Sum up the values, converting string values to numbers
        totals.calories += parseFloat(nutrition.calories) || 0;
        totals.fat += parseFloat(nutrition.fat) || 0;
        totals.carbs += parseFloat(nutrition.carbs) || 0;
        totals.protein += parseFloat(nutrition.protein) || 0;
      }
    }
  });
  
  // Check if all recipes have complete nutritional info
  totals.complete = (completeCount === recipeIds.length && completeCount > 0);
  
  // Round values to 1 decimal place for display
  totals.calories = Math.round(totals.calories);
  totals.fat = Math.round(totals.fat * 10) / 10;
  totals.carbs = Math.round(totals.carbs * 10) / 10;
  totals.protein = Math.round(totals.protein * 10) / 10;
  
  return totals;
};

// Add the selected recipes to the meal plan for the selected day
const addRecipesToDay = async () => {
  if (!selectedDayDate.value || tempSelectedRecipes.value.length === 0) return;

  try {
    isProcessing.value = true;
    const dateKey = getDateKey(selectedDayDate.value);

    // Initialize dailyRecipes.value if it doesn't exist yet
    if (!dailyRecipes.value) {
      dailyRecipes.value = new Map<string, string[]>();
    }

    // Get current recipes for this day or initialize empty array
    const currentDayRecipes = dailyRecipes.value.get(dateKey) || [];

    // Create new array with all recipes (existing + new)
    const updatedDayRecipes = [...currentDayRecipes];

    // Add new recipes that aren't already in the day
    for (const item of tempSelectedRecipes.value) {
      // Extract the ID, handling both string IDs and object selections
      const savedRecipeId =
        typeof item === "object" && item !== null && "id" in item
          ? item.id
          : item;

      console.log("Processing saved recipe:", savedRecipeId);

      // Always add the recipe to allow duplicates
      updatedDayRecipes.push(savedRecipeId);

      // Add to the meal plan via backend with the new config structure
      await addRecipeToMealPlan(planId.value, savedRecipeId, {
        dayAssignment: dateKey,
        servingSize: 1,
        mealType: "OTHER",
      });

      // Keep track of all selected recipes for rendering
      if (!selectedRecipes.value.includes(savedRecipeId)) {
        selectedRecipes.value.push(savedRecipeId);
      }
    }

    // Update our daily recipes map
    dailyRecipes.value.set(dateKey, updatedDayRecipes);

    // Close the modal
    isModalOpen.value = false;
    hasChanges.value = true;
  } catch (error) {
    console.error("Error adding recipes to day:", error);
  } finally {
    isProcessing.value = false;
  }
};

// Add the selected recipes to all days in the meal plan
const addRecipesToAllDays = async () => {
  if (tempSelectedRecipes.value.length === 0 || daysInRange.value.length === 0)
    return;

  try {
    isProcessing.value = true;

    // Initialize dailyRecipes.value if it doesn't exist yet
    if (!dailyRecipes.value) {
      dailyRecipes.value = new Map<string, string[]>();
    }

    // Add recipes to each day in the date range
    for (const dayDate of daysInRange.value) {
      const dateKey = getDateKey(dayDate);

      // Get current recipes for this day or initialize empty array
      const currentDayRecipes = dailyRecipes.value.get(dateKey) || [];

      // Create new array with all recipes (existing + new)
      const updatedDayRecipes = [...currentDayRecipes];

      // Add each selected recipe to this day
      for (const item of tempSelectedRecipes.value) {
        // Extract the ID, handling both string IDs and object selections
        const savedRecipeId =
          typeof item === "object" && item !== null && "id" in item
            ? item.id
            : item;

        console.log(`Adding recipe ${savedRecipeId} to day ${dateKey}`);

        // Always add the recipe to allow duplicates
        updatedDayRecipes.push(savedRecipeId);

        // Add to the meal plan via backend with the new config structure
        await addRecipeToMealPlan(planId.value, savedRecipeId, {
          dayAssignment: dateKey,
          servingSize: 1,
          mealType: "OTHER",
        });

        // Keep track of all selected recipes for rendering
        if (!selectedRecipes.value.includes(savedRecipeId)) {
          selectedRecipes.value.push(savedRecipeId);
        }
      }

      // Update our daily recipes map for this day
      dailyRecipes.value.set(dateKey, updatedDayRecipes);
    }

    // Close the modal
    isModalOpen.value = false;
    hasChanges.value = true;
  } catch (error) {
    console.error("Error adding recipes to all days:", error);
  } finally {
    isProcessing.value = false;
  }
};

// Overall loading state
const isLoading = computed(() => {
  return mealPlanLoading.value || isLoadingRecipes.value;
});

definePageMeta({
  layout: "dashboard",
});
</script>

<template>
  <UDashboardPanel id="mealPlanDetails">
    <template #header>
      <UDashboardNavbar :title="t('mealPlan.title')" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UButton
            color="neutral"
            icon="i-heroicons-arrow-left"
            variant="ghost"
            to="/plans"
          >
            {{ t("mealPlan.backToPlans") }}
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="w-full px-4 py-2">
        <!-- Date Range Toolbar -->
        <UCard class="mb-4">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-medium">{{ t("mealPlan.planPeriod") }}</h3>

            <!-- Date Range Picker -->
            <UPopover>
              <UButton
                color="neutral"
                variant="subtle"
                icon="i-lucide-calendar"
              >
                <template v-if="dateRange.start">
                  <template v-if="dateRange.end">
                    {{ df.format(dateRange.start.toDate(getLocalTimeZone())) }}
                    - {{ df.format(dateRange.end.toDate(getLocalTimeZone())) }}
                  </template>
                  <template v-else>
                    {{ df.format(dateRange.start.toDate(getLocalTimeZone())) }}
                  </template>
                </template>
                <template v-else>
                  {{ t("mealPlan.pickDateRange") }}
                </template>
              </UButton>

              <template #content>
                <UCalendar
                  v-model="dateRange"
                  class="p-2"
                  :number-of-months="2"
                  range
                  @update:model-value="handleDateRangeChanged"
                />
              </template>
            </UPopover>
          </div>
        </UCard>

        <!-- Daily Meal Cards -->
        <div
          v-if="isLoading"
          class="py-8 flex justify-center items-center"
        ></div>

        <div v-else>
          <!-- Loop through days in the date range -->
          <div
            v-for="(dayDate, index) in daysInRange"
            :key="index"
            class="mb-4"
          >
            <UCard>
              <template #header>
                <div class="flex items-center justify-between">
                  <h3 class="text-lg font-medium">
                    {{ formatDayHeader(dayDate) }}
                  </h3>
                  <UButton
                    color="gray"
                    variant="ghost"
                    icon="i-heroicons-plus"
                    size="xs"
                    @click="openAddRecipesModal(dayDate)"
                  >
                    {{ t("mealPlan.addMeals") }}
                  </UButton>
                </div>
              </template>

              <div class="p-4">
                <!-- Daily Nutritional Summary -->
                <div v-if="getRecipesForDay(dayDate).length > 0" class="mb-4">
                  <div class="bg-neutral-50 dark:bg-neutral-900 p-3 rounded-lg">
                    <h5 class="font-medium text-sm text-neutral-900 dark:text-neutral-100 mb-2">
                      {{ t("mealPlan.dailyNutritionSummary") }}
                    </h5>
                    
                    <div v-if="getDailyNutritionTotals(dayDate).anyComplete" class="grid grid-cols-4 gap-2 text-center">
                      <div class="bg-white dark:bg-neutral-800 rounded p-2">
                        <div class="text-xs text-neutral-500 dark:text-neutral-400">{{ t("mealPlan.calories") }}</div>
                        <div class="font-semibold">{{ getDailyNutritionTotals(dayDate).calories }}</div>
                      </div>
                      <div class="bg-white dark:bg-neutral-800 rounded p-2">
                        <div class="text-xs text-neutral-500 dark:text-neutral-400">{{ t("mealPlan.protein") }}</div>
                        <div class="font-semibold">{{ getDailyNutritionTotals(dayDate).protein }}g</div>
                      </div>
                      <div class="bg-white dark:bg-neutral-800 rounded p-2">
                        <div class="text-xs text-neutral-500 dark:text-neutral-400">{{ t("mealPlan.carbs") }}</div>
                        <div class="font-semibold">{{ getDailyNutritionTotals(dayDate).carbs }}g</div>
                      </div>
                      <div class="bg-white dark:bg-neutral-800 rounded p-2">
                        <div class="text-xs text-neutral-500 dark:text-neutral-400">{{ t("mealPlan.fat") }}</div>
                        <div class="font-semibold">{{ getDailyNutritionTotals(dayDate).fat }}g</div>
                      </div>
                    </div>
                    
                    <div v-else class="text-center py-1 text-xs text-neutral-500 dark:text-neutral-400">
                      {{ t("mealPlan.nutritionalInfoPending") }}
                    </div>
                    
                    <div v-if="getDailyNutritionTotals(dayDate).anyComplete && !getDailyNutritionTotals(dayDate).complete" 
                         class="text-xs text-neutral-500 dark:text-neutral-400 mt-2 text-center">
                      {{ t("mealPlan.partialNutritionalInfo") }}
                    </div>
                  </div>
                </div>
                
                <!-- Recipes for this specific day -->
                <div v-if="getRecipesForDay(dayDate).length > 0">
                  <!-- Recipe accordions for this day -->
                  <div
                    v-for="(recipeId, recipeIndex) in getRecipesForDay(dayDate)"
                    :key="`${recipeId}-${recipeIndex}`"
                  >
                    <UAccordion
                      multiple
                      :items="
                        recipeAccordionItems.filter(
                          (item) => item.id === recipeId,
                        )
                      "
                    >
                      <!-- Recipe header -->
                      <template #default="{ item, open }">
                        <div
                          class="flex flex-col md:flex-row justify-between w-full gap-2 pr-4 pl-4 even:bg-neutral-50 odd:bg-neutral-900"
                        >
                          <div class="flex items-center gap-2">
                            <span class="font-medium">{{ item.label }}</span>
                            <!-- Show tags in the header -->
                            <div
                              class="flex gap-1"
                              v-if="item.tags && item.tags.length"
                            >
                              <span
                                v-for="tag in item.tags.slice(0, 3)"
                                :key="tag.id"
                                class="w-2 h-2 rounded-full"
                                :style="{ backgroundColor: '#' + tag.color }"
                              ></span>
                            </div>
                          </div>

                          <div
                            class="flex flex-wrap items-center gap-3 text-xs text-(--ui-text-muted) mt-1 md:mt-0"
                          >
                            <span
                              v-if="item.prep_time"
                              class="flex items-center gap-1"
                            >
                              <UIcon name="i-heroicons-clock" class="w-3 h-3" />
                              {{ t("mealPlan.prep") }}: {{ item.prep_time }}
                            </span>
                            <span
                              v-if="item.cook_time"
                              class="flex items-center gap-1"
                            >
                              <UIcon name="i-heroicons-fire" class="w-3 h-3" />
                              {{ t("mealPlan.cook") }}: {{ item.cook_time }}
                            </span>
                            <span
                              v-if="item.servings"
                              class="flex items-center gap-1"
                            >
                              <UIcon
                                name="i-heroicons-user-group"
                                class="w-3 h-3"
                              />
                              {{ item.servings }}
                            </span>
                          </div>
                        </div>
                      </template>

                      <!-- Recipe details -->
                      <template #body="{ item }">
                        <div class="space-y-6 text-sm">
                          <!-- Description -->
                          <div
                            v-if="item.description"
                            class="bg-neutral-50 dark:bg-neutral-900 p-4 rounded-lg"
                          >
                            <h5
                              class="font-medium text-neutral-900 dark:text-neutral-100 mb-2"
                            >
                              {{ t("mealPlan.description") }}
                            </h5>
                            <p class="text-neutral-700 dark:text-neutral-300">
                              {{ item.description }}
                            </p>
                          </div>

                          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <!-- Ingredients -->
                            <div
                              v-if="
                                item.ingredients && item.ingredients.length > 0
                              "
                              class="bg-neutral-50 dark:bg-neutral-900 p-4 rounded-lg"
                            >
                              <h5
                                class="font-medium text-neutral-900 dark:text-neutral-100 mb-3"
                              >
                                {{ t("mealPlan.ingredients") }}
                              </h5>
                              <ul
                                class="list-disc list-inside space-y-1 text-neutral-700 dark:text-neutral-300"
                              >
                                <li
                                  v-for="ingredient in item.ingredients"
                                  :key="ingredient.name"
                                >
                                  <span class="font-medium"
                                    >{{ ingredient.quantity }}
                                    {{ ingredient.unit }}</span
                                  >
                                  {{ ingredient.name }}
                                </li>
                              </ul>
                            </div>

                            <!-- Nutritional information -->
                            <div
                              v-if="item.nutritionalInformation"
                              class="bg-neutral-50 dark:bg-neutral-900 p-4 rounded-lg"
                            >
                              <h5
                                class="font-medium text-neutral-900 dark:text-neutral-100 mb-3"
                              >
                                {{ t("mealPlan.nutritionalInfo") }}
                              </h5>

                              <div
                                v-if="
                                  item.nutritionalInformation.status ===
                                  'SUCCESS'
                                "
                                class="space-y-2"
                              >
                                <div
                                  class="flex justify-between text-neutral-700 dark:text-neutral-300"
                                >
                                  <span>{{ t("mealPlan.calories") }}:</span>
                                  <span class="font-medium">{{
                                    item.nutritionalInformation.calories
                                  }}</span>
                                </div>
                                <div
                                  class="flex justify-between text-neutral-700 dark:text-neutral-300"
                                >
                                  <span>{{ t("mealPlan.protein") }}:</span>
                                  <span class="font-medium">{{
                                    item.nutritionalInformation.protein
                                  }}</span>
                                </div>
                                <div
                                  class="flex justify-between text-neutral-700 dark:text-neutral-300"
                                >
                                  <span>{{ t("mealPlan.fat") }}:</span>
                                  <span class="font-medium">{{
                                    item.nutritionalInformation.fat
                                  }}</span>
                                </div>
                                <div
                                  class="flex justify-between text-neutral-700 dark:text-neutral-300"
                                >
                                  <span>{{ t("mealPlan.carbs") }}:</span>
                                  <span class="font-medium">{{
                                    item.nutritionalInformation.carbs
                                  }}</span>
                                </div>
                              </div>

                              <p
                                v-else
                                class="text-(--ui-text-muted) dark:text-neutral-400 italic"
                              >
                                {{ t("mealPlan.nutritionalInfoPending") }}
                              </p>
                            </div>
                          </div>
                        </div>
                      </template>
                    </UAccordion>
                  </div>
                </div>
                <div v-else class="text-center py-4 text-gray-500">
                  {{ t("mealPlan.noMealsForDay") }}
                </div>
              </div>
            </UCard>
          </div>

          <!-- Empty state if no recipes in entire plan -->
          <div
            v-if="
              !daysInRange.length ||
              (dailyRecipes.value &&
                Array.from(dailyRecipes.value.values()).flat().length === 0)
            "
            class="text-center py-8"
          >
            <p>{{ t("mealPlan.emptyPlan") }}</p>
          </div>
        </div>
      </div>
    </template>

    <!-- Modal for adding recipes to a specific day -->
  </UDashboardPanel>

  <UModal
    v-model:open="isModalOpen"
    :title="
      selectedDayDate
        ? t('mealPlan.addMealsToDay', { day: formatDayHeader(selectedDayDate) })
        : ''
    "
  >
    <template #body>
      <UFormField :label="t('mealPlan.selectRecipes')">
        <USelectMenu
          v-model="tempSelectedRecipes"
          v-model:query="modalSearchQuery"
          :items="recipeOptions"
          :placeholder="t('mealPlan.searchRecipes')"
          option-attribute="label"
          value-attribute="id"
          multiple
          searchable
          clear-search-on-close
          :search-attributes="['label', 'tags.name']"
          class="w-full"
        >
          <template #option="{ option }">
            <div class="flex items-center gap-2">
              <span class="truncate">{{ option.label }}</span>
              <!-- Show tags if available -->
              <div
                class="flex ml-auto gap-1"
                v-if="option.tags && option.tags.length"
              >
                <span
                  v-for="tag in option.tags.slice(0, 3)"
                  :key="tag.id"
                  class="w-2 h-2 rounded-full"
                  :style="{ backgroundColor: '#' + tag.color }"
                ></span>
                <span
                  v-if="option.tags.length > 3"
                  class="text-xs text-(--ui-text-muted)"
                  >+{{ option.tags.length - 3 }}</span
                >
              </div>
            </div>
          </template>
        </USelectMenu>
      </UFormField>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton color="gray" variant="ghost" @click="isModalOpen = false">
          {{ t("mealPlan.cancel") }}
        </UButton>
        <UButton
          color="primary"
          variant="outline"
          :loading="isProcessing"
          :disabled="tempSelectedRecipes.length === 0"
          @click="addRecipesToAllDays"
        >
          {{ t("mealPlan.addToAllDays") }}
        </UButton>
        <UButton
          color="primary"
          :loading="isProcessing"
          :disabled="tempSelectedRecipes.length === 0"
          @click="addRecipesToDay"
        >
          {{ t("mealPlan.addToDay") }}
        </UButton>
      </div>
    </template>
  </UModal>
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
      "dailyNutritionSummary": "Daily Nutrition Summary",
      "partialNutritionalInfo": "Some recipes are missing nutritional information",
      "calories": "Calories",
      "protein": "Protein",
      "fat": "Fat",
      "carbs": "Carbohydrates",
      "description": "Description",
      "prep": "Prep",
      "cook": "Cook",
      "planPeriod": "Plan Period",
      "pickDateRange": "Pick a date range",
      "searchRecipes": "Search recipes...",
      "noMealsForDay": "No meals scheduled for this day",
      "addMeals": "Add",
      "addMealsToDay": "Add Meals to {day}",
      "selectRecipes": "Select Recipes",
      "cancel": "Cancel",
      "addToDay": "Add to Day",
      "addToAllDays": "Add to All Days"
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
      "dailyNutritionSummary": "Résumé Nutritionnel Quotidien",
      "partialNutritionalInfo": "Certaines recettes n'ont pas d'informations nutritionnelles",
      "calories": "Calories",
      "protein": "Protéines",
      "fat": "Matières grasses",
      "carbs": "Glucides",
      "description": "Description",
      "prep": "Préparation",
      "cook": "Cuisson",
      "planPeriod": "Période du Plan",
      "pickDateRange": "Choisir une période",
      "searchRecipes": "Rechercher des recettes...",
      "noMealsForDay": "Aucun repas prévu pour ce jour",
      "addMeals": "Ajouter",
      "addMealsToDay": "Ajouter des Repas pour {day}",
      "selectRecipes": "Sélectionner des Recettes",
      "cancel": "Annuler",
      "addToDay": "Ajouter au Jour",
      "addToAllDays": "Ajouter à Tous les Jours"
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
      "dailyNutritionSummary": "Resumen Nutricional Diario",
      "partialNutritionalInfo": "Algunas recetas no tienen información nutricional",
      "calories": "Calorías",
      "protein": "Proteínas",
      "fat": "Grasas",
      "carbs": "Carbohidratos",
      "description": "Descripción",
      "prep": "Preparación",
      "cook": "Cocción",
      "planPeriod": "Período del Plan",
      "pickDateRange": "Elegir un período",
      "searchRecipes": "Buscar recetas...",
      "noMealsForDay": "No hay comidas programadas para este día",
      "addMeals": "Añadir",
      "addMealsToDay": "Añadir Comidas para {day}",
      "selectRecipes": "Seleccionar Recetas",
      "cancel": "Cancelar",
      "addToDay": "Añadir al Día",
      "addToAllDays": "Añadir a Todos los Días"
    }
  }
}
</i18n>
