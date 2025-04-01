import Fraction from 'fraction.js';
import type { Ingredient } from '../types/models';

/**
 * Normalizes Unicode fraction characters (e.g., "½") in a string to ASCII fractions (e.g., "1/2").
 */
export function normalizeFractionString(str: string): string {
  // Return empty string for undefined input
  if (!str) return '';

  const unicodeMap: Record<string, string> = {
    '½': '1/2',
    '⅓': '1/3',
    '⅔': '2/3',
    '¼': '1/4',
    '¾': '3/4',
    '⅕': '1/5',
    '⅖': '2/5',
    '⅗': '3/5',
    '⅘': '4/5',
    '⅙': '1/6',
    '⅚': '5/6',
    '⅛': '1/8',
    '⅜': '3/8',
    '⅝': '5/8',
    '⅞': '7/8',
  };

  let result = str;
  Object.keys(unicodeMap).forEach((unicodeFrac) => {
    if (result.includes(unicodeFrac)) {
      // Use a safer, non-function approach - use the split and join method
      // to avoid the function-style replacement which causes TypeScript issues
      result = result.split(unicodeFrac).join(unicodeMap[unicodeFrac]);
    }
  });
  return result;
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
export function scaleIngredients(
  ingredients: Ingredient[],
  multiplier: number,
): Ingredient[] {
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
    }
    catch (error) {
      console.error(
        `Error parsing quantity for ${ingredient.name}: ${ingredient.quantity}`,
        error,
      );
      // In case of an error, return the ingredient unmodified.
      return ingredient;
    }
  });
}