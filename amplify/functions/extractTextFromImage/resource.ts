import { defineFunction } from '@aws-amplify/backend';

// Move this to data stack to help break circular dependencies
export const extractTextFromImage = defineFunction({
  name: 'extractTextFromImage',
  resourceGroupName: 'data', // Assign to data stack since it interacts with recipe data
  timeoutSeconds: 60 * 15,
});
