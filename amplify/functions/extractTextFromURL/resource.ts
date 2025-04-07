import { defineFunction } from '@aws-amplify/backend';

export const extractTextFromURL = defineFunction({
  name: 'extractTextFromURL',
  resourceGroupName: 'data', // Assign to data stack
  timeoutSeconds: 60 * 15,
});
