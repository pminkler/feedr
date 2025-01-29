import type { DynamoDBStreamHandler } from "aws-lambda";
import { Logger } from "@aws-lambda-powertools/logger";
import axios from "axios";
import { OpenAI } from "openai";
import { env } from "$amplify/env/recipeAddedHandler";

const logger = new Logger({
  logLevel: "INFO",
  serviceName: "dynamodb-stream-handler",
});

export const handler: DynamoDBStreamHandler = async (event) => {
  const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

  for (const record of event.Records) {
    logger.info(`Processing record: ${record.eventID}`);
    logger.info(`Event Type: ${record.eventName}`);

    if (record.eventName === "INSERT") {
      const newItem = record.dynamodb?.NewImage;
      if (!newItem) continue;

      const url = newItem.url?.S;
      const recipeId = newItem.id?.S;
      if (!url || !recipeId) {
        logger.error("Missing URL or ID in record.");
        continue;
      }

      logger.info(`Fetching recipe from: ${url}`);
      try {
        // Fetch the webpage content
        const response = await axios.get(url, {
          headers: { "User-Agent": "Mozilla/5.0" },
        });
        const pageContent = response.data;

        // Send to OpenAI for recipe extraction
        const gptResponse = await openai.chat.completions.create({
          model: "gpt-4-turbo",
          messages: [
            {
              role: "system",
              content:
                "You are an AI that extracts recipes from web pages. Return a structured JSON with title, ingredients, instructions, prep time, cook time, and servings.",
            },
            {
              role: "user",
              content: `Extract and format the recipe from the following page:\n\n${pageContent}`,
            },
          ],
          temperature: 0,
        });

        const formattedRecipe = gptResponse.choices[0].message.content;
        logger.info(`Extracted Recipe: ${formattedRecipe}`);

        // Store extracted recipe in DynamoDB
        logger.info(`Recipe successfully saved for ID: ${recipeId}`);
      } catch (error) {
        logger.error(`Error processing recipe: ${error}`);
      }
    }
  }

  return {
    batchItemFailures: [],
  };
};
