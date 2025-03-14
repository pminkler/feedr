import { useState } from "#app";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import type { AuthMode } from "@aws-amplify/data-schema-types";
import { useAuth } from "~/composables/useAuth";

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

  // Use useState instead of ref to ensure state persistence across components
  const mealPlansState = useState<MealPlan[]>("mealPlans", () => []);
  const isLoading = useState<boolean>("mealPlansLoading", () => false);
  const error = useState<Error | null>("mealPlansError", () => null);

  // Helper function to get auth options based on user login state
  const getAuthOptions = () => {
    return currentUser.value ? { authMode: "userPool" as AuthMode } : {};
  };

  // Function to fetch user's meal plans from the backend
  const getMealPlans = async () => {
    isLoading.value = true;
    error.value = null;

    try {
      // Fetch meal plans from GraphQL API with relationships
      const response = await client.models.MealPlan.list(
        {}, 
        { 
          ...getAuthOptions(),
          selectionSet: [
            "id",
            "name",
            "startDate",
            "endDate",
            "createdAt",
            "updatedAt",
            "notes",
            "mealPlanRecipes.*",
            "mealPlanRecipes.savedRecipe.id",
            "mealPlanRecipes.savedRecipe.title", 
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
      };

      // Create meal plan in the backend
      const response = await client.models.MealPlan.create(
        newPlan,
        getAuthOptions(),
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
      // Fetch the meal plan from the API with all relationship data
      const response = await client.models.MealPlan.get(
        { id: mealPlanId },
        { 
          ...getAuthOptions(),
          selectionSet: [
            "id",
            "name",
            "startDate",
            "endDate",
            "createdAt",
            "updatedAt",
            "notes",
            "mealPlanRecipes.*",
            "mealPlanRecipes.savedRecipe.id",
            "mealPlanRecipes.savedRecipe.title",
            "mealPlanRecipes.config.*"
          ] 
        }
      );

      // Get the meal plan from the response
      let mealPlan = response.data;

      if (mealPlan) {
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
      
      const mealPlanRecipe = {
        id: mealPlanRecipeId,
        mealPlanId: mealPlanId,
        savedRecipeId: recipeId,  // Changed from recipeId to savedRecipeId
        config: {
          dayAssignment: config.dayAssignment,
          servingSize: servingSize,
          mealType: config.mealType ?? 'OTHER',
          notes: config.notes ?? '',
        },
      };

      // Create the MealPlanRecipe in the backend
      const createResponse = await client.models.MealPlanRecipe.create(
        mealPlanRecipe,
        getAuthOptions(),
      );

      if (!createResponse.data) {
        throw new Error("Failed to create meal plan recipe relation");
      }

      // Update the meal plan's updatedAt timestamp
      const updateResponse = await client.models.MealPlan.update(
        {
          id: mealPlanId,
          updatedAt: new Date().toISOString(),
        },
        getAuthOptions(),
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
      // Delete the MealPlanRecipe entry
      const deleteResponse = await client.models.MealPlanRecipe.delete(
        { id: mealPlanRecipeId },
        getAuthOptions(),
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
            "savedRecipeId",
            "config.*",
            "savedRecipe.id",
            "savedRecipe.title",
            "savedRecipe.ingredients.*",
            "savedRecipe.nutritionalInformation.*",
            "savedRecipe.instructions",
            "savedRecipe.description",
            "savedRecipe.prep_time",
            "savedRecipe.cook_time",
            "savedRecipe.servings",
            "savedRecipe.imageUrl",
            "savedRecipe.tags.*"
          ]
        },
        getAuthOptions()
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
