import { defineFunction } from "@aws-amplify/backend";

export const extractTextFromImage = defineFunction({
  name: "extractTextFromImage",
  timeoutSeconds: 60 * 15,
});
