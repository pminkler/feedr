import { useState } from "#app";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import type { AuthMode } from "@aws-amplify/data-schema-types";
import { useAuth } from "~/composables/useAuth";
import { useIdentity } from "~/composables/useIdentity";

// Import types from the models file
import type { 
  Recipe, 
  Ingredient, 
  NutritionalInformation, 
  MealPlan, 
  MealPlanRecipe, 
  MealPlanRecipeConfig,
  MealType
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

export function useMealPlan() {
  // Use auth to handle authentication for GraphQL requests
  const { currentUser } = useAuth();
  const { getOwnerId, getAuthOptions } = useIdentity();

  // Use useState instead of ref to ensure state persistence across components
  const mealPlansState = useState<MealPlan[]>("mealPlans", () => []);
  const isLoading = useState<boolean>("mealPlansLoading", () => false);
  const error = useState<Error | null>("mealPlansError", () => null);

  // Function to fetch user's meal plans from the backend
  const getMealPlans = async () => {
    isLoading.value = true;
    error.value = null;

    try {
      // Use lambda authorizer for access control on MealPlan listing
      const authOptions = await getAuthOptions({ requiresOwnership: true });
      
      // Fetch meal plans from GraphQL API with relationships
      // Add filter to only get meal plans where the current user is an owner
      const username = currentUser.value?.username;
      const identityId = await getOwnerId();
      
      // Build filter to include both username and identityId for ownership check
      const filter = {
        or: []
      };
      
      // If we have a username (authenticated user), add it to the filter
      if (username) {
        filter.or.push({
          owners: {
            contains: username
          }
        });
      }
      
      // If we have an identityId (guest or authenticated), add it to the filter
      if (identityId) {
        filter.or.push({
          createdBy: {
            eq: identityId
          }
        });
      }
      
      // Only apply filter if we have criteria
      const listParams = filter.or.length > 0 ? { filter } : {};
      
      const response = await client.models.MealPlan.list(
        listParams, 
        { 
          ...authOptions,
          selectionSet: [
            "id",
            "name",
            "startDate",
            "endDate",
            "createdAt",
            "updatedAt",
            "notes",
            "mealPlanRecipes.*",
            "mealPlanRecipes.recipe.id",
            "mealPlanRecipes.recipe.title", 
            "mealPlanRecipes.config.*"
          ]
        }
      );

      // Update state with fetched meal plans
      if (response.data) {
        // Ensure mealPlanRecipes is always an array for each meal plan
        mealPlansState.value = response.data.map(plan => ({
          ...plan,
          mealPlanRecipes: Array.isArray(plan.mealPlanRecipes) ? plan.mealPlanRecipes : []
        }));
      }
    } catch (err) {
      error.value = err as Error;
      console.error("Error fetching meal plans:", err);
    } finally {
      isLoading.value = false;
    }
  };

  // Function to create a new meal plan
  const createMealPlan = async (options: {
    name?: string;
    startDate?: string;
    endDate?: string;
    notes?: string;
  } = {}) => {
    isLoading.value = true;
    error.value = null;

    try {
      // Generate a random UUID for the meal plan
      const planId = generateUUID();
      
      // Get dates or use defaults (today and a week from today)
      const now = new Date();
      const oneWeekLater = new Date();
      oneWeekLater.setDate(now.getDate() + 6);
      
      // Get identity ID for tracking
      const identityId = await getOwnerId();
      const userId = currentUser.value?.username;
      
      // Create a new meal plan object
      const newPlan = {
        id: planId,
        name: options.name || `Meal Plan ${now.toLocaleDateString()}`,
        startDate: options.startDate || now.toISOString().split('T')[0],
        endDate: options.endDate || oneWeekLater.toISOString().split('T')[0],
        mealPlanRecipes: [],
        notes: options.notes || "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // For owners array, only add authenticated users
        owners: userId ? [userId] : [],
        // Store the identity ID to track ownership for guests
        createdBy: identityId || "",
      };

      // Get appropriate auth options based on user state
      // Authenticated users -> userPool, Guest users -> identityPool
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

  // Function to get a single meal plan by ID
  const getMealPlanById = async (mealPlanId: string) => {
    isLoading.value = true;
    error.value = null;

    try {
      // For MealPlan reads, use lambda mode with owner context
      // This ensures we only get plans the user should have access to
      const authOptions = await getAuthOptions({ requiresOwnership: true });
      
      // Fetch the meal plan from the API with all relationship data
      const response = await client.models.MealPlan.get(
        { id: mealPlanId },
        { 
          ...authOptions,
          selectionSet: [
            "id",
            "name",
            "startDate",
            "endDate",
            "createdAt",
            "updatedAt",
            "notes",
            "owners",
            "createdBy",
            "mealPlanRecipes.*",
            "mealPlanRecipes.recipe.id",
            "mealPlanRecipes.recipe.title",
            "mealPlanRecipes.config.*"
          ] 
        }
      );

      // Get the meal plan from the response
      let mealPlan = response.data;

      if (mealPlan) {
        // Verify ownership before allowing access to this meal plan
        const username = currentUser.value?.username;
        const identityId = await getOwnerId();
        
        // Check if current user is an owner or creator of this meal plan
        const isOwner = (username && mealPlan.owners?.includes(username)) || 
                       (identityId && mealPlan.createdBy === identityId);
                       
        if (!isOwner) {
          console.error("Access denied: Not an owner of this meal plan");
          error.value = new Error("You don't have permission to view this meal plan");
          return null;
        }
        
        // Ensure mealPlanRecipes is always an array
        mealPlan = {
          ...mealPlan,
          mealPlanRecipes: Array.isArray(mealPlan.mealPlanRecipes) 
            ? mealPlan.mealPlanRecipes 
            : []
        };
        
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

  // Function to add a saved recipe to a meal plan for a specific day
  const addRecipeToMealPlan = async (
    mealPlanId: string, 
    recipeId: string, 
    config: {
      dayAssignment: string;
      servingSize?: number;
      mealType?: MealType;
      notes?: string;
    }
  ) => {
    isLoading.value = true;
    error.value = null;

    try {
      // First, check if the meal plan exists in our local state
      let mealPlanIndex = mealPlansState.value.findIndex(
        (plan) => plan.id === mealPlanId,
      );
      let mealPlan;

      // If not found in local state, try to fetch it from the backend
      if (mealPlanIndex === -1) {
        const fetchedPlan = await getMealPlanById(mealPlanId);

        // If still not found, create a new meal plan with default values
        if (!fetchedPlan) {
          const now = new Date();
          const oneWeekLater = new Date();
          oneWeekLater.setDate(now.getDate() + 6);
          
          mealPlan = {
            id: mealPlanId,
            name: `Meal Plan ${now.toLocaleDateString()}`,
            startDate: now.toISOString().split('T')[0],
            endDate: oneWeekLater.toISOString().split('T')[0],
            mealPlanRecipes: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          // Create the meal plan in the backend
          const createResponse = await client.models.MealPlan.create(
            mealPlan,
            getAuthOptions(),
          );

          if (createResponse.data) {
            mealPlan = createResponse.data;
            mealPlansState.value.push(mealPlan);
            mealPlanIndex = mealPlansState.value.length - 1;
          }
        } else {
          mealPlan = fetchedPlan;
          mealPlanIndex = mealPlansState.value.length - 1;
        }
      } else {
        // Clone the existing meal plan to avoid direct state mutation
        mealPlan = { ...mealPlansState.value[mealPlanIndex] };
      }

      // We're allowing duplicate recipes for the same day, so we no longer need to check
      // if the recipe already exists
      console.log(`Adding recipe ${recipeId} to meal plan for day ${config.dayAssignment} (allowing duplicates)`);
      
      // Removed check for existing recipe - we want to allow duplicates

      // Create the MealPlanRecipe entry
      const mealPlanRecipeId = generateUUID();
      
      // Default to 1 serving if not specified
      const servingSize = config.servingSize ?? 1;
      
      // Get identity ID for tracking
      const identityId = await getOwnerId();
      const userId = currentUser.value?.username;
      
      const mealPlanRecipe = {
        id: mealPlanRecipeId,
        mealPlanId: mealPlanId,
        recipeId: recipeId,
        config: {
          dayAssignment: config.dayAssignment,
          servingSize: servingSize,
          mealType: config.mealType ?? 'OTHER',
          notes: config.notes ?? '',
        },
        // Use username for authenticated users, identity ID for guests
        owners: userId ? [userId] : [identityId || "anonymous"],
        createdBy: identityId || "",
      };

      // Get auth options
      const authOptions = await getAuthOptions();
      
      // For create operation, use appropriate auth based on user state
      const createAuthOptions = await getAuthOptions();
      
      // Create the MealPlanRecipe in the backend
      const createResponse = await client.models.MealPlanRecipe.create(
        mealPlanRecipe,
        createAuthOptions,
      );

      if (!createResponse.data) {
        throw new Error("Failed to create meal plan recipe relation");
      }

      // For update operation that modifies a meal plan, use lambda with ownership context
      const updateAuthOptions = await getAuthOptions({ requiresOwnership: true });
      
      // Update the meal plan's updatedAt timestamp
      const updateResponse = await client.models.MealPlan.update(
        {
          id: mealPlanId,
          updatedAt: new Date().toISOString(),
        },
        updateAuthOptions, // Use ownership-aware options for update
      );

      // Get the updated meal plan from the response
      const updatedMealPlan = updateResponse.data;

      // Update the meal plan in our local state
      if (updatedMealPlan) {
        // Reload the meal plan to get the full data with relationships
        const refreshedPlan = await getMealPlanById(mealPlanId);
        if (refreshedPlan) {
          // Ensure mealPlanRecipes is an array 
          const planWithValidRecipes = {
            ...refreshedPlan,
            mealPlanRecipes: Array.isArray(refreshedPlan.mealPlanRecipes) 
              ? refreshedPlan.mealPlanRecipes 
              : []
          };
          
          const refreshedIndex = mealPlansState.value.findIndex(
            (plan) => plan.id === mealPlanId,
          );
          if (refreshedIndex >= 0) {
            mealPlansState.value[refreshedIndex] = planWithValidRecipes;
          }
        }
      }

      console.log(`Added recipe ${recipeId} to meal plan ${mealPlanId} for day ${config.dayAssignment}`);

      return updatedMealPlan;
    } catch (err) {
      error.value = err as Error;
      console.error("Error adding recipe to meal plan:", err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };
  
  // Function to remove a recipe from a meal plan for a specific day
  const removeRecipeFromMealPlan = async (mealPlanRecipeId: string) => {
    isLoading.value = true;
    error.value = null;

    try {
      // For delete operation, use lambda auth mode with ownership context
      const authOptions = await getAuthOptions({ requiresOwnership: true });
      
      // Delete the MealPlanRecipe entry
      const deleteResponse = await client.models.MealPlanRecipe.delete(
        { id: mealPlanRecipeId },
        authOptions,
      );

      if (!deleteResponse.data) {
        throw new Error("Failed to delete meal plan recipe relation");
      }

      console.log(`Removed recipe assignment ${mealPlanRecipeId} from meal plan`);

      return deleteResponse.data;
    } catch (err) {
      error.value = err as Error;
      console.error("Error removing recipe from meal plan:", err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };
  
  // Function to get all recipes for a specific day in a meal plan
  const getRecipesForDay = async (mealPlanId: string, dayAssignment: string) => {
    try {
      // First, verify that the user has access to this meal plan
      const mealPlan = await getMealPlanById(mealPlanId);
      
      // If no meal plan is returned or there was an error, the user doesn't have access
      if (!mealPlan || error.value) {
        return [];
      }
      
      // Get auth options
      const authOptions = await getAuthOptions();
      
      const response = await client.models.MealPlanRecipe.list(
        {
          filter: {
            and: [
              { mealPlanId: { eq: mealPlanId } },
              { config: { dayAssignment: { eq: dayAssignment } } }
            ]
          },
          selectionSet: [
            "id",
            "mealPlanId",
            "recipeId",
            "config.*",
            "recipe.id",
            "recipe.title",
            "recipe.ingredients.*",
            "recipe.nutritionalInformation.*",
            "recipe.instructions",
            "recipe.description",
            "recipe.prep_time",
            "recipe.cook_time",
            "recipe.servings",
            "recipe.imageUrl",
            "recipe.tags.*"
          ]
        },
        authOptions
      );
      
      return response.data || [];
    } catch (err) {
      console.error(`Error getting recipes for day ${dayAssignment}:`, err);
      return [];
    }
  };

  return {
    mealPlansState,
    isLoading,
    error,
    getMealPlans,
    getMealPlanById,
    createMealPlan,
    addRecipeToMealPlan,
    removeRecipeFromMealPlan,
    getRecipesForDay,
  };
}
