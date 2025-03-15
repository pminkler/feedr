<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useMealPlan } from "~/composables/useMealPlan";
import { useAuth } from "~/composables/useAuth";

const {
  mealPlansState,
  getMealPlans,
  createMealPlan,
  toggleMealPlanActive,
  error: mealPlanError,
} = useMealPlan();

const { isLoggedIn } = useAuth();
const isLoading = ref(false);
const hasError = ref(false);
const isCreatingPlan = ref(false);

// Flag to track if we've initiated plan creation
const hasTriedCreatingPlan = ref(false);

// Track which plans are currently being toggled
const togglingPlans = ref<Record<string, boolean>>({});

// Function to toggle a plan's active state
const togglePlanActive = async (planId: string) => {
  if (togglingPlans.value[planId]) return; // Prevent multiple toggles at once

  togglingPlans.value[planId] = true;
  try {
    await toggleMealPlanActive(planId);
  } catch (error) {
    console.error(`Error toggling plan ${planId}:`, error);
  } finally {
    togglingPlans.value[planId] = false;
  }
};

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
    if (
      !mealPlanError.value &&
      !hasTriedCreatingPlan.value &&
      mealPlansState.value.length === 0
    ) {
      hasTriedCreatingPlan.value = true;
      isCreatingPlan.value = true;

      try {
        const newPlan = await createMealPlan({
          name: "My Meal Plan",
          color: "#3B82F6", // Primary blue color
          isActive: true,
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
      
      <UDashboardToolbar
        v-if="!isLoading && !hasError && !mealPlanError && !isCreatingPlan"
        :ui="{
          base: 'p-4',
          content: 'flex md:flex-row flex-col gap-4 w-full py-4 md:py-0',
        }"
      >
        <div class="w-full flex flex-wrap items-center gap-3">
          <!-- Select active plans -->
          <USelectMenu
            v-if="mealPlansState.length > 0"
            :items="mealPlansState.map(plan => plan.name)"
            :model-value="mealPlansState.filter(plan => plan.isActive).map(plan => plan.name)"
            placeholder="Toggle active plans"
            multiple
            searchable
            class="min-w-60 flex-1 md:w-auto"
            @update:model-value="async (selectedNames) => {
              for (const plan of mealPlansState) {
                const shouldBeActive = selectedNames.includes(plan.name);
                // Only toggle if state changed
                if (plan.isActive !== shouldBeActive) {
                  await togglePlanActive(plan.id);
                }
              }
            }"
          >
            <template #label>
              <div class="flex items-center gap-2">
                <!-- Show color dots for active plans -->
                <div class="flex -space-x-1 mr-1">
                  <div 
                    v-for="plan in mealPlansState.filter(p => p.isActive).slice(0, 3)" 
                    :key="plan.id"
                    class="w-4 h-4 rounded-full border border-white dark:border-gray-800 shadow-sm"
                    :style="{ backgroundColor: plan.color || '#3B82F6' }"
                    :title="plan.name"
                  ></div>
                  <div 
                    v-if="mealPlansState.filter(p => p.isActive).length > 3"
                    class="w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[8px] text-gray-700 dark:text-gray-300 border border-white dark:border-gray-800 shadow-sm"
                  >
                    +{{ mealPlansState.filter(p => p.isActive).length - 3 }}
                  </div>
                </div>
                
                <span>
                  {{ mealPlansState.filter(p => p.isActive).length }} active
                  <span class="text-xs text-gray-500">of {{ mealPlansState.length }}</span>
                </span>
              </div>
            </template>
            
            <!-- Custom item template with color dot -->
            <template #item="{ item, selected }">
              <div class="flex items-center gap-2">
                <!-- Color dot -->
                <div 
                  class="w-3 h-3 rounded-full flex-shrink-0" 
                  :style="{ 
                    backgroundColor: mealPlansState.find(p => p.name === item)?.color || '#3B82F6' 
                  }"
                ></div>
                
                <!-- Item label -->
                <span>{{ item }}</span>
                
                <!-- Selected checkmark -->
                <UIcon
                  v-if="selected"
                  name="i-heroicons-check"
                  class="ml-auto text-primary-500 flex-shrink-0"
                />
              </div>
            </template>
            
            <!-- Show selected plan names instead of count -->
            <template #selected-text="{ selectedLabels }">
              <span class="truncate">
                {{ selectedLabels.join(', ') }}
              </span>
            </template>
          </USelectMenu>
          
          <!-- Placeholder when no plans to keep layout consistent -->
          <div v-else class="flex-1 md:w-auto">
            <span class="text-sm text-gray-500">No active plans yet</span>
          </div>
          
          <div class="ml-auto">
            <UButton
              color="primary"
              variant="soft"
              icon="i-heroicons-plus"
              size="sm"
            >
              Add Plan
            </UButton>
          </div>
        </div>
      </UDashboardToolbar>
    </template>

    <template #body>
      <div class="p-4">
        <!-- Loading state when fetching plans -->
        <div
          v-if="isLoading"
          class="w-full flex flex-col items-center justify-center py-12 gap-3"
        >
          <ULoading color="primary" size="lg" />
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Loading meal plans...
          </p>
        </div>

        <!-- Creating plan state -->
        <div
          v-else-if="isCreatingPlan"
          class="w-full flex flex-col items-center justify-center py-12 gap-3"
        >
          <ULoading color="primary" size="md" />
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Creating your default meal plan...
          </p>
        </div>

        <!-- Error state -->
        <div
          v-else-if="hasError || mealPlanError"
          class="w-full flex justify-center py-8"
        >
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
            <h2 class="text-xl font-semibold">Your Meal Plans</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <UCard
                v-for="plan in mealPlansState"
                :key="plan.id"
                class="relative"
                :ui="{
                  body: {
                    padding: 'p-4',
                  },
                }"
                :class="{
                  'opacity-75': !plan.isActive,
                  'border-primary-500 dark:border-primary-500': plan.isActive,
                  'border-gray-200 dark:border-gray-700': !plan.isActive,
                }"
              >
                <!-- Status and toggle -->
                <div class="absolute right-3 top-3 flex items-center gap-2">
                  <UTooltip text="Toggle active state">
                    <div @click.stop.prevent class="cursor-pointer">
                      <UToggle
                        v-model="plan.isActive"
                        :loading="!!togglingPlans[plan.id]"
                        size="sm"
                        :disabled="!!togglingPlans[plan.id]"
                        @click="togglePlanActive(plan.id)"
                      />
                    </div>
                  </UTooltip>
                </div>

                <!-- Color dot and name -->
                <div class="flex items-center gap-3 mb-3 pr-12">
                  <div
                    class="w-5 h-5 rounded-full flex-shrink-0"
                    :style="{ backgroundColor: plan.color || '#3B82F6' }"
                  ></div>
                  <h3 class="text-lg font-medium truncate">{{ plan.name }}</h3>
                </div>

                <!-- Plan details -->
                <div class="text-sm text-gray-500 dark:text-gray-400">
                  <p v-if="plan.notes" class="mb-2 line-clamp-2">
                    {{ plan.notes }}
                  </p>
                  <div
                    class="flex justify-between items-center mt-3 pt-3 border-t border-gray-100 dark:border-gray-800"
                  >
                    <p class="text-xs">
                      Created:
                      {{ new Date(plan.createdAt).toLocaleDateString() }}
                    </p>

                    <!-- Active badge -->
                    <UBadge
                      :color="plan.isActive ? 'primary' : 'gray'"
                      variant="subtle"
                      size="xs"
                    >
                      {{ plan.isActive ? "Active" : "Inactive" }}
                    </UBadge>
                  </div>
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
