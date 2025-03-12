import { useState } from '#app';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import { MealPlan, Recipe } from '~/types/models';
import type { AuthMode } from "@aws-amplify/data-schema-types";
import { useAuth } from '~/composables/useAuth';

// Generate Amplify client for GraphQL operations
const client = generateClient<Schema>();

// Helper function to generate a UUID
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function useMealPlan() {
  // Use auth to handle authentication for GraphQL requests
  const { currentUser } = useAuth();
  
  // Use useState instead of ref to ensure state persistence across components
  const mealPlansState = useState<MealPlan[]>('mealPlans', () => []);
  const isLoading = useState<boolean>('mealPlansLoading', () => false);
  const error = useState<Error | null>('mealPlansError', () => null);

  // Helper function to get auth options based on user login state
  const getAuthOptions = () => {
    return currentUser.value
      ? { authMode: "userPool" as AuthMode }
      : {};
  };

  // Function to fetch user's meal plans from the backend
  const getMealPlans = async () => {
    isLoading.value = true;
    error.value = null;
    
    try {
      // Fetch meal plans from GraphQL API
      const response = await client.models.MealPlan.list(
        {},
        getAuthOptions()
      );

      // Update state with fetched meal plans
      if (response.data) {
        mealPlansState.value = response.data;
      }
    } catch (err) {
      error.value = err as Error;
      console.error('Error fetching meal plans:', err);
    } finally {
      isLoading.value = false;
    }
  };

  // Function to create a new meal plan
  const createMealPlan = async () => {
    isLoading.value = true;
    error.value = null;
    
    try {
      // Generate a random UUID for the meal plan
      const planId = generateUUID();
      
      // Create a new meal plan object
      const newPlan = {
        id: planId,
        recipes: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Create meal plan in the backend
      const response = await client.models.MealPlan.create(
        newPlan,
        getAuthOptions()
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
      console.error('Error creating meal plan:', err);
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
      // Fetch the meal plan from the API
      const response = await client.models.MealPlan.get(
        { id: mealPlanId },
        getAuthOptions()
      );
      
      // Get the meal plan from the response
      const mealPlan = response.data;
      
      if (mealPlan) {
        // Update the local state
        const existingIndex = mealPlansState.value.findIndex(p => p.id === mealPlanId);
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

  // Function to add a recipe to a meal plan
  const addRecipeToMealPlan = async (mealPlanId: string, recipeId: string) => {
    isLoading.value = true;
    error.value = null;
    
    try {
      // First, check if the meal plan exists in our local state
      let mealPlanIndex = mealPlansState.value.findIndex(plan => plan.id === mealPlanId);
      let mealPlan;
      
      // If not found in local state, try to fetch it from the backend
      if (mealPlanIndex === -1) {
        const fetchedPlan = await getMealPlanById(mealPlanId);
        
        // If still not found, create a new meal plan
        if (!fetchedPlan) {
          mealPlan = {
            id: mealPlanId,
            recipes: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          // Create the meal plan in the backend
          const createResponse = await client.models.MealPlan.create(
            mealPlan,
            getAuthOptions()
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
      
      // Check if the recipe is already in the meal plan
      const recipeExists = mealPlan.recipes.some(recipe => recipe.id === recipeId);
      
      if (recipeExists) {
        console.log('Recipe already exists in the meal plan');
        return mealPlan;
      }
      
      // Fetch the recipe details from backend
      const recipeResponse = await client.models.Recipe.get(
        { id: recipeId },
        getAuthOptions()
      );
      
      let recipe;
      
      if (recipeResponse.data) {
        // Use the fetched recipe
        recipe = recipeResponse.data;
      } else {
        // Create a placeholder recipe object if not found
        recipe = {
          id: recipeId,
          title: `Recipe ${recipeId}`,
          ingredients: [],
          nutritionalInformation: {
            status: "PENDING",
            calories: "",
            fat: "",
            carbs: "",
            protein: ""
          },
          instructions: [],
          url: "",
          description: "",
          prep_time: "",
          cook_time: "",
          servings: "",
          imageUrl: "",
          status: "SUCCESS",
          pictureSubmissionUUID: ""
        } as Recipe;
      }
      
      // Add the recipe to the meal plan
      const updatedRecipes = [...mealPlan.recipes, recipe];
      
      // Update the meal plan in the backend
      const updateResponse = await client.models.MealPlan.update(
        {
          id: mealPlanId,
          recipes: updatedRecipes,
          updatedAt: new Date().toISOString()
        },
        getAuthOptions()
      );
      
      // Get the updated meal plan from the response
      const updatedMealPlan = updateResponse.data;
      
      // Update the meal plan in our local state
      if (updatedMealPlan) {
        mealPlansState.value[mealPlanIndex] = updatedMealPlan;
      }
      
      console.log(`Added recipe ${recipeId} to meal plan ${mealPlanId}`);
      
      return updatedMealPlan;
    } catch (err) {
      error.value = err as Error;
      console.error('Error adding recipe to meal plan:', err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  return {
    mealPlansState,
    isLoading,
    error,
    getMealPlans,
    getMealPlanById,
    createMealPlan,
    addRecipeToMealPlan
  };
}