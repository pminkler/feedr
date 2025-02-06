import { defineFunction, secret } from "@aws-amplify/backend";
import * as dotenv from "dotenv";

dotenv.config();

export const generateInstacartUrl = defineFunction({
  name: "generateInstacartUrl",
  environment: {
    INSTACART_API_KEY: secret("INSTACART_API_KEY"),
    INSTACART_API_URI: process.env.INSTACART_API_URI || "",
  },
  timeoutSeconds: 60,
});
