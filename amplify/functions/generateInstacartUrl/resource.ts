import { defineFunction, secret } from "@aws-amplify/backend";

export const generateInstacartUrl = defineFunction({
  name: "generateInstacartUrl",
  timeoutSeconds: 30, // 30 seconds should be more than enough for URL generation
  environment: {
    INSTACART_API_URI: process.env.INSTACART_API_URI || "https://connect.dev.instacart.tools",
    INSTACART_API_KEY: secret('INSTACART_API_KEY')
  }
});