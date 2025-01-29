import type { DynamoDBStreamHandler } from "aws-lambda";
import { Logger } from "@aws-lambda-powertools/logger";
import axios from "axios";
import { OpenAI } from "openai";
import * as cheerio from "cheerio";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";
import { env } from "$amplify/env/recipeAddedHandler";

const logger = new Logger({
  logLevel: "INFO",
  serviceName: "dynamodb-stream-handler",
});

const RecipeExtraction = z.object({
  title: z.string(),
  ingredients: z.array(z.string()),
  instructions: z.array(z.string()),
  prep_time: z.string().nullable(),
  cook_time: z.string().nullable(),
  servings: z.string().nullable(),
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
        // Fetch webpage content
        const response = await axios.get(url, {
          headers: { "User-Agent": "Mozilla/5.0" },
        });
        const $ = cheerio.load(response.data);

        // Extract JSON-LD structured recipe data if available
        let structuredRecipe: any = null;
        $('script[type="application/ld+json"]').each((_, element) => {
          const jsonData = JSON.parse($(element).text());
          if (jsonData["@type"] === "Recipe") {
            structuredRecipe = jsonData;
          }
        });

        if (!structuredRecipe) {
          logger.info(
            `No structured data found. Using GPT Structured Outputs.`,
          );

          // Extract key text for GPT processing
          const title = $("h1").first().text().trim();
          const ingredients = $("ul, ol")
            .map((_, el) => $(el).text().trim())
            .get()
            .slice(0, 5); // Reduce number of ingredients

          const instructions = $("p")
            .map((_, el) => $(el).text().trim())
            .get()
            .slice(0, 5); // Reduce number of steps

          const extractedText = `Title: ${title}\nIngredients: ${ingredients.join(
            ", ",
          )}\nInstructions: ${instructions.join(" ")}`;

          // Call OpenAI with Structured Outputs
          const completion = await openai.beta.chat.completions.parse({
            model: "gpt-4o-2024-08-06",
            messages: [
              {
                role: "system",
                content: "Extract and format the recipe details as JSON.",
              },
              {
                role: "user",
                content: extractedText,
              },
            ],
            response_format: zodResponseFormat(
              RecipeExtraction,
              "recipe_extraction",
            ),
          });

          structuredRecipe = completion.choices[0].message.parsed;
        }

        logger.info(`Structured Recipe: ${JSON.stringify(structuredRecipe)}`);

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
