import { generateClient } from "aws-amplify/data";
import type { Schema } from "./amplify/data/resource";
import { useState } from "#app";
import Fraction from "fraction.js";
import { useAuth } from "~/composables/useAuth";

const client = generateClient<Schema>();

export function useRecipe() {
  const recipesState = useState<Record<string, any>>("recipes", () => ({}));
  const savedRecipesState = useState<any[]>("savedRecipes", () => []); // New state for saved recipes
  const errors = useState("recipeErrors", () => null);
  const { currentUser } = useAuth();

  async function createRecipe(recipeData: {
    url: string;
    title?: string;
    description?: string;
    tags?: string;
    image?: string;
    language?: string;
  }) {
    try {
      // Determine auth options: only add authMode: 'userPool' if logged in.
      const options = currentUser.value ? { authMode: "userPool" } : {};
      const { data } = await client.models.Recipe.create(
        {
          ...recipeData,
          status: "PENDING",
          nutritionalInformation: {
            status: "PENDING",
          },
        },
        options,
      );

      if (data) {
        recipesState.value[data.id] = data;
        return data;
      }
    } catch (error) {
      console.error("Error creating recipe:", error);
      errors.value = error;
    }
  }

  async function getRecipeById(id: string) {
    // Determine auth options based on login state.
    const options = currentUser.value ? { authMode: "userPool" } : {};
    const { data } = await client.models.Recipe.get({ id }, options);
    if (data) {
      recipesState.value[data.id] = data;
    }
    return data;
  }

  /**
   * New method to get all SavedRecipes for the current user.
   */
  async function getSavedRecipes() {
    if (!currentUser.value) {
      throw new Error("User must be logged in to view saved recipes.");
    }
    try {
      const response = await client.models.SavedRecipe.list({
        authMode: "userPool",
        selectionSet: ["recipeId", "recipe.title"],
      });
      const savedRecipes = response.data || [];
      savedRecipesState.value = savedRecipes;
      return savedRecipes;
    } catch (error) {
      console.error("Error fetching saved recipes:", error);
      errors.value = error;
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
   * Creates a new SavedRecipe record linking the current authenticated user to a recipe.
   * @param recipeId The ID of the Recipe to save.
   * @returns The created SavedRecipe record.
   */
  async function saveRecipe(recipeId: string) {
    if (!currentUser.value) {
      throw new Error("User must be logged in to save a recipe.");
    }
    try {
      const { data } = await client.models.SavedRecipe.create(
        {
          recipeId,
          owner: currentUser.value.id, // Adjust property if your user object uses a different key
        },
        { authMode: "userPool" },
      );
      return data;
    } catch (error) {
      console.error("Error saving recipe:", error);
      errors.value = error;
      return null;
    }
  }

  /**
   * Deletes a SavedRecipe record for the current authenticated user and the given recipe ID.
   * @param recipeId The ID of the Recipe to unsave.
   * @returns The deleted SavedRecipe record or null if not found.
   */
  async function unsaveRecipe(recipeId: string) {
    if (!currentUser.value) {
      throw new Error("User must be logged in to unsave a recipe.");
    }
    try {
      // First, query for the SavedRecipe record that matches the current user and recipeId.
      const savedRecipesResponse = await client.models.SavedRecipe.list({
        filter: {
          recipeId: { eq: recipeId },
        },
        authMode: "userPool",
      });
      const savedRecipes = savedRecipesResponse.data;
      if (savedRecipes && savedRecipes.length > 0) {
        // Delete all found records in parallel.
        const deleteResults = await Promise.all(
          savedRecipes.map((record: any) =>
            client.models.SavedRecipe.delete(
              { id: record.id },
              { authMode: "userPool" },
            ),
          ),
        );
        return deleteResults.map((res) => res.data);
      } else {
        console.warn("No saved recipe found for this user and recipe.");
        return null;
      }
    } catch (error) {
      console.error("Error unsaving recipe:", error);
      errors.value = error;
      return null;
    }
  }

  return {
    recipesState,
    savedRecipesState,
    errors,
    createRecipe,
    getRecipeById,
    getSavedRecipes,
    scaleIngredients,
    saveRecipe,
    unsaveRecipe,
  };
}
