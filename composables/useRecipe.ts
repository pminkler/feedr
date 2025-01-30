import { generateClient } from "aws-amplify/data";
import { type Schema } from "./amplify/data/resource";
import { useState } from "#app";

const client = generateClient<Schema>();

export function useRecipe() {
  const recipesState = useState<Record<string, any>>("recipes", () => ({}));
  const errors = useState("recipeErrors", () => null);

  async function getRecipeFromUrl({ url } = {}) {
    try {
      const { data, errors: getErrors } = await client.queries.getRecipeFromUrl(
        { url },
      );
      if (data) {
        recipesState.value[data.id] = data;
        return data;
      }
    } catch (error) {
      errors.value = error;
    }
  }

  return {
    recipesState,
    errors,
    getRecipeFromUrl,
  };
}
