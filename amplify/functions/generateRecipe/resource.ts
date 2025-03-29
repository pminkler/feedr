import { defineFunction, secret } from '@aws-amplify/backend';

export const generateRecipe = defineFunction({
  name: 'generateRecipe',
  environment: {
    OPENAI_API_KEY: secret('OPENAI_API_KEY'),
  },
  timeoutSeconds: 60 * 15,
});
