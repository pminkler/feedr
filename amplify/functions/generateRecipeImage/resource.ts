import { defineFunction } from '@aws-amplify/backend';

// Place this in the data stack to break circular dependencies
// This is part of the recipe processing workflow which should be in the data stack
export const generateRecipeImage = defineFunction({
  name: 'generateRecipeImage',
  resourceGroupName: 'data',
});
