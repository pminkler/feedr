import type { Handler } from "aws-lambda";
import { Logger } from "@aws-lambda-powertools/logger";
import axios from "axios";
import { OpenAI } from "openai";
import * as cheerio from "cheerio";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";
import { env } from "$amplify/env/recipeUrlEndpoint";

const logger = new Logger({
  logLevel: "INFO",
  serviceName: "process-recipe-handler",
});

const Ingredient = z.object({
  name: z.string(),
  quantity: z.string().nullable(),
  unit: z.string().nullable(),
});

const RecipeExtraction = z.object({
  title: z.string(),
  ingredients: z.array(Ingredient),
  instructions: z.array(z.string()),
  prep_time: z.string().nullable(),
  cook_time: z.string().nullable(),
  servings: z.string().nullable(),
});

export const handler: Handler = async (event) => {
  const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

  logger.info(`Received event: ${JSON.stringify(event)}`);

  // ✅ Step Functions expects { id, url }
  const { id, url } = event;

  if (!url) {
    logger.error("Missing URL in Step Functions input.");
    throw new Error("Missing URL in Step Functions input.");
  }

  logger.info(`Fetching recipe from: ${url}`);

  try {
    // Fetch webpage content
    const response = await axios.get(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    const $ = cheerio.load(response.data);

    // Extract main content
    const mainContent = $("body").text().trim() || "";

    // Summarize the main content
    const summaryResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "Summarize the following text to extract key details about a recipe, including ingredient quantities and units. Keep the steps in order and retain major points about technique and timing.",
        },
        {
          role: "user",
          content: mainContent,
        },
      ],
      temperature: 0.5,
    });

    const summarizedText = summaryResponse.choices[0].message.content || "";

    // Call OpenAI with Structured Outputs
    const completion = await openai.beta.chat.completions.parse({
      model: "gpt-4o-2024-08-06",
      messages: [
        {
          role: "system",
          content:
            "Extract and format the recipe details as JSON, including ingredient quantities and units.",
        },
        {
          role: "user",
          content: summarizedText,
        },
      ],
      response_format: zodResponseFormat(RecipeExtraction, "recipe_extraction"),
    });

    const structuredRecipe = completion.choices[0].message.parsed;

    logger.info(`Structured Recipe: ${JSON.stringify(structuredRecipe)}`);

    // ✅ Step Functions expects a structured JSON object, not an HTTP response
    return {
      id,
      url,
      processed_recipe: structuredRecipe, // Pass structured result to the next step
    };
  } catch (error) {
    logger.error(`Error processing recipe: ${error}`);
    throw new Error("Failed to process recipe.");
  }
};
