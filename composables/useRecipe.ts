import { generateClient } from "aws-amplify/data";
import { type Schema } from "./amplify/data/resource";
import { useState } from "#app";

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

  return {
    recipesState,
    errors,
    createRecipe,
    getRecipeById,
  };
}
