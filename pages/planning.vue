<script setup lang="ts">
import { onMounted, ref, computed } from "vue";
import { useMealPlan } from "~/composables/useMealPlan";
import { useAuth } from "~/composables/useAuth";
import AddMealModal from "~/components/AddMealModal.vue";

const {
  mealPlansState,
  mealAssignmentsState,
  getMealPlans,
  createMealPlan,
  toggleMealPlanActive,
  getMealAssignmentsForDate,
  getCurrentWeekDays,
  previousWeek,
  nextWeek,
  goToCurrentWeek,
  currentWeekOffset,
  removeMealAssignment,
  error: mealPlanError,
} = useMealPlan();

const { isLoggedIn } = useAuth();
const overlay = useOverlay();
const isLoading = ref(false);
const hasError = ref(false);
const isCreatingPlan = ref(false);

// Flag to track if we've initiated plan creation
const hasTriedCreatingPlan = ref(false);

// Track which plans are currently being toggled
const togglingPlans = ref<Record<string, boolean>>({});

// Track the selected date for meal assignments
const selectedDate = ref("");

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

// Wrapper function for removeMealAssignment to add logging
const handleRemoveMealAssignment = async (assignmentId: string) => {
  console.log(`Attempting to remove meal assignment: ${assignmentId}`);
  try {
    await removeMealAssignment(assignmentId);
    console.log(`Successfully removed meal assignment: ${assignmentId}`);
  } catch (error) {
    console.error(`Failed to remove meal assignment: ${assignmentId}`, error);
  }
};

// Get week days starting from Monday
const weekDays = computed(() => {
  // The getCurrentWeekDays now returns days starting from Monday
  return getCurrentWeekDays();
});

// Function to determine if a day is in the past
const isDayInPast = (dateString: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time to start of day
  const date = new Date(dateString);
  return date < today;
};

// Only show days from today onwards if we're in the current week
const visibleWeekDays = computed(() => {
  // If we're not in the current week, show all days
  if (currentWeekOffset.value !== 0) {
    return weekDays.value;
  }

  // If we're in the current week, only show today and future days
  return weekDays.value.filter((day) => !isDayInPast(day.date) || day.isToday);
});

// Calculate week date range for display
const weekDateRange = computed(() => {
  if (weekDays.value.length === 0) return "";

  // Use the dates directly from weekDays to avoid any timezone conversions
  // that might happen when creating new Date objects
  const dates = weekDays.value.map((day) => day.date);

  // Convert ISO strings to Date objects with timezone handling
  const firstDay = new Date(dates[0] + "T00:00:00");
  const lastDay = new Date(dates[dates.length - 1] + "T00:00:00");

  // Force both dates to be in the user's local timezone
  const formatFirstDay = new Date(
    firstDay.getTime() - firstDay.getTimezoneOffset() * 60000,
  );
  const formatLastDay = new Date(
    lastDay.getTime() - lastDay.getTimezoneOffset() * 60000,
  );

  // Directly display the day values from the week days array for accuracy
  // to avoid any math errors with timezone conversion
  return `${weekDays.value[0].dayNumber}-${weekDays.value[weekDays.value.length - 1].dayNumber} ${weekDays.value[0].monthName} ${new Date(dates[0]).getFullYear()}`;
});

// Determine if we can navigate to the previous week (don't allow past weeks)
const canNavigateToPreviousWeek = computed(() => {
  // If we're already in a future week, we can go back
  return currentWeekOffset.value > 0;
});

