// functions/markFailure/index.ts
import type { Handler } from "aws-lambda";
import { Logger } from "@aws-lambda-powertools/logger";
import type { Schema } from "../../data/resource";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";
import { env } from "$amplify/env/markFailure";

const { resourceConfig, libraryOptions } =
  await getAmplifyDataClientConfig(env);
Amplify.configure(resourceConfig, libraryOptions);
const client = generateClient<Schema>();

const logger = new Logger({
  logLevel: "INFO",
  serviceName: "mark-failure-handler",
});

export const handler: Handler = async (event) => {
  // Expect event to include an 'id'
  const { id } = event;
  if (!id) {
    logger.error("Missing 'id' in input for markFailure.");
    throw new Error("Missing 'id' in input for markFailure.");
  }
  try {
    const response = await client.models.Recipe.update({
      id,
      status: "FAILED",
    });
    logger.info(`Recipe marked as FAILED: ${JSON.stringify(response)}`);
  } catch (error) {
    logger.error(`Error marking recipe as FAILED: ${error}`);
  }
  // Optionally, return the event or any error info so the state machine ends.
  return { id, status: "FAILED" };
};
