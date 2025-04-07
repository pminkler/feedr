import { defineFunction } from '@aws-amplify/backend';

export const markFailure = defineFunction({
  name: 'markFailure',
  resourceGroupName: 'data', // Assign to data stack
});
