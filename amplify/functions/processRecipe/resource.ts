import { defineFunction, secret } from "@aws-amplify/backend";

export const processRecipe = defineFunction({
  name: "processRecipe",
  environment: {
    OPENAI_API_KEY: secret("OPENAI_API_KEY"),
  },
  timeoutSeconds: 60 * 15,
});