// Function to open the add meal dialog
const openAddMealDialog = async (date: string) => {
  selectedDate.value = date;

  const modal = overlay.create(AddMealModal, {
    props: {
      date: date,
    },
    events: {
      // Event handler for when a meal is added
      mealAdded: async () => {
        // Reload assignments for the active plans
        const activePlans = mealPlansState.value.filter(
          (plan) => plan.isActive,
        );
        if (activePlans.length > 0) {
          await getMealAssignments(activePlans.map((plan) => plan.id));
        }
      },
    },
  });

  await modal.open();
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
            :items="mealPlansState.map((plan) => plan.name)"
            :model-value="
              mealPlansState
                .filter((plan) => plan.isActive)
                .map((plan) => plan.name)
            "
            placeholder="Toggle active plans"
            multiple
            searchable
            class="min-w-60 flex-1 md:w-auto"
            label="Displayed plans"
            icon="i-heroicons-clipboard-document-check"
            @update:model-value="
              async (selectedNames) => {
                for (const plan of mealPlansState) {
                  const shouldBeActive = selectedNames.includes(plan.name);
                  // Only toggle if state changed
                  if (plan.isActive !== shouldBeActive) {
                    await togglePlanActive(plan.id);
                  }
                }
              }
            "
          >
            <template #label>
              <div class="flex items-center gap-2">
                <!-- Show color dots for active plans -->
                <div class="flex -space-x-1 mr-1">
                  <div
                    v-for="plan in mealPlansState
                      .filter((p) => p.isActive)
                      .slice(0, 3)"
                    :key="plan.id"
                    class="w-4 h-4 rounded-full border border-white dark:border-gray-800 shadow-sm"
                    :style="{ backgroundColor: plan.color || '#3B82F6' }"
                    :title="plan.name"
                  ></div>
                  <div
                    v-if="mealPlansState.filter((p) => p.isActive).length > 3"
                    class="w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[8px] text-gray-700 dark:text-gray-300 border border-white dark:border-gray-800 shadow-sm"
                  >
                    +{{ mealPlansState.filter((p) => p.isActive).length - 3 }}
                  </div>
                </div>

                <span>
                  {{ mealPlansState.filter((p) => p.isActive).length }} active
                  <span class="text-xs text-gray-500"
                    >of {{ mealPlansState.length }}</span
                  >
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
                    backgroundColor:
                      mealPlansState.find((p) => p.name === item)?.color ||
                      '#3B82F6',
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
                {{ selectedLabels.join(", ") }}
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
          <USkeleton class="h-8 w-8 rounded-full" />
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Loading meal plans...
          </p>
        </div>

        <!-- Creating plan state -->
        <div
          v-else-if="isCreatingPlan"
          class="w-full flex flex-col items-center justify-center py-12 gap-3"
        >
          <USkeleton class="h-6 w-6 rounded-full" />
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
          <!-- Weekly Meal Planning Calendar -->
          <div v-if="mealPlansState.length > 0" class="space-y-4">
            <!-- Week navigation -->
            <div class="flex justify-between items-center mb-6">
              <h2 class="text-xl font-semibold">Weekly Meal Plan</h2>

              <div class="flex items-center gap-2">
                <UButton
                  icon="i-heroicons-arrow-left"
                  color="gray"
                  variant="ghost"
                  :disabled="!canNavigateToPreviousWeek"
                  @click="previousWeek"
                  size="sm"
                >
                  Previous
                </UButton>

                <UButton
                  variant="ghost"
                  color="primary"
                  @click="goToCurrentWeek"
                  size="sm"
                >
                  Today
                </UButton>

                <UButton
                  icon="i-heroicons-arrow-right"
                  color="gray"
                  variant="ghost"
                  @click="nextWeek"
                  size="sm"
                  icon-right
                >
                  Next
                </UButton>
              </div>
            </div>

            <!-- Week display with date info -->
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-medium">
                {{ weekDateRange }}
              </h3>

              <div>
                <USelectMenu
                  v-if="mealAssignmentsState.length > 0"
                  placeholder="Filter by meal type"
                  class="w-40"
                >
                  <template #leading>
                    <UIcon name="i-heroicons-funnel" />
                  </template>
                </USelectMenu>
              </div>
            </div>

            <!-- Days grid -->
            <div class="grid grid-cols-1 md:grid-cols-7 gap-4">
              <div
                v-for="day in visibleWeekDays"
                :key="day.date"
                class="space-y-2"
              >
                <!-- Day header -->
                <div
                  class="flex flex-col items-center p-2 rounded-lg"
                  :class="
                    day.isToday
                      ? 'bg-primary-50 dark:bg-primary-950'
                      : 'bg-gray-50 dark:bg-gray-900'
                  "
                >
                  <span class="text-sm font-medium">{{ day.dayName }}</span>
                  <div class="flex items-center gap-1">
                    <span
                      class="text-xl font-bold rounded-full w-9 h-9 flex items-center justify-center"
                      :class="day.isToday ? 'bg-primary-500 text-white' : ''"
                    >
                      {{ day.dayNumber }}
                    </span>
                  </div>
                  <span class="text-xs text-gray-500">{{ day.monthName }}</span>
                </div>

                <!-- Single day card -->
                <UCard
                  class="h-64 overflow-y-auto"
                  :ui="{ body: 'p-1 sm:p-1' }"
                >
                  <!-- Assigned meals will be listed here -->
                  <div
                    class="flex flex-col gap-1 min-h-[100px] h-full"
                    :class="{
                      'items-center justify-center':
                        getMealAssignmentsForDate(day.date).length === 0,
                    }"
                  >
                    <div
                      v-if="getMealAssignmentsForDate(day.date).length === 0"
                      class="text-center py-1 h-full flex flex-col items-center justify-center"
                    >
                      <div class="text-gray-300 dark:text-gray-600 mb-0.5">
                        <UIcon name="i-heroicons-plus-circle" class="h-5 w-5" />
                      </div>
                      <p class="text-[10px] text-gray-400 mb-1">No meals yet</p>
                      <UButton
                        variant="link"
                        color="primary"
                        icon="i-heroicons-plus-small"
                        size="xs"
                        class="text-xs"
                        @click="openAddMealDialog(day.date)"
                      >
                        Add meal
                      </UButton>
                    </div>

                    <!-- This will show assigned meals -->
                    <div v-else class="p-1 space-y-1">
                      <!-- For each meal assignment -->
                      <div
                        v-for="assignment in getMealAssignmentsForDate(
                          day.date,
                        )"
                        :key="assignment.id"
                        class="p-0.5 rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 relative mb-1"
                      >
                        <!-- Meal details with minimal UI -->
                        <div class="relative">
                          <UChip
                            class="w-full"
                            :color="
                              mealPlansState.find(
                                (p) => p.id === assignment.mealPlanId,
                              )?.color || 'blue'
                            "
                            variant="subtle"
                            :ui="{
                              base: 'py-0 px-1.5 min-h-6',
                              container: 'items-start',
                              rounded: 'rounded',
                            }"
                          >
                            <div class="flex items-center w-full gap-1">
                              <!-- Servings badge -->
                              <UBadge
                                :color="
                                  mealPlansState.find(
                                    (p) => p.id === assignment.mealPlanId,
                                  )?.color || 'blue'
                                "
                                variant="solid"
                                size="xs"
                                :ui="{
                                  base: 'py-0 px-1 text-[9px] leading-tight inline-flex min-h-0 h-4',
                                }"
                              >
                                {{ assignment.servingSize }}
                              </UBadge>

                              <div class="flex-1 min-w-0">
                                <!-- Recipe title -->
                                <span
                                  class="text-[11px] font-medium block truncate leading-tight"
                                >
                                  {{
                                    assignment.recipe?.title || "Unnamed recipe"
                                  }}
                                </span>

                                <!-- Plan name in tiny text -->
                                <span
                                  class="text-[8px] opacity-70 block truncate leading-tight"
                                >
                                  {{
                                    mealPlansState.find(
                                      (p) => p.id === assignment.mealPlanId,
                                    )?.name || "Unknown plan"
                                  }}
                                </span>
                              </div>
                            </div>
                          </UChip>

                          <UButton
                            color="red"
                            variant="solid"
                            icon="i-heroicons-x-mark"
                            size="xs"
                            class="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 z-20 cursor-pointer"
                            :ui="{ icon: { size: 'xs' } }"
                            @click.stop.prevent="handleRemoveMealAssignment(assignment.id)"
                          />
                        </div>
                      </div>

                      <!-- Add another meal button - super minimal -->
                      <div class="pt-0.5 flex justify-center">
                        <UButton
                          variant="link"
                          color="gray"
                          icon="i-heroicons-plus-small"
                          size="xs"
                          :ui="{ padding: 'py-0 px-1' }"
                          class="text-[10px] opacity-50 hover:opacity-100 font-normal h-5"
                          @click="openAddMealDialog(day.date)"
                        >
                          Add
                        </UButton>
                      </div>
                    </div>
                  </div>
                </UCard>
              </div>
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
