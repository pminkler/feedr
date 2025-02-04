// functions/generateRecipe/index.ts
import type { Handler } from "aws-lambda";
import { Logger } from "@aws-lambda-powertools/logger";
import { OpenAI } from "openai";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";
import { env } from "$amplify/env/generateRecipe";
import type { Schema } from "../../data/resource";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";

const { resourceConfig, libraryOptions } =
  await getAmplifyDataClientConfig(env);
Amplify.configure(resourceConfig, libraryOptions);

const client = generateClient<Schema>();

const logger = new Logger({
  logLevel: "INFO",
  serviceName: "generate-recipe-handler",
});

// Schema for recipe extraction (for structured output from OpenAI)
const Ingredient = z.object({
  name: z.string(),
  quantity: z.string(),
  unit: z.string(),
  stepMapping: z.array(z.number()).optional(),
});

const RecipeExtraction = z.object({
  title: z.string(),
  ingredients: z.array(Ingredient),
  instructions: z.array(z.string()),
  prep_time: z.string(),
  cook_time: z.string(),
  servings: z.string(),
});

export const handler: Handler = async (event) => {
  const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  logger.info(`Received event: ${JSON.stringify(event)}`);

  // Expecting the event to have an 'id' and 'extractedText'
  const { id, extractedText } = event;
  if (!id) {
    logger.error("Missing 'id' in input.");
    throw new Error("Missing 'id' in input.");
  }
  if (!extractedText) {
    logger.error("Missing 'extractedText' in input.");
    throw new Error("Missing 'extractedText' in input.");
  }

  // Log the raw extractedText structure for debugging
  logger.info(`Raw extractedText: ${JSON.stringify(extractedText)}`);

  // Unwrap extractedText in case it is nested
  let textForOpenAI: string = "";

  if (typeof extractedText === "string") {
    textForOpenAI = extractedText;
  } else if (typeof extractedText === "object") {
    // First, check if it's wrapped in a Payload key
    if ("Payload" in extractedText) {
      const payload = extractedText.Payload;
      if (typeof payload === "string") {
        textForOpenAI = payload;
      } else if (typeof payload === "object" && payload.extractedText) {
        textForOpenAI = payload.extractedText;
      }
    } else if (extractedText.extractedText) {
      // Otherwise, if the object directly has an extractedText key:
      textForOpenAI = extractedText.extractedText;
    }
  }

  if (!textForOpenAI || typeof textForOpenAI !== "string") {
    logger.error("Invalid format for 'extractedText'");
    throw new Error("Invalid format for 'extractedText'");
  }

  logger.info(
    `Unwrapped textForOpenAI (first 100 chars): ${textForOpenAI.substring(0, 100)}...`,
  );

  // Validate that the text is "good enough" for a recipe.
  const MIN_TEXT_LENGTH = 100; // adjust this threshold as needed
  if (textForOpenAI.trim().length < MIN_TEXT_LENGTH) {
    logger.error(
      `Extracted text is too short for a valid recipe: ${textForOpenAI.trim().length} characters.`,
    );
    throw new Error("Insufficient content to generate a recipe.");
  }

  logger.info(`Generating recipe for ID: ${id}`);

  try {
    // Call OpenAI using the extracted text.
    const completion = await openai.beta.chat.completions.parse({
      model: "gpt-4o-2024-08-06",
      messages: [
        {
          role: "system",
          content: `Extract and format the recipe details as JSON, including ingredient quantities and units.  For each ingredient, identify the steps where it is used and include the step indices (starting from 1) in a "stepMapping" array. If an ingredient is used in multiple steps, include all relevant indices. If an ingredient is used generally throughout the recipe or its usage is not tied to specific steps, omit the "stepMapping" field.`,
        },
        {
          role: "user",
          content: textForOpenAI,
        },
      ],
      response_format: zodResponseFormat(RecipeExtraction, "recipe_extraction"),
    });

    const structuredRecipe = completion.choices[0].message.parsed;
    logger.info(`Structured Recipe: ${JSON.stringify(structuredRecipe)}`);

    // Update the DynamoDB record for the recipe.
    try {
      const response = await client.models.Recipe.update({
        id,
        status: "SUCCESS",
        title: structuredRecipe?.title,
        ingredients: structuredRecipe?.ingredients,
        prep_time: structuredRecipe?.prep_time ?? "",
        cook_time: structuredRecipe?.cook_time ?? "",
        servings: structuredRecipe?.servings ?? "",
        instructions: structuredRecipe?.instructions ?? [],
        description: "",
        tags: "",
        image: "",
      });
      logger.info(`Recipe update response: ${JSON.stringify(response)}`);
    } catch (updateError) {
      logger.error(`Error updating recipe: ${updateError}`);
      throw new Error("Failed to update recipe in the database.");
    }

    return {
      id,
      processed_recipe: structuredRecipe,
    };
  } catch (error) {
    logger.error(`Error generating recipe: ${error}`);
    throw new Error("Failed to generate recipe.");
  }
};
