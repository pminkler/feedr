import { defineFunction } from '@aws-amplify/backend';

export const sendFeedbackEmail = defineFunction({
  name: 'sendFeedbackEmail',
  entry: './handler.ts',
});
