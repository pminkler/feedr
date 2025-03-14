import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { useState } from "#app";
import Fraction from "fraction.js";
import { useAuth } from "~/composables/useAuth";
import type { AuthMode } from "@aws-amplify/data-schema-types";
import type { RecipeTag } from "~/types/models";

const client = generateClient<Schema>();

export function useRecipe() {
  const recipesState = useState<Record<string, Record<string, any>>>(
    "recipes",
    () => ({}),
  );
  const savedRecipesState = useState<any[]>("savedRecipes", () => []); // State for saved recipes
  const myRecipesState = useState<any[]>("myRecipes", () => []); // State for user-created recipes
  const { currentUser } = useAuth();

  async function createRecipe(recipeData: Record<string, any>) {
    try {
      if (!currentUser.value) {
        throw new Error("User must be logged in to create a recipe.");
      }

      const userId = currentUser.value.username;
      
      const response = await client.models.Recipe.create(
        {
          ...recipeData,
          status: "PENDING",
          nutritionalInformation: {
            status: "PENDING",
          },
          owners: [userId],
        },
        { authMode: "userPool" as AuthMode },
      );

      const recipe = Array.isArray(response?.data)
        ? response.data[0]
        : response?.data;

      if (recipe?.id) {
        recipesState.value[recipe.id] = recipe;
        return recipe;
      }
    } catch (error) {
      console.error("Error creating recipe:", error);
      throw error;
    }
  }
  async function getRecipeById(id: string) {
    // Determine auth options based on login state.
    const options = currentUser.value
      ? { authMode: "userPool" as AuthMode }
      : {};
    const response = await client.models.Recipe.get({ id }, options);
    const recipe = response.data;
    if (recipe && recipe.id) {
      recipesState.value[recipe.id] = recipe;
    }
    return recipe;
  }

  /**
   * Gets all Recipes where the current user is in the owners array.
   */
  async function getSavedRecipes() {
    if (!currentUser.value) {
      throw new Error("User must be logged in to view saved recipes.");
    }
    
    const userId = currentUser.value.username;
    
    try {
      const response = await client.models.Recipe.list({
        filter: {
          owners: {
            contains: userId
          }
        },
        selectionSet: [
          "id",
          "title",
          "description",
          "prep_time",
          "cook_time",
          "servings",
          "imageUrl",
          "ingredients.*",
          "instructions",
          "nutritionalInformation.*", 
          "tags.*",
          "owners",
          "createdAt",
          "updatedAt"
        ],
        authMode: "userPool",
      });
      
      const savedRecipes = response.data || [];
      savedRecipesState.value = savedRecipes;
      return savedRecipes;
    } catch (error) {
      console.error("Error fetching saved recipes:", error);
      return [];
    }
  }

  /**
   * Normalizes Unicode fraction characters (e.g., "½") in a string to ASCII fractions (e.g., "1/2").
   */
  function normalizeFractionString(str: string): string {
    const unicodeMap: Record<string, string> = {
      "½": "1/2",
      "⅓": "1/3",
      "⅔": "2/3",
      "¼": "1/4",
      "¾": "3/4",
      "⅕": "1/5",
      "⅖": "2/5",
      "⅗": "3/5",
      "⅘": "4/5",
      "⅙": "1/6",
      "⅚": "5/6",
      "⅛": "1/8",
      "⅜": "3/8",
      "⅝": "5/8",
      "⅞": "7/8",
    };

    Object.keys(unicodeMap).forEach((unicodeFrac) => {
      if (str.includes(unicodeFrac)) {
        // Use a global replacement in case there are multiple occurrences.
        str = str.replace(
          new RegExp(unicodeFrac, "g"),
          unicodeMap[unicodeFrac],
        );
      }
    });
    return str;
  }

  /**
   * Scales an array of ingredients by the given multiplier.
   *
   * Each ingredient should have a `quantity` string (e.g., "1 ¼", "3½").
   * The method normalizes any Unicode fractions, converts the quantity to a Fraction,
   * scales it, and converts it back to a nicely formatted mixed fraction string.
   *
   * @param ingredients Array of ingredients to scale.
   * @param multiplier The scaling factor (e.g., 2, 2.5, etc.).
   * @returns The scaled array of ingredients.
   */
  function scaleIngredients(
    ingredients: { name: string; quantity: string; unit: string }[],
    multiplier: number,
  ): { name: string; quantity: string; unit: string }[] {
    return ingredients.map((ingredient) => {
      const normalizedQuantity = normalizeFractionString(ingredient.quantity);
      try {
        const fractionQuantity = new Fraction(normalizedQuantity);
        const scaledFraction = fractionQuantity.mul(multiplier);
        const newQuantity = scaledFraction.toFraction(true);

        return {
          ...ingredient,
          quantity: newQuantity,
        };
      } catch (error) {
        console.error(
          `Error parsing quantity for ${ingredient.name}: ${ingredient.quantity}`,
          error,
        );
        // In case of an error, return the ingredient unmodified.
        return ingredient;
      }
    });
  }

  /**
   * Updates a Recipe to add the current user as an owner (bookmark the recipe)
   * @param recipeId The ID of the Recipe to save.
   * @returns The updated Recipe record.
   */
  async function saveRecipe(recipeId: string) {
    if (!currentUser.value) {
      throw new Error("User must be logged in to save a recipe.");
    }
    
    const userId = currentUser.value.username;
    
    try {
      // First, get the original recipe data
      const recipeResponse = await client.models.Recipe.get(
        { id: recipeId },
        { authMode: "userPool" }
      );
      
      if (!recipeResponse.data) {
        throw new Error("Recipe not found");
      }
      
      const recipe = recipeResponse.data;
      const currentOwners = recipe.owners || [];
      
      // Check if user is already an owner
      if (currentOwners.includes(userId)) {
        return recipe; // User already owns this recipe
      }
      
      // Add user to owners array
      const updatedOwners = [...currentOwners, userId];
      
      // Update the recipe with the new owners array
      const { data } = await client.models.Recipe.update(
        {
          id: recipeId,
          owners: updatedOwners,
        },
        { authMode: "userPool" },
      );
      
      // Update the local state
      if (data) {
        recipesState.value[recipeId] = data;
      }
      
      return data;
    } catch (error) {
      console.error("Error saving recipe:", error);
      throw error;
    }
  }

  /**
   * Updates a Recipe to remove the current user from the owners array (unbookmark the recipe)
   * @param recipeId The ID of the Recipe to unsave.
   * @returns The updated Recipe record.
   */
  async function unsaveRecipe(recipeId: string) {
    if (!currentUser.value) {
      throw new Error("User must be logged in to unsave a recipe.");
    }
    
    const userId = currentUser.value.username;
    
    try {
      // First, get the original recipe data
      const recipeResponse = await client.models.Recipe.get(
        { id: recipeId },
        { authMode: "userPool" }
      );
      
      if (!recipeResponse.data) {
        throw new Error("Recipe not found");
      }
      
      const recipe = recipeResponse.data;
      const currentOwners = recipe.owners || [];
      
      // Check if user is an owner
      if (!currentOwners.includes(userId)) {
        return recipe; // User is not an owner of this recipe
      }
      
      // Remove user from owners array
      const updatedOwners = currentOwners.filter(owner => owner !== userId);
      
      // Update the recipe with the new owners array
      const { data } = await client.models.Recipe.update(
        {
          id: recipeId,
          owners: updatedOwners,
        },
        { authMode: "userPool" },
      );
      
      // Update the local state
      if (data) {
        recipesState.value[recipeId] = data;
      }
      
      return data;
    } catch (error) {
      console.error("Error unsaving recipe:", error);
      throw error;
    }
  }

  async function updateRecipe(
    recipeId: string,
    updateData: Record<string, any>,
  ) {
    if (!currentUser.value) {
      throw new Error("User must be logged in to update a recipe.");
    }
    
    try {
      // Check if user is an owner
      const recipeResponse = await client.models.Recipe.get(
        { id: recipeId },
        { authMode: "userPool" }
      );
      
      if (!recipeResponse.data) {
        throw new Error("Recipe not found");
      }
      
      const recipe = recipeResponse.data;
      const userId = currentUser.value.username;
      
      // Check if user is in owners array
      if (!recipe.owners?.includes(userId)) {
        throw new Error("You don't have permission to update this recipe.");
      }
      
      // Update the recipe
      const { data } = await client.models.Recipe.update(
        { id: recipeId, ...updateData },
        { authMode: "userPool" },
      );
      
      if (data) {
        // Find the existing recipe in local state.
        if (recipesState.value[recipeId]) {
          // Merge the new data into the existing record (shallow merge).
          recipesState.value[recipeId] = { ...recipesState.value[recipeId], ...updateData };
        } else {
          // If it doesn't exist in state, store it
          recipesState.value[recipeId] = data;
        }
        
        // Also update in savedRecipes if it exists there
        const index = savedRecipesState.value.findIndex(
          (record: any) => record.id === recipeId,
        );
        
        if (index !== -1) {
          const existing = savedRecipesState.value[index];
          savedRecipesState.value[index] = { ...existing, ...updateData };
        }
        
        return data;
      }
    } catch (error) {
      console.error("Error updating recipe:", error);
      throw error;
    }
  }

  const recipeTags = computed(() => {
    const uniqueTags: RecipeTag[] = [];
    const tagMap = new Map<string, RecipeTag>();
    
    // Get tags from all saved recipes (where user is an owner)
    savedRecipesState.value.forEach((recipe: any) => {
      recipe.tags?.forEach((tag: RecipeTag) => {
        if (tag && tag.name && !tagMap.has(tag.name)) {
          tagMap.set(tag.name, tag);
          uniqueTags.push(tag);
        }
      });
    });
    
    return uniqueTags;
  });

  /**
   * Gets all Recipes created by the current user.
   */
  async function getMyRecipes() {
    if (!currentUser.value) {
      throw new Error("User must be logged in to view their recipes.");
    }
    
    const userId = currentUser.value.username;
    
    try {
      const response = await client.models.Recipe.list({
        filter: {
          status: { eq: "SUCCESS" },
          // Only return recipes where the current user is the creator (first owner)
          // This assumes the first owner in the array is always the creator
          owners: {
            contains: userId
          }
        },
        selectionSet: [
          "id",
          "title",
          "description",
          "prep_time",
          "cook_time",
          "servings",
          "imageUrl",
          "ingredients.*",
          "instructions",
          "nutritionalInformation.*", 
          "tags.*",
          "owners",
          "createdAt",
          "updatedAt"
        ],
        authMode: "userPool",
      });
      
      const myRecipes = response.data || [];
      myRecipesState.value = myRecipes;
      return myRecipes;
    } catch (error) {
      console.error("Error fetching my recipes:", error);
      return [];
    }
  }

  return {
    recipesState,
    savedRecipesState,
    myRecipesState,
    recipeTags,
    updateRecipe,
    createRecipe,
    getRecipeById,
    getSavedRecipes,
    getMyRecipes,
    scaleIngredients,
    saveRecipe,
    unsaveRecipe,
  };
}
