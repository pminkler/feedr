import { defineFunction } from '@aws-amplify/backend';

export const generateRecipeImage = defineFunction({
  name: 'generateRecipeImage',
  resourceGroupName: 'data',
});
