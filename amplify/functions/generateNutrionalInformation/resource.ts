import { defineFunction, secret } from '@aws-amplify/backend';

export const generateNutritionalInformation = defineFunction({
  name: 'generateNutritionalInformation',
  resourceGroupName: 'data', // Assign to data stack
  environment: {
    OPENAI_API_KEY: secret('OPENAI_API_KEY'),
  },
  timeoutSeconds: 60 * 15,
});
