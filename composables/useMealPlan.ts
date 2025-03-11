import { useState } from '#app';
import { MealPlan } from '~/types/models';

// Helper function to generate a UUID
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function useMealPlan() {
  // Use useState instead of ref to ensure state persistence across components
  const mealPlansState = useState<MealPlan[]>('mealPlans', () => []);
  const isLoading = useState<boolean>('mealPlansLoading', () => false);
  const error = useState<Error | null>('mealPlansError', () => null);

  // Function to fetch user's meal plans from the backend
  const getMealPlans = async () => {
    isLoading.value = true;
    error.value = null;
    
    try {
      // This is a placeholder for the actual API call
      // We'll implement the actual GraphQL query later
      // For now, just return an empty array
      mealPlansState.value = [];
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
      // This is a placeholder for the actual API call
      // We'll implement the actual mutation later
      console.log('Creating meal plan...');
      
      // Generate a random UUID for the meal plan
      const newPlan = {
        id: generateUUID(),
        recipes: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      return newPlan;
    } catch (err) {
      error.value = err as Error;
      console.error('Error creating meal plan:', err);
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
    createMealPlan
  };
}