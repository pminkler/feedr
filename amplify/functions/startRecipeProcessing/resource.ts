import { defineFunction } from "@aws-amplify/backend";

export const startRecipeProcessing = defineFunction({
  name: "startRecipeProcessing",
  resourceGroupName: "data",
});
