import { defineFunction } from '@aws-amplify/backend';

export const extractTextFromImage = defineFunction({
  name: 'extractTextFromImage',
  resourceGroupName: 'data', // Assign to data stack
  timeoutSeconds: 60 * 15,
});
