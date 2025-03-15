<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useMealPlan } from "~/composables/useMealPlan";
import { useAuth } from "~/composables/useAuth";

const { 
  mealPlansState, 
  getMealPlans,
  createMealPlan,
  toggleMealPlanActive,
  error: mealPlanError
} = useMealPlan();

const { isLoggedIn } = useAuth();
const isLoading = ref(false);
const hasError = ref(false);
const isCreatingPlan = ref(false);

// Flag to track if we've initiated plan creation
const hasTriedCreatingPlan = ref(false);

onMounted(async () => {
  isLoading.value = true;
  hasError.value = false;
  
  try {
    // First, get existing meal plans
    await getMealPlans();
    
    // Only create a plan if:
    // 1. We successfully loaded existing plans (no error)
    // 2. No plans were found
    // 3. We haven't already tried to create one in this session
    if (!mealPlanError.value && 
        !hasTriedCreatingPlan.value && 
        mealPlansState.value.length === 0) {
      
      hasTriedCreatingPlan.value = true;
      isCreatingPlan.value = true;
      
      try {
        const newPlan = await createMealPlan({
          name: "My Meal Plan",
          color: "#3B82F6", // Primary blue color
          isActive: true
        });
        
        if (newPlan) {
          console.log("Created new default meal plan:", newPlan.id);
        } else {
          console.warn("Failed to create default meal plan");
        }
      } catch (createError) {
        console.error("Error creating meal plan:", createError);
      } finally {
        isCreatingPlan.value = false;
      }
    }
  } catch (error) {
    console.error("Error loading meal plans:", error);
    hasError.value = true;
  } finally {
    isLoading.value = false;
  }
});
</script>

<template>
  <UDashboardPanel id="meal-planning">
    <template #header>
      <UDashboardNavbar title="Meal Planning" icon="i-heroicons-calendar">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-4">
        <!-- Loading state when fetching plans -->
        <div v-if="isLoading" class="w-full flex flex-col items-center justify-center py-12 gap-3">
          <ULoading color="primary" size="lg" />
          <p class="text-sm text-gray-600 dark:text-gray-400">Loading meal plans...</p>
        </div>
        
        <!-- Creating plan state -->
        <div v-else-if="isCreatingPlan" class="w-full flex flex-col items-center justify-center py-12 gap-3">
          <ULoading color="primary" size="md" />
          <p class="text-sm text-gray-600 dark:text-gray-400">Creating your default meal plan...</p>
        </div>
        
        <!-- Error state -->
        <div v-else-if="hasError || mealPlanError" class="w-full flex justify-center py-8">
          <UAlert
            class="w-full md:w-2/3"
            icon="i-heroicons-exclamation-triangle"
            color="red"
            title="Error Loading Meal Plans"
            description="There was a problem loading your meal plans. Please refresh the page to try again."
          >
            <template #footer>
              <div class="flex justify-end">
                <UButton
                  color="red"
                  variant="ghost"
                  icon="i-heroicons-arrow-path"
                  @click="window.location.reload()"
                >
                  Refresh Page
                </UButton>
              </div>
            </template>
          </UAlert>
        </div>
        
        <!-- Content state -->
        <div v-else>
          <!-- Show a basic list of meal plans -->
          <div v-if="mealPlansState.length > 0" class="space-y-4">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-xl font-semibold">Your Meal Plans</h2>
              <UButton
                v-if="isLoggedIn"
                color="primary"
                variant="soft"
                icon="i-heroicons-plus"
                size="sm"
              >
                Add Plan
              </UButton>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <UCard 
                v-for="plan in mealPlansState" 
                :key="plan.id"
                class="relative"
                :ui="{
                  body: {
                    padding: 'p-4'
                  }
                }"
              >
                <!-- Status indicator -->
                <UBadge 
                  v-if="plan.isActive" 
                  class="absolute right-3 top-3" 
                  color="primary" 
                  variant="solid" 
                  size="xs"
                >
                  Active
                </UBadge>
                
                <!-- Color dot -->
                <div class="flex items-center gap-3 mb-3">
                  <div 
                    class="w-4 h-4 rounded-full" 
                    :style="{ backgroundColor: plan.color || '#3B82F6' }"
                  ></div>
                  <h3 class="text-lg font-medium">{{ plan.name }}</h3>
                </div>
                
                <!-- Plan details -->
                <div class="text-sm text-gray-500 dark:text-gray-400">
                  <p v-if="plan.notes" class="mb-2">{{ plan.notes }}</p>
                  <p class="text-xs">
                    Created: {{ new Date(plan.createdAt).toLocaleDateString() }}
                  </p>
                </div>
              </UCard>
            </div>
          </div>
          
          <!-- No meal plans yet -->
          <div v-else class="w-full flex justify-center py-8">
            <UAlert
              class="w-full md:w-2/3"
              icon="i-heroicons-information-circle"
              color="warning"
              title="No Meal Plans"
              description="You don't have any meal plans yet. We'll try to create a default plan for you."
            >
              <template #footer>
                <div class="flex justify-end">
                  <UButton
                    color="primary"
                    icon="i-heroicons-plus"
                    size="sm"
                    @click="window.location.reload()"
                  >
                    Refresh Page
                  </UButton>
                </div>
              </template>
            </UAlert>
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>