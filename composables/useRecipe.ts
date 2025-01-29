import { generateClient } from 'aws-amplify/data';
import { type Schema } from './amplify/data/resource';
import { useState } from '#app';

const client = generateClient<Schema>();

export function useRecipe() {
  const recipesState = useState<Record<string, any>>('recipes', () => ({}));
  const errors = useState('recipeErrors', () => null);

  async function createRecipe(recipeData: {
    url: string;
    title?: string;
    description?: string;
    tags?: string;
    image?: string;
  }) {
    try {
      const { data, errors: createErrors } = await client.models.Recipe.create(recipeData);
      if (data) {
        recipesState.value[data.id] = data;
        return data;
      }
    } catch (error) {
      errors.value = error;
    }
  }

  async function getRecipeById(id: string) {
    if (recipesState.value[id]) {
      return recipesState.value[id];
    }
    try {
      const { data, errors: getErrors } = await client.models.Recipe.get({ id });
      if (data) {
        recipesState.value[id] = data;
        return data;
      }
    } catch (error) {
      errors.value = error;
    }
  }

  return {
    recipesState,
    errors,
    createRecipe,
    getRecipeById,
  };
}