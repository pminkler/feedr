import { defineFunction } from '@aws-amplify/backend';

// Move this to a custom processing stack to break circular dependencies
// This avoids circular dependencies with the Recipe table in the data stack
export const startRecipeProcessing = defineFunction({
  name: 'startRecipeProcessing',
  resourceGroupName: 'processing',
});
