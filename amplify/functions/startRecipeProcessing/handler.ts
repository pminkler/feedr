// functions/startRecipeProcessing/index.ts
import type { DynamoDBStreamHandler } from 'aws-lambda';
import { Logger } from '@aws-lambda-powertools/logger';
import { SFNClient, StartExecutionCommand } from '@aws-sdk/client-sfn';
// @ts-expect-error - Generated at build time
import { env } from '$amplify/env/startRecipeProcessing';

const logger = new Logger({
  logLevel: 'INFO',
  serviceName: 'dynamodb-stream-handler',
});

const sfnClient = new SFNClient({
  region: process.env.AWS_REGION || 'us-west-2',
});

export const handler: DynamoDBStreamHandler = async (event) => {
  for (const record of event.Records) {
    logger.info(`Processing record: ${record.eventID}`);
    logger.info(`Event Type: ${record.eventName}`);

    if (record.eventName === 'INSERT') {
      const newItem = record.dynamodb?.NewImage;
      if (!newItem) {
        logger.warn(`Skipping record with no NewImage`);
        continue;
      }

      const id = newItem.id?.S;
      const url = newItem.url?.S;
      const language = newItem.language?.S || 'en';
      const pictureSubmissionUUID = newItem.pictureSubmissionUUID?.S;

      // Process record only if there's an id and at least one of url or pictureSubmissionUUID.
      if (!id || (!url && !pictureSubmissionUUID)) {
        logger.warn(
          `Skipping record with missing id or url/pictureSubmissionUUID: ${JSON.stringify(newItem)}`
        );
        continue;
      }

      // Build the input for the state machine.
      const input: Record<string, string> = { id };

      if (url) {
        logger.info(`Triggering Step Function for ID: ${id}, URL: ${url}`);
        input.url = url;
      } else if (pictureSubmissionUUID) {
        logger.info(
          `Triggering Step Function for ID: ${id}, pictureSubmissionUUID: ${pictureSubmissionUUID}`
        );
        input.pictureSubmissionUUID = pictureSubmissionUUID;
        // Do not pass bucket or key—the Lambda handling image OCR will resolve these at runtime.
      }

      logger.info(`Step Function ARN: ${env.ProcessRecipeStepFunctionArn}`);

      try {
        const command = new StartExecutionCommand({
          stateMachineArn: env.ProcessRecipeStepFunctionArn,
          input: JSON.stringify({ ...input, language }),
        });

        const response = await sfnClient.send(command);
        logger.info(`Step Function started: ${response.executionArn}`);
      } catch (error) {
        logger.error(`Failed to start Step Function: ${error}`);
      }
    }
  }

  logger.info(`Successfully processed ${event.Records.length} records.`);

  return {
    batchItemFailures: [],
  };
};
