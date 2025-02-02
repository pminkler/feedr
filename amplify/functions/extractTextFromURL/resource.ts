import { defineFunction } from "@aws-amplify/backend";

export const extractTextFromURL = defineFunction({
  name: "extractTextFromURL",
  timeoutSeconds: 60 * 15,
});
