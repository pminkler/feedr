import { useState } from '#app';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import { useAuth } from '~/composables/useAuth';
import { useIdentity } from '~/composables/useIdentity';

// Import types from the models file
import type { Recipe, MealPlan, MealAssignment, MealType } from '~/types/models';

// Generate Amplify client for GraphQL operations
const client = generateClient<Schema>();

// Helper function to generate a UUID
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Default colors for meal plans
const DEFAULT_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#6366F1', // Indigo
  '#F97316', // Orange
];

export function useMealPlan() {
  // Use auth to handle authentication for GraphQL requests
  const { currentUser } = useAuth();
  const { getOwnerId, getAuthOptions } = useIdentity();

  // Use useState instead of ref to ensure state persistence across components
  const mealPlansState = useState<MealPlan[]>('mealPlans', () => []);
  const mealAssignmentsState = useState<MealAssignment[]>('mealAssignments', () => []);
  const isLoading = useState<boolean>('mealPlansLoading', () => false);
  const error = useState<Error | null>('mealPlansError', () => null);
  const currentWeekOffset = useState<number>('currentWeekOffset', () => 0);

  // Function to fetch user's meal plans from the backend
  const getMealPlans = async () => {
    isLoading.value = true;
    error.value = null;

    try {
      // Use lambda authorizer for access control on MealPlan listing
      const authOptions = await getAuthOptions({ requiresOwnership: true });

      // Build filter to include both username and identityId for ownership check
      const username = currentUser.value?.username;
      const identityId = await getOwnerId();

      const filter = {
        or: [],
      };

      // If we have a username (authenticated user), add it to the filter
      if (username) {
        filter.or.push({
          owners: {
            contains: username,
          },
        });
      }

      // If we have an identityId (guest or authenticated), add it to the filter
      if (identityId) {
        filter.or.push({
          createdBy: {
            eq: identityId,
          },
        });
      }

      // Only apply filter if we have criteria
      const listParams = filter.or.length > 0 ? { filter } : {};

      const response = await client.models.MealPlan.list({
        listParams,
        selectionSet: [
          'id',
          'name',
          'color',
          'isActive',
          'createdAt',
          'updatedAt',
          'notes',
          'owners',
          'createdBy',
        ],
        ...authOptions,
      });

      // Update state with fetched meal plans
      if (response.data) {
        mealPlansState.value = response.data;

        // Fetch meal assignments for active meal plans
        const activePlans = response.data.filter((plan) => plan.isActive);
        if (activePlans.length > 0) {
          await getMealAssignments(activePlans.map((plan) => plan.id));
        }
      }
    } catch (err) {
      error.value = err as Error;
      console.error('Error fetching meal plans:', err);
    } finally {
      isLoading.value = false;
    }
  };

  // Function to fetch meal assignments for specified meal plans
  const getMealAssignments = async (mealPlanIds: string[]) => {
    console.log('Fetching meal assignments for meal plans:', mealPlanIds);
    if (!mealPlanIds.length) return [];

    try {
      const authOptions = await getAuthOptions({ requiresOwnership: true });

      // Get current week start and end dates
      const weekOffset = currentWeekOffset.value;
      const today = new Date();
      const currentDay = today.getDay(); // 0 = Sunday, 6 = Saturday

      // Calculate the start of the current week (Sunday)
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - currentDay + 7 * weekOffset);

      // Calculate the end of the current week (Saturday)
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      // Format dates as YYYY-MM-DD
      const startDate = startOfWeek.toISOString().split('T')[0];
      const endDate = endOfWeek.toISOString().split('T')[0];

      // Fetch meal assignments for this week and these meal plans
      // Since 'in' operator is not supported for mealPlanId, use 'or' with multiple 'eq' conditions
      const mealPlanFilters = mealPlanIds.map((id) => ({
        mealPlanId: { eq: id },
      }));

      const response = await client.models.MealAssignment.list({
        filter: {
          and: [
            {
              or: mealPlanFilters,
            },
            {
              date: {
                between: [startDate, endDate],
              },
            },
          ],
        },
        selectionSet: [
          'id',
          'mealPlanId',
          'recipeId',
          'date',
          'mealType',
          'servingSize',
          'notes',
          'createdAt',
          'updatedAt',
          'recipe.*',
        ],
        ...authOptions,
      });

      if (response.data) {
        const assignments = response.data;

        mealAssignmentsState.value = assignments;
        return assignments;
      }

      return [];
    } catch (err) {
      console.error('Error fetching meal assignments:', err);
      return [];
    }
  };

  // Navigate to previous week
  const previousWeek = () => {
    currentWeekOffset.value -= 1;
    // Reload meal assignments for the new week
    const activePlans = mealPlansState.value.filter((plan) => plan.isActive);
    if (activePlans.length > 0) {
      getMealAssignments(activePlans.map((plan) => plan.id));
    }
  };

  // Navigate to next week
  const nextWeek = () => {
    currentWeekOffset.value += 1;
    // Reload meal assignments for the new week
    const activePlans = mealPlansState.value.filter((plan) => plan.isActive);
    if (activePlans.length > 0) {
      getMealAssignments(activePlans.map((plan) => plan.id));
    }
  };

  // Reset to current week
  const goToCurrentWeek = () => {
    currentWeekOffset.value = 0;
    // Reload meal assignments for the new week
    const activePlans = mealPlansState.value.filter((plan) => plan.isActive);
    if (activePlans.length > 0) {
      getMealAssignments(activePlans.map((plan) => plan.id));
    }
  };

  // Function to create a new meal plan
  const createMealPlan = async (
    options: {
      name?: string;
      color?: string;
      isActive?: boolean;
      notes?: string;
    } = {}
  ) => {
    isLoading.value = true;
    error.value = null;

    try {
      // Generate a random UUID for the meal plan
      const planId = generateUUID();

      // Get identity ID for tracking
      const identityId = await getOwnerId();
      const userId = currentUser.value?.username;

      // Pick a random color if not specified
      const color =
        options.color || DEFAULT_COLORS[Math.floor(Math.random() * DEFAULT_COLORS.length)];

      // Create a new meal plan object
      const newPlan = {
        id: planId,
        name: options.name || `Meal Plan ${new Date().toLocaleDateString()}`,
        color,
        isActive: options.isActive !== undefined ? options.isActive : true,
        notes: options.notes || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // For owners array, only add authenticated users
        owners: userId ? [userId] : [],
        // Store the identity ID to track ownership for guests
        createdBy: identityId || '',
      };

      // Get appropriate auth options based on user state
      const authOptions = await getAuthOptions();

      // Create meal plan in the backend
      const response = await client.models.MealPlan.create(newPlan, authOptions);

      // Get the created meal plan from the response
      const createdPlan = response.data;

      // Add the new plan to the local state
      if (createdPlan) {
        mealPlansState.value.push(createdPlan);
      }

      return createdPlan;
    } catch (err) {
      error.value = err as Error;
      console.error('Error creating meal plan:', err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // Function to get a meal plan by ID
  const getMealPlanById = async (mealPlanId: string) => {
    isLoading.value = true;
    error.value = null;

    try {
      // For MealPlan reads, use lambda mode with owner context
      const authOptions = await getAuthOptions({ requiresOwnership: true });

      // Fetch the meal plan from the API
      const response = await client.models.MealPlan.get({
        id: mealPlanId,
        ...authOptions,
        selectionSet: [
          'id',
          'name',
          'color',
          'isActive',
          'createdAt',
          'updatedAt',
          'notes',
          'owners',
          'createdBy',
        ],
      });

      // Get the meal plan from the response
      const mealPlan = response.data;

      if (mealPlan) {
        // Verify ownership before allowing access to this meal plan
        const username = currentUser.value?.username;
        const identityId = await getOwnerId();

        // Check if current user is an owner or creator of this meal plan
        const isOwner =
          (username && mealPlan.owners?.includes(username)) ||
          (identityId && mealPlan.createdBy === identityId);

        if (!isOwner) {
          console.error('Access denied: Not an owner of this meal plan');
          error.value = new Error("You don't have permission to view this meal plan");
          return null;
        }

        // Update the local state
        const existingIndex = mealPlansState.value.findIndex((p) => p.id === mealPlanId);
        if (existingIndex >= 0) {
          mealPlansState.value[existingIndex] = mealPlan;
        } else {
          mealPlansState.value.push(mealPlan);
        }
      }

      return mealPlan;
    } catch (err) {
      error.value = err as Error;
      console.error(`Error fetching meal plan ${mealPlanId}:`, err);
      return null;
    } finally {
      isLoading.value = false;
    }
  };

  // Function to toggle a meal plan's active status
  const toggleMealPlanActive = async (mealPlanId: string) => {
    try {
      // Find the meal plan in our state
      const mealPlanIndex = mealPlansState.value.findIndex((p) => p.id === mealPlanId);
      if (mealPlanIndex === -1) return null;

      const mealPlan = mealPlansState.value[mealPlanIndex];
      const newActiveStatus = !mealPlan.isActive;

      // Get auth options with ownership context
      const authOptions = await getAuthOptions({ requiresOwnership: true });

      // Update the meal plan
      const response = await client.models.MealPlan.update(
        {
          id: mealPlanId,
          isActive: newActiveStatus,
          updatedAt: new Date().toISOString(),
        },
        authOptions
      );

      if (response.data) {
        // Update local state
        mealPlansState.value[mealPlanIndex] = {
          ...mealPlan,
          isActive: newActiveStatus,
        };

        // If the plan was activated, fetch its meal assignments
        if (newActiveStatus) {
          await getMealAssignments([mealPlanId]);
        }
      }

      return response.data;
    } catch (err) {
      console.error(`Error toggling meal plan active status: ${err}`);
      return null;
    }
  };

  // Function to add a recipe to a meal plan for a specific date
  const addRecipeToMealPlan = async (
    mealPlanId: string,
    recipeId: string,
    config: {
      date: string;
      servingSize?: number;
      mealType?: MealType;
      notes?: string;
    }
  ) => {
    isLoading.value = true;
    error.value = null;

    try {
      // First, check if the meal plan exists in our local state
      const existingPlan = mealPlansState.value.find((plan) => plan.id === mealPlanId);

      console.log('Checking meal plan existence. Found in local state:', !!existingPlan);

      // If not found in local state, try to fetch it from the backend
      if (!existingPlan) {
        console.log('Fetching meal plan from backend with ID:', mealPlanId);
        const fetchedPlan = await getMealPlanById(mealPlanId);
        console.log('Fetched plan:', fetchedPlan);

        if (!fetchedPlan) {
          console.error('Meal plan not found with ID:', mealPlanId);
          throw new Error('Meal plan not found');
        }
      }

      // Create a new meal assignment
      const mealAssignmentId = generateUUID();

      // Default to 1 serving if not specified
      const servingSize = config.servingSize ?? 1;

      // Get identity ID for tracking
      const identityId = await getOwnerId();
      const userId = currentUser.value?.username;

      // Ensure we store the date in YYYY-MM-DD format (ISO date)
      // config.date is expected to already be in this format, but we double check
      const dateStr = config.date.includes('T')
        ? config.date.split('T')[0] // If has time component, keep just date part
        : config.date; // Otherwise use as-is

      const mealAssignment = {
        id: mealAssignmentId,
        mealPlanId: mealPlanId,
        recipeId: recipeId,
        date: dateStr, // Normalized ISO date (YYYY-MM-DD)
        mealType: config.mealType ?? 'OTHER',
        servingSize: servingSize,
        notes: config.notes ?? '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // Use username for authenticated users, identity ID for guests
        owners: userId ? [userId] : [],
        createdBy: identityId || '',
      };

      // Try using basic authenticated/guest auth modes directly
      // The schema allows creation for both guests and authenticated users
      const authMode = currentUser.value?.username ? 'userPool' : 'identityPool';
      const createAuthOptions = { authMode };

      // Log identity information for debugging
      console.log('Current identity ID:', identityId);
      console.log('Current user:', currentUser.value?.username);
      console.log('Using direct auth mode:', authMode);

      console.log('Creating meal assignment with auth options:', JSON.stringify(createAuthOptions));
      console.log('Meal assignment data:', JSON.stringify(mealAssignment));

      // Create the MealAssignment in the backend
      let createResponse;
      try {
        createResponse = await client.models.MealAssignment.create(
          mealAssignment,
          createAuthOptions
        );

        console.log('Create response:', JSON.stringify(createResponse));

        if (!createResponse.data) {
          console.error('Create response has no data:', createResponse);
          throw new Error('Failed to create meal assignment - no data returned');
        }
      } catch (createError) {
        console.error('Detailed error creating meal assignment:', createError);
        throw new Error(`Failed to create meal assignment: ${createError.message || createError}`);
      }

      // Update the meal plan's updatedAt timestamp
      // For updates, we need ownership context
      const updateAuthOptions = await getAuthOptions({
        requiresOwnership: true,
      });
      console.log('Update meal plan auth options:', JSON.stringify(updateAuthOptions));
      await client.models.MealPlan.update(
        {
          id: mealPlanId,
          updatedAt: new Date().toISOString(),
        },
        updateAuthOptions
      );

      // Since we're having auth issues with fetching the newly created assignment,
      // let's simply add the basic assignment to the state without the recipe details
      // This is enough for the UI to show the assignment

      // Add to our local state with the basic information we already have
      const basicAssignment = {
        id: mealAssignmentId,
        mealPlanId,
        recipeId,
        date: config.date,
        mealType: config.mealType ?? 'OTHER',
        servingSize: config.servingSize ?? 1,
        notes: config.notes ?? '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // We'll add the recipe later when we refresh the assignments
      };

      console.log('Adding basic assignment to state:', basicAssignment);
      mealAssignmentsState.value.push(basicAssignment);

      // Then trigger a refresh of meal assignments for active plans
      // This will happen asynchronously and update the UI later
      setTimeout(() => {
        try {
          const activePlans = mealPlansState.value.filter((plan) => plan.isActive);
          if (activePlans.length > 0) {
            getMealAssignments(activePlans.map((plan) => plan.id));
          }
        } catch (refreshError) {
          console.log('Error refreshing assignments (non-critical):', refreshError);
        }
      }, 1000);

      return createResponse.data;
    } catch (err) {
      error.value = err as Error;
      console.error('Error adding recipe to meal plan:', err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // Function to remove a meal assignment
  const removeMealAssignment = async (mealAssignmentId: string) => {
    isLoading.value = true;
    error.value = null;

    try {
      // For delete operation, use lambda auth mode with ownership context
      const authOptions = await getAuthOptions({ requiresOwnership: true });

      // Delete the MealAssignment entry
      const deleteResponse = await client.models.MealAssignment.delete(
        { id: mealAssignmentId },
        authOptions
      );

      if (!deleteResponse.data) {
        throw new Error('Failed to delete meal assignment');
      }

      // Update local state
      mealAssignmentsState.value = mealAssignmentsState.value.filter(
        (ma) => ma.id !== mealAssignmentId
      );

      return deleteResponse.data;
    } catch (err) {
      error.value = err as Error;
      console.error('Error removing meal assignment:', err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // Function to get all meal assignments for a specific date
  // The date parameter is already in YYYY-MM-DD format
  const getMealAssignmentsForDate = (date: string) => {
    // The date is stored in UTC/ISO format (YYYY-MM-DD)
    // This matches exactly with how we save it, so we can compare directly
    return mealAssignmentsState.value.filter((ma) => ma.date === date);
  };

  // Function to get the days of the current week
  const getCurrentWeekDays = () => {
    const weekOffset = currentWeekOffset.value;
    const today = new Date();

    // Create a new date object for calculations to avoid modifying 'today'
    const calcDate = new Date(today);
    // Reset hours to avoid timezone issues
    calcDate.setHours(0, 0, 0, 0);

    // For Monday start, we need to adjust the calculation
    // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const dayOfWeek = calcDate.getDay();
    const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Adjust to make Monday the first day

    // Calculate the start of the current week (Monday)
    // To get Monday: if today is Wednesday (daysSinceMonday=2), go back 2 days
    const mondayOfWeek = new Date(calcDate);
    mondayOfWeek.setDate(calcDate.getDate() - daysSinceMonday + 7 * weekOffset);

    // Calculation is now correct to find Monday of the current week

    // Generate an array of 7 days starting from Monday
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(mondayOfWeek);
      day.setDate(mondayOfWeek.getDate() + i);
      weekDays.push({
        date: day.toISOString().split('T')[0],
        dayName: day.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: day.getDate(),
        monthName: day.toLocaleDateString('en-US', { month: 'short' }),
        isToday: day.toDateString() === today.toDateString(),
      });
    }

    return weekDays;
  };

  /**
   * Delete all meal plans and their assignments associated with the current user.
   * Used for account deletion to ensure all user data is removed.
   */
  async function deleteAllMealPlans() {
    try {
      // First, fetch all meal plans for this user
      await getMealPlans();

      // If no meal plans, return success
      if (!mealPlansState.value || mealPlansState.value.length === 0) {
        console.log('No meal plans to delete');
        return true;
      }

      console.log(`Deleting ${mealPlansState.value.length} meal plans for account deletion`);

      // Get auth options with ownership context
      const authOptions = await getAuthOptions({ requiresOwnership: true });

      // For each meal plan, first delete all associated meal assignments
      for (const mealPlan of mealPlansState.value) {
        try {
          // Get all meal assignments for this plan (not just current week)
          const assignmentsResponse = await client.models.MealAssignment.list({
            filter: {
              mealPlanId: { eq: mealPlan.id },
            },
            selectionSet: ['id'],
            ...authOptions,
          });

          const assignments = assignmentsResponse.data || [];

          // Delete each assignment
          for (const assignment of assignments) {
            await client.models.MealAssignment.delete(
              {
                id: assignment.id,
              },
              authOptions
            );
          }

          // Then delete the meal plan itself
          await client.models.MealPlan.delete(
            {
              id: mealPlan.id,
            },
            authOptions
          );
        } catch (error) {
          console.error(`Error deleting meal plan ${mealPlan.id}:`, error);
          // Continue with other meal plans even if one fails
        }
      }

      // Clear local state
      mealPlansState.value = [];
      mealAssignmentsState.value = [];

      return true;
    } catch (error) {
      console.error('Error in deleteAllMealPlans:', error);
      throw error;
    }
  }

  return {
    mealPlansState,
    mealAssignmentsState,
    isLoading,
    error,
    currentWeekOffset,
    getMealPlans,
    getMealPlanById,
    createMealPlan,
    toggleMealPlanActive,
    addRecipeToMealPlan,
    removeMealAssignment,
    getMealAssignmentsForDate,
    getMealAssignments,
    getCurrentWeekDays,
    previousWeek,
    nextWeek,
    goToCurrentWeek,
    deleteAllMealPlans,
  };
}
