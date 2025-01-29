import { defineFunction, secret } from "@aws-amplify/backend";

export const recipeAddedHandler = defineFunction({
  name: "recipeAddedHandler",
  resourceGroupName: "data",
  environment: {
    OPENAI_API_KEY: secret("OPENAI_API_KEY"),
  },
  timeoutSeconds: 60 * 15,
});
