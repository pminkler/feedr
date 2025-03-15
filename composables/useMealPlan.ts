import { useState } from "#app";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { useAuth } from "~/composables/useAuth";
import { useIdentity } from "~/composables/useIdentity";

// Import types from the models file
import type {
  Recipe,
  MealPlan,
  MealAssignment,
  MealType,
} from "~/types/models";

// Generate Amplify client for GraphQL operations
const client = generateClient<Schema>();

// Helper function to generate a UUID
function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Default colors for meal plans
const DEFAULT_COLORS = [
  "#3B82F6", // Blue
  "#10B981", // Green
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#6366F1", // Indigo
  "#F97316", // Orange
];

export function useMealPlan() {
  // Use auth to handle authentication for GraphQL requests
  const { currentUser } = useAuth();
  const { getOwnerId, getAuthOptions } = useIdentity();

  // Use useState instead of ref to ensure state persistence across components
  const mealPlansState = useState<MealPlan[]>("mealPlans", () => []);
  const mealAssignmentsState = useState<MealAssignment[]>(
    "mealAssignments",
    () => [],
  );
  const isLoading = useState<boolean>("mealPlansLoading", () => false);
  const error = useState<Error | null>("mealPlansError", () => null);
  const currentWeekOffset = useState<number>("currentWeekOffset", () => 0);

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
          "id",
          "name",
          "color",
          "isActive",
          "createdAt",
          "updatedAt",
          "notes",
          "owners",
          "createdBy",
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
      console.error("Error fetching meal plans:", err);
    } finally {
      isLoading.value = false;
    }
  };

  // Function to fetch meal assignments for specified meal plans
  const getMealAssignments = async (mealPlanIds: string[]) => {
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
      const startDate = startOfWeek.toISOString().split("T")[0];
      const endDate = endOfWeek.toISOString().split("T")[0];

      // Fetch meal assignments for this week and these meal plans
      const response = await client.models.MealAssignment.list({
        filter: {
          and: [
            {
              mealPlanId: {
                in: mealPlanIds,
              },
            },
            {
              date: {
                between: [startDate, endDate],
              },
            },
          ],
        },
        selectionSet: [
          "id",
          "mealPlanId",
          "recipeId",
          "date",
          "mealType",
          "servingSize",
          "notes",
          "createdAt",
          "updatedAt",
          "recipe.id",
          "recipe.title",
          "recipe.imageUrl",
          "recipe.prep_time",
          "recipe.cook_time",
          "recipe.servings",
          "recipe.nutritionalInformation.*",
          "recipe.tags.*",
        ],
        ...authOptions,
      });

      if (response.data) {
        mealAssignmentsState.value = response.data;
        return response.data;
      }

      return [];
    } catch (err) {
      console.error("Error fetching meal assignments:", err);
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
    } = {},
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
        options.color ||
        DEFAULT_COLORS[Math.floor(Math.random() * DEFAULT_COLORS.length)];

      // Create a new meal plan object
      const newPlan = {
        id: planId,
        name: options.name || `Meal Plan ${new Date().toLocaleDateString()}`,
        color,
        isActive: options.isActive !== undefined ? options.isActive : true,
        notes: options.notes || "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // For owners array, only add authenticated users
        owners: userId ? [userId] : [],
        // Store the identity ID to track ownership for guests
        createdBy: identityId || "",
      };

      // Get appropriate auth options based on user state
      const authOptions = await getAuthOptions();

      // Create meal plan in the backend
      const response = await client.models.MealPlan.create(
        newPlan,
        authOptions,
      );

      // Get the created meal plan from the response
      const createdPlan = response.data;

      // Add the new plan to the local state
      if (createdPlan) {
        mealPlansState.value.push(createdPlan);
      }

      return createdPlan;
    } catch (err) {
      error.value = err as Error;
      console.error("Error creating meal plan:", err);
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
      const response = await client.models.MealPlan.get(
        { id: mealPlanId },
        {
          ...authOptions,
          selectionSet: [
            "id",
            "name",
            "color",
            "isActive",
            "createdAt",
            "updatedAt",
            "notes",
            "owners",
            "createdBy",
          ],
        },
      );

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
          console.error("Access denied: Not an owner of this meal plan");
          error.value = new Error(
            "You don't have permission to view this meal plan",
          );
          return null;
        }

        // Update the local state
        const existingIndex = mealPlansState.value.findIndex(
          (p) => p.id === mealPlanId,
        );
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
      const mealPlanIndex = mealPlansState.value.findIndex(
        (p) => p.id === mealPlanId,
      );
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
        authOptions,
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
    },
  ) => {
    isLoading.value = true;
    error.value = null;

    try {
      // First, check if the meal plan exists in our local state
      const existingPlan = mealPlansState.value.find(
        (plan) => plan.id === mealPlanId,
      );

      // If not found in local state, try to fetch it from the backend
      if (!existingPlan) {
        const fetchedPlan = await getMealPlanById(mealPlanId);
        if (!fetchedPlan) {
          throw new Error("Meal plan not found");
        }
      }

      // Create a new meal assignment
      const mealAssignmentId = generateUUID();

      // Default to 1 serving if not specified
      const servingSize = config.servingSize ?? 1;

      // Get identity ID for tracking
      const identityId = await getOwnerId();
      const userId = currentUser.value?.username;

      const mealAssignment = {
        id: mealAssignmentId,
        mealPlanId: mealPlanId,
        recipeId: recipeId,
        date: config.date,
        mealType: config.mealType ?? "OTHER",
        servingSize: servingSize,
        notes: config.notes ?? "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // Use username for authenticated users, identity ID for guests
        owners: userId ? [userId] : [],
        createdBy: identityId || "",
      };

      // Get auth options
      const createAuthOptions = await getAuthOptions();

      // Create the MealAssignment in the backend
      const createResponse = await client.models.MealAssignment.create(
        mealAssignment,
        createAuthOptions,
      );

      if (!createResponse.data) {
        throw new Error("Failed to create meal assignment");
      }

      // Update the meal plan's updatedAt timestamp
      const updateAuthOptions = await getAuthOptions({
        requiresOwnership: true,
      });
      await client.models.MealPlan.update(
        {
          id: mealPlanId,
          updatedAt: new Date().toISOString(),
        },
        updateAuthOptions,
      );

      // We need to fetch the full recipe details to add to the state
      // Fetch the created meal assignment with recipe details
      const getResponse = await client.models.MealAssignment.get(
        { id: mealAssignmentId },
        {
          ...createAuthOptions,
          selectionSet: [
            "id",
            "mealPlanId",
            "recipeId",
            "date",
            "mealType",
            "servingSize",
            "notes",
            "createdAt",
            "updatedAt",
            "recipe.id",
            "recipe.title",
            "recipe.imageUrl",
            "recipe.prep_time",
            "recipe.cook_time",
            "recipe.servings",
            "recipe.nutritionalInformation.*",
            "recipe.tags.*",
          ],
        },
      );

      if (getResponse.data) {
        // Add to our local state
        mealAssignmentsState.value.push(getResponse.data);
      }

      return createResponse.data;
    } catch (err) {
      error.value = err as Error;
      console.error("Error adding recipe to meal plan:", err);
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
        authOptions,
      );

      if (!deleteResponse.data) {
        throw new Error("Failed to delete meal assignment");
      }

      // Update local state
      mealAssignmentsState.value = mealAssignmentsState.value.filter(
        (ma) => ma.id !== mealAssignmentId,
      );

      return deleteResponse.data;
    } catch (err) {
      error.value = err as Error;
      console.error("Error removing meal assignment:", err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // Function to get all meal assignments for a specific date
  const getMealAssignmentsForDate = (date: string) => {
    return mealAssignmentsState.value.filter((ma) => ma.date === date);
  };

  // Function to get the days of the current week
  const getCurrentWeekDays = () => {
    const weekOffset = currentWeekOffset.value;
    const today = new Date();
    
    // For Monday start, we need to adjust the calculation
    // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const currentDay = today.getDay();
    const daysSinceMonday = currentDay === 0 ? 6 : currentDay - 1; // Adjust to make Monday the first day
    
    // Calculate the start of the current week (Monday)
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - daysSinceMonday + (7 * weekOffset));
    
    // Generate an array of 7 days starting from Monday
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      weekDays.push({
        date: day.toISOString().split("T")[0],
        dayName: day.toLocaleDateString("en-US", { weekday: "short" }),
        dayNumber: day.getDate(),
        monthName: day.toLocaleDateString("en-US", { month: "short" }),
        isToday: day.toDateString() === today.toDateString(),
      });
    }

    return weekDays;
  };

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
  };
}
