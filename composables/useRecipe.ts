import { generateClient } from "aws-amplify/data";
import { type Schema } from "./amplify/data/resource";
import { useState } from "#app";
import Fraction from "fraction.js";

const client = generateClient<Schema>();

export function useRecipe() {
  const recipesState = useState<Record<string, any>>("recipes", () => ({}));
  const errors = useState("recipeErrors", () => null);

  async function createRecipe(recipeData: {
    url: string;
    title?: string;
    description?: string;
    tags?: string;
    image?: string;
  }) {
    try {
      const { data } = await client.models.Recipe.create({
        ...recipeData,
        status: "PENDING",
      });

      if (data) {
        recipesState.value[data.id] = data;
        return data;
      }
    } catch (error) {
      errors.value = error;
    }
  }

  async function getRecipeById(id: string) {
    const { data } = await client.models.Recipe.get({ id });
    if (data) {
      recipesState.value[data.id] = data;
    }
    return data;
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

  return {
    recipesState,
    errors,
    createRecipe,
    getRecipeById,
    scaleIngredients,
  };
}
