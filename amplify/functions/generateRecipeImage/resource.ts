import { defineFunction } from '@aws-amplify/backend';

// Assign this function to the same stack where the Step Functions and data resources are
export const generateRecipeImage = defineFunction({
  name: 'generateRecipeImage',
  // Explicitly assign to the data stack to avoid circular dependencies
  resourceGroupName: 'data',
});
