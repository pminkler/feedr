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
  serviceName: "api-handler",
});

const RecipeExtraction = z.object({
  title: z.string(),
  ingredients: z.array(z.string()),
  instructions: z.array(z.string()),
  prep_time: z.string().nullable(),
  cook_time: z.string().nullable(),
  servings: z.string().nullable(),
});

export const handler: Handler = async (event, context) => {
  const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

  const { arguments: { url } = {} } = event;

  logger.info("event", event, "context", context);

  if (!url) {
    logger.error("Missing URL in request.");
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing URL in request." }),
    };
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
            "Summarize the following text to extract key details about a recipe.",
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
          content: "Extract and format the recipe details as JSON.",
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

    return JSON.stringify({
      statusCode: 200,
      body: structuredRecipe,
    });
  } catch (error) {
    logger.error(`Error processing recipe: ${error}`);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Error processing recipe." }),
    };
  }
};
